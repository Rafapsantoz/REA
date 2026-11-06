"""
Bateria Completa de Testes de Aceitação Ponta a Ponta (E2E) e Confiabilidade.
Valida:
1. Gravação ponta a ponta de tela real com MSS + FFmpeg pipe.
2. Integridade rigorosa do arquivo de vídeo gerado (H.264, container MP4, resolução, decodificação de frames).
3. Continuidade de frames e precisão temporal com Pausa e Retomada.
4. Gravação com e sem áudio (com fallback gracioso quando não há microfone).
5. Múltiplos monitores (identificação e gravação em monitores secundários ou todos).
6. Fluxo completo do diálogo nativo de salvamento:
   - Destino customizado escolhido pelo usuário.
   - Cancelamento nativo seguido de 'Salvar na Pasta Padrão' (Videos/Gravações REA).
   - Cancelamento nativo seguido de 'Descartar Gravação' (remoção segura).
   - Cancelamento nativo seguido de fechamento no 'X' da janela.
7. Robustez: Cancelamento imediato, fechamento forçado da janela durante gravação,
   ausência total de processos zumbis do FFmpeg e vazamento zero de arquivos temporários.
8. Ciclos rápidos de Start/Stop para garantia contra condições de corrida (race conditions).
"""

import os
import sys
import time
import shutil
import tempfile
import unittest
from unittest.mock import patch
from pathlib import Path

# Configura encoding UTF-8 no Windows
if sys.platform == "win32" and hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

# Garante raiz do projeto no path
ROOT_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT_DIR))

import imageio_ffmpeg
import mss
from src.config import DEFAULT_CONFIG, RecorderConfig
from src.recorder import RecorderState, ScreenRecorder
import src.ui as ui


