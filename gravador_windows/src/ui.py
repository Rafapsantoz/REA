"""
RPsec Recorder - Interface Gráfica Moderna (UI/UX Desktop)
Desenvolvido com CustomTkinter para Windows 11.
Suporta gravação de tela, seleção de monitor, captura de áudio (microfone),
atalho global F9, e fluxo completo de diálogo nativo de salvamento.
"""

import os
import sys
import time
import shutil
import logging
import threading
import subprocess
from datetime import datetime
from typing import Optional, Callable, Dict, Any, List

import tkinter as tk
from tkinter import filedialog, messagebox
import customtkinter as ctk

# Tentativa de importação de mss e pynput com tratamento defensivo
try:
    import mss
except ImportError:
    mss = None

try:
    from pynput import keyboard
except ImportError:
    keyboard = None

# Integração com configurações e engine do Dev 1 se disponíveis
try:
    from src.config import DEFAULT_CONFIG
except ImportError:
    try:
        from config import DEFAULT_CONFIG
    except ImportError:
        DEFAULT_CONFIG = None

try:
    from src.recorder import ScreenRecorder
except ImportError:
    try:
        from recorder import ScreenRecorder
    except ImportError:
        ScreenRecorder = None

# Configuração de logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("RPsec_UI")

# Paleta de Cores Dinâmica com Alto Contraste (Modo Claro & Modo Escuro)
COLOR_BG_ROOT = ("#EDF2F7", "#121215")        # Fundo geral (Cool Gray 100 / Deep Zinc)
COLOR_BG_CARD = ("#FFFFFF", "#1E1E23")        # Painéis/Cards (White puro / Zinc 800)
COLOR_BG_CARD_INNER = ("#F8FAFC", "#17171B")  # Displays internos (Slate 50 / Zinc 900)
COLOR_BORDER = ("#CBD5E1", "#33333A")         # Bordas nítidas (Slate 300 / Zinc 700)

COLOR_RED_RECORD = "#EF4444"     # Vermelho gravação
COLOR_RED_RECORD_HOVER = "#DC2626"
COLOR_RED_PULSE = "#991B1B"

COLOR_AMBER_PAUSE = "#F59E0B"    # Âmbar pausa
COLOR_AMBER_PAUSE_HOVER = "#D97706"

COLOR_GREEN_READY = "#10B981"    # Verde sucesso/pronto
COLOR_GREEN_READY_HOVER = "#059669"

COLOR_BLUE_ACCENT = "#2563EB"    # Azul de ação primária
COLOR_BLUE_ACCENT_HOVER = "#1D4ED8"

COLOR_TEXT_PRIMARY = ("#0F172A", "#F8FAFC")   # Texto primário (Slate 900 / Slate 50)
COLOR_TEXT_MUTED = ("#334155", "#94A3B8")     # Texto secundário (Slate 700 / Slate 400)
COLOR_TEXT_DIMMED = ("#64748B", "#71717A")    # Texto terciário/labels (Slate 500 / Zinc 500)


def format_file_size(size_in_bytes: int) -> str:
    """Retorna o tamanho de arquivo formatado legível (B, KB, MB, GB)."""
    if size_in_bytes < 1024:
        return f"{size_in_bytes} B"
    elif size_in_bytes < 1024 * 1024:
        return f"{size_in_bytes / 1024:.1f} KB"
    elif size_in_bytes < 1024 * 1024 * 1024:
        return f"{size_in_bytes / (1024 * 1024):.1f} MB"
    else:
        return f"{size_in_bytes / (1024 * 1024 * 1024):.2f} GB"


def format_duration(seconds: float) -> str:
    """Formata segundos em HH:MM:SS."""
    total_secs = int(max(0, seconds))
    hours = total_secs // 3600
    minutes = (total_secs % 3600) // 60
    secs = total_secs % 60
    return f"{hours:02d}:{minutes:02d}:{secs:02d}"


def get_available_monitors() -> List[Dict[str, Any]]:
    """
    Obtém a lista de monitores disponíveis de forma segura usando mss.
    Retorna uma lista de dicts com 'id', 'label', 'width', 'height'.
    """
    monitors_list = []
    if mss is not None:
        try:
            MSSClass = getattr(mss, "MSS", mss.mss)
            with MSSClass() as sct:
                mons = sct.monitors
                if len(mons) > 1:
                    # mons[1..n] são os monitores físicos individuais
                    for idx in range(1, len(mons)):
                        m = mons[idx]
                        is_primary = m.get("is_primary", False) or (idx == 1 and len(mons) == 2)
                        primary_tag = " - Principal" if is_primary else ""
                        label = f"Monitor {idx} ({m['width']}x{m['height']}){primary_tag}"
                        monitors_list.append({
                            "id": idx,
                            "label": label,
                            "width": m["width"],
                            "height": m["height"]
                        })
                    # Se houver mais de 1 monitor físico, adiciona a opção de capturar todos
                    if len(mons) > 2:
                        m_all = mons[0]
                        monitors_list.append({
                            "id": 0,
                            "label": f"Todos os Monitores ({m_all['width']}x{m_all['height']})",
                            "width": m_all["width"],
                            "height": m_all["height"]
                        })
                elif len(mons) == 1:
                    m = mons[0]
                    monitors_list.append({
                        "id": 0,
                        "label": f"Monitor 1 ({m['width']}x{m['height']}) - Principal",
                        "width": m["width"],
                        "height": m["height"]
                    })
        except Exception as e:
            logger.warning(f"Erro ao listar monitores via mss: {e}")

    if not monitors_list:
        monitors_list = [
            {"id": 1, "label": "Monitor 1 (Principal)", "width": 1920, "height": 1080}
        ]

    return monitors_list


