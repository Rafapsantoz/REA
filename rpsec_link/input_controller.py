"""
RPsec Link - Controlador de Input Remoto de Alta Precisão (Win32 SendInput).
Interpreta códigos de teclas físicas do navegador (KeyboardEvent.code) e caracteres Unicode,
eliminando teclas trocadas e garantindo compatibilidade total com teclados ABNT2 e US.
"""

import ctypes
from ctypes import wintypes
import time
from typing import Dict, Any

u32 = ctypes.windll.user32

# Flags do Mouse Win32
MOUSEEVENTF_MOVE = 0x0001
MOUSEEVENTF_LEFTDOWN = 0x0002
MOUSEEVENTF_LEFTUP = 0x0004
MOUSEEVENTF_RIGHTDOWN = 0x0008
MOUSEEVENTF_RIGHTUP = 0x0010
MOUSEEVENTF_MIDDLEDOWN = 0x0020
MOUSEEVENTF_MIDDLEUP = 0x0040
MOUSEEVENTF_WHEEL = 0x0800
MOUSEEVENTF_ABSOLUTE = 0x8000

# Flags do Teclado Win32 (SendInput)
KEYEVENTF_EXTENDEDKEY = 0x0001
KEYEVENTF_KEYUP = 0x0002
KEYEVENTF_UNICODE = 0x0004
KEYEVENTF_SCANCODE = 0x0008

INPUT_MOUSE = 0
INPUT_KEYBOARD = 1
INPUT_HARDWARE = 2


# Estruturas Ctypes para SendInput de 64 bits
class MOUSEINPUT(ctypes.Structure):
    _fields_ = [
        ("dx", wintypes.LONG),
        ("dy", wintypes.LONG),
        ("mouseData", wintypes.DWORD),
        ("dwFlags", wintypes.DWORD),
        ("time", wintypes.DWORD),
        ("dwExtraInfo", ctypes.c_size_t),
    ]


class KEYBDINPUT(ctypes.Structure):
    _fields_ = [
        ("wVk", wintypes.WORD),
        ("wScan", wintypes.WORD),
        ("dwFlags", wintypes.DWORD),
        ("time", wintypes.DWORD),
        ("dwExtraInfo", ctypes.c_size_t),
    ]


class HARDWAREINPUT(ctypes.Structure):
    _fields_ = [
        ("uMsg", wintypes.DWORD),
        ("wParamL", wintypes.WORD),
        ("wParamH", wintypes.WORD),
    ]


class INPUT_UNION(ctypes.Union):
    _fields_ = [
        ("mi", MOUSEINPUT),
        ("ki", KEYBDINPUT),
        ("hi", HARDWAREINPUT),
    ]


class INPUT(ctypes.Structure):
    _fields_ = [
        ("type", wintypes.DWORD),
        ("u", INPUT_UNION),
    ]


u32.SendInput.argtypes = [wintypes.UINT, ctypes.POINTER(INPUT), ctypes.c_int]
u32.SendInput.restype = wintypes.UINT


