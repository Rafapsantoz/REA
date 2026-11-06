"""Testes automatizados e autônomos para validação do ScreenRecorder."""

import os
import sys
import time
from pathlib import Path

# Configura encoding UTF-8 para stdout no Windows
if sys.platform == "win32" and hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

# Adiciona a raiz do projeto ao sys.path
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

import imageio_ffmpeg
from src.config import DEFAULT_CONFIG, RecorderConfig
from src.recorder import RecorderState, ScreenRecorder


def test_monitor_detection():
    print("\n--- Teste 1: Detecção de Monitores ---")
    monitors = ScreenRecorder.get_monitors()
    print(f"Monitores detectados: {len(monitors)}")
    for m in monitors:
        print(f"  [{m['index']}] {m['label']} - {m['width']}x{m['height']} (Principal: {m['is_primary']})")
    assert len(monitors) > 0, "Nenhum monitor detectado!"
    print("[OK] Teste de detecção de monitores aprovado.")


def test_audio_availability():
    print("\n--- Teste 2: Verificação de Áudio ---")
    available = ScreenRecorder.is_audio_available()
    print(f"Dispositivo de entrada de áudio disponível: {available}")
    print("[OK] Teste de verificação de áudio executado com sucesso.")


def test_basic_screen_recording():
    print("\n--- Teste 3: Gravação Básica de Tela (2.5 segundos) ---")
    status_history = []
    tick_history = []

    def on_status(s):
        status_history.append(s)
        print(f"  [Callback Status] -> {s}")

    def on_tick(t):
        tick_history.append(t)

    recorder = ScreenRecorder(
        on_status_change=on_status,
        on_tick=on_tick,
    )

    print("Iniciando gravação (sem áudio)...")
    recorder.start_recording(include_audio=False, monitor_index=1)
    assert recorder.is_recording
    assert recorder.state == RecorderState.RECORDING

    # Grava por 2.5 segundos
    time.sleep(2.5)

    print(f"Frames gravados até agora: {recorder.recorded_frames}, Tempo: {recorder.elapsed_time:.2f}s")
    output_path = recorder.stop_recording()

    print(f"Arquivo gerado: {output_path}")
    assert os.path.exists(output_path), f"Arquivo {output_path} não foi gerado!"
    file_size = os.path.getsize(output_path)
    print(f"Tamanho do arquivo: {file_size} bytes ({file_size / 1024:.1f} KB)")
    assert file_size > 10000, f"Arquivo muito pequeno ({file_size} bytes), pode estar corrompido!"

    # Inspeciona metadados do vídeo gerado via imageio-ffmpeg
    gen = imageio_ffmpeg.read_frames(output_path)
    meta = next(gen)
    print(f"Metadados do vídeo: Codec={meta.get('codec')}, Resolução={meta.get('size')}, FPS={meta.get('fps')}, Duração={meta.get('duration')}s")

    assert meta.get("size")[0] > 0 and meta.get("size")[1] > 0, "Resolução inválida!"
    assert "h264" in meta.get("codec", "").lower(), f"Codec inesperado: {meta.get('codec')}"

    # Fecha o gerador para liberar o descritor de arquivo no Windows
    gen.close()
    time.sleep(0.2)

    # Limpeza
    if os.path.exists(output_path):
        os.remove(output_path)
    print("[OK] Teste de gravação básica aprovado com louvor.")


def test_pause_and_resume():
    print("\n--- Teste 4: Pausa e Retomada ---")
    recorder = ScreenRecorder()

    recorder.start_recording(include_audio=False, monitor_index=1)
    time.sleep(1.0)

    recorder.pause_recording()
    assert recorder.is_paused
    assert recorder.state == RecorderState.PAUSED
    time.sleep(0.1)  # Breve intervalo para qualquer frame em trânsito terminar

    frames_before_pause = recorder.recorded_frames
    print(f"Frames pausados: {frames_before_pause}")

    print("Gravação pausada. Aguardando 1 segundo enquanto pausado...")
    time.sleep(1.0)

    frames_during_pause = recorder.recorded_frames
    print(f"Frames após 1s de pausa: {frames_during_pause}")
    assert frames_during_pause == frames_before_pause, "Frames foram gravados indevidamente durante a pausa!"

    recorder.resume_recording()
    assert recorder.is_recording
    assert recorder.state == RecorderState.RECORDING
    print("Gravação retomada. Gravando por mais 1 segundo...")
    time.sleep(1.0)

    output_path = recorder.stop_recording()
    total_frames = recorder.recorded_frames
    print(f"Total de frames final: {total_frames}")
    assert total_frames > frames_before_pause, "Nenhum frame adicional foi gravado após retomar!"
    assert os.path.exists(output_path), "Vídeo final não existe!"

    # Limpeza
    if os.path.exists(output_path):
        os.remove(output_path)
    print("[OK] Teste de pausa e retomada aprovado com sucesso.")


def test_recording_with_audio():
    print("\n--- Teste 5: Gravação com Áudio (Microfone se disponível) ---")
    audio_avail = ScreenRecorder.is_audio_available()
    print(f"Áudio disponível no ambiente de teste: {audio_avail}")

    recorder = ScreenRecorder()
    recorder.start_recording(include_audio=True, monitor_index=1)
    time.sleep(2.0)
    output_path = recorder.stop_recording()

    print(f"Arquivo gerado com include_audio=True: {output_path}")
    assert os.path.exists(output_path), "Vídeo com áudio não foi gerado!"
    file_size = os.path.getsize(output_path)
    print(f"Tamanho do arquivo: {file_size} bytes")
    assert file_size > 10000

    # Limpeza
    if os.path.exists(output_path):
        os.remove(output_path)
    print("[OK] Teste de gravação com áudio aprovado.")


def test_cancel_recording():
    print("\n--- Teste 6: Cancelamento de Gravação ---")
    recorder = ScreenRecorder()
    recorder.start_recording(include_audio=False, monitor_index=1)
    time.sleep(0.8)

    temp_video = recorder._temp_video_path
    recorder.cancel_recording()

    assert recorder.state == RecorderState.IDLE
    if temp_video:
        assert not temp_video.exists(), f"Arquivo temporário {temp_video} não foi limpo!"
    print("[OK] Teste de cancelamento aprovado com sucesso.")


if __name__ == "__main__":
    print("==================================================")
    print("   INICIANDO SUÍTE DE TESTES AUTÔNOMOS DO RECORDER")
    print("==================================================")

    test_monitor_detection()
    test_audio_availability()
    test_basic_screen_recording()
    test_pause_and_resume()
    test_recording_with_audio()
    test_cancel_recording()

    print("\n==================================================")
    print("   TODOS OS TESTES FORAM CONCLUÍDOS COM SUCESSO!  ")
    print("==================================================")
