"""
Testes automatizados para a interface gráfica e fluxo de salvamento do REA Screen Recorder.
"""

import os
import sys
import time
import shutil
import unittest

# Adiciona o diretório raiz ao PYTHONPATH
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import src.ui as ui
import customtkinter as ctk


class TestUIHelpers(unittest.TestCase):
    def test_format_file_size(self):
        self.assertEqual(ui.format_file_size(500), "500 B")
        self.assertEqual(ui.format_file_size(1024), "1.0 KB")
        self.assertEqual(ui.format_file_size(1024 * 1024 * 5), "5.0 MB")
        self.assertEqual(ui.format_file_size(1024 * 1024 * 1024 * 2), "2.00 GB")

    def test_format_duration(self):
        self.assertEqual(ui.format_duration(0), "00:00:00")
        self.assertEqual(ui.format_duration(59), "00:00:59")
        self.assertEqual(ui.format_duration(65), "00:01:05")
        self.assertEqual(ui.format_duration(3665), "01:01:05")

    def test_get_available_monitors(self):
        monitors = ui.get_available_monitors()
        self.assertIsInstance(monitors, list)
        self.assertGreaterEqual(len(monitors), 1)
        for m in monitors:
            self.assertIn("id", m)
            self.assertIn("label", m)
            self.assertIn("width", m)
            self.assertIn("height", m)


class TestMockRecorder(unittest.TestCase):
    def test_mock_lifecycle(self):
        recorder = ui.MockScreenRecorder()
        self.assertFalse(recorder.is_recording)
        self.assertFalse(recorder.is_paused)

        recorder.start(monitor_index=1, record_audio=True)
        self.assertTrue(recorder.is_recording)
        self.assertFalse(recorder.is_paused)

        recorder.pause()
        self.assertTrue(recorder.is_recording)
        self.assertTrue(recorder.is_paused)

        recorder.resume()
        self.assertTrue(recorder.is_recording)
        self.assertFalse(recorder.is_paused)

        temp_path = recorder.stop()
        self.assertFalse(recorder.is_recording)
        self.assertFalse(recorder.is_paused)
        self.assertTrue(os.path.exists(temp_path))

        # Cleanup
        if os.path.exists(temp_path):
            os.remove(temp_path)


