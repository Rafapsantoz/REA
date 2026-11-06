"""Motor central de gravação de tela de alta performance para Windows.

Utiliza MSS para captura em tempo real via GDI/DirectX, FFmpeg embutido via
imageio-ffmpeg gravando via subprocess pipe rawvideo, e sounddevice para áudio opcional.
"""

from __future__ import annotations

import datetime
import logging
import os
import shutil
import subprocess
import sys
import threading
import time
import uuid
from enum import Enum
from pathlib import Path
from typing import Any, Callable, Dict, List, Optional

import imageio_ffmpeg
import mss
import numpy as np

# sounddevice e scipy são opcionais para resiliência caso não haja backend de áudio
try:
    import sounddevice as sd
except ImportError:
    sd = None

try:
    import scipy.io.wavfile as wavfile
except ImportError:
    wavfile = None

from src.config import DEFAULT_CONFIG, RecorderConfig

logger = logging.getLogger("REA_Recorder")


def _ensure_windows_desktop() -> bool:
    """Garante que a thread atual esteja anexada à área de trabalho ativa no Windows.
    
    Evita falhas do BitBlt (Access Denied / Código 5) quando o processo
    roda em contexto de serviço ou desktops secundários.
    """
    if sys.platform != "win32":
        return True
    try:
        import ctypes
        user32 = ctypes.windll.user32
        generic_all = 0x10000000
        # Tenta a área de trabalho interativa (onde o usuário está vendo)
        hdesk = user32.OpenInputDesktop(0, False, generic_all)
        if not hdesk:
            hdesk = user32.OpenDesktopW("Default", 0, False, generic_all)
        if hdesk:
            return bool(user32.SetThreadDesktop(hdesk))
    except Exception as e:
        logger.debug(f"Aviso ao anexar desktop: {e}")
    return False


# =========================================================================
# Suporte a Captura do Cursor do Mouse em Tempo Real no Windows
# =========================================================================

_orig_mss_gdi_grab = None
_cursor_capture_installed = False

if sys.platform == "win32":
    import ctypes
    from ctypes import wintypes

    class _POINT(ctypes.Structure):
        _fields_ = [("x", wintypes.LONG), ("y", wintypes.LONG)]

    class _CURSORINFO(ctypes.Structure):
        _fields_ = [
            ("cbSize", wintypes.DWORD),
            ("flags", wintypes.DWORD),
            ("hCursor", wintypes.HICON),
            ("ptScreenPos", _POINT),
        ]

    class _ICONINFO(ctypes.Structure):
        _fields_ = [
            ("fIcon", wintypes.BOOL),
            ("xHotspot", wintypes.DWORD),
            ("yHotspot", wintypes.DWORD),
            ("hbmMask", wintypes.HBITMAP),
            ("hbmColor", wintypes.HBITMAP),
        ]

    _user32 = ctypes.windll.user32
    _gdi32 = ctypes.windll.gdi32

    _user32.GetCursorInfo.argtypes = [ctypes.c_void_p]
    _user32.GetCursorInfo.restype = wintypes.BOOL

    _user32.GetIconInfo.argtypes = [wintypes.HICON, ctypes.c_void_p]
    _user32.GetIconInfo.restype = wintypes.BOOL

    _user32.DrawIconEx.argtypes = [
        wintypes.HDC,
        ctypes.c_int,
        ctypes.c_int,
        wintypes.HICON,
        ctypes.c_int,
        ctypes.c_int,
        wintypes.UINT,
        wintypes.HBRUSH,
        wintypes.UINT,
    ]
    _user32.DrawIconEx.restype = wintypes.BOOL

    _gdi32.DeleteObject.argtypes = [wintypes.HGDIOBJ]
    _gdi32.DeleteObject.restype = wintypes.BOOL

    _DI_NORMAL = 0x0003