# Mapeamento oficial de KeyboardEvent.code do navegador para Virtual Keys (VK) do Windows
CODE_TO_VK = {
    # Letras A-Z
    "KeyA": 0x41, "KeyB": 0x42, "KeyC": 0x43, "KeyD": 0x44, "KeyE": 0x45,
    "KeyF": 0x46, "KeyG": 0x47, "KeyH": 0x48, "KeyI": 0x49, "KeyJ": 0x4A,
    "KeyK": 0x4B, "KeyL": 0x4C, "KeyM": 0x4D, "KeyN": 0x4E, "KeyO": 0x4F,
    "KeyP": 0x50, "KeyQ": 0x51, "KeyR": 0x52, "KeyS": 0x53, "KeyT": 0x54,
    "KeyU": 0x55, "KeyV": 0x56, "KeyW": 0x57, "KeyX": 0x58, "KeyY": 0x59, "KeyZ": 0x5A,

    # Dígitos 0-9
    "Digit0": 0x30, "Digit1": 0x31, "Digit2": 0x32, "Digit3": 0x33, "Digit4": 0x34,
    "Digit5": 0x35, "Digit6": 0x36, "Digit7": 0x37, "Digit8": 0x38, "Digit9": 0x39,

    # Teclado Numérico
    "Numpad0": 0x60, "Numpad1": 0x61, "Numpad2": 0x62, "Numpad3": 0x63, "Numpad4": 0x64,
    "Numpad5": 0x65, "Numpad6": 0x66, "Numpad7": 0x67, "Numpad8": 0x68, "Numpad9": 0x69,
    "NumpadMultiply": 0x6A, "NumpadAdd": 0x6B, "NumpadSubtract": 0x6D, "NumpadDecimal": 0x6E, "NumpadDivide": 0x6F,

    # Controle e Modificadores
    "Enter": 0x0D,
    "Backspace": 0x08,
    "Tab": 0x09,
    "Escape": 0x1B,
    "Space": 0x20,
    "ShiftLeft": 0x10,
    "ShiftRight": 0x10,
    "ControlLeft": 0x11,
    "ControlRight": 0x11,
    "AltLeft": 0x12,
    "AltRight": 0x12,
    "MetaLeft": 0x5B,
    "MetaRight": 0x5C,
    "ContextMenu": 0x5D,

    # Navegação
    "ArrowLeft": 0x25,
    "ArrowUp": 0x26,
    "ArrowRight": 0x27,
    "ArrowDown": 0x28,
    "Delete": 0x2E,
    "Insert": 0x2D,
    "Home": 0x24,
    "End": 0x23,
    "PageUp": 0x21,
    "PageDown": 0x22,
    "CapsLock": 0x14,
    "NumLock": 0x90,
    "ScrollLock": 0x91,

    # Teclas de Função F1-F12
    "F1": 0x70, "F2": 0x71, "F3": 0x72, "F4": 0x73, "F5": 0x74, "F6": 0x75,
    "F7": 0x76, "F8": 0x77, "F9": 0x78, "F10": 0x79, "F11": 0x7A, "F12": 0x7B,

    # Pontuação e Símbolos
    "Semicolon": 0xBA,
    "Equal": 0xBB,
    "Comma": 0xBC,
    "Minus": 0xBD,
    "Period": 0xBE,
    "Slash": 0xBF,
    "Backquote": 0xC0,
    "BracketLeft": 0xDB,
    "Backslash": 0xDC,
    "BracketRight": 0xDD,
    "Quote": 0xDE,

    # Teclas ABNT2 Brasileiras
    "IntlRo": 0xC1,          # Tecla / e ? no teclado ABNT2
    "IntlBackslash": 0xE2,   # Tecla \ e | no teclado ABNT2
}

EXTENDED_KEYS = {0x25, 0x26, 0x27, 0x28, 0x2D, 0x2E, 0x24, 0x23, 0x21, 0x22, 0x5B, 0x5C, 0x6F}


