"""
RPsec DDTank Bot - Controlador de Batalha & Máquina de Estados (Sky City).
Executa o ciclo completo da instância: Lobby -> Suicídio Rápido das Fakes -> Execução Tática da Principal.
"""

import time
import logging
from typing import Optional

from src.config import DEFAULT_CONFIG, BotConfig
from src.window_manager import WindowManager
from src.vision_engine import VisionEngine
from src.input_sim import tap_key, hold_key

logger = logging.getLogger("RPsec_BattleController")


class SkyCityBattleController:
    """Controla a partida de Sky City de ponta a ponta com máxima velocidade."""

    def __init__(self, config: BotConfig = DEFAULT_CONFIG):
        self.config = config
        self.win_mgr = WindowManager(config)
        self.vision = VisionEngine(config)
        self._running = False

    def run_single_instance(self) -> bool:
        """
        Executa um ciclo completo da instância Sky City:
        1. Dá Pronto nas fakes e Começa no Líder configurado
        2. Aguarda a tela de carregamento terminar e a arena abrir
        3. Executa o suicídio relâmpago das 3 fakes (elimina delay)
        4. Executa os turnos táticos da Conta Principal (TR)
        5. Conclui após o Boss ser abatido
        """
        logger.info("==================================================")
        logger.info("   INICIANDO INSTÂNCIA SKY CITY (RPsec DDTank)    ")
        logger.info(f"   Líder da Sala: {self.config.host_quadrant.upper()} | Conta Principal: TR")
        logger.info("==================================================")

        # 1. FASE DE LOBBY
        logger.info("[FASE 1/4] Preparando lobby e iniciando partida...")
        self.win_mgr.ready_all_fakes()
        time.sleep(0.4)
        self.win_mgr.start_match()

        # 2. ESPERA PELO CARREGAMENTO DA ARENA
        logger.info("[FASE 2/4] Aguardando transição para a Arena de Batalha...")
        start_wait = time.perf_counter()
        in_battle = False
        while time.perf_counter() - start_wait < 35.0:
            state = self.vision.detect_game_state()
            if state == "BATTLE":
                in_battle = True
                logger.info("Arena de Batalha detectada com sucesso!")
                break
            time.sleep(0.5)

        if not in_battle:
            logger.warning("Tempo limite aguardando a batalha esgotado. Verifique as janelas.")
            return False

        # Aguarda 2 segundos para estabilização de spawn dos personagens
        time.sleep(2.0)

        # 3. SUICÍDIO DAS 3 FAKES (ZERO DELAY)
        logger.info("[FASE 3/4] Eliminando as 3 fakes para zerar a fila de turnos...")
        self.win_mgr.execute_fakes_suicide_sequence()

        # 4. EXECUÇÃO TÁTICA DA CONTA PRINCIPAL (TR)
        logger.info("[FASE 4/4] Executando estratégia de vitória na Conta Principal...")
        self.win_mgr.focus_point(self.config.focus_tr)
        time.sleep(0.5)

        # --- TURNO 1: O Voo do Avião (F) para a plataforma segura ---
        logger.info("Turno 1: Acionando Avião (F)...")
        tap_key(self.config.turn1_airplane_key)
        time.sleep(0.3)
        logger.info(f"Carregando força de voo por {self.config.turn1_charge_time_sec}s...")
        hold_key("space", self.config.turn1_charge_time_sec)
        logger.info("Avião disparado! Aguardando aterrissagem e resposta do Boss...")

        # Aguarda a ação do Boss (geralmente ~15 a 20 segundos)
        time.sleep(16.0)

        # --- TURNO 2: Avanço Tático com Setas ---
        self.win_mgr.focus_point(self.config.focus_tr)
        logger.info(f"Turno 2: Avançando com seta '{self.config.turn2_move_key}' por {self.config.turn2_move_forward_sec}s...")
        hold_key(self.config.turn2_move_key, self.config.turn2_move_forward_sec)
        time.sleep(0.5)

        # Se houver itens de ataque para este turno
        for item in self.config.turn3_items:
            logger.info(f"Ativando item [{item}]...")
            tap_key(item)
            time.sleep(0.2)

        # --- TURNO 3: Disparo Mortal no Boss ---
        logger.info(f"Turno 3: Carregando disparo contra o Boss por {self.config.turn3_attack_charge_time_sec}s...")
        hold_key("space", self.config.turn3_attack_charge_time_sec)
        logger.info("Disparo executado com sucesso!")
        return True
