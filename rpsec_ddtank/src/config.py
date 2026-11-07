"""
RPsec DDTank Bot - Configurações Globais e Mapeamento de Quadrantes.
Projetado para telas 1920x1080 com 4 janelas em grid 2x2.
"""

from dataclasses import dataclass
from typing import Tuple, Dict

# Resolução base de referência
SCREEN_WIDTH = 1920
SCREEN_HEIGHT = 1080

# Definição dos 4 Quadrantes (x, y, largura, altura)
QUADRANT_TL = (0, 0, 960, 540)        # Fake 1 (Secundária)
QUADRANT_TR = (960, 0, 960, 540)      # CONTA PRINCIPAL (Líder / Atacante)
QUADRANT_BL = (0, 540, 960, 540)      # Fake 2 (Secundária)
QUADRANT_BR = (960, 540, 960, 540)    # Fake 3 (Secundária)

# Ponto de clique interno do botão "Pronto" / "Começar" (relativo a cada quadrante de 960x540)
BTN_READY_REL_X = 860
BTN_READY_REL_Y = 470

# Ponto de clique neutro para focar a janela (centro do client area)
FOCUS_CLICK_REL_X = 480
FOCUS_CLICK_REL_Y = 270

@dataclass
class BotConfig:
    # Quadrantes
    quadrant_tl: Tuple[int, int, int, int] = QUADRANT_TL
    quadrant_tr: Tuple[int, int, int, int] = QUADRANT_TR  # Conta Principal
    quadrant_bl: Tuple[int, int, int, int] = QUADRANT_BL
    quadrant_br: Tuple[int, int, int, int] = QUADRANT_BR

    # Coordenadas absolutas de clique do botão "Pronto" (Lobby)
    ready_btn_tl: Tuple[int, int] = (QUADRANT_TL[0] + BTN_READY_REL_X, QUADRANT_TL[1] + BTN_READY_REL_Y)
    ready_btn_bl: Tuple[int, int] = (QUADRANT_BL[0] + BTN_READY_REL_X, QUADRANT_BL[1] + BTN_READY_REL_Y)
    ready_btn_br: Tuple[int, int] = (QUADRANT_BR[0] + BTN_READY_REL_X, QUADRANT_BR[1] + BTN_READY_REL_Y)
    start_btn_tr: Tuple[int, int] = (QUADRANT_TR[0] + BTN_READY_REL_X, QUADRANT_TR[1] + BTN_READY_REL_Y)

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

    # Configurações de latência humana (Jitter anti-detecção)
    human_jitter_enabled: bool = True
    min_click_delay: float = 0.12
    max_click_delay: float = 0.28

DEFAULT_CONFIG = BotConfig()
