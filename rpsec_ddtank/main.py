#!/usr/bin/env python3
"""
RPsec DDTank Bot - Ponto de Entrada Principal & Painel Operacional.
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

from src.config import DEFAULT_CONFIG, BotConfig
from src.window_manager import WindowManager
from src.vision_engine import VisionEngine
from src.battle_controller import SkyCityBattleController


def configure_console_window():
    """
    Configurações essenciais para Windows Console:
    1. Desativa QuickEdit Mode para evitar congelamento acidental do script caso o usuário clique no terminal.
    2. Posiciona a janela do terminal no quadrante neutro superior (x=360, y=80) para não cobrir
       nenhum dos 4 botões de ação do jogo (TL: 910,435 | TR: 1870,435 | BL: 910,995 | BR: 1870,995).
    """
    if sys.platform != "win32":
        return

    try:
        import ctypes
        from ctypes import wintypes

        kernel32 = ctypes.windll.kernel32
        user32 = ctypes.windll.user32

        # 1. Desativa QuickEdit Mode
        h_in = kernel32.GetStdHandle(-10)  # STD_INPUT_HANDLE
        mode = wintypes.DWORD()
        if kernel32.GetConsoleMode(h_in, ctypes.byref(mode)):
            ENABLE_QUICK_EDIT_MODE = 0x0040
            ENABLE_EXTENDED_FLAGS = 0x0080
            new_mode = (mode.value & ~ENABLE_QUICK_EDIT_MODE) | ENABLE_EXTENDED_FLAGS
            kernel32.SetConsoleMode(h_in, new_mode)

        # 2. Posiciona e redimensiona em área neutra
        hwnd = kernel32.GetConsoleWindow()
        if hwnd:
            # x=360, y=80, w=540, h=340
            user32.SetWindowPos(hwnd, 0, 360, 80, 540, 340, 0x0040)
    except Exception:
        pass


def setup_logging():
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
        datefmt="%H:%M:%S",
    )


def print_banner(host_quadrant: str):
    print("=" * 65)
    print("      RPsec DDTank Bot - RPsecti Soluções Inteligentes      ")
    print("   Automação Profissional Sky City (Castelo na Cidade)       ")
    print("=" * 65)
    print(f" [*] Configuração Ativa:")
    print(f"     - Líder da Sala (Host): [{host_quadrant.upper()}] {'(Conta Principal)' if host_quadrant.upper() == 'TR' else ''}")
    print(f"     - Contas que darão Pronto: {['TL', 'BL', 'BR'] if host_quadrant.upper() == 'TR' else ['TL', 'TR', 'BL']}")
    print(f"     - Estratégia de Suicídio: Fakes andam para esquerda (3.5s)")
    print("=" * 65)


def countdown(seconds: int = 5, reason: str = ""):
    print(f"\n[ATENÇÃO] {reason}")
    print("[DICA] O terminal foi alinhado em posição neutra para não cobrir o jogo.")
    for i in range(seconds, 0, -1):
        print(f"Disparando em {i} segundo(s)... (solte mouse e teclado)")
        time.sleep(1.0)
    print(">>> EXECUTANDO AGORA <<<\n")


def run_interactive_menu():
    configure_console_window()
    setup_logging()
    logger = logging.getLogger("RPsec-Bot")
    current_host = "TR"  # Padrão: Conta Principal (TR - LV 70)

    while True:
        os.system("cls" if os.name == "nt" else "clear")
        print_banner(current_host)
        print("\nEscolha uma opção:")
        print("  [1] Testar 'Pronto' nas 3 Fakes (Lobby)")
        print("  [2] Testar 'Suicídio' das 3 Fakes (Andar para a esquerda)")
        print("  [3] Iniciar Ciclo Completo da Instância Sky City")
        print(f"  [4] Alternar Líder da Sala (Atual: {current_host} -> Mudar para {'BR' if current_host == 'TR' else 'TR'})")
        print("  [5] Analisar Visão Computacional da Tela")
        print("  [0] Sair")
        print()

        choice = input("Opção [0-5]: ").strip()

        config = BotConfig(host_quadrant=current_host)
        wm = WindowManager(config)

        if choice == "1":
            countdown(5, f"O bot clicará em 'Pronto' nas fakes (Líder em {current_host}).")
            logger.info("Executando teste: Clicar Pronto nas contas secundárias...")
            wm.ready_all_fakes()
            logger.info("Teste de Pronto concluído com sucesso!")
            input("\nPressione ENTER para voltar ao menu...")

        elif choice == "2":
            countdown(5, "O bot focará as 3 fakes e andará para a esquerda por 3.5s.")
            logger.info("Executando teste: Suicídio das 3 fakes...")
            wm.execute_fakes_suicide_sequence()
            logger.info("Teste de suicídio concluído com sucesso!")
            input("\nPressione ENTER para voltar ao menu...")

        elif choice == "3":
            countdown(5, f"Iniciando ciclo completo da instância Sky City (Líder: {current_host}).")
            controller = SkyCityBattleController(config)
            controller.run_single_instance()
            input("\nPartida concluída. Pressione ENTER para voltar ao menu...")

        elif choice == "4":
            current_host = "BR" if current_host == "TR" else "TR"
            print(f"\n[OK] Líder da Sala alterado para [{current_host}]!")
            time.sleep(1.0)

        elif choice == "5":
            logger.info("Analisando tela com VisionEngine...")
            ve = VisionEngine(config)
            state = ve.detect_game_state()
            turn_active = ve.is_turn_active()
            boss_alive = ve.is_boss_alive()
            logger.info(f"Estado Detectado: [{state}]")
            logger.info(f"Turno Ativo na Principal: {turn_active}")
            logger.info(f"Boss Vivo na Arena: {boss_alive}")
            ve.close()
            input("\nPressione ENTER para voltar ao menu...")

        elif choice == "0":
            print("\nEncerrando RPsec DDTank Bot. Até logo!")
            break
        else:
            print("\nOpção inválida.")
            time.sleep(1.0)


def main():
    configure_console_window()

    parser = argparse.ArgumentParser(description="RPsec DDTank Bot - Automação Sky City")
    parser.add_argument("--run", action="store_true", help="Executa o ciclo completo da instância Sky City")
    parser.add_argument("--test-ready", action="store_true", help="Testa os cliques de Pronto nas contas convidadas")
    parser.add_argument("--test-suicide", action="store_true", help="Testa a rotina de suicídio das fakes")
    parser.add_argument("--test-vision", action="store_true", help="Analisa a tela e imprime o estado do jogo")
    parser.add_argument("--host", type=str, default="TR", choices=["BR", "TR", "br", "tr"], help="Quadrante do líder da sala (TR ou BR, padrão TR)")

    args = parser.parse_args()

    # Se nenhum argumento for passado, abre o menu interativo
    if not (args.run or args.test_ready or args.test_suicide or args.test_vision):
        run_interactive_menu()
        return

    setup_logging()
    logger = logging.getLogger("RPsec-Bot")
    host = args.host.upper()
    config = BotConfig(host_quadrant=host)
    wm = WindowManager(config)

    print_banner(host)

    if args.test_ready:
        countdown(5, f"O bot clicará em 'Pronto' nas contas secundárias (Líder em {host}).")
        logger.info(f"Executando teste: Clicar Pronto (Líder: {host})...")
        wm.ready_all_fakes()
        logger.info("Teste de Pronto concluído com sucesso!")
        return

    if args.test_suicide:
        countdown(5, "O bot focará as 3 fakes e andará para a esquerda por 3.5s.")
        logger.info("Executando teste: Suicídio das 3 fakes...")
        wm.execute_fakes_suicide_sequence()
        logger.info("Teste de suicídio concluído com sucesso!")
        return

    if args.test_vision:
        logger.info("Executando análise de visão computacional na tela...")
        ve = VisionEngine(config)
        state = ve.detect_game_state()
        turn_active = ve.is_turn_active()
        boss_alive = ve.is_boss_alive()
        logger.info(f"Estado Detectado: [{state}]")
        logger.info(f"Turno Ativo na Principal: {turn_active}")
        logger.info(f"Boss Vivo na Arena: {boss_alive}")
        ve.close()
        return

    if args.run:
        countdown(5, f"Iniciando ciclo da instância Sky City (Líder: {host}).")
        controller = SkyCityBattleController(config)
        controller.run_single_instance()


if __name__ == "__main__":
    main()
