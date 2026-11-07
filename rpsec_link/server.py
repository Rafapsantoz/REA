"""
RPsec Link - Servidor de Acesso Remoto Ultraleve (FastAPI + WebSockets + Win32).
Executa na máquina Host e permite visualização e controle via qualquer navegador web.
"""

import os
import sys
import json
import time
import socket
import asyncio
import argparse
from pathlib import Path
from typing import Optional

import uvicorn
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Query
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

# Importa os módulos Win32 do RPsec Link
from screen_capture import ScreenCapturer
from input_controller import InputController

app = FastAPI(title="RPsec Link Server", version="1.0.0")

STATIC_DIR = Path(__file__).parent / "static"
INDEX_HTML = (STATIC_DIR / "index.html").read_text(encoding="utf-8")

# Configuração global
CONFIG = {
    "pin": "1234",
    "port": 8765,
    "host": "0.0.0.0",
}

# Inicializa motores
capturer = ScreenCapturer()
input_ctrl = InputController(capturer.width, capturer.height)


@app.get("/", response_class=HTMLResponse)
async def serve_index():
    """Entrega a aplicação cliente web zero-instalação."""
    return HTMLResponse(INDEX_HTML)


@app.get("/status")
async def get_status():
    """Status do host remoto."""
    return {
        "status": "online",
        "resolution": f"{capturer.width}x{capturer.height}",
        "pin_configured": bool(CONFIG["pin"]),
    }


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket, pin: str = Query("")):
    """Canal bidirecional: Streaming de vídeo (Binário) + Input do Cliente (JSON)."""
    # Validação do PIN de segurança
    if CONFIG["pin"] and pin != CONFIG["pin"]:
        await websocket.close(code=4001, reason="PIN Incorreto")
        print(f"[-] Tentativa de conexão rejeitada com PIN inválido: '{pin}'")
        return

    await websocket.accept()
    print(f"[+] Cliente conectado com sucesso de {websocket.client.host}")

    # Envia dimensões da tela do host
    await websocket.send_text(json.dumps({
        "type": "init",
        "width": capturer.width,
        "height": capturer.height
    }))

    # Estado da sessão
    session_state = {
        "quality": 60,
        "scale": 1.0,
        "fps": 22,
        "running": True
    }

    # Task de Streaming de Vídeo
    async def stream_frames():
        try:
            while session_state["running"]:
                t_start = time.perf_counter()

                # Captura e comprime tela via Win32 + OpenCV
                frame_bytes = capturer.grab_frame_jpeg(
                    quality=session_state["quality"],
                    scale=session_state["scale"]
                )

                # Transmite frame binário
                await websocket.send_bytes(frame_bytes)

                # Controle de taxa de quadros (FPS)
                target_interval = 1.0 / session_state["fps"]
                elapsed = time.perf_counter() - t_start
                sleep_time = max(0.005, target_interval - elapsed)
                await asyncio.sleep(sleep_time)
        except Exception as e:
            session_state["running"] = False

    # Task de Recepção de Comandos do Cliente
    async def receive_events():
        try:
            while session_state["running"]:
                raw_msg = await websocket.receive_text()
                msg = json.loads(raw_msg)
                mtype = msg.get("type")

                if mtype == "mouse_move":
                    input_ctrl.move_mouse(msg["x"], msg["y"])

                elif mtype == "mouse_down":
                    input_ctrl.mouse_down(msg["button"], msg.get("x"), msg.get("y"))

                elif mtype == "mouse_up":
                    input_ctrl.mouse_up(msg["button"], msg.get("x"), msg.get("y"))

                elif mtype == "wheel":
                    input_ctrl.mouse_wheel(msg.get("delta", 0))

                elif mtype == "key_down":
                    input_ctrl.key_down(msg.get("key", ""), msg.get("code", ""))

                elif mtype == "key_up":
                    input_ctrl.key_up(msg.get("key", ""), msg.get("code", ""))

                elif mtype == "shortcut":
                    input_ctrl.send_shortcut(msg.get("shortcut", ""))

                elif mtype == "quality":
                    session_state["quality"] = int(msg.get("quality", 60))
                    session_state["scale"] = float(msg.get("scale", 1.0))
                    session_state["fps"] = int(msg.get("fps", 22))

                elif mtype == "ping":
                    await websocket.send_text(json.dumps({"type": "pong", "ts": msg.get("ts")}))

        except (WebSocketDisconnect, Exception):
            session_state["running"] = False

    # Executa ambas as tarefas concorrentemente
    stream_task = asyncio.create_task(stream_frames())
    receive_task = asyncio.create_task(receive_events())

    done, pending = await asyncio.wait(
        [stream_task, receive_task],
        return_when=asyncio.FIRST_COMPLETED
    )

    for task in pending:
        task.cancel()

    print(f"[-] Cliente desconectado de {websocket.client.host}")


def print_banner(host: str, port: int, pin: str):
    """Exibe URLs e instruções de acesso de forma amigável no terminal."""
    hostname = socket.gethostname()
    try:
        ips = socket.gethostbyname_ex(hostname)[2]
    except Exception:
        ips = ["127.0.0.1"]

    print("=" * 64)
    print("   ⚡ RPsec Link — Servidor de Acesso Remoto Ultraleve")
    print("=" * 64)
    print(f"  • Resolução da Tela: {capturer.width}x{capturer.height}")
    print(f"  • PIN de Segurança : {pin}")
    print("  • Links para conectar no seu navegador:")
    print(f"      - Localhost : http://localhost:{port}")
    for ip in ips:
        if not ip.startswith("127."):
            print(f"      - Na sua Rede: http://{ip}:{port}")
    print("=" * 64)
    print("  Pressione Ctrl+C para encerrar o servidor a qualquer momento.")
    print("=" * 64 + "\n")


def main():
    parser = argparse.ArgumentParser(description="RPsec Link - Servidor Remoto")
    parser.add_argument("--port", type=int, default=8765, help="Porta HTTP/WebSocket (padrão: 8765)")
    parser.add_argument("--pin", type=str, default="1234", help="PIN de acesso (padrão: 1234)")
    parser.add_argument("--host", type=str, default="0.0.0.0", help="Interface de rede (padrão: 0.0.0.0)")
    args = parser.parse_args()

    CONFIG["port"] = args.port
    CONFIG["pin"] = args.pin
    CONFIG["host"] = args.host

    print_banner(args.host, args.port, args.pin)

    uvicorn.run(app, host=args.host, port=args.port, log_level="warning")


if __name__ == "__main__":
    main()