def center_toplevel(window: tk.Toplevel, parent: tk.Misc, width: int, height: int):
    """Centraliza uma janela toplevel em relação à janela pai."""
    parent.update_idletasks()
    px = parent.winfo_x()
    py = parent.winfo_y()
    pw = parent.winfo_width()
    ph = parent.winfo_height()

    x = px + max(0, (pw - width) // 2)
    y = py + max(0, (ph - height) // 2)
    window.geometry(f"{width}x{height}+{x}+{y}")


def apply_window_icon(window):
    """Aplica o ícone oficial de círculo vermelho de gravação à janela e barra de tarefas."""
    base_dir = os.path.dirname(os.path.abspath(__file__))
    candidates = [
        os.path.join(base_dir, "..", "assets"),
        os.path.join(base_dir, "assets"),
        os.path.join(os.getcwd(), "assets"),
        os.path.join(os.getcwd(), "gravador_windows", "assets"),
    ]
    if hasattr(sys, "_MEIPASS"):
        candidates.insert(0, os.path.join(sys._MEIPASS, "assets"))

    ico_path = None
    png_path = None
    for c in candidates:
        cand_ico = os.path.join(c, "icon.ico")
        cand_png = os.path.join(c, "icon.png")
        if os.path.exists(cand_ico) and ico_path is None:
            ico_path = cand_ico
        if os.path.exists(cand_png) and png_path is None:
            png_path = cand_png

    if ico_path:
        try:
            window.iconbitmap(ico_path)
        except Exception:
            pass

    if png_path:
        try:
            from PIL import Image, ImageTk
            img = Image.open(png_path)
            photo = ImageTk.PhotoImage(img)
            window.iconphoto(True, photo)
            window._app_photo_icon = photo
        except Exception:
            pass


class SaveSuccessDialog(ctk.CTkToplevel):
    """
    Pop-up moderno de sucesso após salvar a gravação.
    Permite abrir a pasta no Explorer com o arquivo selecionado ou reproduzir o vídeo.
    """

    def __init__(self, parent: ctk.CTk, file_path: str, duration_sec: float = 0.0):
        super().__init__(parent)
        self.file_path = os.path.normpath(file_path)
        self.title("Gravação Salva com Sucesso")
        self.resizable(False, False)
        self.configure(fg_color=COLOR_BG_ROOT)

        # Aplica o ícone de círculo vermelho de gravação
        apply_window_icon(self)

        # Configurações de modal
        self.transient(parent)
        self.grab_set()

        width, height = 480, 290
        center_toplevel(self, parent, width, height)

        # Container Principal
        container = ctk.CTkFrame(self, fg_color="transparent")
        container.pack(fill="both", expand=True, padx=24, pady=20)

        # Cabeçalho com Ícone de Sucesso
        header_frame = ctk.CTkFrame(container, fg_color="transparent")
        header_frame.pack(fill="x", pady=(0, 12))

        icon_label = ctk.CTkLabel(
            header_frame,
            text="🎉",
            font=("Segoe UI", 28)
        )
        icon_label.pack(side="left", padx=(0, 10))

        title_box = ctk.CTkFrame(header_frame, fg_color="transparent")
        title_box.pack(side="left", fill="x")

        title_lbl = ctk.CTkLabel(
            title_box,
            text="Gravação Salva com Sucesso!",
            font=("Segoe UI", 16, "bold"),
            text_color=COLOR_TEXT_PRIMARY
        )
        title_lbl.pack(anchor="w")

        subtitle_lbl = ctk.CTkLabel(
            title_box,
            text="O arquivo de vídeo está pronto e seguro.",
            font=("Segoe UI", 11),
            text_color=COLOR_TEXT_MUTED
        )
        subtitle_lbl.pack(anchor="w")

        # Cartão de Informações do Arquivo
        info_card = ctk.CTkFrame(container, fg_color=COLOR_BG_CARD, corner_radius=10, border_width=1, border_color=COLOR_BORDER)
        info_card.pack(fill="x", pady=(0, 16), padx=2, ipady=8)

        filename = os.path.basename(self.file_path)
        file_dir = os.path.dirname(self.file_path)
        file_size = 0
        if os.path.exists(self.file_path):
            file_size = os.path.getsize(self.file_path)

        # Nome do arquivo
        name_lbl = ctk.CTkLabel(
            info_card,
            text=f"📁 {filename}",
            font=("Segoe UI", 12, "bold"),
            text_color=COLOR_TEXT_PRIMARY,
            anchor="w"
        )
        name_lbl.pack(fill="x", padx=14, pady=(2, 2))

        # Detalhes (Tamanho e Duração)
        details_txt = f"Tamanho: {format_file_size(file_size)}"
        if duration_sec > 0:
            details_txt += f"  •  Duração: {format_duration(duration_sec)}"

        meta_lbl = ctk.CTkLabel(
            info_card,
            text=details_txt,
            font=("Segoe UI", 11),
            text_color=COLOR_TEXT_MUTED,
            anchor="w"
        )
        meta_lbl.pack(fill="x", padx=14, pady=(0, 4))

        # Caminho completo com botão de copiar
        path_frame = ctk.CTkFrame(info_card, fg_color=COLOR_BG_CARD_INNER, corner_radius=6)
        path_frame.pack(fill="x", padx=12, pady=(2, 4))

        path_entry = ctk.CTkEntry(
            path_frame,
            fg_color="transparent",
            border_width=0,
            text_color=COLOR_TEXT_MUTED,
            font=("Consolas", 10)
        )
        path_entry.insert(0, self.file_path)
        path_entry.configure(state="readonly")
        path_entry.pack(side="left", fill="x", expand=True, padx=(8, 4), pady=4)

        def copy_path():
            parent.clipboard_clear()
            parent.clipboard_append(self.file_path)
            btn_copy.configure(text="Copiado!")
            self.after(1500, lambda: btn_copy.configure(text="Copiar"))

        btn_copy = ctk.CTkButton(
            path_frame,
            text="Copiar",
            width=58,
            height=24,
            font=("Segoe UI", 10),
            fg_color=COLOR_BG_CARD,
            hover_color=COLOR_BORDER,
            command=copy_path
        )
        btn_copy.pack(side="right", padx=4, pady=4)

        # Botões de Ação
        actions_frame = ctk.CTkFrame(container, fg_color="transparent")
        actions_frame.pack(fill="x", pady=(4, 0))

        btn_folder = ctk.CTkButton(
            actions_frame,
            text="📂 Abrir Pasta",
            height=36,
            font=("Segoe UI", 12, "bold"),
            fg_color=COLOR_BG_CARD,
            hover_color=COLOR_BORDER,
            border_width=1,
            border_color=COLOR_BORDER,
            command=self._open_folder
        )
        btn_folder.pack(side="left", fill="x", expand=True, padx=(0, 6))

        btn_play = ctk.CTkButton(
            actions_frame,
            text="▶️ Reproduzir",
            height=36,
            font=("Segoe UI", 12, "bold"),
            fg_color=COLOR_GREEN_READY,
            hover_color=COLOR_GREEN_READY_HOVER,
            command=self._play_video
        )
        btn_play.pack(side="left", fill="x", expand=True, padx=(6, 6))

        btn_close = ctk.CTkButton(
            actions_frame,
            text="Fechar",
            height=36,
            width=75,
            font=("Segoe UI", 12),
            fg_color="transparent",
            hover_color=COLOR_BG_CARD,
            border_width=1,
            border_color=COLOR_BORDER,
            command=self.destroy
        )
        btn_close.pack(side="left", padx=(6, 0))

    def _open_folder(self):
        """Abre o Windows Explorer com o arquivo de gravação selecionado ou a pasta correspondente."""
        try:
            norm_path = os.path.normpath(self.file_path)
            if sys.platform == "win32":
                if os.path.exists(norm_path):
                    # No Windows, 'explorer /select,"<caminho>"' abre o Explorer com o arquivo selecionado.
                    # NOTA: Não usar SW_HIDE, pois explorer.exe é uma aplicação gráfica nativa (sem console CMD)
                    # e SW_HIDE ocultaria a janela do Explorer.
                    subprocess.Popen(f'explorer /select,"{norm_path}"')
                else:
                    folder = os.path.dirname(norm_path)
                    target = folder if os.path.exists(folder) else os.path.expanduser("~")
                    os.startfile(target)
            else:
                subprocess.Popen(["xdg-open", os.path.dirname(norm_path)])
        except Exception as e:
            logger.error(f"Erro ao abrir pasta: {e}")
            try:
                os.startfile(os.path.dirname(os.path.normpath(self.file_path)))
            except Exception:
                pass

    def _play_video(self):
        """Executa o arquivo no reprodutor de mídia padrão do Windows."""
        try:
            if hasattr(os, "startfile"):
                os.startfile(self.file_path)
            else:
                subprocess.Popen(["xdg-open", self.file_path])
        except Exception as e:
            logger.error(f"Erro ao reproduzir vídeo: {e}")


class SaveCancelDialog(ctk.CTkToplevel):
    """
    Diálogo protetor exibido quando o usuário cancela o diálogo de seleção de diretório.
    Garante que o trabalho gravado não seja perdido acidentalmente.
    Oferece:
    - Salvar na pasta padrão ('Vídeos/Gravações RPsec')
    - Tentar novamente (reabre a janela de diálogo)
    - Descartar gravação
    """

    def __init__(
        self,
        parent: ctk.CTk,
        default_dir: str,
        on_save_default: Callable[[], None],
        on_retry: Callable[[], None],
        on_discard: Callable[[], None]
    ):
        super().__init__(parent)
        self.title("Local de Salvamento Não Selecionado")
        self.resizable(False, False)
        self.configure(fg_color=COLOR_BG_ROOT)

        # Aplica o ícone de círculo vermelho de gravação
        apply_window_icon(self)

        self.on_save_default_cb = on_save_default
        self.on_retry_cb = on_retry
        self.on_discard_cb = on_discard

        self.transient(parent)
        self.grab_set()

        width, height = 480, 270
        center_toplevel(self, parent, width, height)

        container = ctk.CTkFrame(self, fg_color="transparent")
        container.pack(fill="both", expand=True, padx=22, pady=18)

        # Header de Alerta
        header = ctk.CTkFrame(container, fg_color="transparent")
        header.pack(fill="x", pady=(0, 10))

        warn_icon = ctk.CTkLabel(header, text="⚠️", font=("Segoe UI", 26))
        warn_icon.pack(side="left", padx=(0, 10))

        header_text_frame = ctk.CTkFrame(header, fg_color="transparent")
        header_text_frame.pack(side="left", fill="x")

        title_lbl = ctk.CTkLabel(
            header_text_frame,
            text="Deseja Salvar a Gravação?",
            font=("Segoe UI", 15, "bold"),
            text_color=COLOR_TEXT_PRIMARY
        )
        title_lbl.pack(anchor="w")

        sub_lbl = ctk.CTkLabel(
            header_text_frame,
            text="Você cancelou a seleção do local de salvamento.",
            font=("Segoe UI", 11),
            text_color=COLOR_TEXT_MUTED
        )
        sub_lbl.pack(anchor="w")

        # Mensagem Explicativa com Pasta Padrão
        msg_frame = ctk.CTkFrame(container, fg_color=COLOR_BG_CARD, corner_radius=8, border_width=1, border_color=COLOR_BORDER)
        msg_frame.pack(fill="x", pady=(0, 14), ipady=6, padx=2)

        desc_lbl = ctk.CTkLabel(
            msg_frame,
            text="Sua gravação foi concluída com sucesso. Escolha uma das opções:",
            font=("Segoe UI", 11),
            text_color=COLOR_TEXT_PRIMARY,
            anchor="w"
        )
        desc_lbl.pack(fill="x", padx=12, pady=(4, 2))

        dir_lbl = ctk.CTkLabel(
            msg_frame,
            text=f"📁 Pasta padrão: {default_dir}",
            font=("Consolas", 10),
            text_color=COLOR_TEXT_MUTED,
            anchor="w"
        )
        dir_lbl.pack(fill="x", padx=12, pady=(0, 4))

        # Ações (3 Botões bem definidos)
        btn_frame = ctk.CTkFrame(container, fg_color="transparent")
        btn_frame.pack(fill="x", pady=(2, 0))

        btn_default = ctk.CTkButton(
            btn_frame,
            text="📁 Salvar na Pasta Padrão",
            height=36,
            font=("Segoe UI", 12, "bold"),
            fg_color=COLOR_GREEN_READY,
            hover_color=COLOR_GREEN_READY_HOVER,
            command=self._action_save_default
        )
        btn_default.pack(fill="x", pady=(0, 6))

        btn_row_lower = ctk.CTkFrame(btn_frame, fg_color="transparent")
        btn_row_lower.pack(fill="x")

        btn_retry = ctk.CTkButton(
            btn_row_lower,
            text="🔄 Tentar Novamente",
            height=34,
            font=("Segoe UI", 11, "bold"),
            fg_color=COLOR_BLUE_ACCENT,
            hover_color=COLOR_BLUE_ACCENT_HOVER,
            command=self._action_retry
        )
        btn_retry.pack(side="left", fill="x", expand=True, padx=(0, 6))

        btn_discard = ctk.CTkButton(
            btn_row_lower,
            text="🗑️ Descartar Gravação",
            height=34,
            font=("Segoe UI", 11),
            fg_color="transparent",
            hover_color=("#FEE2E2", "#7F1D1D"),
            text_color=("#DC2626", "#F87171"),
            border_width=1,
            border_color=("#FCA5A5", "#991B1B"),
            command=self._action_discard
        )
        btn_discard.pack(side="right", fill="x", expand=True, padx=(6, 0))

        # Se o usuário fechar a janela no 'X', assume descarte seguro
        self.protocol("WM_DELETE_WINDOW", self._action_discard)

    def _action_save_default(self):
        self.destroy()
        self.on_save_default_cb()

    def _action_retry(self):
        self.destroy()
        self.on_retry_cb()

    def _action_discard(self):
        self.destroy()
        self.on_discard_cb()


class MockScreenRecorder:
    """
    Simulador de engine de gravação para execução standalone e testes de UI.
    Cria um arquivo de vídeo MP4 sintético e válido quando a gravação é encerrada.
    """

    def __init__(self):
        self.is_recording = False
        self.is_paused = False
        self._temp_path: Optional[str] = None
        self._start_time = 0.0

    def start(self, monitor_index: int = 1, record_audio: bool = True):
        self.is_recording = True
        self.is_paused = False
        self._start_time = time.time()
        logger.info(f"[MockRecorder] Iniciando gravação: Monitor={monitor_index}, Áudio={record_audio}")

    def pause(self):
        if self.is_recording and not self.is_paused:
            self.is_paused = True
            logger.info("[MockRecorder] Gravação pausada.")

    def resume(self):
        if self.is_recording and self.is_paused:
            self.is_paused = False
            logger.info("[MockRecorder] Gravação retomada.")

    def stop(self) -> str:
        self.is_recording = False
        self.is_paused = False
        logger.info("[MockRecorder] Finalizando gravação e gerando arquivo de teste...")

        # Gera um arquivo MP4 temporário realista
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        temp_dir = os.path.join(os.path.expanduser("~"), "AppData", "Local", "Temp")
        if not os.path.exists(temp_dir):
            temp_dir = os.path.expanduser("~")

        self._temp_path = os.path.join(temp_dir, f"rpsec_mock_temp_{timestamp}.mp4")

        # Tenta gerar um clipe de 1 segundo com imageio se disponível
        try:
            import imageio
            import numpy as np
            frames = []
            for i in range(15):
                # Animação simples de cor (dimensões 384x640 são divisíveis por 16)
                color_val = int((i / 15.0) * 200)
                frame = np.full((384, 640, 3), [20, color_val, 180], dtype=np.uint8)
                frames.append(frame)
            imageio.mimwrite(self._temp_path, frames, fps=15)
        except Exception:
            # Fallback seguro: grava bytes dummy simulados
            with open(self._temp_path, "wb") as f:
                f.write(b"MOCK_MP4_VIDEO_STREAM_" + b"\x00" * 4096)

        return self._temp_path


class ScreenRecorderUI(ctk.CTk):
    """
    Interface Gráfica Moderna Principal do RPsec Recorder.
    Implementa todos os controles, timer de alta precisão, atalho global F9,
    e o fluxo de encerramento com diálogo nativo do Windows.
    """

    STATE_IDLE = "idle"
    STATE_RECORDING = "recording"
    STATE_PAUSED = "paused"
    STATE_FINISHING = "finishing"

    def __init__(
        self,
        recorder: Optional[Any] = None,
        on_start: Optional[Callable[[int, bool], None]] = None,
        on_pause: Optional[Callable[[], None]] = None,
        on_resume: Optional[Callable[[], None]] = None,
        on_stop: Optional[Callable[[], str]] = None,
        on_save: Optional[Callable[[str], None]] = None
    ):
        super().__init__()

        # Inicializa backend / callbacks desacoplados
        if recorder is not None:
            self.recorder = recorder
        elif ScreenRecorder is not None:
            try:
                self.recorder = ScreenRecorder()
                logger.info("Motor ScreenRecorder real conectado à interface.")
            except Exception as e:
                logger.warning(f"Falha ao instanciar ScreenRecorder ({e}). Usando MockScreenRecorder.")
                self.recorder = MockScreenRecorder()
        else:
            self.recorder = MockScreenRecorder()
        self.cb_start = on_start
        self.cb_pause = on_pause
        self.cb_resume = on_resume
        self.cb_stop = on_stop
        self.cb_save = on_save

        # Gerenciamento de Estado
        self.app_state = self.STATE_IDLE
        self._recording_start_time = 0.0
        self._elapsed_time_accumulated = 0.0
        self._timer_job = None
        self._pulse_state = False
        self._last_hotkey_time = 0.0

        # Configurações de Janela
        self.title("RPsec Recorder")
        self.geometry("460x590")
        self.minsize(440, 570)
        self.configure(fg_color=COLOR_BG_ROOT)

        # Configura AppUserModelID no Windows para que o ícone na barra de tarefas seja o ícone do app
        if sys.platform == "win32":
            try:
                import ctypes
                myappid = "rpsecti.recorder.windows.v1"
                ctypes.windll.shell32.SetCurrentProcessExplicitAppUserModelID(myappid)
            except Exception as e:
                logger.debug(f"Falha ao definir AppUserModelID: {e}")

        # Aplica o ícone oficial de círculo vermelho de gravação
        apply_window_icon(self)

        # Tema CustomTkinter
        ctk.set_appearance_mode("dark")
        ctk.set_default_color_theme("blue")

        # Variáveis Reativas
        initial_audio = DEFAULT_CONFIG.audio_enabled if DEFAULT_CONFIG is not None else True
        self.record_audio_var = ctk.BooleanVar(value=initial_audio)
        self.monitor_selection_var = ctk.StringVar()
        self.appearance_mode_var = ctk.StringVar(value="🌙 Modo Escuro")

        # Construção da Interface
        self._init_ui_components()

        # Inicialização do Atalho Global F9
        self._hotkey_listener = None
        self._setup_global_hotkey()

        # Fechamento Gracioso
        self.protocol("WM_DELETE_WINDOW", self._on_closing)

        # Centraliza janela na tela inicial
        self._center_main_window()

    def _center_main_window(self):
        """Centraliza a janela principal no monitor primário."""
        self.update_idletasks()
        screen_w = self.winfo_screenwidth()
        screen_h = self.winfo_screenheight()
        width = 460
        height = 590
        x = max(0, (screen_w - width) // 2)
        y = max(0, (screen_h - height) // 2)
        self.geometry(f"{width}x{height}+{x}+{y}")

    def _init_ui_components(self):
        """Constrói e organiza todos os widgets do layout."""
        # Container Central com padding suave
        self.main_container = ctk.CTkFrame(self, fg_color="transparent")
        self.main_container.pack(fill="both", expand=True, padx=22, pady=18)

        # 1. CABEÇALHO & STATUS
        self._build_header(self.main_container)

        # 2. DISPLAY DO CRONÔMETRO
        self._build_timer_card(self.main_container)

        # 3. CONTROLES DE AÇÃO (Iniciar / Pausar / Parar)
        self._build_action_controls(self.main_container)

        # 4. CONFIGURAÇÕES SECUNDÁRIAS (Monitores, Áudio & Tema)
        self._build_settings_card(self.main_container)

        # 5. RODAPÉ COM LEGENDA DE ATALHOS
        self._build_footer(self.main_container)

    def _build_header(self, parent: ctk.CTkFrame):
        """Constrói o cabeçalho com título, ícone de gravação e badge de status dinâmico."""
        header_frame = ctk.CTkFrame(parent, fg_color="transparent")
        header_frame.pack(fill="x", pady=(0, 14))

        # Título e Subtítulo com Ícone Oficial de Gravação
        title_box = ctk.CTkFrame(header_frame, fg_color="transparent")
        title_box.pack(side="left")

        title_row = ctk.CTkFrame(title_box, fg_color="transparent")
        title_row.pack(anchor="w")

        # Carrega o ícone oficial embutido em alta definição via CTkImage (evita glitches de fontes emoji)
        logo_img = None
        base_dir = os.path.dirname(os.path.abspath(__file__))
        candidates = [
            os.path.join(base_dir, "..", "assets", "icon.png"),
            os.path.join(base_dir, "assets", "icon.png"),
            os.path.join(os.getcwd(), "assets", "icon.png"),
            os.path.join(os.getcwd(), "gravador_windows", "assets", "icon.png"),
        ]
        if hasattr(sys, "_MEIPASS"):
            candidates.insert(0, os.path.join(sys._MEIPASS, "assets", "icon.png"))

        for p in candidates:
            if os.path.exists(p):
                try:
                    from PIL import Image
                    pil_img = Image.open(p)
                    logo_img = ctk.CTkImage(light_image=pil_img, dark_image=pil_img, size=(24, 24))
                    break
                except Exception:
                    pass

        if logo_img is not None:
            self.logo_icon = ctk.CTkLabel(title_row, text="", image=logo_img)
        else:
            self.logo_icon = ctk.CTkLabel(title_row, text="⏺", font=("Segoe UI", 18, "bold"), text_color=COLOR_RED_RECORD)
        self.logo_icon.pack(side="left", padx=(0, 8))

        self.title_lbl = ctk.CTkLabel(
            title_row,
            text="RPsec Recorder",
            font=("Segoe UI", 18, "bold"),
            text_color=COLOR_TEXT_PRIMARY
        )
        self.title_lbl.pack(side="left")

        self.subtitle_lbl = ctk.CTkLabel(
            title_box,
            text="Gravador de tela & áudio ultra-leve",
            font=("Segoe UI", 11),
            text_color=COLOR_TEXT_MUTED
        )
        self.subtitle_lbl.pack(anchor="w", padx=(32, 0))

        # Pill Badge de Status
        self.status_badge = ctk.CTkFrame(
            header_frame,
            fg_color=COLOR_BG_CARD,
            corner_radius=14,
            border_width=1,
            border_color=COLOR_BORDER
        )
        self.status_badge.pack(side="right", ipady=2, ipadx=6)

        self.status_dot = ctk.CTkLabel(
            self.status_badge,
            text="●",
            font=("Segoe UI", 14),
            text_color=COLOR_GREEN_READY
        )
        self.status_dot.pack(side="left", padx=(6, 4))

        self.status_text = ctk.CTkLabel(
            self.status_badge,
            text="Pronto",
            font=("Segoe UI", 11, "bold"),
            text_color=COLOR_TEXT_PRIMARY
        )
        self.status_text.pack(side="left", padx=(0, 8))

    def _build_timer_card(self, parent: ctk.CTkFrame):
        """Constrói o card do cronômetro com visual moderno e tipografia monospace."""
        self.timer_card = ctk.CTkFrame(
            parent,
            fg_color=COLOR_BG_CARD_INNER,
            corner_radius=12,
            border_width=1,
            border_color=COLOR_BORDER
        )
        self.timer_card.pack(fill="x", pady=(0, 14), ipady=10)

        # Rótulo de Duração
        card_label = ctk.CTkLabel(
            self.timer_card,
            text="TEMPO DE GRAVAÇÃO",
            font=("Segoe UI", 10, "bold"),
            text_color=COLOR_TEXT_DIMMED
        )
        card_label.pack(pady=(6, 0))

        # Cronômetro Grande
        self.timer_label = ctk.CTkLabel(
            self.timer_card,
            text="00:00:00",
            font=("Consolas", 42, "bold"),
            text_color=COLOR_TEXT_MUTED
        )
        self.timer_label.pack(pady=(2, 4))

        # Indicador de estado auxiliar
        self.timer_subtext = ctk.CTkLabel(
            self.timer_card,
            text="Aguardando início...",
            font=("Segoe UI", 10),
            text_color=COLOR_TEXT_DIMMED
        )
        self.timer_subtext.pack(pady=(0, 4))

    def _build_action_controls(self, parent: ctk.CTkFrame):
        """Constrói os botões de ação: Iniciar, Pausar/Retomar e Finalizar."""
        controls_frame = ctk.CTkFrame(parent, fg_color="transparent")
        controls_frame.pack(fill="x", pady=(0, 14))

        # Botão Principal "Iniciar Gravação"
        self.btn_start = ctk.CTkButton(
            controls_frame,
            text="🔴 Iniciar Gravação",
            height=46,
            font=("Segoe UI", 14, "bold"),
            fg_color=COLOR_RED_RECORD,
            hover_color=COLOR_RED_RECORD_HOVER,
            text_color="#FFFFFF",
            corner_radius=10,
            command=self.start_recording
        )
        self.btn_start.pack(fill="x", pady=(0, 8))

        # Grade com Botões de Pausa e Parada
        sub_controls = ctk.CTkFrame(controls_frame, fg_color="transparent")
        sub_controls.pack(fill="x")
        sub_controls.grid_columnconfigure(0, weight=1)
        sub_controls.grid_columnconfigure(1, weight=1)

        # Botão Pausar / Retomar
        self.btn_pause = ctk.CTkButton(
            sub_controls,
            text="⏸️ Pausar",
            height=40,
            font=("Segoe UI", 12, "bold"),
            fg_color=("#F1F5F9", "#27272A"),
            hover_color=("#E2E8F0", "#3F3F46"),
            text_color=COLOR_TEXT_PRIMARY,
            text_color_disabled=("#94A3B8", "#52525B"),
            border_width=1,
            border_color=COLOR_BORDER,
            state="disabled",
            corner_radius=8,
            command=self.toggle_pause_resume
        )
        self.btn_pause.grid(row=0, column=0, sticky="ew", padx=(0, 5))

        # Botão Finalizar & Salvar
        self.btn_stop = ctk.CTkButton(
            sub_controls,
            text="⏹️ Finalizar & Salvar",
            height=40,
            font=("Segoe UI", 12, "bold"),
            fg_color=("#F1F5F9", "#27272A"),
            hover_color=("#E2E8F0", "#3F3F46"),
            text_color=COLOR_TEXT_PRIMARY,
            text_color_disabled=("#94A3B8", "#52525B"),
            border_width=1,
            border_color=COLOR_BORDER,
            state="disabled",
            corner_radius=8,
            command=self.stop_recording
        )
        self.btn_stop.grid(row=0, column=1, sticky="ew", padx=(5, 0))

    def _build_settings_card(self, parent: ctk.CTkFrame):
        """Constrói o card de configurações secundárias (Monitor e Microfone)."""
        settings_card = ctk.CTkFrame(
            parent,
            fg_color=COLOR_BG_CARD,
            corner_radius=10,
            border_width=1,
            border_color=COLOR_BORDER
        )
        settings_card.pack(fill="x", pady=(0, 14), padx=1, ipady=4)

        # Seção Título
        sec_title = ctk.CTkLabel(
            settings_card,
            text="CONFIGURAÇÕES DA GRAVAÇÃO",
            font=("Segoe UI", 10, "bold"),
            text_color=COLOR_TEXT_DIMMED
        )
        sec_title.pack(anchor="w", padx=14, pady=(8, 6))

        # Linha Seletor de Monitor
        mon_row = ctk.CTkFrame(settings_card, fg_color="transparent")
        mon_row.pack(fill="x", padx=14, pady=(0, 8))

        mon_lbl = ctk.CTkLabel(
            mon_row,
            text="🖥️ Monitor:",
            font=("Segoe UI", 12),
            text_color=COLOR_TEXT_PRIMARY
        )
        mon_lbl.pack(side="left")

        # Obtenção segura dos monitores
        self.monitors_data = get_available_monitors()
        monitor_labels = [m["label"] for m in self.monitors_data]

        # Define valor inicial (preferência por Monitor 1 / Principal)
        default_label = monitor_labels[0]
        for m in self.monitors_data:
            if m["id"] == 1:
                default_label = m["label"]
                break
        self.monitor_selection_var.set(default_label)

        self.monitor_menu = ctk.CTkOptionMenu(
            mon_row,
            values=monitor_labels,
            variable=self.monitor_selection_var,
            font=("Segoe UI", 11),
            fg_color=("#F1F5F9", "#222227"),
            text_color=COLOR_TEXT_PRIMARY,
            button_color=("#CBD5E1", "#33333A"),
            button_hover_color=("#94A3B8", "#4F4F56"),
            dropdown_fg_color=("#FFFFFF", "#222227"),
            dropdown_text_color=COLOR_TEXT_PRIMARY,
            dropdown_hover_color=("#E2E8F0", "#33333A"),
            dropdown_font=("Segoe UI", 11),
            height=32,
            corner_radius=6
        )
        self.monitor_menu.pack(side="right", fill="x", expand=True, padx=(10, 0))

        # Linha Switch de Áudio
        audio_row = ctk.CTkFrame(settings_card, fg_color="transparent")
        audio_row.pack(fill="x", padx=14, pady=(0, 10))

        self.audio_switch = ctk.CTkSwitch(
            audio_row,
            text="🎙️ Gravar Áudio (Microfone)",
            font=("Segoe UI", 12),
            text_color=COLOR_TEXT_PRIMARY,
            progress_color=COLOR_GREEN_READY,
            variable=self.record_audio_var,
            onvalue=True,
            offvalue=False,
            command=self._on_audio_switch_changed
        )
        self.audio_switch.pack(side="left")

        # Linha Seletor de Tema (Modo Claro / Escuro / Sistema)
        theme_row = ctk.CTkFrame(settings_card, fg_color="transparent")
        theme_row.pack(fill="x", padx=14, pady=(0, 8))

        theme_lbl = ctk.CTkLabel(
            theme_row,
            text="🎨 Tema Visual:",
            font=("Segoe UI", 12),
            text_color=COLOR_TEXT_PRIMARY
        )
        theme_lbl.pack(side="left")

        self.theme_menu = ctk.CTkOptionMenu(
            theme_row,
            values=["🌙 Modo Escuro", "☀️ Modo Claro", "💻 Modo Sistema"],
            variable=self.appearance_mode_var,
            command=self._on_theme_changed,
            font=("Segoe UI", 11),
            fg_color=("#F1F5F9", "#222227"),
            text_color=COLOR_TEXT_PRIMARY,
            button_color=("#CBD5E1", "#33333A"),
            button_hover_color=("#94A3B8", "#4F4F56"),
            dropdown_fg_color=("#FFFFFF", "#222227"),
            dropdown_text_color=COLOR_TEXT_PRIMARY,
            dropdown_hover_color=("#E2E8F0", "#33333A"),
            dropdown_font=("Segoe UI", 11),
            height=32,
            corner_radius=6
        )
        self.theme_menu.pack(side="right", fill="x", expand=True, padx=(10, 0))

    def _on_theme_changed(self, choice: str):
        """Alterna a aparência entre Modo Escuro, Modo Claro e Sistema."""
        if "Claro" in choice:
            ctk.set_appearance_mode("light")
        elif "Escuro" in choice:
            ctk.set_appearance_mode("dark")
        else:
            ctk.set_appearance_mode("system")
        self.update_idletasks()

    def _on_audio_switch_changed(self):
        """Atualiza a mensagem de status dinamicamente quando o usuário altera o microfone."""
        if self.app_state == self.STATE_IDLE:
            if self.record_audio_var.get():
                self.subtitle_lbl.configure(text="Gravador de tela & áudio ultra-leve")
                self.timer_subtext.configure(text="Pronto para gravar tela e áudio", text_color=COLOR_TEXT_DIMMED)
            else:
                self.subtitle_lbl.configure(text="Gravador de tela ultra-leve (áudio desligado)")
                self.timer_subtext.configure(text="Pronto para gravar tela (sem áudio)", text_color=COLOR_TEXT_DIMMED)

    def _build_footer(self, parent: ctk.CTkFrame):
        """Exibe o que o F9 faz de forma direta e temporária, auto-ocultando após 6 segundos."""
        self.footer_frame = ctk.CTkFrame(
            parent,
            fg_color="transparent"
        )
        self.footer_frame.pack(fill="x", side="bottom", pady=(2, 0))

        # Badge moderno e discreto (sem a palavra "Dica", 100% focado no que o F9 faz)
        self.shortcut_badge = ctk.CTkFrame(
            self.footer_frame,
            fg_color=("#E2E8F0", "#27272A"),
            corner_radius=8,
            border_width=1,
            border_color=COLOR_BORDER
        )
        self.shortcut_badge.pack(anchor="center", ipady=2, ipadx=10)

        self.shortcut_label = ctk.CTkLabel(
            self.shortcut_badge,
            text="⌨️ F9: Iniciar e Parar gravação",
            font=("Segoe UI", 10, "bold"),
            text_color=COLOR_TEXT_MUTED
        )
        self.shortcut_label.pack(side="left", padx=4, pady=1)

        # Oculta automaticamente a mensagem após tempo limite (6 segundos) para uma interface limpa
        self.after(6000, self._hide_shortcut_message)

    def _hide_shortcut_message(self):
        """Remove a mensagem de atalho após tempo limite para deixar o layout minimalista."""
        try:
            if hasattr(self, "shortcut_badge") and self.shortcut_badge.winfo_exists():
                self.shortcut_badge.pack_forget()
        except Exception:
            pass

    def _setup_global_hotkey(self):
        """Inicia um listener global em segundo plano para capturar o atalho F9."""
        if keyboard is None:
            logger.warning("Módulo pynput não disponível. Atalho global F9 desativado.")
            return

        def on_key_release(key):
            try:
                if key == keyboard.Key.f9:
                    # Envia para a thread principal da UI
                    self.after(0, self._on_f9_triggered)
            except Exception as e:
                logger.debug(f"Erro no processamento da tecla de atalho: {e}")

        try:
            self._hotkey_listener = keyboard.Listener(on_release=on_key_release)
            self._hotkey_listener.daemon = True
            self._hotkey_listener.start()
            logger.info("Atalho global F9 registrado com sucesso.")
        except Exception as e:
            logger.warning(f"Não foi possível registrar o atalho global F9: {e}")

    def _on_f9_triggered(self):
        """Callback acionado na thread da UI quando F9 é pressionado."""
        now = time.time()
        # Debounce de 0.5s para evitar acionamentos duplicados acidentais
        if now - self._last_hotkey_time < 0.5:
            return
        self._last_hotkey_time = now

        if self.app_state == self.STATE_IDLE:
            self.start_recording()
        elif self.app_state in (self.STATE_RECORDING, self.STATE_PAUSED):
            self.stop_recording()

    def _get_selected_monitor_id(self) -> int:
        """Retorna o ID do monitor atualmente selecionado no dropdown."""
        selected_label = self.monitor_selection_var.get()
        for m in self.monitors_data:
            if m["label"] == selected_label:
                return m["id"]
        return 1

    # =========================================================================
    # FLUXO DE GRAVAÇÃO (INICIAR / PAUSAR / RETOMAR / PARAR)
    # =========================================================================

    def start_recording(self):
        """Inicia o processo de gravação de tela."""
        if self.app_state != self.STATE_IDLE:
            return

        monitor_id = self._get_selected_monitor_id()
        record_audio = self.record_audio_var.get()

        logger.info(f"Iniciando gravação - Monitor: {monitor_id}, Áudio: {record_audio}")

        # Chama a engine ou callback
        try:
            if self.cb_start:
                self.cb_start(monitor_id, record_audio)
            elif hasattr(self.recorder, "start_recording"):
                self.recorder.start_recording(monitor_index=monitor_id, record_audio=record_audio)
            elif hasattr(self.recorder, "start"):
                self.recorder.start(monitor_index=monitor_id, record_audio=record_audio)
        except Exception as e:
            logger.error(f"Falha ao iniciar gravação: {e}")
            messagebox.showerror("Erro de Gravação", f"Não foi possível iniciar a gravação:\n{e}")
            return

        # Atualiza Estado e Controles
        self.app_state = self.STATE_RECORDING
        self._recording_start_time = time.time()
        self._elapsed_time_accumulated = 0.0
        self._is_recording_audio = record_audio

        # Atualização visual - Status adaptativo conforme a opção de áudio
        if record_audio:
            self._set_status("Gravando Tela & Áudio", COLOR_RED_RECORD)
            self.timer_subtext.configure(text="Capturando tela e áudio...", text_color=COLOR_RED_RECORD)
        else:
            self._set_status("Gravando Tela", COLOR_RED_RECORD)
            self.timer_subtext.configure(text="Capturando apenas tela...", text_color=COLOR_RED_RECORD)

        self.timer_label.configure(text_color=COLOR_TEXT_PRIMARY)

        self.btn_start.configure(state="disabled", text="🔴 Gravando...")
        self.btn_pause.configure(state="normal", text="⏸️ Pausar", fg_color=COLOR_BLUE_ACCENT, hover_color=COLOR_BLUE_ACCENT_HOVER)
        self.btn_stop.configure(state="normal", text="⏹️ Finalizar & Salvar", fg_color=COLOR_RED_RECORD, hover_color=COLOR_RED_RECORD_HOVER)

        # Desabilita configurações para não alterar no meio da gravação
        self.monitor_menu.configure(state="disabled")
        self.audio_switch.configure(state="disabled")

        # Inicia o loop do cronômetro
        self._tick_timer()

    def toggle_pause_resume(self):
        """Alterna entre pausar e retomar a gravação."""
        if self.app_state == self.STATE_RECORDING:
            self.pause_recording()
        elif self.app_state == self.STATE_PAUSED:
            self.resume_recording()

    def pause_recording(self):
        """Pausa a gravação em andamento."""
        if self.app_state != self.STATE_RECORDING:
            return

        try:
            if self.cb_pause:
                self.cb_pause()
            elif hasattr(self.recorder, "pause_recording"):
                self.recorder.pause_recording()
            elif hasattr(self.recorder, "pause"):
                self.recorder.pause()
        except Exception as e:
            logger.error(f"Erro ao pausar: {e}")

        # Acumula o tempo até a pausa
        self._elapsed_time_accumulated += (time.time() - self._recording_start_time)
        self.app_state = self.STATE_PAUSED

        if getattr(self, "_is_recording_audio", False):
            self._set_status("Pausado (Tela & Áudio)", COLOR_AMBER_PAUSE)
            self.timer_subtext.configure(text="Gravação de tela e áudio em pausa", text_color=COLOR_AMBER_PAUSE)
        else:
            self._set_status("Pausado (Tela)", COLOR_AMBER_PAUSE)
            self.timer_subtext.configure(text="Gravação de tela em pausa", text_color=COLOR_AMBER_PAUSE)

        self.timer_label.configure(text_color=COLOR_AMBER_PAUSE)

        self.btn_pause.configure(text="▶️ Retomar", fg_color=COLOR_GREEN_READY, hover_color=COLOR_GREEN_READY_HOVER)

    def resume_recording(self):
        """Retoma a gravação que estava pausada."""
        if self.app_state != self.STATE_PAUSED:
            return

        try:
            if self.cb_resume:
                self.cb_resume()
            elif hasattr(self.recorder, "resume_recording"):
                self.recorder.resume_recording()
            elif hasattr(self.recorder, "resume"):
                self.recorder.resume()
        except Exception as e:
            logger.error(f"Erro ao retomar: {e}")

        self._recording_start_time = time.time()
        self.app_state = self.STATE_RECORDING

        if getattr(self, "_is_recording_audio", False):
            self._set_status("Gravando Tela & Áudio", COLOR_RED_RECORD)
            self.timer_subtext.configure(text="Capturando tela e áudio...", text_color=COLOR_RED_RECORD)
        else:
            self._set_status("Gravando Tela", COLOR_RED_RECORD)
            self.timer_subtext.configure(text="Capturando apenas tela...", text_color=COLOR_RED_RECORD)

        self.timer_label.configure(text_color=COLOR_TEXT_PRIMARY)

        self.btn_pause.configure(text="⏸️ Pausar", fg_color=COLOR_BLUE_ACCENT, hover_color=COLOR_BLUE_ACCENT_HOVER)

        self._tick_timer()

    def stop_recording(self):
        """
        Finaliza a gravação, processa o arquivo em segundo plano e
        dispara o diálogo nativo do Windows para escolha do destino.
        """
        if self.app_state not in (self.STATE_RECORDING, self.STATE_PAUSED):
            return

        # Congela o tempo total registrado
        if self.app_state == self.STATE_RECORDING:
            self._elapsed_time_accumulated += (time.time() - self._recording_start_time)

        final_duration = self._elapsed_time_accumulated
        self.app_state = self.STATE_FINISHING

        # Atualiza a UI para estado de finalização
        self._set_status("Finalizando...", COLOR_BLUE_ACCENT)
        self.timer_subtext.configure(text="Preparando e codificando arquivo...", text_color=COLOR_BLUE_ACCENT)

        # Desabilita todos os botões de ação para evitar chamadas concorrentes
        self.btn_start.configure(state="disabled", text="Finalizando...")
        self.btn_pause.configure(state="disabled")
        self.btn_stop.configure(state="disabled")

        if self._timer_job:
            self.after_cancel(self._timer_job)
            self._timer_job = None

        # Executa a finalização da engine em uma thread separada para não travar a UI
        def worker_stop():
            temp_path = None
            err = None
            try:
                if self.cb_stop:
                    temp_path = self.cb_stop()
                elif hasattr(self.recorder, "stop_recording"):
                    temp_path = self.recorder.stop_recording()
                elif hasattr(self.recorder, "stop"):
                    temp_path = self.recorder.stop()
            except Exception as e:
                err = e

            # Volta à thread principal da UI
            self.after(0, lambda: self._on_stop_finished(temp_path, err, final_duration))

        threading.Thread(target=worker_stop, daemon=True).start()

    def _on_stop_finished(self, temp_path: Optional[str], error: Optional[Exception], duration_sec: float):
        """Chamado na thread da UI quando a engine encerra o arquivo temporário."""
        if error or not temp_path or not os.path.exists(temp_path):
            logger.error(f"Falha na finalização do arquivo: {error}")
            messagebox.showerror(
                "Erro ao Salvar Gravação",
                f"Ocorreu um problema ao finalizar o vídeo:\n{error or 'Arquivo temporário não encontrado.'}"
            )
            self._reset_to_idle()
            return

        logger.info(f"Arquivo temporário gerado com sucesso: {temp_path}")
        self._prompt_native_save_dialog(temp_path, duration_sec)

    # =========================================================================
    # FLUXO DO DIÁLOGO NATIVO DE SALVAMENTO (REQUISITO CENTRAL)
    # =========================================================================

    def _get_default_save_dir(self) -> str:
        """Retorna o diretório padrão de vídeos ('Vídeos/Gravações RPsec')."""
        user_videos = os.path.join(os.path.expanduser("~"), "Videos")
        if not os.path.exists(user_videos):
            user_videos = os.path.expanduser("~")
        rpsec_folder = os.path.join(user_videos, "Gravações RPsec")
        return rpsec_folder

    def _prompt_native_save_dialog(self, temp_path: str, duration_sec: float):
        """
        Abre o diálogo nativo do Windows (filedialog.asksaveasfilename)
        com nome sugerido 'Gravacao_AAAA-MM-DD_HH-MM-SS.mp4'.
        """
        timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
        suggested_name = f"Gravacao_{timestamp}.mp4"

        # Diretório sugerido inicial
        default_dir = os.path.join(os.path.expanduser("~"), "Videos")
        if not os.path.exists(default_dir):
            default_dir = os.path.expanduser("~")

        logger.info("Abrindo diálogo nativo de salvamento...")

        # Diálogo nativo do sistema operacional
        dest_path = filedialog.asksaveasfilename(
            parent=self,
            title="Onde você deseja salvar a gravação?",
            initialdir=default_dir,
            initialfile=suggested_name,
            defaultextension=".mp4",
            filetypes=[("Vídeo MP4", "*.mp4"), ("Todos os Arquivos", "*.*")]
        )

        if dest_path:
            # CASO 1: Usuário confirmou o destino
            self._save_to_destination(temp_path, dest_path, duration_sec)
        else:
            # CASO 2: Usuário cancelou o diálogo nativo -> Diálogo Protetor
            self._handle_save_cancelled(temp_path, suggested_name, duration_sec)

    def _save_to_destination(self, temp_path: str, dest_path: str, duration_sec: float):
        """Move o arquivo temporário para o destino final escolhido."""
        try:
            dest_dir = os.path.dirname(dest_path)
            if dest_dir and not os.path.exists(dest_dir):
                os.makedirs(dest_dir, exist_ok=True)

            # Move arquivo temporário para o destino final
            shutil.move(temp_path, dest_path)
            logger.info(f"Arquivo salvo com sucesso em: {dest_path}")

            if self.cb_save:
                try:
                    self.cb_save(dest_path)
                except Exception as e:
                    logger.warning(f"Erro no callback cb_save: {e}")

            # Reseta a UI para o estado pronto
            self._reset_to_idle()
            self._set_status("Salvo!", COLOR_GREEN_READY)

            # Exibe o pop-up moderno de sucesso
            SaveSuccessDialog(self, dest_path, duration_sec)

        except Exception as e:
            logger.error(f"Erro ao mover arquivo para destino: {e}")
            messagebox.showerror("Erro ao Salvar", f"Não foi possível salvar o arquivo no destino:\n{e}")
            self._reset_to_idle()

    def _handle_save_cancelled(self, temp_path: str, suggested_name: str, duration_sec: float):
        """Exibe o diálogo protetor quando o usuário fecha/cancela a janela de salvamento."""
        default_dir = self._get_default_save_dir()

        def on_save_default():
            try:
                os.makedirs(default_dir, exist_ok=True)
                final_path = os.path.join(default_dir, suggested_name)
                self._save_to_destination(temp_path, final_path, duration_sec)
            except Exception as e:
                logger.error(f"Erro ao salvar na pasta padrão: {e}")
                messagebox.showerror("Erro", f"Não foi possível salvar na pasta padrão:\n{e}")
                self._reset_to_idle()

        def on_retry():
            # Reabre o diálogo nativo de salvamento
            self._prompt_native_save_dialog(temp_path, duration_sec)

        def on_discard():
            # Remove o arquivo temporário com segurança
            try:
                if os.path.exists(temp_path):
                    os.remove(temp_path)
                    logger.info(f"Arquivo temporário descartado: {temp_path}")
            except Exception as e:
                logger.warning(f"Erro ao descartar arquivo temporário: {e}")

            self._reset_to_idle()
            self._set_status("Descartado", COLOR_TEXT_MUTED)
            self.timer_subtext.configure(text="Gravação descartada.", text_color=COLOR_TEXT_MUTED)

        SaveCancelDialog(
            parent=self,
            default_dir=default_dir,
            on_save_default=on_save_default,
            on_retry=on_retry,
            on_discard=on_discard
        )

    # =========================================================================
    # AUXILIARES DE STATUS & CRONÔMETRO
    # =========================================================================

    def _set_status(self, text: str, dot_color: str):
        """Atualiza o badge visual de status no cabeçalho."""
        self.status_text.configure(text=text)
        self.status_dot.configure(text_color=dot_color)

    def _tick_timer(self):
        """Atualiza o display de cronômetro periodicamente."""
        if self.app_state != self.STATE_RECORDING:
            return

        current_elapsed = self._elapsed_time_accumulated + (time.time() - self._recording_start_time)
        formatted = format_duration(current_elapsed)
        self.timer_label.configure(text=formatted)

        # Efeito de pulso sutil no indicador enquanto grava
        self._pulse_state = not self._pulse_state
        dot_color = COLOR_RED_RECORD if self._pulse_state else COLOR_RED_PULSE
        self.status_dot.configure(text_color=dot_color)

        self._timer_job = self.after(200, self._tick_timer)

    def _reset_to_idle(self):
        """Restaura a interface ao estado inicial 'Pronto'."""
        if hasattr(self, "recorder") and getattr(self.recorder, "is_recording", False):
            try:
                if hasattr(self.recorder, "cancel_recording"):
                    self.recorder.cancel_recording()
                elif hasattr(self.recorder, "cancel"):
                    self.recorder.cancel()
            except Exception:
                pass

        self.app_state = self.STATE_IDLE
        self._elapsed_time_accumulated = 0.0
        self._recording_start_time = 0.0

        if self._timer_job:
            self.after_cancel(self._timer_job)
            self._timer_job = None

        self._set_status("Pronto", COLOR_GREEN_READY)
        self.timer_label.configure(text="00:00:00", text_color=COLOR_TEXT_MUTED)
        if self.record_audio_var.get():
            self.timer_subtext.configure(text="Pronto para gravar tela e áudio", text_color=COLOR_TEXT_DIMMED)
        else:
            self.timer_subtext.configure(text="Pronto para gravar apenas tela", text_color=COLOR_TEXT_DIMMED)

        # Restaura botões
        self.btn_start.configure(state="normal", text="🔴 Iniciar Gravação", fg_color=COLOR_RED_RECORD, hover_color=COLOR_RED_RECORD_HOVER, text_color="#FFFFFF")
        self.btn_pause.configure(state="disabled", text="⏸️ Pausar", fg_color=("#F1F5F9", "#27272A"), hover_color=("#E2E8F0", "#3F3F46"), text_color=COLOR_TEXT_PRIMARY)
        self.btn_stop.configure(state="disabled", text="⏹️ Finalizar & Salvar", fg_color=("#F1F5F9", "#27272A"), hover_color=("#E2E8F0", "#3F3F46"), text_color=COLOR_TEXT_PRIMARY)

        # Reabilita configurações
        self.monitor_menu.configure(state="normal")
        self.audio_switch.configure(state="normal")

    def _on_closing(self):
        """Manipulador de fechamento gracioso da janela."""
        if self.app_state in (self.STATE_RECORDING, self.STATE_PAUSED):
            confirm = messagebox.askyesno(
                "Gravação em Andamento",
                "Uma gravação está em andamento. Deseja finalizar e salvar antes de sair?\n\n"
                "- Sim: Finaliza e abre o diálogo de salvar\n- Não: Descarta e encerra o programa"
            )
            if confirm:
                self.stop_recording()
                return
            else:
                # Descarta gravação
                try:
                    if hasattr(self.recorder, "cancel_recording"):
                        self.recorder.cancel_recording()
                    elif hasattr(self.recorder, "cancel"):
                        self.recorder.cancel()
                    elif hasattr(self.recorder, "stop"):
                        temp = self.recorder.stop()
                        if temp and os.path.exists(temp):
                            os.remove(temp)
                except Exception:
                    pass

        # Desativa listener global do teclado
        if self._hotkey_listener is not None:
            try:
                self._hotkey_listener.stop()
            except Exception:
                pass
            self._hotkey_listener = None

        self.destroy()

    def destroy(self):
        """Garante cancelamento de timers e listeners antes de destruir a janela."""
        if hasattr(self, "recorder") and getattr(self.recorder, "is_recording", False):
            try:
                if hasattr(self.recorder, "cancel_recording"):
                    self.recorder.cancel_recording()
                elif hasattr(self.recorder, "cancel"):
                    self.recorder.cancel()
            except Exception:
                pass

        if hasattr(self, "_timer_job") and self._timer_job is not None:
            try:
                self.after_cancel(self._timer_job)
            except Exception:
                pass
            self._timer_job = None

        if hasattr(self, "_hotkey_listener") and self._hotkey_listener is not None:
            try:
                self._hotkey_listener.stop()
            except Exception:
                pass
            self._hotkey_listener = None

        super().destroy()


# =============================================================================
# EXECUÇÃO STANDALONE PARA TESTES E DESENVOLVIMENTO
# =============================================================================

if __name__ == "__main__":
    logger.info("Iniciando RPsec Recorder em modo standalone (com MockRecorder)...")
    app = ScreenRecorderUI()
    app.mainloop()
