"""
RPsec DDTank Bot - Configurações Globais e Mapeamento de Quadrantes.
Projetado para telas 1920x1080 com 4 janelas em grid 2x2.
Calibrado com precisão sub-pixel a partir de telemetria de gravações reais.
"""

from dataclasses import dataclass, field
from typing import Tuple, Dict, List

# Resolução base de referência do monitor de 27"
SCREEN_WIDTH = 1920
SCREEN_HEIGHT = 1080

# Definição dos 4 Quadrantes (x, y, largura, altura)
QUADRANT_TL = (0, 0, 960, 540)        # Fake 1 (Top-Left)
QUADRANT_TR = (960, 0, 960, 540)      # Top-Right (Conta Principal LV 70 / Líder Padrão)
QUADRANT_BL = (0, 540, 960, 540)      # Fake 2 (Bottom-Left)
QUADRANT_BR = (960, 540, 960, 540)    # Bottom-Right (Fake 3 ou Host Alternativo)

# Coordenadas calibradas dos botões de ação (Pronto / Começar)
ACTION_BTN_TL = (910, 435)
ACTION_BTN_TR = (1870, 435)
ACTION_BTN_BL = (910, 995)
ACTION_BTN_BR = (1870, 995)

# Coordenadas neutras no centro de cada janela para restaurar foco sem acionar nenhum botão
FOCUS_TL = (480, 270)
FOCUS_TR = (1440, 270)
FOCUS_BL = (480, 800)
FOCUS_BR = (1440, 800)


@dataclass
class BotConfig:
    # Quadrantes
    quadrant_tl: Tuple[int, int, int, int] = QUADRANT_TL
    quadrant_tr: Tuple[int, int, int, int] = QUADRANT_TR
    quadrant_bl: Tuple[int, int, int, int] = QUADRANT_BL
    quadrant_br: Tuple[int, int, int, int] = QUADRANT_BR

    # Botões de Ação
    ready_btn_tl: Tuple[int, int] = ACTION_BTN_TL
    ready_btn_tr: Tuple[int, int] = ACTION_BTN_TR
    ready_btn_bl: Tuple[int, int] = ACTION_BTN_BL
    ready_btn_br: Tuple[int, int] = ACTION_BTN_BR

    start_btn_tr: Tuple[int, int] = ACTION_BTN_TR
    start_btn_br: Tuple[int, int] = ACTION_BTN_BR

    # Pontos de foco central neutro de cada janela
    focus_tl: Tuple[int, int] = FOCUS_TL
    focus_tr: Tuple[int, int] = FOCUS_TR
    focus_bl: Tuple[int, int] = FOCUS_BL
    focus_br: Tuple[int, int] = FOCUS_BR

    # Identificação do Líder da Sala (Host): "TR" (padrão - Conta Principal LV 70) ou "BR"
    host_quadrant: str = "TR"

    # Estratégia de Suicídio das Fakes (Elimina delay do 'Confiar')
    fakes_suicide_key: str = "left"
    fakes_suicide_duration_sec: float = 3.5  # Tempo segurando seta esquerda para cair no buraco

    # Estratégia da Conta Principal no Sky City
    turn1_use_airplane: bool = True
    turn1_airplane_key: str = "f"
    turn1_charge_time_sec: float = 0.55     # Força moderada para pousar na plataforma elevada à esquerda

    turn2_move_forward_sec: float = 1.4     # Passo tático para a direita com setas
    turn2_move_key: str = "right"

    turn3_attack_charge_time_sec: float = 1.05  # Tempo de barra de espaço calibrado para acertar o Boss
    turn3_items: Tuple[str, ...] = ("1", "2")   # Teclas de buffs rápidos antes do disparo

    # Configurações de latência humana
    human_jitter_enabled: bool = True
    min_click_delay: float = 0.12
    max_click_delay: float = 0.28

    def get_guest_quadrants(self) -> List[Tuple[str, Tuple[int, int], Tuple[int, int]]]:
        """
        Retorna lista de tuplas (nome_quadrante, coordenadas_pronto, coordenadas_foco_neutro)
        para todas as contas secundárias que devem dar Pronto.
        """
        host = self.host_quadrant.upper()
        all_quads = [
            ("TL", self.ready_btn_tl, self.focus_tl),
            ("TR", self.ready_btn_tr, self.focus_tr),
            ("BL", self.ready_btn_bl, self.focus_bl),
            ("BR", self.ready_btn_br, self.focus_br),
        ]
        return [q for q in all_quads if q[0] != host]

    def get_host_info(self) -> Tuple[str, Tuple[int, int], Tuple[int, int]]:
        """Retorna tupla (nome_quadrante, coordenadas_inicio, coordenadas_foco_neutro) do líder."""
        if self.host_quadrant.upper() == "TR":
            return ("TR", self.start_btn_tr, self.focus_tr)
        return ("BR", self.start_btn_br, self.focus_br)

    def get_host_start_button(self) -> Tuple[int, int]:
        """Compatibilidade: Retorna o botão de Iniciar do líder configurado."""
        return self.get_host_info()[1]


DEFAULT_CONFIG = BotConfig()
