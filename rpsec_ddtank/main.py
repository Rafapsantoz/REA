#!/usr/bin/env python3
"""
RPsec DDTank Bot - Ponto de Entrada Principal.
Automação Inteligente de Instâncias (Sky City / Castelo na Cidade).
Um produto RPsecti Soluções Inteligentes.
"""

import sys
import os
import time
import argparse
import logging

# Garante path raiz
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from src.config import DEFAULT_CONFIG
from src.window_manager import WindowManager
from src.vision_engine import VisionEngine
from src.battle_controller import SkyCityBattleController

def setup_logging():
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
        datefmt="%H:%M:%S",
    )

def main():
    setup_logging()
    logger = logging.getLogger("RPsec-Bot")

    parser = argparse.ArgumentParser(description="RPsec DDTank Bot - Automação Sky City")
    parser.add_argument("--run", action="store_true", help="Executa o ciclo completo da instância Sky City")
    parser.add_argument("--test-ready", action="store_true", help="Testa apenas os cliques de Pronto nas 3 fakes")
    parser.add_argument("--test-suicide", action="store_true", help="Testa a rotina de suicídio das fakes (andar para a esquerda)")
    parser.add_argument("--test-vision", action="store_true", help="Analisa a tela e imprime o estado atual do jogo")
    
    args = parser.parse_args()

    print("=" * 60)
    print("      RPsec DDTank Bot - RPsecti Soluções Inteligentes      ")
    print("=" * 60)

    if args.test_ready:
        logger.info("Executando teste: Clicar Pronto nas 3 fakes...")
        wm = WindowManager(DEFAULT_CONFIG)
        wm.ready_all_fakes()
        logger.info("Teste de Pronto concluído!")
        return

    if args.test_suicide:
        logger.info("Executando teste: Suicídio das 3 fakes (andar para a esquerda)...")
        wm = WindowManager(DEFAULT_CONFIG)
        wm.execute_fakes_suicide_sequence()
        logger.info("Teste de suicídio concluído!")
        return

    if args.test_vision:
        logger.info("Executando análise de visão computacional na tela...")
        ve = VisionEngine(DEFAULT_CONFIG)
        state = ve.detect_game_state()
        turn_active = ve.is_turn_active()
        boss_alive = ve.is_boss_alive()
        logger.info(f"Estado Detectado: [{state}]")
        logger.info(f"Turno Ativo na Principal: {turn_active}")
        logger.info(f"Boss Vivo na Arena: {boss_alive}")
        ve.close()
        return

    # Execução padrão se --run for passado ou menu interativo
    logger.info("Iniciando controlador da instância Sky City...")
    controller = SkyCityBattleController(DEFAULT_CONFIG)
    
    print("\n[ATENÇÃO] Posicione as 4 janelas do DDTank no Grid 2x2 do seu monitor.")
    print("A partida iniciará em 5 segundos. Pressione CTRL+C para cancelar se necessário.\n")
    for i in range(5, 0, -1):
        print(f"Iniciando em {i}...")
        time.sleep(1.0)

    controller.run_single_instance()

if __name__ == "__main__":
    main()
