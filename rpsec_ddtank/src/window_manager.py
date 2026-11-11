"""
RPsec DDTank Bot - Gerenciador de Janelas e Orquestrador dos 4 Quadrantes.
Controla o fluxo de Ready no Lobby e a rotina de suicídio das fakes para zerar atrasos de turno.
Implementa foco neutro seguro (anti-desclique de Pronto) e ativação de botão único.
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
        """Clica suavemente nas coordenadas neutras fornecidas para trazer a janela ao primeiro plano."""
        x, y = pt
        click_at(x, y, jitter=False)
        time.sleep(0.15)

    def focus_quadrant(self, quadrant_coords: Tuple[int, int, int, int]):
        """Clica no centro neutro do quadrante para restaurar o foco."""
        qx, qy, qw, qh = quadrant_coords
        center_x = qx + qw // 2
        center_y = qy + qh // 2
        click_at(center_x, center_y, jitter=False)
        time.sleep(0.15)

    def trigger_action_button(self, btn_coords: Tuple[int, int], focus_coords: Tuple[int, int], label: str = "Ação"):
        """
        Ativação segura em duas etapas:
        1. Foco Neutro: Clica no centro da janela (arena/chão) para acordar o Flash Player e remover o véu
           de inatividade SEM tocar em nenhum botão.
        2. Pausa tática (180ms): Dá tempo para o Flash stage processar o ganho de foco.
        3. Clique ÚNICO no botão: Pressiona o botão de Pronto ou Início exatamente UMA VEZ,
           garantindo que o status de 'Pronto' fique fixo e NUNCA seja desmarcado por clique duplo.
        """
        fx, fy = focus_coords
        bx, by = btn_coords

        # 1. Foco neutro no meio da janela
        logger.debug(f"Despertando janela via foco neutro em ({fx}, {fy})...")
        click_at(fx, fy, jitter=False)
        time.sleep(0.18)

        # 2. Clique único e definitivo no botão
        logger.info(f"[*] Acionando botão '{label}' em ({bx}, {by})...")
        click_at(bx, by, jitter=True)
        time.sleep(0.35)

    def ready_all_fakes(self):
        """
        Clica em 'Pronto' em todas as contas secundárias/convidadas da sala.
        Utiliza foco neutro prévio + clique único no botão para evitar alternância indesejada.
        """
        guests = self.config.get_guest_quadrants()
        host = self.config.host_quadrant.upper()
        logger.info(f"Preparando contas secundárias para Pronto (Líder da Sala: {host})...")

        for quad_name, btn_coords, focus_coords in guests:
            logger.info(f"[*] Processando Quadrante {quad_name}...")
            self.trigger_action_button(btn_coords, focus_coords, label=f"Pronto {quad_name}")
            time.sleep(0.20)

        logger.info("Todas as contas secundárias estão prontas com sucesso!")

    def start_match(self):
        """Clica no botão 'Começar / Início' no quadrante do Líder da Sala configurado."""
        host_name, btn_coords, focus_coords = self.config.get_host_info()
        logger.info(f"Iniciando a partida no Líder da Sala ({host_name})...")
        self.trigger_action_button(btn_coords, focus_coords, label=f"Começar {host_name}")
        time.sleep(0.50)

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
