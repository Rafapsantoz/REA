"""
RPsec Link - Servidor de Acesso Remoto Ultraleve (FastAPI + WebSockets + Win32).
Executa na máquina Host e permite visualização e controle via qualquer navegador web.
Inclui proteção ativa contra força bruta com congelamento exponencial após 3 erros de PIN.
"""

import os
import sys
import json
import time
import socket
import secrets
import asyncio
import argparse
from pathlib import Path
from typing import Optional, Callable, Set, Dict, Any

import uvicorn
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Query
from fastapi.responses import HTMLResponse, JSONResponse, FileResponse

from screen_capture import ScreenCapturer
from input_controller import InputController

app = FastAPI(title="RPsec Link Server", version="1.4.0")

BASE_DIR = Path(__file__).parent
STATIC_DIR = BASE_DIR / "static"
ASSETS_DIR = BASE_DIR / "assets"


def generate_random_pin(digits: int = 4) -> str:
    """Gera um PIN numérico aleatório seguro entre 1000 e 9999."""
    lower = 10 ** (digits - 1)
    upper = (10 ** digits) - 1
    return str(secrets.randbelow(upper - lower + 1) + lower)


CONFIG = {
    "pin": generate_random_pin(),
    "port": 8765,
    "host": "0.0.0.0",
}

ACTIVE_CLIENTS: Set[str] = set()
CALLBACKS = {
    "on_connect": None,
    "on_disconnect": None,
    "on_security_alert": None,
}

# Rastreamento de falhas de autenticação e bloqueio (Anti-Brute Force)
# client_ip -> {"count": int, "locked_until": float, "level": int}
FAILED_ATTEMPTS: Dict[str, Dict[str, Any]] = {}

# Inicializa motores com DPI awareness ativo e sem duplicação de cursor
capturer = ScreenCapturer(draw_cursor=False)
input_ctrl = InputController(capturer.width, capturer.height)


@app.get("/", response_class=HTMLResponse)
async def serve_index():
    """Entrega a aplicação cliente web com no-cache para sempre refletir as melhorias."""
    index_file = STATIC_DIR / "index.html"
    content = index_file.read_text(encoding="utf-8")
    return HTMLResponse(
        content=content,
        headers={
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "Pragma": "no-cache",
            "Expires": "0"
        }
    )


@app.get("/favicon.ico")
@app.get("/static/icon.png")
async def serve_favicon():
    """Entrega o ícone oficial da RPsecti para a aba do navegador."""
    icon_path = STATIC_DIR / "icon.png"
    if icon_path.exists():
        return FileResponse(icon_path, media_type="image/png")
    return HTMLResponse("")


