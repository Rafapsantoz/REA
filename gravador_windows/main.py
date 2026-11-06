#!/usr/bin/env python3
"""
RPsec Recorder - Gravador de Tela Simplificado para Windows
Ponto de entrada principal da aplicação.
"""

import sys
import os
import logging

# Garante que o diretório raiz esteja no path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from src.config import DEFAULT_CONFIG
from src.recorder import ScreenRecorder
from src.ui import ScreenRecorderUI


def main():
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
        datefmt="%H:%M:%S",
    )
    logger = logging.getLogger("RPsec-App")
    logger.info("Iniciando RPsec Recorder...")

    # Instancia o motor de gravação de tela
    recorder = ScreenRecorder(config=DEFAULT_CONFIG)

    # Instancia a interface gráfica conectada ao motor
    app = ScreenRecorderUI(recorder=recorder)

    # Tratamento para fechar a aplicação com segurança
    def on_closing():
        if recorder.is_recording:
            from tkinter import messagebox
            confirm = messagebox.askyesno(
                "Gravação em Andamento",
                "Uma gravação está em andamento. Deseja cancelar e sair?",
                parent=app,
            )
            if not confirm:
                return
            recorder.cancel_recording()
        app.destroy()

    app.protocol("WM_DELETE_WINDOW", on_closing)

    try:
        app.mainloop()
    except KeyboardInterrupt:
        logger.info("Encerrado pelo usuário.")
        if recorder.is_recording:
            recorder.cancel_recording()


if __name__ == "__main__":
    main()
