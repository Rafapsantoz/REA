"""
RPsec Link - Servidor de Acesso Remoto Ultraleve (FastAPI + WebSockets + Win32).
Executa na máquina Host e permite visualização e controle via qualquer navegador web.
Inclui otimização de conexão com Dirty Frame Detection e controle de desconexão remota.
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

app = FastAPI(title="RPsec Link Server", version="1.5.0")

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
ACTIVE_WEBSOCKETS: Set[WebSocket] = set()
ACTIVE_DEVICES: Dict[str, Dict[str, Any]] = {}
SERVER_LOOP: Optional[asyncio.AbstractEventLoop] = None

CALLBACKS = {
    "on_connect": None,
    "on_disconnect": None,
    "on_security_alert": None,
    "on_devices_update": None,
    "on_shutdown_request": None,
}

# Rastreamento de falhas de autenticação e bloqueio (Anti-Brute Force)
FAILED_ATTEMPTS: Dict[str, Dict[str, Any]] = {}

# Inicializa motores com DPI awareness ativo e sem duplicação de cursor
capturer = ScreenCapturer(draw_cursor=False)
input_ctrl = InputController(capturer.width, capturer.height)


def get_connected_devices() -> list:
    """Retorna lista formatada de todos os dispositivos conectados no momento."""
    now = time.time()
    return [
        {
            "id": dev["id"],
            "ip": dev["ip"],
            "connected_at": dev["connected_at"],
            "connected_str": dev["connected_str"],
            "duration": int(now - dev["connected_at"]),
            "is_native": dev.get("is_native", False),
            "client_type": "Cliente Desktop" if dev.get("is_native") else "Navegador Web"
        }
        for dev in list(ACTIVE_DEVICES.values())
    ]


async def broadcast_devices():
    """Envia a lista atualizada de dispositivos para todos os clientes conectados."""
    dev_list = get_connected_devices()
    msg = json.dumps({"type": "devices_list", "devices": dev_list})
    for dev in list(ACTIVE_DEVICES.values()):
        try:
            await dev["ws"].send_text(msg)
        except Exception:
            pass


def notify_devices_changed():
    """Notifica a interface gráfica do Host sobre alterações nos dispositivos conectados."""
    if CALLBACKS.get("on_devices_update"):
        try:
            CALLBACKS["on_devices_update"](get_connected_devices())
        except Exception:
            pass


async def disconnect_device_by_id(session_id: str):
    """Encerra a conexão de um dispositivo específico pelo seu ID."""
    dev = ACTIVE_DEVICES.pop(session_id, None)
    if dev:
        try:
            await dev["ws"].send_text(json.dumps({
                "type": "server_disconnect",
                "message": "Sessão encerrada pelo Host."
            }))
            await dev["ws"].close(code=1000, reason="Desconectado pelo Host")
        except Exception:
            pass
        ACTIVE_CLIENTS.discard(dev["ip"])
        ACTIVE_WEBSOCKETS.discard(dev["ws"])
        await broadcast_devices()
        notify_devices_changed()


def trigger_disconnect_device(session_id: str):
    """Dispara a desconexão de um dispositivo específico a partir de threads síncronas."""
    if SERVER_LOOP and SERVER_LOOP.is_running():
        asyncio.run_coroutine_threadsafe(disconnect_device_by_id(session_id), SERVER_LOOP)


async def disconnect_other_devices(caller_session_id: str):
    """Desconecta todos os outros dispositivos conectados, mantendo o chamador ativo."""
    for sid, dev in list(ACTIVE_DEVICES.items()):
        if sid != caller_session_id:
            try:
                await dev["ws"].send_text(json.dumps({
                    "type": "server_disconnect",
                    "message": "Sessão encerrada pelo administrador."
                }))
                await dev["ws"].close(code=1000, reason="Desconectado pelo administrador")
            except Exception:
                pass
            ACTIVE_DEVICES.pop(sid, None)
            ACTIVE_CLIENTS.discard(dev["ip"])
            ACTIVE_WEBSOCKETS.discard(dev["ws"])
    await broadcast_devices()
    notify_devices_changed()


async def disconnect_all_clients():
    """Encerra todas as conexões WebSocket ativas imediatamente."""
    for dev in list(ACTIVE_DEVICES.values()):
        try:
            await dev["ws"].send_text(json.dumps({
                "type": "server_disconnect",
                "message": "A sessão foi encerrada pelo Host."
            }))
            await dev["ws"].close(code=1000, reason="Host encerrou a sessão")
        except Exception:
            pass
    ACTIVE_DEVICES.clear()
    ACTIVE_WEBSOCKETS.clear()
    ACTIVE_CLIENTS.clear()
    notify_devices_changed()
    if CALLBACKS.get("on_disconnect"):
        try:
            CALLBACKS["on_disconnect"]("Desconectado", 0)
        except Exception:
            pass


def trigger_disconnect_all():
    """Dispara a desconexão a partir de threads síncronas (como a GUI do Host)."""
    if SERVER_LOOP and SERVER_LOOP.is_running():
        return asyncio.run_coroutine_threadsafe(disconnect_all_clients(), SERVER_LOOP)
    return None


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
    """Canal bidirecional otimizado: Transmissão adaptativa com Dirty Frame Detection."""
    global SERVER_LOOP
    SERVER_LOOP = asyncio.get_running_loop()

    client_ip = websocket.client.host if websocket.client else "unknown"
    now = time.time()

    # 1. Verifica se o IP está bloqueado temporariamente
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
        return

    # 2. Validação do PIN de Segurança
    if CONFIG["pin"] and pin != CONFIG["pin"]:
        sec_data["count"] += 1

        if sec_data["count"] >= 3:
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

    # 3. Autenticado com sucesso
    FAILED_ATTEMPTS.pop(client_ip, None)
    await websocket.accept()

    # Limpa qualquer tecla que possa ter ficado presa de sessões anteriores
    input_ctrl.release_all_keys()

    session_id = f"dev_{secrets.token_hex(4)}"
    ACTIVE_CLIENTS.add(client_ip)
    ACTIVE_WEBSOCKETS.add(websocket)
    ACTIVE_DEVICES[session_id] = {
        "id": session_id,
        "ip": client_ip,
        "ws": websocket,
        "connected_at": time.time(),
        "connected_str": time.strftime("%H:%M:%S"),
        "is_native": False,
    }

    print(f"[+] Cliente autorizado conectado com sucesso: {client_ip} (ID: {session_id})")

    notify_devices_changed()
    await broadcast_devices()

    if CALLBACKS["on_connect"]:
        try:
            CALLBACKS["on_connect"](client_ip, len(ACTIVE_DEVICES))
        except Exception:
            pass

    # Envia dimensões físicas nativas da tela e ID da sessão
    await websocket.send_text(json.dumps({
        "type": "init",
        "session_id": session_id,
        "width": capturer.width,
        "height": capturer.height,
        "devices": get_connected_devices()
    }))

    session_state = {
        "quality": 55,
        "scale": 1.0,
        "fps": 25,
        "interactive_boost": 0,
        "running": True
    }

    async def stream_frames():
        last_keyframe = time.perf_counter()
        try:
            while session_state["running"]:
                t_start = time.perf_counter()

                # Boost Interativo: se o usuário digitou ou clicou recentemente,
                # força a captura e o envio do quadro imediatamente com prioridade máxima!
                is_interactive = session_state["interactive_boost"] > 0
                if is_interactive:
                    session_state["interactive_boost"] -= 1

                force_sync = is_interactive or ((t_start - last_keyframe) >= 1.5)

                # Executa captura e compressão em thread separada para NUNCA bloquear inputs de mouse e teclado
                frame_bytes = await asyncio.to_thread(
                    capturer.grab_frame_jpeg,
                    session_state["quality"],
                    session_state["scale"],
                    force_sync
                )

                if frame_bytes is not None:
                    last_keyframe = t_start
                    await websocket.send_bytes(frame_bytes)

                # Controle de taxa com sono adaptativo
                target_interval = 1.0 / session_state["fps"]
                elapsed = time.perf_counter() - t_start
                sleep_time = max(0.002, target_interval - elapsed)
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
                    session_state["interactive_boost"] = 3
                    input_ctrl.sync_modifiers(
                        ctrl=msg.get("ctrl"),
                        alt=msg.get("alt"),
                        shift=msg.get("shift"),
                        meta=msg.get("meta")
                    )
                    input_ctrl.mouse_down(msg["button"], msg.get("x"), msg.get("y"))

                elif mtype == "mouse_up":
                    session_state["interactive_boost"] = 3
                    input_ctrl.mouse_up(msg["button"], msg.get("x"), msg.get("y"))

                elif mtype == "wheel":
                    session_state["interactive_boost"] = 2
                    input_ctrl.mouse_wheel(msg.get("delta", 0))

                elif mtype == "key_down":
                    session_state["interactive_boost"] = 3
                    input_ctrl.key_down(
                        key=msg.get("key", ""),
                        code=msg.get("code", ""),
                        vk=int(msg.get("vk", 0)),
                        ctrl=msg.get("ctrl"),
                        alt=msg.get("alt"),
                        shift=msg.get("shift"),
                        meta=msg.get("meta")
                    )

                elif mtype == "key_up":
                    session_state["interactive_boost"] = 3
                    input_ctrl.key_up(
                        key=msg.get("key", ""),
                        code=msg.get("code", ""),
                        vk=int(msg.get("vk", 0)),
                        ctrl=msg.get("ctrl"),
                        alt=msg.get("alt"),
                        shift=msg.get("shift"),
                        meta=msg.get("meta")
                    )

                elif mtype == "reset_keys":
                    input_ctrl.release_all_keys()

                elif mtype == "shortcut":
                    session_state["interactive_boost"] = 3
                    input_ctrl.send_shortcut(msg.get("shortcut", ""))

                elif mtype == "quality":
                    profile = msg.get("profile")
                    if profile == "turbo":
                        session_state["quality"] = 70
                        session_state["scale"] = 1.0
                        session_state["fps"] = 30
                    elif profile == "balanced":
                        session_state["quality"] = 55
                        session_state["scale"] = 1.0
                        session_state["fps"] = 25
                    elif profile == "weak":
                        session_state["quality"] = 40
                        session_state["scale"] = 0.75
                        session_state["fps"] = 18
                    elif profile == "ultra":
                        session_state["quality"] = 30
                        session_state["scale"] = 0.60
                        session_state["fps"] = 12
                    else:
                        session_state["quality"] = int(msg.get("quality", session_state["quality"]))
                        session_state["scale"] = float(msg.get("scale", session_state["scale"]))
                        session_state["fps"] = int(msg.get("fps", session_state["fps"]))

                elif mtype == "ping":
                    await websocket.send_text(json.dumps({"type": "pong", "ts": msg.get("ts")}))

                elif mtype == "client_info":
                    if session_id in ACTIVE_DEVICES:
                        ACTIVE_DEVICES[session_id]["is_native"] = bool(msg.get("is_native", False))
                        notify_devices_changed()
                        await broadcast_devices()

                elif mtype == "request_devices":
                    await websocket.send_text(json.dumps({
                        "type": "devices_list",
                        "devices": get_connected_devices()
                    }))

                elif mtype == "disconnect_device":
                    target_id = msg.get("device_id")
                    if target_id:
                        await disconnect_device_by_id(target_id)

                elif mtype == "disconnect_other_devices":
                    await disconnect_other_devices(session_id)

                elif mtype == "disconnect_all_devices":
                    await disconnect_all_clients()

                elif mtype == "shutdown_host":
                    if CALLBACKS.get("on_shutdown_request"):
                        try:
                            CALLBACKS["on_shutdown_request"]()
                        except Exception:
                            pass

                elif mtype == "client_disconnect":
                    session_state["running"] = False
                    break

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

    ACTIVE_DEVICES.pop(session_id, None)
    ACTIVE_WEBSOCKETS.discard(websocket)
    ACTIVE_CLIENTS.discard(client_ip)
    await broadcast_devices()
    notify_devices_changed()

    # Garante que nenhuma tecla fique presa no host após desconexão
    input_ctrl.release_all_keys()

    print(f"[-] Cliente desconectado de {client_ip} (ID: {session_id})")

    if CALLBACKS["on_disconnect"]:
        try:
            CALLBACKS["on_disconnect"](client_ip, len(ACTIVE_DEVICES))
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