class InputController:
    """Controlador de Mouse e Teclado via Windows SendInput API."""

    def __init__(self, screen_width: int, screen_height: int):
        self.width = screen_width
        self.height = screen_height

    def _ensure_desktop(self):
        try:
            hdesk = u32.OpenInputDesktop(0, False, 0x01FF)
            if hdesk:
                u32.SetThreadDesktop(hdesk)
        except Exception:
            pass

    def move_mouse(self, norm_x: float, norm_y: float):
        """Move o cursor para coordenadas normalizadas (0.0 a 1.0)."""
        self._ensure_desktop()
        px = max(0, min(self.width - 1, int(norm_x * self.width)))
        py = max(0, min(self.height - 1, int(norm_y * self.height)))
        u32.SetCursorPos(px, py)

    def mouse_down(self, button: str, norm_x: float = None, norm_y: float = None):
        """Pressiona botão do mouse."""
        if norm_x is not None and norm_y is not None:
            self.move_mouse(norm_x, norm_y)

        flag = MOUSEEVENTF_LEFTDOWN
        if button == "right":
            flag = MOUSEEVENTF_RIGHTDOWN
        elif button == "middle":
            flag = MOUSEEVENTF_MIDDLEDOWN

        u32.mouse_event(flag, 0, 0, 0, 0)

    def mouse_up(self, button: str, norm_x: float = None, norm_y: float = None):
        """Solta o botão do mouse."""
        if norm_x is not None and norm_y is not None:
            self.move_mouse(norm_x, norm_y)

        flag = MOUSEEVENTF_LEFTUP
        if button == "right":
            flag = MOUSEEVENTF_RIGHTUP
        elif button == "middle":
            flag = MOUSEEVENTF_MIDDLEUP

        u32.mouse_event(flag, 0, 0, 0, 0)

    def mouse_wheel(self, delta_y: int):
        """Rola a roda do mouse verticalmente."""
        self._ensure_desktop()
        amt = int(delta_y * 1.5)
        u32.mouse_event(MOUSEEVENTF_WHEEL, 0, 0, amt, 0)

    def key_down(self, key: str, code: str = ""):
        """Pressiona uma tecla usando SendInput de alta precisão."""
        self._send_key_event(key, code, is_up=False)

    def key_up(self, key: str, code: str = ""):
        """Libera uma tecla usando SendInput."""
        self._send_key_event(key, code, is_up=True)

    def _send_key_event(self, key: str, code: str, is_up: bool):
        self._ensure_desktop()
        vk = CODE_TO_VK.get(code) or CODE_TO_VK.get(key)

        if vk:
            scan = u32.MapVirtualKeyW(vk, 0)
            flags = 0
            if is_up:
                flags |= KEYEVENTF_KEYUP
            if vk in EXTENDED_KEYS:
                flags |= KEYEVENTF_EXTENDEDKEY

            inp = INPUT()
            inp.type = INPUT_KEYBOARD
            inp.u.ki.wVk = vk
            inp.u.ki.wScan = scan
            inp.u.ki.dwFlags = flags
            inp.u.ki.time = 0
            inp.u.ki.dwExtraInfo = 0
            u32.SendInput(1, ctypes.byref(inp), ctypes.sizeof(INPUT))

        elif len(key) == 1:
            # Envia via Unicode WCHAR para acentos, cedilhas e caracteres especiais
            char_code = ord(key)
            flags = KEYEVENTF_UNICODE
            if is_up:
                flags |= KEYEVENTF_KEYUP

            inp = INPUT()
            inp.type = INPUT_KEYBOARD
            inp.u.ki.wVk = 0
            inp.u.ki.wScan = char_code
            inp.u.ki.dwFlags = flags
            inp.u.ki.time = 0
            inp.u.ki.dwExtraInfo = 0
            u32.SendInput(1, ctypes.byref(inp), ctypes.sizeof(INPUT))

    def send_shortcut(self, shortcut: str):
        """Envia atalhos de sistema compostos (ex: 'ctrl+c', 'win+d', 'alt+tab', 'ctrl+alt+del')."""
        self._ensure_desktop()
        keys = [k.strip().lower() for k in shortcut.split("+")]

        vks = []
        for k in keys:
            if k in ("ctrl", "control"):
                vks.append(0x11)
            elif k == "alt":
                vks.append(0x12)
            elif k == "shift":
                vks.append(0x10)
            elif k in ("win", "cmd", "meta"):
                vks.append(0x5B)
            elif k == "del" or k == "delete":
                vks.append(0x2E)
            elif k == "tab":
                vks.append(0x09)
            elif len(k) == 1:
                vks.append(ord(k.upper()))

        # Pressiona teclas em ordem
        for vk in vks:
            self._send_raw_vk(vk, is_up=False)
        time.sleep(0.04)
        # Libera teclas em ordem reversa
        for vk in reversed(vks):
            self._send_raw_vk(vk, is_up=True)

    def _send_raw_vk(self, vk: int, is_up: bool):
        scan = u32.MapVirtualKeyW(vk, 0)
        flags = 0
        if is_up:
            flags |= KEYEVENTF_KEYUP
        if vk in EXTENDED_KEYS:
            flags |= KEYEVENTF_EXTENDEDKEY

        inp = INPUT()
        inp.type = INPUT_KEYBOARD
        inp.u.ki.wVk = vk
        inp.u.ki.wScan = scan
        inp.u.ki.dwFlags = flags
        u32.SendInput(1, ctypes.byref(inp), ctypes.sizeof(INPUT))