@app.get("/status")
async def get_status():
    """Status do host remoto com resolução física real."""
    return {
        "status": "online",
        "resolution": f"{capturer.width}x{capturer.height}",
        "pin_configured": bool(CONFIG["pin"]),
        "clients_connected": len(ACTIVE_CLIENTS),
    }


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket, pin: str = Query("")):
    """Canal bidirecional: Streaming de vídeo (Binário) + Input do Cliente (JSON)."""
    client_ip = websocket.client.host if websocket.client else "unknown"
    now = time.time()

    # 1. Verifica se o IP está bloqueado temporariamente por excesso de tentativas
    sec_data = FAILED_ATTEMPTS.get(client_ip, {"count": 0, "locked_until": 0.0, "level": 0})
    if sec_data["locked_until"] > now:
        remaining_secs = int(sec_data["locked_until"] - now)
        await websocket.accept()
        await websocket.send_text(json.dumps({
            "type": "auth_error",
            "status": "locked",
            "seconds": remaining_secs,
            "message": f"Bloqueado por segurança. Aguarde {remaining_secs}s para tentar novamente."
        }))
        await websocket.close(code=4003, reason="IP Bloqueado")
        print(f"[!] Conexão rejeitada: {client_ip} ainda bloqueado por mais {remaining_secs}s")
        return

    # 2. Validação do PIN de Segurança
    if CONFIG["pin"] and pin != CONFIG["pin"]:
        sec_data["count"] += 1

        if sec_data["count"] >= 3:
            # 3 tentativas incorretas -> Aplica bloqueio exponencial (30s, 60s, 120s, ...)
            sec_data["level"] += 1
            freeze_duration = 30 * (2 ** (sec_data["level"] - 1))
            sec_data["locked_until"] = now + freeze_duration
            sec_data["count"] = 0
            FAILED_ATTEMPTS[client_ip] = sec_data

            await websocket.accept()
            await websocket.send_text(json.dumps({
                "type": "auth_error",
                "status": "locked",
                "seconds": freeze_duration,
                "message": f"Muitas tentativas incorretas. Acesso congelado por {freeze_duration} segundos."
            }))
            await websocket.close(code=4003, reason="IP Congelado")

            print(f"[ALERTA DE SEGURANÇA] {client_ip} congelado por {freeze_duration}s (Nível {sec_data['level']})")
            if CALLBACKS["on_security_alert"]:
                try:
                    CALLBACKS["on_security_alert"](client_ip, freeze_duration)
                except Exception:
                    pass
            return
        else:
            # Erro simples (1 ou 2 tentativas)
            attempts_left = 3 - sec_data["count"]
            FAILED_ATTEMPTS[client_ip] = sec_data

            await websocket.accept()
            await websocket.send_text(json.dumps({
                "type": "auth_error",
                "status": "wrong_pin",
                "attempts_left": attempts_left,
                "message": f"PIN incorreto! Restam {attempts_left} tentativa(s) antes do bloqueio."
            }))
            await websocket.close(code=4001, reason="PIN Incorreto")
            print(f"[-] Tentativa incorreta de {client_ip} ({sec_data['count']}/3)")
            return

    # 3. PIN Correto -> Reseta falhas e aceita conexão
    FAILED_ATTEMPTS.pop(client_ip, None)
    await websocket.accept()
    ACTIVE_CLIENTS.add(client_ip)
    print(f"[+] Cliente autorizado conectado com sucesso: {client_ip}")

    if CALLBACKS["on_connect"]:
        try:
            CALLBACKS["on_connect"](client_ip, len(ACTIVE_CLIENTS))
        except Exception:
            pass

    # Envia dimensões físicas nativas da tela
    await websocket.send_text(json.dumps({
        "type": "init",
        "width": capturer.width,
        "height": capturer.height
    }))

    session_state = {
        "quality": 65,
        "scale": 1.0,
        "fps": 25,
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
                    session_state["quality"] = int(msg.get("quality", 65))
                    session_state["scale"] = float(msg.get("scale", 1.0))
                    session_state["fps"] = int(msg.get("fps", 25))

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
    """Retorna os IPs da máquina na rede local."""
    hostname = socket.gethostname()
    try:
        ips = socket.gethostbyname_ex(hostname)[2]
        return [ip for ip in ips if not ip.startswith("127.")]
    except Exception:
        return ["127.0.0.1"]


def main():
    parser = argparse.ArgumentParser(description="RPsec Link - Servidor Remoto")
    parser.add_argument("--port", type=int, default=8765, help="Porta HTTP/WebSocket (padrão: 8765)")
    parser.add_argument("--pin", type=str, default=None, help="PIN de acesso (padrão: gerado aleatoriamente)")
    parser.add_argument("--host", type=str, default="0.0.0.0", help="Interface de rede (padrão: 0.0.0.0)")
    args = parser.parse_args()

    CONFIG["port"] = args.port
    CONFIG["host"] = args.host
    if args.pin:
        CONFIG["pin"] = args.pin
    else:
        CONFIG["pin"] = generate_random_pin()

    ips = get_network_ips()
    print("=" * 64)
    print("   ⚡ RPsec Link — Servidor de Acesso Remoto Ultraleve")
    print("=" * 64)
    print(f"  • Resolução Nativa : {capturer.width}x{capturer.height}")
    print(f"  • PIN de Segurança : {CONFIG['pin']} (Aleatório)")
    print(f"  • Acesso Local     : http://localhost:{args.port}")
    for ip in ips:
        print(f"  • Acesso na Rede   : http://{ip}:{args.port}")
    print("=" * 64 + "\n")

    uvicorn.run(app, host=args.host, port=args.port, log_level="warning")


if __name__ == "__main__":
    main()
