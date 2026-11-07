"""
Testes automatizados do RPsec DDTank Bot.
Valida mapeamento de quadrantes, integridade das funções de entrada e visão.
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

    def test_quadrant_geometry(self):
        """Valida que os 4 quadrantes somam exatamente a tela de 1920x1080 sem sobreposição."""
        cfg = DEFAULT_CONFIG
        
        # TL
        self.assertEqual(cfg.quadrant_tl, (0, 0, 960, 540))
        # TR
        self.assertEqual(cfg.quadrant_tr, (960, 0, 960, 540))
        # BL
        self.assertEqual(cfg.quadrant_bl, (0, 540, 960, 540))
        # BR
        self.assertEqual(cfg.quadrant_br, (960, 540, 960, 540))

        # Valida que todos os botões de Ready/Start estão dentro da tela
        for name, pt in [
            ("ready_tl", cfg.ready_btn_tl),
            ("ready_bl", cfg.ready_btn_bl),
            ("ready_br", cfg.ready_btn_br),
            ("start_tr", cfg.start_btn_tr),
        ]:
            x, y = pt
            self.assertGreaterEqual(x, 0)
            self.assertLess(x, SCREEN_WIDTH)
            self.assertGreaterEqual(y, 0)
            self.assertLess(y, SCREEN_HEIGHT)

    def test_suicide_configuration(self):
        """Valida que a estratégia de suicídio das fakes está devidamente configurada."""
        cfg = DEFAULT_CONFIG
        self.assertEqual(cfg.fakes_suicide_key, "left")
        self.assertGreater(cfg.fakes_suicide_duration_sec, 2.0)

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
