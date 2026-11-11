"""
Testes automatizados do RPsec DDTank Bot.
Valida mapeamento de quadrantes calibrados, alternância de líder da sala,
integridade das funções de entrada e visão computacional.
"""

import unittest
import numpy as np
import sys
import os

# Adiciona raiz do bot ao path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.config import DEFAULT_CONFIG, BotConfig, SCREEN_WIDTH, SCREEN_HEIGHT
from src.input_sim import SCAN_CODES, VK_CODES
from src.vision_engine import VisionEngine


class TestBotCore(unittest.TestCase):

    def test_calibrated_geometry(self):
        """Valida que todos os botões de ação e pontos de foco calibrados estão dentro da tela 1920x1080."""
        cfg = DEFAULT_CONFIG

        for name, pt in [
            ("ready_tl", cfg.ready_btn_tl),
            ("ready_tr", cfg.ready_btn_tr),
            ("ready_bl", cfg.ready_btn_bl),
            ("ready_br", cfg.ready_btn_br),
            ("focus_tl", cfg.focus_tl),
            ("focus_tr", cfg.focus_tr),
            ("focus_bl", cfg.focus_bl),
            ("focus_br", cfg.focus_br),
        ]:
            x, y = pt
            self.assertGreaterEqual(x, 0, f"{name} X fora da tela")
            self.assertLess(x, SCREEN_WIDTH, f"{name} X fora da tela")
            self.assertGreaterEqual(y, 0, f"{name} Y fora da tela")
            self.assertLess(y, SCREEN_HEIGHT, f"{name} Y fora da tela")

    def test_host_guest_alternation(self):
        """Valida que a lista de convidados exclui corretamente o líder configurado."""
        # Cenário 1: Líder em TR (padrão - Conta Principal)
        cfg_tr = BotConfig(host_quadrant="TR")
        guests_tr = [q[0] for q in cfg_tr.get_guest_quadrants()]
        self.assertEqual(guests_tr, ["TL", "BL", "BR"])
        self.assertEqual(cfg_tr.get_host_start_button(), cfg_tr.start_btn_tr)

        # Cenário 2: Líder em BR
        cfg_br = BotConfig(host_quadrant="BR")
        guests_br = [q[0] for q in cfg_br.get_guest_quadrants()]
        self.assertEqual(guests_br, ["TL", "TR", "BL"])
        self.assertEqual(cfg_br.get_host_start_button(), cfg_br.start_btn_br)

    def test_suicide_configuration(self):
        """Valida que a estratégia de suicídio das fakes está devidamente configurada."""
        cfg = DEFAULT_CONFIG
        self.assertEqual(cfg.fakes_suicide_key, "left")
        self.assertGreaterEqual(cfg.fakes_suicide_duration_sec, 3.0)

    def test_scan_codes_integrity(self):
        """Valida que todas as teclas críticas possuem códigos de hardware mapeados."""
        for key in ["left", "right", "space", "f", "1", "2", "b"]:
            self.assertIn(key, SCAN_CODES)
            self.assertIn(key, VK_CODES)

    def test_vision_engine_state_classification(self):
        """Valida a classificação dos estados de tela com frames simulados."""
        ve = VisionEngine(DEFAULT_CONFIG)
        
        # 1. Frame predominantemente preto (Loading)
        loading_frame = np.zeros((540, 960, 3), dtype=np.uint8)
        self.assertEqual(ve.detect_game_state(loading_frame), "LOADING")

        # 2. Frame com céu azul de Sky City (Batalha)
        battle_frame = np.full((540, 960, 3), [150, 190, 210], dtype=np.uint8)
        self.assertEqual(ve.detect_game_state(battle_frame), "BATTLE")

        # 3. Frame padrão de lobby
        lobby_frame = np.full((540, 960, 3), [100, 80, 50], dtype=np.uint8)
        self.assertEqual(ve.detect_game_state(lobby_frame), "LOBBY")

        ve.close()


if __name__ == "__main__":
    unittest.main()
