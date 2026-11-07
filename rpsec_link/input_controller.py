"""
RPsec Link - Controlador de Input Remoto (Mouse e Teclado Win32).
Interpreta coordenadas normalizadas e eventos de entrada da interface web.
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

# Flags do Teclado Win32
KEYEVENTF_EXTENDEDKEY = 0x0001
KEYEVENTF_KEYUP = 0x0002
KEYEVENTF_UNICODE = 0x0004

# Mapeamento de Teclas Especiais JS -> Virtual Keys do Windows (VK)
VK_MAP = {
    "Enter": 0x0D,
    "Backspace": 0x08,
    "Tab": 0x09,
    "Escape": 0x1B,
    "Space": 0x20,
    " ": 0x20,
    "Shift": 0x10,
    "ShiftLeft": 0xA0,
    "ShiftRight": 0xA1,
    "Control": 0x11,
    "ControlLeft": 0xA2,
    "ControlRight": 0xA3,
    "Alt": 0x12,
    "AltLeft": 0xA4,
    "AltRight": 0xA5,
    "Meta": 0x5B,
    "MetaLeft": 0x5B,
    "MetaRight": 0x5C,
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
    "F1": 0x70,
    "F2": 0x71,
    "F3": 0x72,
    "F4": 0x73,
    "F5": 0x74,
    "F6": 0x75,
    "F7": 0x76,
    "F8": 0x77,
    "F9": 0x78,
    "F10": 0x79,
    "F11": 0x7A,
    "F12": 0x7B,
}


class InputController:
    """Gerencia a simulação de mouse e teclado para o host remoto."""

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
        """Pressiona botão do mouse (left, right, middle)."""
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
        """Rola a roda do mouse (positivo para cima, negativo para baixo)."""
        self._ensure_desktop()
        # Normaliza o delta de scroll do navegador para a escala do Windows
        amt = int(delta_y * 1.5)
        u32.mouse_event(MOUSEEVENTF_WHEEL, 0, 0, amt, 0)

    def key_down(self, key: str, code: str = ""):
        """Pressiona uma tecla."""
        self._ensure_desktop()
        vk = VK_MAP.get(code) or VK_MAP.get(key)

        if vk:
            flags = 0
            if vk in (0x25, 0x26, 0x27, 0x28, 0x2D, 0x2E, 0x24, 0x23, 0x21, 0x22, 0x5B, 0x5C):
                flags |= KEYEVENTF_EXTENDEDKEY
            u32.keybd_event(vk, 0, flags, 0)
        elif len(key) == 1:
            # Letras, números ou caracteres unicode (incluindo ç, ~, acentos)
            char_code = ord(key)
            u32.keybd_event(0, char_code, KEYEVENTF_UNICODE, 0)

    def key_up(self, key: str, code: str = ""):
        """Libera uma tecla."""
        self._ensure_desktop()
        vk = VK_MAP.get(code) or VK_MAP.get(key)

        if vk:
            flags = KEYEVENTF_KEYUP
            if vk in (0x25, 0x26, 0x27, 0x28, 0x2D, 0x2E, 0x24, 0x23, 0x21, 0x22, 0x5B, 0x5C):
                flags |= KEYEVENTF_EXTENDEDKEY
            u32.keybd_event(vk, 0, flags, 0)
        elif len(key) == 1:
            char_code = ord(key)
            u32.keybd_event(0, char_code, KEYEVENTF_UNICODE | KEYEVENTF_KEYUP, 0)

    def send_shortcut(self, shortcut: str):
        """Envia atalhos compostos (ex: 'ctrl+c', 'win+d', 'alt+tab')."""
        self._ensure_desktop()
        keys = [k.strip().lower() for k in shortcut.split("+")]

        # Mapeamento simples
        key_codes = []
        for k in keys:
            if k in ("ctrl", "control"):
                key_codes.append(0x11)
            elif k == "alt":
                key_codes.append(0x12)
            elif k == "shift":
                key_codes.append(0x10)
            elif k in ("win", "cmd", "meta"):
                key_codes.append(0x5B)
            elif len(k) == 1:
                key_codes.append(ord(k.upper()))
            elif k in VK_MAP:
                key_codes.append(VK_MAP[k])

        # Pressiona em ordem
        for vk in key_codes:
            u32.keybd_event(vk, 0, 0, 0)
        time.sleep(0.05)
        # Solta em ordem reversa
        for vk in reversed(key_codes):
            u32.keybd_event(vk, 0, KEYEVENTF_KEYUP, 0)
