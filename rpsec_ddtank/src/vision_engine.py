"""
RPsec DDTank Bot - Motor de Visão Computacional de Baixa Latência.
Monitora o estado da tela (Lobby, Loading, Batalha, Turno Ativo e Vida do Boss).
"""

import sys
import time
import logging
from typing import Dict, Any, Optional

import numpy as np
import mss
from PIL import Image

from src.config import DEFAULT_CONFIG, BotConfig

logger = logging.getLogger("RPsec_Vision")


class VisionEngine:
    """Extrai informações do estado de jogo via análise de frames em tempo real (< 8ms)."""

    def __init__(self, config: BotConfig = DEFAULT_CONFIG):
        self.config = config
        self._sct = mss.MSS()

    def capture_quadrant(self, quadrant_coords) -> np.ndarray:
        """Captura um quadrante específico e retorna como array RGB uint8."""
        qx, qy, qw, qh = quadrant_coords
        rect = {"left": qx, "top": qy, "width": qw, "height": qh}
        shot = self._sct.grab(rect)
        # Converte BGRA para RGB
        arr = np.array(shot, dtype=np.uint8)[:, :, :3][:, :, ::-1]
        return arr

    def capture_main_window(self) -> np.ndarray:
        """Captura a janela da Conta Principal (Quadrante TR)."""
        return self.capture_quadrant(self.config.quadrant_tr)

    def detect_game_state(self, main_frame: Optional[np.ndarray] = None) -> str:
        """
        Classifica o estado atual da Conta Principal:
        - 'LOBBY'
        - 'LOADING'
        - 'BATTLE'
        """
        if main_frame is None:
            main_frame = self.capture_main_window()

        # Janela interna do jogo (excluindo barra de título superior)
        viewport = main_frame[35:535, :]

        # Proporção de pixels escuros (Loading / Telas pretas de transição)
        dark_pct = np.mean(viewport < 40) * 100
        if dark_pct > 70:
            return "LOADING"

        # Proporção de azul celeste (Céu da fase Sky City)
        is_sky = (viewport[:, :, 0] > 120) & (viewport[:, :, 1] > 160) & (viewport[:, :, 2] > 180)
        sky_pct = np.mean(is_sky) * 100
        if sky_pct > 15:
            return "BATTLE"

        return "LOBBY"

    def is_turn_active(self, main_frame: Optional[np.ndarray] = None) -> bool:
        """
        Detecta se a Conta Principal está no seu turno ativo:
        Procura pelo cronômetro amarelo/vermelho central ou marcador ativo.
        """
        if main_frame is None:
            main_frame = self.capture_main_window()

        # Região central do HUD (onde o cronômetro amarelo de 10s pulsa)
        center_hud = main_frame[120:250, 400:560]
        # Amarelo/Dourado característico do timer do DDTank
        is_yellow = (center_hud[:, :, 0] > 200) & (center_hud[:, :, 1] > 180) & (center_hud[:, :, 2] < 70)
        return int(np.sum(is_yellow)) > 45

    def is_boss_alive(self, main_frame: Optional[np.ndarray] = None) -> bool:
        """
        Verifica se o Chefe do Sky City ainda está vivo analisando
        a presença dos pixels vermelhos da barra de vida/corpo na arena.
        """
        if main_frame is None:
            main_frame = self.capture_main_window()

        # Área da arena onde o Boss paira (x: 550..800, y: 160..380)
        boss_area = main_frame[160:380, 550:800]
        reds = (boss_area[:, :, 0] > 190) & (boss_area[:, :, 1] < 60) & (boss_area[:, :, 2] < 60)
        return int(np.sum(reds)) > 80

    def close(self):
        """Fecha o capturador MSS."""
        if self._sct:
            self._sct.close()
