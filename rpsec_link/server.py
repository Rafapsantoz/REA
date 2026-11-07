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
from typing import Optional, Callable, Set

import uvicorn
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Query
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

from screen_capture import ScreenCapturer
from input_controller import InputController

app = FastAPI(title="RPsec Link Server", version="1.1.0")

STATIC_DIR = Path(__file__).parent / "static"
INDEX_HTML = (STATIC_DIR / "index.html").read_text(encoding="utf-8")

CONFIG = {
    "pin": "1234",
    "port": 8765,
    "host": "0.0.0.0",
}

# Controle de conexões ativas e callbacks para a GUI do Host
ACTIVE_CLIENTS: Set[str] = set()
CALLBACKS = {
    "on_connect": None,
    "on_disconnect": None,
}

# Inicializa motores
capturer = ScreenCapturer(draw_cursor=True)
input_ctrl = InputController(capturer.width, capturer.height)


@app.get("/", response_class=HTMLResponse)
async def serve_index():
    """Entrega a aplicação cliente web zero-instalação."""
    # Sempre recarrega do arquivo em tempo de desenvolvimento para refletir edições
    content = (STATIC_DIR / "index.html").read_text(encoding="utf-8")
    return HTMLResponse(content)


@app.get("/status")
async def get_status():
    """Status do host remoto."""
    return {
        "status": "online",
        "resolution": f"{capturer.width}x{capturer.height}",
        "pin_configured": bool(CONFIG["pin"]),
        "clients_connected": len(ACTIVE_CLIENTS),
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
    client_ip = websocket.client.host
    ACTIVE_CLIENTS.add(client_ip)
    print(f"[+] Cliente conectado com sucesso de {client_ip}")

    if CALLBACKS["on_connect"]:
        try:
            CALLBACKS["on_connect"](client_ip, len(ACTIVE_CLIENTS))
        except Exception:
            pass

    # Envia dimensões da tela do host
    await websocket.send_text(json.dumps({
        "type": "init",
        "width": capturer.width,
        "height": capturer.height
    }))

    session_state = {
        "quality": 60,
        "scale": 1.0,
        "fps": 22,
        "running": True
    }

    async def stream_frames():
        try:
            while session_state["running"]:
                t_start = time.perf_counter()

                frame_bytes = capturer.grab_frame_jpeg(
                    quality=session_state["quality"],
                    scale=session_state["scale"]
                )

                await websocket.send_bytes(frame_bytes)

                target_interval = 1.0 / session_state["fps"]
                elapsed = time.perf_counter() - t_start
                sleep_time = max(0.005, target_interval - elapsed)
                await asyncio.sleep(sleep_time)
        except Exception:
            session_state["running"] = False

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

    stream_task = asyncio.create_task(stream_frames())
    receive_task = asyncio.create_task(receive_events())

    done, pending = await asyncio.wait(
        [stream_task, receive_task],
        return_when=asyncio.FIRST_COMPLETED
    )

    for task in pending:
        task.cancel()

    ACTIVE_CLIENTS.discard(client_ip)
    print(f"[-] Cliente desconectado de {client_ip}")

    if CALLBACKS["on_disconnect"]:
        try:
            CALLBACKS["on_disconnect"](client_ip, len(ACTIVE_CLIENTS))
        except Exception:
            pass


def get_network_ips():
    """Retorna a lista de IPs locais da máquina."""
    hostname = socket.gethostname()
    try:
        ips = socket.gethostbyname_ex(hostname)[2]
        return [ip for ip in ips if not ip.startswith("127.")]
    except Exception:
        return ["127.0.0.1"]


def main():
    parser = argparse.ArgumentParser(description="RPsec Link - Servidor Remoto")
    parser.add_argument("--port", type=int, default=8765, help="Porta HTTP/WebSocket (padrão: 8765)")
    parser.add_argument("--pin", type=str, default="1234", help="PIN de acesso (padrão: 1234)")
    parser.add_argument("--host", type=str, default="0.0.0.0", help="Interface de rede (padrão: 0.0.0.0)")
    args = parser.parse_args()

    CONFIG["port"] = args.port
    CONFIG["pin"] = args.pin
    CONFIG["host"] = args.host

    ips = get_network_ips()
    print("=" * 64)
    print("   ⚡ RPsec Link — Servidor de Acesso Remoto Ultraleve")
    print("=" * 64)
    print(f"  • Resolução: {capturer.width}x{capturer.height}")
    print(f"  • PIN de Segurança: {args.pin}")
    print(f"  • Acesso Local    : http://localhost:{args.port}")
    for ip in ips:
        print(f"  • Acesso na Rede  : http://{ip}:{args.port}")
    print("=" * 64 + "\n")

    uvicorn.run(app, host=args.host, port=args.port, log_level="warning")


if __name__ == "__main__":
    main()