class TestScreenRecorderUI(unittest.TestCase):
    def setUp(self):
        self.app = ui.ScreenRecorderUI()
        self.app.update()

    def tearDown(self):
        if self.app:
            try:
                self.app.destroy()
            except Exception:
                pass

    def test_initial_state(self):
        self.assertEqual(self.app.app_state, ui.ScreenRecorderUI.STATE_IDLE)
        self.assertEqual(self.app.btn_start.cget("state"), "normal")
        self.assertEqual(self.app.btn_pause.cget("state"), "disabled")
        self.assertEqual(self.app.btn_stop.cget("state"), "disabled")

    def test_recording_state_transitions(self):
        # Iniciar
        self.app.start_recording()
        self.app.update()
        self.assertEqual(self.app.app_state, ui.ScreenRecorderUI.STATE_RECORDING)
        self.assertEqual(self.app.btn_start.cget("state"), "disabled")
        self.assertEqual(self.app.btn_pause.cget("state"), "normal")
        self.assertEqual(self.app.btn_stop.cget("state"), "normal")

        # Pausar
        self.app.pause_recording()
        self.app.update()
        self.assertEqual(self.app.app_state, ui.ScreenRecorderUI.STATE_PAUSED)
        self.assertEqual(self.app.btn_pause.cget("text"), "▶️ Retomar")

        # Retomar
        self.app.resume_recording()
        self.app.update()
        self.assertEqual(self.app.app_state, ui.ScreenRecorderUI.STATE_RECORDING)
        self.assertEqual(self.app.btn_pause.cget("text"), "⏸️ Pausar")

        # Reset manual
        self.app._reset_to_idle()
        self.app.update()
        self.assertEqual(self.app.app_state, ui.ScreenRecorderUI.STATE_IDLE)

    def test_save_cancelled_discard(self):
        temp_file = os.path.join(os.path.expanduser("~"), "AppData", "Local", "Temp", "test_unit_discard.mp4")
        with open(temp_file, "wb") as f:
            f.write(b"unit_test_content")

        self.assertTrue(os.path.exists(temp_file))
        self.app._handle_save_cancelled(temp_file, "suggested.mp4", 5.0)
        self.app.update()

        for child in self.app.winfo_children():
            if isinstance(child, ui.SaveCancelDialog):
                child._action_discard()
                break

        self.app.update()
        self.assertFalse(os.path.exists(temp_file))
        self.assertEqual(self.app.app_state, ui.ScreenRecorderUI.STATE_IDLE)

    def test_save_cancelled_default_dir(self):
        temp_file = os.path.join(os.path.expanduser("~"), "AppData", "Local", "Temp", "test_unit_default.mp4")
        with open(temp_file, "wb") as f:
            f.write(b"unit_test_content_default")

        self.assertTrue(os.path.exists(temp_file))
        self.app._handle_save_cancelled(temp_file, "unit_test_saved.mp4", 12.0)
        self.app.update()

        for child in self.app.winfo_children():
            if isinstance(child, ui.SaveCancelDialog):
                child._action_save_default()
                break

        self.app.update()
        self.assertFalse(os.path.exists(temp_file))

        default_saved = os.path.join(self.app._get_default_save_dir(), "unit_test_saved.mp4")
        self.assertTrue(os.path.exists(default_saved))

        # Cleanup
        if os.path.exists(default_saved):
            os.remove(default_saved)

    def test_status_text_with_and_without_audio(self):
        # 1. Sem áudio
        self.app.record_audio_var.set(False)
        self.app._on_audio_switch_changed()
        self.assertIn("sem áudio", self.app.timer_subtext.cget("text"))

        self.app.start_recording()
        self.app.update()
        self.assertEqual(self.app.status_text.cget("text"), "Gravando Tela")
        self.assertEqual(self.app.timer_subtext.cget("text"), "Capturando apenas tela...")

        self.app.pause_recording()
        self.app.update()
        self.assertEqual(self.app.status_text.cget("text"), "Pausado (Tela)")

        self.app.resume_recording()
        self.app.update()
        self.assertEqual(self.app.status_text.cget("text"), "Gravando Tela")

        self.app._reset_to_idle()
        self.app.update()

        # 2. Com áudio
        self.app.record_audio_var.set(True)
        self.app._on_audio_switch_changed()
        self.assertIn("tela e áudio", self.app.timer_subtext.cget("text"))

        self.app.start_recording()
        self.app.update()
        self.assertEqual(self.app.status_text.cget("text"), "Gravando Tela & Áudio")
        self.assertEqual(self.app.timer_subtext.cget("text"), "Capturando tela e áudio...")

        self.app.pause_recording()
        self.app.update()
        self.assertEqual(self.app.status_text.cget("text"), "Pausado (Tela & Áudio)")

        self.app.resume_recording()
        self.app.update()
        self.assertEqual(self.app.status_text.cget("text"), "Gravando Tela & Áudio")

        self.app._reset_to_idle()
        self.app.update()

    def test_theme_switching(self):
        # Modo Claro
        self.app._on_theme_changed("☀️ Modo Claro")
        self.app.update()
        self.assertEqual(ctk.get_appearance_mode().lower(), "light")

        # Modo Escuro
        self.app._on_theme_changed("🌙 Modo Escuro")
        self.app.update()
        self.assertEqual(ctk.get_appearance_mode().lower(), "dark")

    def test_icon_helper(self):
        # Valida que a aplicação de ícone não lança exceções
        ui.apply_window_icon(self.app)
        self.assertTrue(True)


if __name__ == "__main__":
    unittest.main()
