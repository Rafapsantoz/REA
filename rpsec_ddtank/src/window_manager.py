"""
RPsec DDTank Bot - Gerenciador de Janelas e Orquestrador dos 4 Quadrantes.
Controla o fluxo de Ready no Lobby e a rotina de suicídio das fakes para zerar atrasos de turno.
"""

import time
import logging
from typing import Tuple

from src.config import DEFAULT_CONFIG, BotConfig, FOCUS_CLICK_REL_X, FOCUS_CLICK_REL_Y
from src.input_sim import click_at, hold_key

logger = logging.getLogger("RPsec_WindowManager")


class WindowManager:
    """Orquestra o foco e as ações entre as 4 janelas do DDTank no monitor de 27 pol."""

    def __init__(self, config: BotConfig = DEFAULT_CONFIG):
        self.config = config

    def focus_quadrant(self, quadrant_coords: Tuple[int, int, int, int]):
        """Clica suavemente no centro do quadrante para trazer a janela ao primeiro plano."""
        qx, qy, qw, qh = quadrant_coords
        focus_x = qx + FOCUS_CLICK_REL_X
        focus_y = qy + FOCUS_CLICK_REL_Y
        click_at(focus_x, focus_y)
        time.sleep(0.15)

    def ready_all_fakes(self):
        """
        Clica em 'Pronto' nas 3 contas secundárias no Lobby:
        1. Fake 1: Top-Left (TL)
        2. Fake 2: Bottom-Left (BL)
        3. Fake 3: Bottom-Right (BR)
        """
        logger.info("Preparando as 3 contas secundárias (Pronto)...")

        # Fake 1 (TL)
        rx, ry = self.config.ready_btn_tl
        logger.info(f"Clicando Pronto na Fake 1 (TL) em ({rx}, {ry})")
        click_at(rx, ry)
        time.sleep(0.4)

        # Fake 2 (BL)
        rx, ry = self.config.ready_btn_bl
        logger.info(f"Clicando Pronto na Fake 2 (BL) em ({rx}, {ry})")
        click_at(rx, ry)
        time.sleep(0.4)

        # Fake 3 (BR)
        rx, ry = self.config.ready_btn_br
        logger.info(f"Clicando Pronto na Fake 3 (BR) em ({rx}, {ry})")
        click_at(rx, ry)
        time.sleep(0.4)

        logger.info("Todas as 3 contas fakes estão prontas!")

    def start_match(self):
        """Clica no botão 'Começar' na Conta Principal (Top-Right)."""
        logger.info("Iniciando a partida na Conta Principal (TR)...")
        sx, sy = self.config.start_btn_tr
        click_at(sx, sy)
        time.sleep(0.5)

    def execute_fakes_suicide_sequence(self):
        """
        NOVA ESTRATÉGIA DE ALTA VELOCIDADE:
        Ao invés de usar o modo 'Confiar' que adiciona delays longos a cada turno,
        o bot foca cada uma das 3 contas fakes e caminha para a esquerda até cair
        no abismo e morrer imediatamente.
        
        Mortas, as contas não recebem turnos de disparo, acelerando a partida em 300%.
        """
        logger.info(">>> INICIANDO SEQUÊNCIA DE SUICÍDIO DAS 3 CONTAS FAKES <<<")

        # 1. Fake 1 (Top-Left)
        logger.info("Focando Fake 1 (TL) para suicídio...")
        self.focus_quadrant(self.config.quadrant_tl)
        logger.info(f"Segurando seta '{self.config.fakes_suicide_key}' por {self.config.fakes_suicide_duration_sec}s...")
        hold_key(self.config.fakes_suicide_key, self.config.fakes_suicide_duration_sec)
        time.sleep(0.25)

        # 2. Fake 2 (Bottom-Left)
        logger.info("Focando Fake 2 (BL) para suicídio...")
        self.focus_quadrant(self.config.quadrant_bl)
        logger.info(f"Segurando seta '{self.config.fakes_suicide_key}' por {self.config.fakes_suicide_duration_sec}s...")
        hold_key(self.config.fakes_suicide_key, self.config.fakes_suicide_duration_sec)
        time.sleep(0.25)

        # 3. Fake 3 (Bottom-Right)
        logger.info("Focando Fake 3 (BR) para suicídio...")
        self.focus_quadrant(self.config.quadrant_br)
        logger.info(f"Segurando seta '{self.config.fakes_suicide_key}' por {self.config.fakes_suicide_duration_sec}s...")
        hold_key(self.config.fakes_suicide_key, self.config.fakes_suicide_duration_sec)
        time.sleep(0.25)

        # Retorna o foco imediatamente para a Conta Principal (TR)
        logger.info("Retornando foco imediato para a Conta Principal (TR)!")
        self.focus_quadrant(self.config.quadrant_tr)
        logger.info("As 3 contas fakes foram eliminadas do ciclo de turnos com sucesso.")
