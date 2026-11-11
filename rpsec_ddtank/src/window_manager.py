"""
RPsec DDTank Bot - Gerenciador de Janelas e Orquestrador dos 4 Quadrantes.
Controla o fluxo de Ready no Lobby e a rotina de suicídio das fakes para zerar atrasos de turno.
Inclui ativação em dois toques (anti-véu Flash) e suporte flexível a líderes de sala.
"""

import time
import logging
from typing import Tuple

from src.config import DEFAULT_CONFIG, BotConfig
from src.input_sim import click_at, hold_key

logger = logging.getLogger("RPsec_WindowManager")


class WindowManager:
    """Orquestra o foco e as ações entre as 4 janelas do DDTank no monitor de 27 pol."""

    def __init__(self, config: BotConfig = DEFAULT_CONFIG):
        self.config = config

    def focus_point(self, pt: Tuple[int, int]):
        """Clica suavemente nas coordenadas fornecidas para trazer a janela ao primeiro plano."""
        x, y = pt
        click_at(x, y, jitter=False)
        time.sleep(0.12)

    def focus_quadrant(self, quadrant_coords: Tuple[int, int, int, int]):
        """Clica no centro neutro do quadrante para restaurar o foco."""
        qx, qy, qw, qh = quadrant_coords
        center_x = qx + qw // 2
        center_y = qy + qh // 2
        click_at(center_x, center_y, jitter=False)
        time.sleep(0.15)

    def activate_action_button(self, x: int, y: int):
        """
        Ativação em dois toques inteligente (Dual-Touch):
        Toque 1: Garante foco na janela e remove o véu do Flash ('Clique no jogo, para continuar jogando').
        Pausa de 120ms: Permite que o Flash Player processe o ganho de foco.
        Toque 2: Executa o clique de ação no botão (Pronto ou Começar).
        """
        # Toque 1: Acorda a janela
        click_at(x, y, jitter=False)
        time.sleep(0.12)
        # Toque 2: Aciona o botão
        click_at(x, y, jitter=True)
        time.sleep(0.20)

    def ready_all_fakes(self):
        """
        Clica em 'Pronto' em todas as contas convidadas da sala.
        Respeita a configuração dinâmica do Líder da Sala (Host).
        """
        guests = self.config.get_guest_quadrants()
        host = self.config.host_quadrant.upper()
        logger.info(f"Preparando contas para Pronto (Líder da Sala: {host})...")

        for quad_name, (rx, ry) in guests:
            logger.info(f"[*] Ativando 'Pronto' no Quadrante {quad_name} em ({rx}, {ry})...")
            self.activate_action_button(rx, ry)
            time.sleep(0.3)

        logger.info("Todas as contas secundárias acionadas!")

    def start_match(self):
        """Clica no botão 'Começar / Início' no quadrante do Líder da Sala configurado."""
        host = self.config.host_quadrant.upper()
        sx, sy = self.config.get_host_start_button()
        logger.info(f"Iniciando a partida no Líder da Sala ({host}) em ({sx}, {sy})...")
        self.activate_action_button(sx, sy)
        time.sleep(0.5)

    def execute_fakes_suicide_sequence(self):
        """
        ESTRATÉGIA DE ALTA VELOCIDADE:
        Ao invés de usar o modo 'Confiar' que adiciona delays longos a cada turno,
        o bot foca cada uma das 3 contas fakes (TL, BL, BR) e caminha para a esquerda
        com repeat rate de hardware até cair no abismo e morrer imediatamente.
        
        A Conta Principal (TR) é preservada intacta para a batalha.
        """
        logger.info(">>> INICIANDO SEQUÊNCIA DE SUICÍDIO DAS 3 CONTAS FAKES <<<")

        fakes = [
            ("Fake 1 (TL)", self.config.focus_tl),
            ("Fake 2 (BL)", self.config.focus_bl),
            ("Fake 3 (BR)", self.config.focus_br),
        ]

        for label, focus_pt in fakes:
            logger.info(f"Focando {label} em {focus_pt} para suicídio...")
            self.focus_point(focus_pt)
            logger.info(f"Segurando seta '{self.config.fakes_suicide_key}' por {self.config.fakes_suicide_duration_sec}s...")
            hold_key(self.config.fakes_suicide_key, self.config.fakes_suicide_duration_sec)
            time.sleep(0.25)

        # Retorna o foco imediato para a Conta Principal (TR)
        logger.info("Retornando foco imediato para a Conta Principal (TR)!")
        self.focus_point(self.config.focus_tr)