def _setup_cursor_capture(enable: bool = True) -> None:
    """Instala suporte a renderização do cursor do mouse no MSS sob Windows."""
    global _orig_mss_gdi_grab, _cursor_capture_installed
    if sys.platform != "win32" or not enable:
        return

    try:
        import mss.windows.gdi
        if _orig_mss_gdi_grab is None:
            _orig_mss_gdi_grab = mss.windows.gdi.MSSImplGdi.grab

        def _grab_with_cursor(self_impl, monitor):
            # Executa BitBlt padrão do MSS para a memória DIB
            _orig_mss_gdi_grab(self_impl, monitor)

            # Renderiza o cursor do mouse diretamente no memdc antes de retornar os bytes
            try:
                ci = _CURSORINFO()
                ci.cbSize = ctypes.sizeof(_CURSORINFO)
                if _user32.GetCursorInfo(ctypes.byref(ci)) and (ci.flags & 1):
                    mx, my = ci.ptScreenPos.x, ci.ptScreenPos.y
                    m_left, m_top = monitor["left"], monitor["top"]
                    m_width, m_height = monitor["width"], monitor["height"]

                    # Desenha apenas se o cursor estiver visível no monitor de gravação
                    if (m_left - 64 <= mx <= m_left + m_width + 64 and
                        m_top - 64 <= my <= m_top + m_height + 64):
                        ii = _ICONINFO()
                        if _user32.GetIconInfo(ci.hCursor, ctypes.byref(ii)):
                            cx = mx - m_left - ii.xHotspot
                            cy = my - m_top - ii.yHotspot
                            _user32.DrawIconEx(self_impl._memdc, cx, cy, ci.hCursor, 0, 0, 0, None, _DI_NORMAL)
                            if ii.hbmMask:
                                _gdi32.DeleteObject(ii.hbmMask)
                            if ii.hbmColor:
                                _gdi32.DeleteObject(ii.hbmColor)
                            self_impl.gdi32.GdiFlush()
            except Exception:
                pass

            return bytearray(self_impl._dib_array)

        mss.windows.gdi.MSSImplGdi.grab = _grab_with_cursor
        _cursor_capture_installed = True
    except Exception as e:
        logger.debug(f"Aviso ao instalar captura de cursor: {e}")


class RecorderState(str, Enum):
    """Estados possíveis do ciclo de vida da gravação."""
    IDLE = "IDLE"
    RECORDING = "RECORDING"
    PAUSED = "PAUSED"
    FINALIZING = "FINALIZING"


