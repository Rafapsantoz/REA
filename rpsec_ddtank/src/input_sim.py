"""
RPsec DDTank Bot - Módulo de Simulação de Inputs Humanizados via Win32 SendInput.
Emite scan-codes de hardware idênticos a um teclado/mouse físico para garantir
indetectabilidade e precisão milimétrica.
"""

import sys
import time
import random
import logging
from typing import Optional

logger = logging.getLogger("RPsec_Input")

if sys.platform == "win32":
    import ctypes
    from ctypes import wintypes

    user32 = ctypes.windll.user32

    # Constantes do Win32 SendInput
    INPUT_MOUSE = 0
    INPUT_KEYBOARD = 1

    KEYEVENTF_EXTENDEDKEY = 0x0001
    KEYEVENTF_KEYUP = 0x0002
    KEYEVENTF_UNICODE = 0x0004
    KEYEVENTF_SCANCODE = 0x0008

    MOUSEEVENTF_MOVE = 0x0001
    MOUSEEVENTF_LEFTDOWN = 0x0002
    MOUSEEVENTF_LEFTUP = 0x0004
    MOUSEEVENTF_ABSOLUTE = 0x8000

    # Mapeamento de Virtual Keys & Hardware Scan Codes
    # Scan codes são essenciais para engines DirectInput/Flash
    SCAN_CODES = {
        "left": 0x4B,    # Seta Esquerda (Extended)
        "right": 0x4D,   # Seta Direita (Extended)
        "up": 0x48,      # Seta Cima (Extended)
        "down": 0x50,    # Seta Baixo (Extended)
        "space": 0x39,   # Barra de Espaço
        "f": 0x21,       # Tecla F (Avião)
        "b": 0x30,       # Tecla B (Pow / Furor)
        "p": 0x19,       # Tecla P (Passar turno se necessário)
        "1": 0x02,       # Item 1 (+2 tiros)
        "2": 0x03,       # Item 2 (+1 tiro)
        "3": 0x04,       # Item 3 (50%)
        "4": 0x05,       # Item 4 (50%)
        "enter": 0x1C,
        "esc": 0x01,
    }

    VK_CODES = {
        "left": 0x25,
        "right": 0x27,
        "up": 0x26,
        "down": 0x28,
        "space": 0x20,
        "f": 0x46,
        "b": 0x42,
        "p": 0x50,
        "1": 0x31,
        "2": 0x32,
        "3": 0x33,
        "4": 0x34,
        "enter": 0x0D,
        "esc": 0x1B,
    }

    # Estruturas Win32 ctypes para 64 bits
    class MOUSEINPUT(ctypes.Structure):
        _fields_ = [
            ("dx", wintypes.LONG),
            ("dy", wintypes.LONG),
            ("mouseData", wintypes.DWORD),
            ("dwFlags", wintypes.DWORD),
            ("time", wintypes.DWORD),
            ("dwExtraInfo", ctypes.c_void_p),
        ]

    class KEYBDINPUT(ctypes.Structure):
        _fields_ = [
            ("wVk", wintypes.WORD),
            ("wScan", wintypes.WORD),
            ("dwFlags", wintypes.DWORD),
            ("time", wintypes.DWORD),
            ("dwExtraInfo", ctypes.c_void_p),
        ]

    class HARDWAREINPUT(ctypes.Structure):
        _fields_ = [
            ("uMsg", wintypes.DWORD),
            ("wParamL", wintypes.WORD),
            ("wParamH", wintypes.WORD),
        ]

    class _INPUT_UNION(ctypes.Union):
        _fields_ = [
            ("mi", MOUSEINPUT),
            ("ki", KEYBDINPUT),
            ("hi", HARDWAREINPUT),
        ]

    class INPUT(ctypes.Structure):
        _fields_ = [
            ("type", wintypes.DWORD),
            ("u", _INPUT_UNION),
        ]

    user32.SendInput.argtypes = [wintypes.UINT, ctypes.POINTER(INPUT), ctypes.c_int]
    user32.SendInput.restype = wintypes.UINT

    user32.SetCursorPos.argtypes = [ctypes.c_int, ctypes.c_int]
    user32.SetCursorPos.restype = wintypes.BOOL

    user32.GetSystemMetrics.argtypes = [ctypes.c_int]
    user32.GetSystemMetrics.restype = ctypes.c_int