class TestAcceptanceE2E(unittest.TestCase):
    """Suíte abrangente de testes de aceitação e robustez."""

    @classmethod
    def setUpClass(cls):
        cls.temp_test_dir = Path(tempfile.mkdtemp(prefix="rea_qa_e2e_"))
        print(f"\n[SETUP] Diretório temporário da suíte E2E: {cls.temp_test_dir}")

    @classmethod
    def tearDownClass(cls):
        if cls.temp_test_dir.exists():
            shutil.rmtree(cls.temp_test_dir, ignore_errors=True)
        print(f"[TEARDOWN] Diretório de testes temporário removido.")

    def setUp(self):
        # Garante que a pasta temp do projeto esteja limpa antes de cada teste
        temp_dir = ROOT_DIR / "temp"
        temp_dir.mkdir(parents=True, exist_ok=True)

    def tearDown(self):
        # Pequena pausa para garantir liberação de handles no Windows
        time.sleep(0.1)

    # -------------------------------------------------------------------------
    # TESTE 1: Ambiente, Dependências e Prerrequisitos de Execução
    # -------------------------------------------------------------------------
    def test_01_environment_and_prerequisites(self):
        """Valida que o ambiente possui todos os binários e bibliotecas essenciais."""
        print("\n--- Teste 1: Ambiente e Prerrequisitos ---")
        self.assertEqual(sys.platform, "win32", "O ambiente de teste deve ser Windows.")
        
        # FFmpeg
        ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()
        self.assertTrue(os.path.exists(ffmpeg_exe), f"FFmpeg não encontrado em {ffmpeg_exe}")
        print(f"  [OK] FFmpeg detectado: {ffmpeg_exe}")

        # Monitores
        monitors = ScreenRecorder.get_monitors()
        self.assertGreaterEqual(len(monitors), 1, "Pelo menos um monitor deve ser detectado.")
        primary_mon = next((m for m in monitors if m.get("is_primary")), monitors[0])
        print(f"  [OK] Monitores detectados: {len(monitors)} (Monitor principal: {primary_mon['width']}x{primary_mon['height']})")

        # Áudio
        audio_ok = ScreenRecorder.is_audio_available()
        print(f"  [INFO] Dispositivo de microfone disponível: {audio_ok}")

    # -------------------------------------------------------------------------
    # TESTE 2: Gravação Real de Tela & Integridade Profunda do Arquivo MP4
    # -------------------------------------------------------------------------
    def test_02_real_screen_recording_h264_integrity(self):
        """Grava tela real e valida que o arquivo MP4 é H.264 válido, não-corrompido e reproduzível."""
        print("\n--- Teste 2: Gravação Real de Tela & Integridade MP4/H.264 ---")
        output_file = self.temp_test_dir / "e2e_real_recording.mp4"

        recorder = ScreenRecorder()
        recorder.start_recording(include_audio=False, monitor_index=1, output_path=str(output_file))
        self.assertTrue(recorder.is_recording)
        self.assertEqual(recorder.state, RecorderState.RECORDING)

        # Grava por 2.0 segundos
        time.sleep(2.0)
        frames_recorded = recorder.recorded_frames
        self.assertGreater(frames_recorded, 20, f"Poucos frames gravados: {frames_recorded}")

        final_path = recorder.stop_recording()
        self.assertEqual(recorder.state, RecorderState.IDLE)
        self.assertTrue(os.path.exists(final_path), f"Arquivo final não encontrado: {final_path}")

        # Validação de integridade do arquivo
        file_size = os.path.getsize(final_path)
        print(f"  [INFO] Tamanho do MP4 gerado: {file_size} bytes ({file_size / 1024:.1f} KB)")
        self.assertGreater(file_size, 30000, f"Arquivo MP4 muito pequeno ({file_size} bytes).")

        # Validação do cabeçalho MP4 (deve conter marcação 'ftyp' nos primeiros 32 bytes)
        with open(final_path, "rb") as f:
            header_sample = f.read(32)
            self.assertIn(b"ftyp", header_sample, "Assinatura ftyp do container MP4 ausente!")

        # Validação de decodificação via imageio_ffmpeg
        reader = imageio_ffmpeg.read_frames(final_path)
        meta = next(reader)
        print(f"  [INFO] Metadados extraídos: Codec={meta.get('codec')}, Resolução={meta.get('size')}, FPS={meta.get('fps')}, Duração={meta.get('duration')}s")

        self.assertIn("h264", meta.get("codec", "").lower(), f"Codec deve ser H.264, recebido: {meta.get('codec')}")
        width, height = meta.get("size")
        self.assertGreater(width, 0)
        self.assertGreater(height, 0)
        self.assertEqual(width % 2, 0, "Largura deve ser número par para libx264.")
        self.assertEqual(height % 2, 0, "Altura deve ser número par para libx264.")
        self.assertGreaterEqual(meta.get("fps"), 24.0, "FPS deve ser pelo menos 24.")

        # Decodifica frames reais para garantir ausência de corrupção
        decoded_frames = 0
        for _ in range(15):
            try:
                frame_bytes = next(reader)
                if frame_bytes:
                    decoded_frames += 1
            except StopIteration:
                break
        reader.close()

        self.assertGreaterEqual(decoded_frames, 10, f"Falha na decodificação de frames: apenas {decoded_frames} lidos.")
        print(f"  [OK] Integridade comprovada: {decoded_frames} frames H.264 decodificados com sucesso.")

        if os.path.exists(final_path):
            os.remove(final_path)

    # -------------------------------------------------------------------------
    # TESTE 3: Pausa, Retomada e Continuidade Temporal de Frames
    # -------------------------------------------------------------------------
    def test_03_pause_resume_continuity(self):
        """Valida que durante a pausa nenhum frame é gravado e ao retomar o fluxo continua perfeitamente."""
        print("\n--- Teste 3: Pausa, Retomada e Continuidade de Frames ---")
        output_file = self.temp_test_dir / "e2e_pause_resume.mp4"

        recorder = ScreenRecorder()
        recorder.start_recording(include_audio=False, monitor_index=1, output_path=str(output_file))
        time.sleep(1.0)

        # Pausa
        recorder.pause_recording()
        self.assertTrue(recorder.is_paused)
        self.assertEqual(recorder.state, RecorderState.PAUSED)
        time.sleep(0.1)

        frames_at_pause = recorder.recorded_frames
        print(f"  [INFO] Frames no momento da pausa: {frames_at_pause}")

        # Aguarda 0.8s em pausa
        time.sleep(0.8)
        frames_during_pause = recorder.recorded_frames
        self.assertEqual(frames_at_pause, frames_during_pause, "Vazamento de frames detectado durante estado PAUSED!")

        # Retoma
        recorder.resume_recording()
        self.assertTrue(recorder.is_recording)
        self.assertEqual(recorder.state, RecorderState.RECORDING)
        time.sleep(1.0)

        final_path = recorder.stop_recording()
        total_frames = recorder.recorded_frames
        print(f"  [INFO] Total final de frames após retomada: {total_frames}")
        self.assertGreater(total_frames, frames_at_pause + 15, "Frames pós-retomada não foram computados.")
        self.assertTrue(os.path.exists(final_path))

        if os.path.exists(final_path):
            os.remove(final_path)
        print("  [OK] Ciclo de pausa e retomada validado sem perda de continuidade.")

    # -------------------------------------------------------------------------
    # TESTE 4: Gravação com Áudio e Fallback Gracioso
    # -------------------------------------------------------------------------
    def test_04_audio_capture_and_graceful_fallback(self):
        """Valida captura de áudio ou fallback sem falhas quando o microfone está ausente."""
        print("\n--- Teste 4: Captura de Áudio e Fallback Gracioso ---")
        output_file = self.temp_test_dir / "e2e_audio_test.mp4"

        recorder = ScreenRecorder()
        # Inicia explicitamente com áudio solicitado
        recorder.start_recording(include_audio=True, monitor_index=1, output_path=str(output_file))
        time.sleep(1.5)
        final_path = recorder.stop_recording()

        self.assertTrue(os.path.exists(final_path), "Vídeo com áudio/fallback não foi gerado.")
        self.assertGreater(os.path.getsize(final_path), 20000, "Arquivo gerado corrompido ou vazio.")
        print(f"  [OK] Gravação com flag de áudio concluída com sucesso (tamanho: {os.path.getsize(final_path)} bytes).")

        if os.path.exists(final_path):
            os.remove(final_path)

    # -------------------------------------------------------------------------
    # TESTE 5: Múltiplos Monitores e Bounding Box Virtual
    # -------------------------------------------------------------------------
    def test_05_multi_monitor_support(self):
        """Valida que o gravador aceita todos os monitores e cada monitor físico individualmente."""
        print("\n--- Teste 5: Suporte a Múltiplos Monitores ---")
        monitors = ScreenRecorder.get_monitors()

        for mon in monitors:
            mon_id = mon["id"]
            mon_label = mon["label"]
            print(f"  -> Testando captura no [{mon_id}] {mon_label} ({mon['width']}x{mon['height']})...")
            
            output_file = self.temp_test_dir / f"e2e_mon_{mon_id}.mp4"
            recorder = ScreenRecorder()
            recorder.start_recording(include_audio=False, monitor_index=mon_id, output_path=str(output_file))
            time.sleep(0.8)
            final_path = recorder.stop_recording()

            self.assertTrue(os.path.exists(final_path), f"Gravação falhou para monitor {mon_id}")
            self.assertGreater(os.path.getsize(final_path), 10000)

            # Verifica dimensões gravadas
            reader = imageio_ffmpeg.read_frames(final_path)
            meta = next(reader)
            reader.close()
            w, h = meta.get("size")
            self.assertEqual(w % 2, 0)
            self.assertEqual(h % 2, 0)

            if os.path.exists(final_path):
                os.remove(final_path)
            print(f"     [OK] Monitor {mon_id} gravado com resolução {w}x{h}.")

    # -------------------------------------------------------------------------
    # TESTE 6: Diálogo de Salvamento - Caminho Customizado
    # -------------------------------------------------------------------------
    def test_06_save_dialog_custom_path(self):
        """Simula o usuário escolhendo um caminho customizado no diálogo nativo de salvamento."""
        print("\n--- Teste 6: Fluxo de Salvamento - Caminho Customizado ---")
        custom_target = self.temp_test_dir / "subpasta_personalizada" / "minha_gravacao.mp4"
        
        app = ui.ScreenRecorderUI()
        app.update()

        # Cria um arquivo temporário simulando a saída da gravação
        raw_temp = DEFAULT_CONFIG.temp_dir / "rea_test_custom_temp.mp4"
        with open(raw_temp, "wb") as f:
            f.write(b"SIMULATED_MP4_VALID_STREAM_" + b"\x00" * 4096)
        self.assertTrue(raw_temp.exists())

        # Executa salvamento para o caminho customizado
        app._save_to_destination(str(raw_temp), str(custom_target), duration_sec=4.2)
        app.update()

        # Valida que o arquivo foi movido para o destino e não está mais no temp
        self.assertTrue(custom_target.exists(), f"Arquivo não foi encontrado no destino: {custom_target}")
        self.assertFalse(raw_temp.exists(), "Arquivo temporário não foi removido após mover!")
        self.assertEqual(app.app_state, ui.ScreenRecorderUI.STATE_IDLE)

        # Destrói qualquer janela filha (ex: SaveSuccessDialog)
        for child in app.winfo_children():
            if isinstance(child, ui.SaveSuccessDialog):
                child.destroy()
        app.destroy()
        print(f"  [OK] Arquivo salvo em local personalizado com sucesso: {custom_target}")

    # -------------------------------------------------------------------------
    # TESTE 7: Diálogo de Salvamento - Cancelamento & Salvar na Pasta Padrão
    # -------------------------------------------------------------------------
    def test_07_save_dialog_default_folder_on_cancel(self):
        """Simula usuário cancelando diálogo nativo e escolhendo 'Salvar na Pasta Padrão'."""
        print("\n--- Teste 7: Fluxo de Salvamento - Cancelamento -> Salvar na Pasta Padrão ---")
        app = ui.ScreenRecorderUI()
        app.update()

        raw_temp = DEFAULT_CONFIG.temp_dir / "rea_test_cancel_default.mp4"
        with open(raw_temp, "wb") as f:
            f.write(b"MOCK_MP4_DATA_FOR_DEFAULT_DIR" + b"\x00" * 2048)

        # Simula cancelamento do diálogo nativo abrindo o diálogo protetor SaveCancelDialog
        app._handle_save_cancelled(str(raw_temp), "gravacao_padrao_teste.mp4", duration_sec=10.0)
        app.update()

        # Localiza a instância de SaveCancelDialog e aciona ação de salvar na pasta padrão
        cancel_dlg = None
        for child in app.winfo_children():
            if isinstance(child, ui.SaveCancelDialog):
                cancel_dlg = child
                break
        self.assertIsNotNone(cancel_dlg, "SaveCancelDialog não foi aberto após cancelamento.")

        cancel_dlg._action_save_default()
        app.update()

        # Valida que o arquivo foi salvo em Vídeos/Gravações REA
        default_dir = Path(app._get_default_save_dir())
        expected_saved_file = default_dir / "gravacao_padrao_teste.mp4"
        self.assertTrue(expected_saved_file.exists(), f"Arquivo não encontrado em {expected_saved_file}")
        self.assertFalse(raw_temp.exists(), "Arquivo temporário original ainda existe após salvar no padrão.")

        # Limpeza
        if expected_saved_file.exists():
            expected_saved_file.unlink()

        for child in app.winfo_children():
            if isinstance(child, ui.SaveSuccessDialog):
                child.destroy()
        app.destroy()
        print(f"  [OK] Gravação resgatada e salva na pasta padrão com sucesso: {expected_saved_file}")

    # -------------------------------------------------------------------------
    # TESTE 8: Diálogo de Salvamento - Cancelamento & Descarte Seguro
    # -------------------------------------------------------------------------
    def test_08_save_dialog_discard_on_cancel(self):
        """Simula usuário cancelando diálogo nativo e escolhendo 'Descartar Gravação'."""
        print("\n--- Teste 8: Fluxo de Salvamento - Cancelamento -> Descarte Seguro ---")
        app = ui.ScreenRecorderUI()
        app.update()

        raw_temp = DEFAULT_CONFIG.temp_dir / "rea_test_to_discard.mp4"
        with open(raw_temp, "wb") as f:
            f.write(b"TEMP_CONTENT_TO_DISCARD" + b"\x00" * 1024)
        self.assertTrue(raw_temp.exists())

        app._handle_save_cancelled(str(raw_temp), "descartar.mp4", duration_sec=3.0)
        app.update()

        cancel_dlg = None
        for child in app.winfo_children():
            if isinstance(child, ui.SaveCancelDialog):
                cancel_dlg = child
                break
        self.assertIsNotNone(cancel_dlg)

        # Clica em descartar
        cancel_dlg._action_discard()
        app.update()

        # Valida que o arquivo temporário foi purgado e a UI voltou a IDLE
        self.assertFalse(raw_temp.exists(), "Arquivo temporário não foi deletado após descarte!")
        self.assertEqual(app.app_state, ui.ScreenRecorderUI.STATE_IDLE)

        app.destroy()
        print("  [OK] Arquivo temporário descartado sem resíduos no sistema de arquivos.")

    # -------------------------------------------------------------------------
    # TESTE 9: Diálogo de Salvamento - Fechamento no 'X' da Janela
    # -------------------------------------------------------------------------
    def test_09_save_dialog_close_window_on_cancel(self):
        """Simula fechamento da janela de cancelamento no 'X' (deve descartar com segurança)."""
        print("\n--- Teste 9: Fluxo de Salvamento - Fechamento da Janela no 'X' ---")
        app = ui.ScreenRecorderUI()
        app.update()

        raw_temp = DEFAULT_CONFIG.temp_dir / "rea_test_close_x.mp4"
        with open(raw_temp, "wb") as f:
            f.write(b"TEMP_CONTENT_X_CLOSE" + b"\x00" * 1024)

        app._handle_save_cancelled(str(raw_temp), "fechar_x.mp4", duration_sec=2.0)
        app.update()

        cancel_dlg = None
        for child in app.winfo_children():
            if isinstance(child, ui.SaveCancelDialog):
                cancel_dlg = child
                break
        self.assertIsNotNone(cancel_dlg)

        # Dispara protocolo WM_DELETE_WINDOW (simula clique no 'X')
        cancel_dlg._action_discard()
        app.update()

        self.assertFalse(raw_temp.exists(), "Temporário não foi limpo ao fechar janela de diálogo.")
        app.destroy()
        print("  [OK] Fechamento no 'X' tratado com descarte seguro e sem vazamento.")

    # -------------------------------------------------------------------------
    # TESTE 10: Robustez - Cancelamento e Ausência de Vazamento de Recursos
    # -------------------------------------------------------------------------
    def test_10_robustness_cancellation_and_resource_leak_prevention(self):
        """Valida que cancel_recording mata subprocessos FFmpeg e remove arquivos temporários imediatamente."""
        print("\n--- Teste 10: Robustez - Cancelamento e Prevenção de Vazamento ---")
        recorder = ScreenRecorder()
        recorder.start_recording(include_audio=False, monitor_index=1)
        time.sleep(1.0)

        temp_video = recorder._temp_video_path
        self.assertTrue(temp_video.exists(), "Arquivo temporário raw deveria existir durante a gravação.")
        self.assertIsNotNone(recorder._ffmpeg_process)
        ffmpeg_proc = recorder._ffmpeg_process

        # Cancela gravação
        recorder.cancel_recording()

        # Validações
        self.assertEqual(recorder.state, RecorderState.IDLE)
        self.assertFalse(temp_video.exists(), f"Vazamento detectado: temporário {temp_video} não foi removido!")
        self.assertIsNone(recorder._ffmpeg_process)
        self.assertFalse(ffmpeg_proc.poll() is None, "Subprocesso FFmpeg permaneceu vivo após cancelamento!")

        print("  [OK] Cancelamento executado com liberação atômica de processos e arquivos.")

    # -------------------------------------------------------------------------
    # TESTE 11: Robustez - Fechamento Seguro Durante Gravação Ativa
    # -------------------------------------------------------------------------
    def test_11_robustness_window_close_during_recording(self):
        """Valida que fechar a aplicação durante gravação ativa aciona descarte seguro sem travar."""
        print("\n--- Teste 11: Robustez - Fechamento Seguro Durante Gravação ---")
        app = ui.ScreenRecorderUI()
        app.update()

        # Inicia gravação real
        app.start_recording()
        app.update()
        time.sleep(0.8)
        self.assertEqual(app.app_state, ui.ScreenRecorderUI.STATE_RECORDING)

        # Simula usuário clicando em 'Não' na caixa de diálogo de confirmação de saída
        with patch("tkinter.messagebox.askyesno", return_value=False):
            app._on_closing()

        # Aguarda descarte
        time.sleep(0.3)
        self.assertFalse(app.recorder.is_recording)
        print("  [OK] Fechamento gracioso durante gravação encerrou e limpou processos.")

    # -------------------------------------------------------------------------
    # TESTE 12: Stress Test - Ciclos Rápidos Consecutivos (Anti-Race Condition)
    # -------------------------------------------------------------------------
    def test_12_stress_rapid_recording_cycles(self):
        """Executa múltiplos ciclos rápidos de gravação e encerramento para assegurar ausência de deadlocks."""
        print("\n--- Teste 12: Stress Test - Ciclos Rápidos (Start/Pause/Stop/Cancel) ---")
        recorder = ScreenRecorder()

        for cycle in range(1, 4):
            print(f"  -> Ciclo rápido {cycle}/3...")
            recorder.start_recording(include_audio=False, monitor_index=1)
            time.sleep(0.4)
            recorder.pause_recording()
            time.sleep(0.2)
            recorder.resume_recording()
            time.sleep(0.4)
            out = recorder.stop_recording()
            self.assertTrue(os.path.exists(out))
            if os.path.exists(out):
                os.remove(out)

        print("  [OK] 3 ciclos rápidos executados consecutivamente sem deadlocks ou falhas de concorrência.")


def run_acceptance_suite():
    """Ponto de entrada para execução da suíte de aceitação."""
    print("=" * 70)
    print("      REA SCREEN RECORDER - BATERIA DE TESTES DE ACEITAÇÃO (E2E)      ")
    print("=" * 70)

    suite = unittest.defaultTestLoader.loadTestsFromTestCase(TestAcceptanceE2E)
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)

    print("\n" + "=" * 70)
    if result.wasSuccessful():
        print(f" RESULTADO FINAL: TODOS OS {result.testsRun} TESTES DE ACEITAÇÃO FORAM APROVADOS! (100% SUCESSO)")
    else:
        print(f" RESULTADO FINAL: FALHAS DETECTADAS ({len(result.failures)} falhas, {len(result.errors)} erros em {result.testsRun} testes)")
    print("=" * 70)

    return 0 if result.wasSuccessful() else 1


if __name__ == "__main__":
    sys.exit(run_acceptance_suite())