class ScreenRecorder:
    """Motor de gravação de tela e áudio com baixo consumo de CPU/RAM.
    
    Características:
    - MSS para captura instantânea de tela sem overhead
    - Pipe direto de rawvideo para o encoder H.264 do FFmpeg
    - Controle de FPS preciso via perf_counter
    - Captura de áudio estéreo assíncrona com sounddevice
    - Muxing e suporte a pausa sem dessincronização
    """

    def __init__(
        self,
        config: Optional[RecorderConfig] = None,
        on_status_change: Optional[Callable[[RecorderState], None]] = None,
        on_tick: Optional[Callable[[float], None]] = None,
        on_error: Optional[Callable[[str], None]] = None,
    ):
        self.config: RecorderConfig = config or DEFAULT_CONFIG
        self.on_status_change: Optional[Callable[[RecorderState], None]] = on_status_change
        self.on_tick: Optional[Callable[[float], None]] = on_tick
        self.on_error: Optional[Callable[[str], None]] = on_error

        # Controle de estado e sincronização
        self._state: RecorderState = RecorderState.IDLE
        self._lock = threading.RLock()
        self._stop_event = threading.Event()
        self._is_paused = threading.Event()

        # Threads e subprocessos
        self._capture_thread: Optional[threading.Thread] = None
        self._ffmpeg_process: Optional[subprocess.Popen] = None
        self._ffmpeg_stderr_lines: List[str] = []
        self._stderr_reader_thread: Optional[threading.Thread] = None

        # Áudio
        self._audio_stream: Optional[Any] = None
        self._audio_lock = threading.Lock()
        self._audio_chunks: List[np.ndarray] = []
        self._audio_active = False

        # Métricas
        self._recorded_frames = 0
        self._target_output_path: Optional[Path] = None
        self._temp_video_path: Optional[Path] = None
        self._temp_audio_path: Optional[Path] = None

        # Ativa suporte à renderização do cursor do mouse se configurado
        if getattr(self.config, "capture_cursor", True):
            _setup_cursor_capture(True)

    # =========================================================================
    # Propriedades Públicas
    # =========================================================================

    @property
    def state(self) -> RecorderState:
        with self._lock:
            return self._state

    @property
    def is_recording(self) -> bool:
        with self._lock:
            return self._state == RecorderState.RECORDING

    @property
    def is_paused(self) -> bool:
        with self._lock:
            return self._state == RecorderState.PAUSED

    @property
    def recorded_frames(self) -> int:
        with self._lock:
            return self._recorded_frames

    @property
    def elapsed_time(self) -> float:
        """Tempo decorrido de gravação em segundos (baseado na contagem real de frames)."""
        with self._lock:
            if self.config.fps > 0:
                return self._recorded_frames / self.config.fps
            return 0.0

    # =========================================================================
    # Métodos Estáticos de Informação do Sistema
    # =========================================================================

    @staticmethod
    def get_monitors() -> List[Dict[str, Any]]:
        """Retorna a lista de monitores disponíveis com metadados."""
        _ensure_windows_desktop()
        monitors_list: List[Dict[str, Any]] = []
        try:
            with mss.MSS() as sct:
                for idx, m in enumerate(sct.monitors):
                    if idx == 0:
                        label = f"Todos os Monitores ({m['width']}x{m['height']})"
                        is_primary = False
                    else:
                        is_primary = m.get("is_primary", False) or (idx == 1)
                        tag = " - Principal" if is_primary else ""
                        label = f"Monitor {idx} ({m['width']}x{m['height']}){tag}"

                    monitors_list.append({
                        "id": idx,
                        "index": idx,
                        "label": label,
                        "name": m.get("name", label),
                        "width": m["width"],
                        "height": m["height"],
                        "left": m["left"],
                        "top": m["top"],
                        "is_primary": is_primary,
                    })
        except Exception as e:
            logger.warning(f"Falha ao obter monitores via MSS: {e}")
            monitors_list = [{
                "id": 1,
                "index": 1,
                "label": "Monitor 1 (1920x1080) - Principal",
                "name": "Monitor 1",
                "width": 1920,
                "height": 1080,
                "left": 0,
                "top": 0,
                "is_primary": True,
            }]
        return monitors_list

    @staticmethod
    def is_audio_available() -> bool:
        """Verifica se há dispositivo de captura de áudio (microfone) disponível."""
        if sd is None:
            return False
        try:
            devices = sd.query_devices()
            if isinstance(devices, list):
                return any(d.get("max_input_channels", 0) > 0 for d in devices)
            elif isinstance(devices, dict):
                return devices.get("max_input_channels", 0) > 0
            return False
        except Exception as e:
            logger.debug(f"Verificação de áudio falhou: {e}")
            return False

    @staticmethod
    def _get_subprocess_window_suppression() -> dict:
        """
        Retorna parâmetros de inicialização de subprocesso para Windows que
        eliminam completamente a criação ou piscar de janelas do console (CMD).
        """
        flags = {}
        if sys.platform == "win32":
            if hasattr(subprocess, "CREATE_NO_WINDOW"):
                flags["creationflags"] = subprocess.CREATE_NO_WINDOW
            startupinfo = subprocess.STARTUPINFO()
            startupinfo.dwFlags |= subprocess.STARTF_USESHOWWINDOW
            startupinfo.wShowWindow = subprocess.SW_HIDE
            flags["startupinfo"] = startupinfo
        return flags

    # =========================================================================
    # Ciclo de Vida da Gravação
    # =========================================================================

    def start_recording(
        self,
        include_audio: bool = False,
        monitor_index: int = 1,
        record_audio: Optional[bool] = None,
        output_path: Optional[str] = None,
    ) -> None:
        """Inicia a gravação de tela em thread separada.
        
        Args:
            include_audio: Se True, captura áudio do microfone padrão.
            monitor_index: Índice do monitor (1 = principal, 0 = todos, etc.).
            record_audio: Alias para include_audio (compatibilidade com UI).
            output_path: Caminho final opcional para salvar o arquivo gravado.
        """
        if record_audio is not None:
            include_audio = record_audio

        with self._lock:
            if self._state != RecorderState.IDLE:
                raise RuntimeError(f"Não é possível iniciar gravação no estado {self._state}.")

            self._set_state(RecorderState.RECORDING)
            self._stop_event.clear()
            self._is_paused.clear()
            self._recorded_frames = 0
            self._ffmpeg_stderr_lines = []

            # Configura diretórios e caminhos
            session_id = uuid.uuid4().hex[:8]
            timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
            self.config.temp_dir.mkdir(parents=True, exist_ok=True)

            self._temp_video_path = self.config.temp_dir / f"rea_{timestamp}_{session_id}_raw.mp4"
            self._temp_audio_path = self.config.temp_dir / f"rea_{timestamp}_{session_id}_mic.wav"

            if output_path:
                self._target_output_path = Path(output_path).resolve()
                self._target_output_path.parent.mkdir(parents=True, exist_ok=True)
            else:
                # Arquivo temporário final que a UI ou usuário pode mover/salvar
                self._target_output_path = self.config.temp_dir / f"rea_rec_{timestamp}_{session_id}.{self.config.format}"

            # 1. Configurar geometria do monitor
            _ensure_windows_desktop()
            with mss.MSS() as sct:
                available_mons = sct.monitors
                if monitor_index < 0 or monitor_index >= len(available_mons):
                    monitor_index = 1 if len(available_mons) > 1 else 0
                selected_mon = available_mons[monitor_index]

                # Libx264 exige dimensões pares
                w = selected_mon["width"] - (selected_mon["width"] % 2)
                h = selected_mon["height"] - (selected_mon["height"] % 2)
                capture_rect = {
                    "left": selected_mon["left"],
                    "top": selected_mon["top"],
                    "width": w,
                    "height": h,
                }

            # 2. Iniciar processo FFmpeg via pipe rawvideo
            ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()
            cmd = [
                ffmpeg_exe,
                "-y",
                "-f", "rawvideo",
                "-vcodec", "rawvideo",
                "-s", f"{w}x{h}",
                "-pix_fmt", "bgr0",
                "-r", str(self.config.fps),
                "-i", "-",
                "-c:v", self.config.video_codec,
                "-preset", self.config.preset,
                "-crf", str(self.config.crf),
                "-pix_fmt", self.config.pix_fmt,
                "-movflags", "+faststart",
                str(self._temp_video_path),
            ]

            logger.info(f"Iniciando FFmpeg com dimensões {w}x{h} @ {self.config.fps} FPS")
            extra_proc_flags = self._get_subprocess_window_suppression()
            self._ffmpeg_process = subprocess.Popen(
                cmd,
                stdin=subprocess.PIPE,
                stdout=subprocess.DEVNULL,
                stderr=subprocess.PIPE,
                bufsize=10 ** 7,
                **extra_proc_flags,
            )

            # Thread para consumir stderr do FFmpeg e evitar deadlocks de buffer
            self._stderr_reader_thread = threading.Thread(
                target=self._drain_stderr,
                args=(self._ffmpeg_process,),
                daemon=True,
            )
            self._stderr_reader_thread.start()

            # 3. Inicializar gravação de áudio opcional
            self._audio_active = False
            self._audio_chunks = []
            if include_audio and sd is not None and wavfile is not None:
                try:
                    if self.is_audio_available():
                        self._audio_stream = sd.InputStream(
                            samplerate=self.config.audio_samplerate,
                            channels=self.config.audio_channels,
                            dtype="int16",
                            callback=self._audio_callback,
                        )
                        self._audio_stream.start()
                        self._audio_active = True
                        logger.info("Captura de microfone inicializada com sucesso.")
                    else:
                        logger.warning("Nenhum microfone detectado. Gravando apenas vídeo.")
                except Exception as e:
                    logger.warning(f"Não foi possível iniciar captura de áudio: {e}. Prosseguindo sem áudio.")
                    self._audio_active = False
                    self._audio_stream = None

            # 4. Iniciar thread de captura contínua
            self._capture_thread = threading.Thread(
                target=self._capture_loop,
                args=(capture_rect, self.config.fps),
                daemon=True,
            )
            self._capture_thread.start()

    def pause_recording(self) -> None:
        """Pausa a gravação sem fechar arquivos ou perder frames já gravados."""
        with self._lock:
            if self._state != RecorderState.RECORDING:
                logger.warning(f"Tentativa de pausar gravação fora do estado RECORDING (estado={self._state}).")
                return
            self._is_paused.set()
            self._set_state(RecorderState.PAUSED)
            logger.info("Gravação pausada.")

    def resume_recording(self) -> None:
        """Retoma a gravação pausada."""
        with self._lock:
            if self._state != RecorderState.PAUSED:
                logger.warning(f"Tentativa de retomar gravação fora do estado PAUSED (estado={self._state}).")
                return
            self._is_paused.clear()
            self._set_state(RecorderState.RECORDING)
            logger.info("Gravação retomada.")

    def stop_recording(self) -> str:
        """Finaliza a gravação, muxa áudio se houver e retorna o caminho do arquivo gerado."""
        with self._lock:
            if self._state not in (RecorderState.RECORDING, RecorderState.PAUSED):
                raise RuntimeError(f"Nenhuma gravação em andamento para parar (estado={self._state}).")
            self._set_state(RecorderState.FINALIZING)

        logger.info("Finalizando gravação...")

        # 1. Sinaliza parada para a thread de vídeo e áudio
        self._stop_event.set()
        self._is_paused.clear()

        # 2. Para a captura de áudio
        if self._audio_stream is not None:
            try:
                self._audio_stream.stop()
                self._audio_stream.close()
            except Exception as e:
                logger.debug(f"Erro ao fechar stream de áudio: {e}")
            self._audio_stream = None

        # 3. Aguarda término da thread de captura de tela
        if self._capture_thread is not None and self._capture_thread.is_alive():
            self._capture_thread.join(timeout=5.0)
            self._capture_thread = None

        # 4. Fecha pipe stdin do FFmpeg e aguarda conclusão
        if self._ffmpeg_process is not None:
            try:
                if self._ffmpeg_process.stdin:
                    self._ffmpeg_process.stdin.close()
                self._ffmpeg_process.wait(timeout=10.0)
            except Exception as e:
                logger.error(f"Erro ao finalizar subprocesso FFmpeg: {e}")
                try:
                    self._ffmpeg_process.kill()
                except Exception:
                    pass
            self._ffmpeg_process = None

        if self._stderr_reader_thread is not None and self._stderr_reader_thread.is_alive():
            self._stderr_reader_thread.join(timeout=1.0)
            self._stderr_reader_thread = None

        # 5. Processamento de áudio e muxing final
        final_file = self._target_output_path
        has_audio = False

        if self._audio_active and wavfile is not None and self._temp_audio_path:
            with self._audio_lock:
                chunks = list(self._audio_chunks)
                self._audio_chunks.clear()

            if chunks:
                try:
                    audio_data = np.concatenate(chunks, axis=0)
                    wavfile.write(str(self._temp_audio_path), self.config.audio_samplerate, audio_data)
                    has_audio = self._temp_audio_path.exists() and self._temp_audio_path.stat().st_size > 44
                except Exception as e:
                    logger.error(f"Erro ao gravar arquivo temporário de áudio: {e}")
                    has_audio = False

        # Se temos vídeo e áudio, muxamos com FFmpeg
        if has_audio and self._temp_video_path and self._temp_video_path.exists():
            ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()
            mux_cmd = [
                ffmpeg_exe,
                "-y",
                "-i", str(self._temp_video_path),
                "-i", str(self._temp_audio_path),
                "-c:v", "copy",
                "-c:a", self.config.audio_codec,
                "-b:a", self.config.audio_bitrate,
                "-shortest",
                "-movflags", "+faststart",
                str(final_file),
            ]
            logger.info("Muxando vídeo e áudio via FFmpeg...")
            extra_proc_flags = self._get_subprocess_window_suppression()
            res = subprocess.run(mux_cmd, capture_output=True, text=True, **extra_proc_flags)
            if res.returncode == 0 and final_file.exists():
                self._safe_remove(self._temp_video_path)
                self._safe_remove(self._temp_audio_path)
            else:
                logger.warning(f"Muxing falhou ({res.stderr}). Mantendo vídeo sem áudio.")
                if self._temp_video_path.exists():
                    self._move_file(self._temp_video_path, final_file)
                self._safe_remove(self._temp_audio_path)
        else:
            # Sem áudio gravado, move o vídeo cru para a saída final
            if self._temp_video_path and self._temp_video_path.exists():
                self._move_file(self._temp_video_path, final_file)
            self._safe_remove(self._temp_audio_path)

        with self._lock:
            self._set_state(RecorderState.IDLE)

        logger.info(f"Gravação concluída com sucesso: {final_file}")
        return str(final_file)

    def cancel_recording(self) -> None:
        """Cancela a gravação imediatamente, liberando recursos e deletando arquivos temporários."""
        logger.info("Cancelando gravação...")
        with self._lock:
            if self._state == RecorderState.IDLE:
                return
            self._set_state(RecorderState.FINALIZING)

        self._stop_event.set()
        self._is_paused.clear()

        # Interrompe áudio
        if self._audio_stream is not None:
            try:
                self._audio_stream.stop()
                self._audio_stream.close()
            except Exception:
                pass
            self._audio_stream = None

        with self._audio_lock:
            self._audio_chunks.clear()

        # Interrompe thread de vídeo
        if self._capture_thread is not None and self._capture_thread.is_alive():
            self._capture_thread.join(timeout=2.0)
            self._capture_thread = None

        # Mata FFmpeg se ativo
        if self._ffmpeg_process is not None:
            proc = self._ffmpeg_process
            try:
                if proc.stdin:
                    proc.stdin.close()
            except Exception:
                pass
            try:
                proc.kill()
                proc.wait(timeout=2.0)
            except Exception:
                pass
            try:
                if proc.stderr:
                    proc.stderr.close()
            except Exception:
                pass
            self._ffmpeg_process = None

        if self._stderr_reader_thread is not None and self._stderr_reader_thread.is_alive():
            self._stderr_reader_thread.join(timeout=1.0)
            self._stderr_reader_thread = None

        # Remove arquivos temporários
        self._safe_remove(self._temp_video_path)
        self._safe_remove(self._temp_audio_path)

        with self._lock:
            self._set_state(RecorderState.IDLE)
        logger.info("Gravação cancelada e temporários removidos.")

    # Aliases de conveniência
    start = start_recording
    pause = pause_recording
    resume = resume_recording
    stop = stop_recording
    cancel = cancel_recording

    # =========================================================================
    # Loop de Captura e Callbacks Privados
    # =========================================================================

    def _capture_loop(self, rect: Dict[str, int], fps: int) -> None:
        """Loop contínuo de captura de frames executado em thread dedicada."""
        _ensure_windows_desktop()

        frame_interval = 1.0 / max(1, fps)
        next_frame_time = time.perf_counter()
        last_tick_time = 0.0

        try:
            with mss.MSS() as sct:
                while not self._stop_event.is_set():
                    if self._is_paused.is_set():
                        # Quando pausado, dorme sem alimentar o pipeline
                        time.sleep(0.02)
                        next_frame_time = time.perf_counter()
                        continue

                    # 1. Captura a tela
                    shot = sct.grab(rect)

                    # 2. Escreve no pipe do FFmpeg
                    proc = self._ffmpeg_process
                    if proc and proc.stdin:
                        try:
                            proc.stdin.write(shot.raw)
                        except (BrokenPipeError, OSError) as e:
                            self._dispatch_error(f"FFmpeg stdin pipe quebrado: {e}")
                            break

                    with self._lock:
                        self._recorded_frames += 1
                        current_elapsed = self._recorded_frames / fps

                    # 3. Notifica ticker com moderação (~10Hz)
                    now = time.perf_counter()
                    if now - last_tick_time >= 0.1:
                        last_tick_time = now
                        self._dispatch_tick(current_elapsed)

                    # 4. Controle de ritmo (FPS pacing)
                    next_frame_time += frame_interval
                    sleep_time = next_frame_time - time.perf_counter()
                    if sleep_time > 0:
                        time.sleep(sleep_time)
                    elif sleep_time < -frame_interval * 2:
                        # Se atrasar mais de 2 frames (sobrecarga), realinha para evitar burst
                        next_frame_time = time.perf_counter()

        except Exception as e:
            self._dispatch_error(f"Erro fatal no loop de captura: {e}")
            logger.exception("Exceção na captura:")

    def _audio_callback(self, indata: np.ndarray, frames: int, time_info: Any, status: Any) -> None:
        """Callback do sounddevice chamado em thread do PortAudio."""
        if not self._is_paused.is_set() and self._state == RecorderState.RECORDING:
            with self._audio_lock:
                self._audio_chunks.append(indata.copy())

    def _drain_stderr(self, proc: subprocess.Popen) -> None:
        """Consome o stderr do processo FFmpeg em background."""
        try:
            if proc.stderr:
                for line in iter(proc.stderr.readline, b""):
                    decoded = line.decode("utf-8", errors="replace").strip()
                    if decoded:
                        self._ffmpeg_stderr_lines.append(decoded)
                        if len(self._ffmpeg_stderr_lines) > 200:
                            self._ffmpeg_stderr_lines.pop(0)
        except Exception:
            pass

    def _set_state(self, new_state: RecorderState) -> None:
        """Atualiza o estado e notifica ouvintes."""
        self._state = new_state
        if self.on_status_change:
            try:
                self.on_status_change(new_state)
            except Exception as e:
                logger.error(f"Erro no callback on_status_change: {e}")

    def _dispatch_tick(self, elapsed: float) -> None:
        if self.on_tick:
            try:
                self.on_tick(elapsed)
            except Exception:
                pass

    def _dispatch_error(self, message: str) -> None:
        logger.error(message)
        if self.on_error:
            try:
                self.on_error(message)
            except Exception:
                pass

    @staticmethod
    def _safe_remove(path: Optional[Path]) -> None:
        if path and path.exists():
            try:
                path.unlink()
            except Exception as e:
                logger.debug(f"Não foi possível remover temporário {path}: {e}")

    @staticmethod
    def _move_file(source: Path, destination: Path) -> None:
        destination.parent.mkdir(parents=True, exist_ok=True)
        if destination.exists():
            try:
                destination.unlink()
            except Exception:
                pass
        shutil.move(str(source), str(destination))