def _send_key_event(key_name: str, key_up: bool = False):
    """Envia um evento de teclado (KeyDown ou KeyUp) via ScanCode no Windows."""
    if sys.platform != "win32":
        return

    key_lower = key_name.lower()
    scan_code = SCAN_CODES.get(key_lower, 0)
    vk_code = VK_CODES.get(key_lower, 0)

    flags = KEYEVENTF_SCANCODE
    if key_lower in ("left", "right", "up", "down"):
        flags |= KEYEVENTF_EXTENDEDKEY
    if key_up:
        flags |= KEYEVENTF_KEYUP

    inp = INPUT()
    inp.type = INPUT_KEYBOARD
    inp.u.ki.wVk = vk_code
    inp.u.ki.wScan = scan_code
    inp.u.ki.dwFlags = flags
    inp.u.ki.time = 0
    inp.u.ki.dwExtraInfo = None

    user32.SendInput(1, ctypes.byref(inp), ctypes.sizeof(INPUT))


def key_down(key_name: str):
    """Pressiona e mantém uma tecla abaixada."""
    _send_key_event(key_name, key_up=False)


def key_up(key_name: str):
    """Solta a tecla previamente pressionada."""
    _send_key_event(key_name, key_up=True)


def tap_key(key_name: str, delay: float = 0.08):
    """Pressiona e solta uma tecla com duração humanizada."""
    key_down(key_name)
    time.sleep(delay + random.uniform(0.01, 0.03))
    key_up(key_name)
    time.sleep(0.05)


def hold_key(key_name: str, duration_sec: float, repeat_interval: float = 0.04):
    """
    Mantém a tecla pressionada durante o tempo especificado simulando repeat rate físico de hardware.
    Essencial para Flash Player / DirectInput que requerem pulsos contínuos de KeyDown para movimentação contínua.
    """
    start_time = time.time()
    # Primeiro pulso
    key_down(key_name)
    while (time.time() - start_time) < duration_sec:
        time.sleep(repeat_interval)
        key_down(key_name)
    # Solta a tecla
    key_up(key_name)
    time.sleep(0.05)


def click_at(x: int, y: int, jitter: bool = True):
    """
    Move o mouse e clica com precisão absoluta nas coordenadas (x, y).
    Utiliza combinação de SetCursorPos + SendInput absoluto para compatibilidade total.
    """
    if sys.platform != "win32":
        return

    if jitter:
        # Micro-variação imperceptível de 1 pixel para humanização
        x += random.randint(-1, 1)
        y += random.randint(-1, 1)

    # 1. Posicionamento físico direto do cursor
    user32.SetCursorPos(x, y)
    time.sleep(random.uniform(0.03, 0.06))

    # Converte coordenadas para normalização absoluta do SendInput (0 a 65535)
    screen_w = max(1, user32.GetSystemMetrics(0))
    screen_h = max(1, user32.GetSystemMetrics(1))
    norm_x = int(x * 65535 / (screen_w - 1))
    norm_y = int(y * 65535 / (screen_h - 1))

    # Flags seguras com MOUSEEVENTF_MOVE | MOUSEEVENTF_ABSOLUTE
    flags_down = MOUSEEVENTF_MOVE | MOUSEEVENTF_ABSOLUTE | MOUSEEVENTF_LEFTDOWN
    flags_up = MOUSEEVENTF_MOVE | MOUSEEVENTF_ABSOLUTE | MOUSEEVENTF_LEFTUP

    # 2. Pressiona botão esquerdo
    inp_down = INPUT()
    inp_down.type = INPUT_MOUSE
    inp_down.u.mi.dx = norm_x
    inp_down.u.mi.dy = norm_y
    inp_down.u.mi.dwFlags = flags_down

    # 3. Solta botão esquerdo
    inp_up = INPUT()
    inp_up.type = INPUT_MOUSE
    inp_up.u.mi.dx = norm_x
    inp_up.u.mi.dy = norm_y
    inp_up.u.mi.dwFlags = flags_up

    user32.SendInput(1, ctypes.byref(inp_down), ctypes.sizeof(INPUT))
    time.sleep(random.uniform(0.06, 0.10))
    user32.SendInput(1, ctypes.byref(inp_up), ctypes.sizeof(INPUT))
