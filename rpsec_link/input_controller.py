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
    # Dígitos 0-9
    "Digit0": 0x30, "Digit1": 0x31, "Digit2": 0x32, "Digit3": 0x33, "Digit4": 0x34,
    "Digit5": 0x35, "Digit6": 0x36, "Digit7": 0x37, "Digit8": 0x38, "Digit9": 0x39,

    # Teclado Numérico
    "Numpad0": 0x60, "Numpad1": 0x61, "Numpad2": 0x62, "Numpad3": 0x63, "Numpad4": 0x64,
    "Numpad5": 0x65, "Numpad6": 0x66, "Numpad7": 0x67, "Numpad8": 0x68, "Numpad9": 0x69,
    "NumpadMultiply": 0x6A, "NumpadAdd": 0x6B, "NumpadSubtract": 0x6D, "NumpadDecimal": 0x6E, "NumpadDivide": 0x6F,

    # Controle e Modificadores (Usa VK genéricos 0x11, 0x10, 0x12 para compatibilidade universal com aceleradores Win32)
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
    "Shift": 0x10,
    "Control": 0x11,
    "Alt": 0x12,
    "Control_L": 0x11,
    "Control_R": 0x11,
    "Shift_L": 0x10,
    "Shift_R": 0x10,
    "Alt_L": 0x12,
    "Alt_R": 0x12,
    "Meta": 0x5B,
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

# Registra letras A-Z (KeyA-KeyZ, maiúsculas e minúsculas) para suporte a navegador e Tkinter
for _ch in "ABCDEFGHIJKLMNOPQRSTUVWXYZ":
    _vk_val = ord(_ch)
    CODE_TO_VK[f"Key{_ch}"] = _vk_val
    CODE_TO_VK[_ch] = _vk_val
    CODE_TO_VK[_ch.lower()] = _vk_val

# Atalhos com caracteres de controle ASCII padrão do Windows (Tkinter)
CODE_TO_VK["\x16"] = 0x56  # Ctrl+V (SYN) -> VK_V
CODE_TO_VK["\x03"] = 0x43  # Ctrl+C (ETX) -> VK_C
CODE_TO_VK["\x18"] = 0x58  # Ctrl+X (CAN) -> VK_X
CODE_TO_VK["\x1a"] = 0x5A  # Ctrl+Z (SUB) -> VK_Z
CODE_TO_VK["\x01"] = 0x41  # Ctrl+A (SOH) -> VK_A

EXTENDED_KEYS = {
    0x21, 0x22, 0x23, 0x24, 0x25, 0x26, 0x27, 0x28, 0x2D, 0x2E,
    0x5B, 0x5C, 0x5D, 0x6F, 0xA3, 0xA5
}


class InputController:
    """Controlador de Mouse e Teclado via Windows SendInput API com imunidade a teclas presas."""

    def __init__(self, screen_width: int, screen_height: int):
        self.width = screen_width
        self.height = screen_height
        self.pressed_vks = set()

    def _ensure_desktop(self):
        try:
            hdesk = u32.OpenInputDesktop(0, False, 0x01FF)
            if hdesk:
                u32.SetThreadDesktop(hdesk)
        except Exception:
            pass

    def release_all_keys(self):
        """Libera com 100% de garantia qualquer tecla ou modificador que possa ter ficado preso."""
        self._ensure_desktop()
        # Modificadores críticos do Windows que causam atalhos fantasmas
        MODIFIERS_TO_CLEAR = [
            0x11, 0xA2, 0xA3,  # VK_CONTROL, VK_LCONTROL, VK_RCONTROL
            0x12, 0xA4, 0xA5,  # VK_MENU, VK_LMENU, VK_RMENU (Alt / AltGr)
            0x10, 0xA0, 0xA1,  # VK_SHIFT, VK_LSHIFT, VK_RSHIFT
            0x5B, 0x5C         # VK_LWIN, VK_RWIN
        ]
        to_release = set(self.pressed_vks) | set(MODIFIERS_TO_CLEAR)
        for vk in to_release:
            try:
                self._send_raw_vk(vk, is_up=True)
            except Exception:
                pass
        self.pressed_vks.clear()

    def sync_modifiers(self, ctrl: bool = None, alt: bool = None, shift: bool = None, meta: bool = None):
        """Sincroniza o estado real dos modificadores do cliente, garantindo ativação e liberação perfeitas."""
        self._ensure_desktop()

        if ctrl is True:
            if 0x11 not in self.pressed_vks and not (u32.GetAsyncKeyState(0x11) & 0x8000):
                self._send_raw_vk(0x11, is_up=False)
                self.pressed_vks.add(0x11)
        elif ctrl is False:
            if 0x11 in self.pressed_vks or 0xA2 in self.pressed_vks or 0xA3 in self.pressed_vks or (u32.GetAsyncKeyState(0x11) & 0x8000):
                self._send_raw_vk(0x11, is_up=True)
                self._send_raw_vk(0xA2, is_up=True)
                self._send_raw_vk(0xA3, is_up=True)
                self.pressed_vks.discard(0x11)
                self.pressed_vks.discard(0xA2)
                self.pressed_vks.discard(0xA3)

        if alt is True:
            if 0x12 not in self.pressed_vks and not (u32.GetAsyncKeyState(0x12) & 0x8000):
                self._send_raw_vk(0x12, is_up=False)
                self.pressed_vks.add(0x12)
        elif alt is False:
            if 0x12 in self.pressed_vks or 0xA4 in self.pressed_vks or 0xA5 in self.pressed_vks or (u32.GetAsyncKeyState(0x12) & 0x8000):
                self._send_raw_vk(0x12, is_up=True)
                self._send_raw_vk(0xA4, is_up=True)
                self._send_raw_vk(0xA5, is_up=True)
                self.pressed_vks.discard(0x12)
                self.pressed_vks.discard(0xA4)
                self.pressed_vks.discard(0xA5)

        if shift is True:
            if 0x10 not in self.pressed_vks and not (u32.GetAsyncKeyState(0x10) & 0x8000):
                self._send_raw_vk(0x10, is_up=False)
                self.pressed_vks.add(0x10)
        elif shift is False:
            if 0x10 in self.pressed_vks or 0xA0 in self.pressed_vks or 0xA1 in self.pressed_vks or (u32.GetAsyncKeyState(0x10) & 0x8000):
                self._send_raw_vk(0x10, is_up=True)
                self._send_raw_vk(0xA0, is_up=True)
                self._send_raw_vk(0xA1, is_up=True)
                self.pressed_vks.discard(0x10)
                self.pressed_vks.discard(0xA0)
                self.pressed_vks.discard(0xA1)

        if meta is True:
            if 0x5B not in self.pressed_vks and not (u32.GetAsyncKeyState(0x5B) & 0x8000):
                self._send_raw_vk(0x5B, is_up=False)
                self.pressed_vks.add(0x5B)
        elif meta is False:
            if 0x5B in self.pressed_vks or 0x5C in self.pressed_vks or (u32.GetAsyncKeyState(0x5B) & 0x8000) or (u32.GetAsyncKeyState(0x5C) & 0x8000):
                self._send_raw_vk(0x5B, is_up=True)
                self._send_raw_vk(0x5C, is_up=True)
                self.pressed_vks.discard(0x5B)
                self.pressed_vks.discard(0x5C)

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

    def key_down(self, key: str, code: str = "", vk: int = 0, ctrl: bool = None, alt: bool = None, shift: bool = None, meta: bool = None):
        """Pressiona uma tecla com proteção total contra atalhos fantasmas e digitação perfeita."""
        # 1. Sincroniza estado de modificadores antes de tudo
        self.sync_modifiers(ctrl=ctrl, alt=alt, shift=shift, meta=meta)

        # 2. Ignora tecla Dead (acentos em composição no navegador)
        if key == "Dead":
            return

        is_shortcut_active = bool(ctrl or alt or meta)

        # 3. Teclas de controle que devem SEMPRE ser físicas:
        # Backspace, Enter, Tab, Escape, Delete, Setas, Home, End, PageUp, PageDown, F1-F12, Space
        control_keys = {
            "Backspace", "Enter", "Tab", "Escape", "Delete", "Insert",
            "ArrowLeft", "ArrowUp", "ArrowRight", "ArrowDown",
            "Home", "End", "PageUp", "PageDown",
            "F1", "F2", "F3", "F4", "F5", "F6", "F7", "F8", "F9", "F10", "F11", "F12",
            "CapsLock", "NumLock", "ScrollLock", "Space", " "
        }

        # 4. Digitação de texto normal (letras, acentos, cedilhas, números, pontuação)
        # Se nenhum modificador de comando (Ctrl/Alt/Win) estiver ativo, injeta direto via Unicode!
        # Isso elimina 100% dos problemas de teclas trocadas ABNT2/US, acentos errados e teclas pulando!
        if not is_shortcut_active and len(key) == 1 and key not in control_keys and vk == 0:
            self._send_unicode_char(key)
            return

        # 5. Tecla física (atalhos como Ctrl+C, Ctrl+V, ou teclas de controle do sistema)
        self._send_key_event(key, code, is_up=False, direct_vk=vk)

    def key_up(self, key: str, code: str = "", vk: int = 0, ctrl: bool = None, alt: bool = None, shift: bool = None, meta: bool = None):
        """Libera uma tecla física usando SendInput."""
        if key == "Dead":
            return

        is_shortcut_active = bool(ctrl or alt or meta)
        control_keys = {
            "Backspace", "Enter", "Tab", "Escape", "Delete", "Insert",
            "ArrowLeft", "ArrowUp", "ArrowRight", "ArrowDown",
            "Home", "End", "PageUp", "PageDown",
            "F1", "F2", "F3", "F4", "F5", "F6", "F7", "F8", "F9", "F10", "F11", "F12",
            "CapsLock", "NumLock", "ScrollLock", "Space", " "
        }

        # Se foi caractere Unicode digitado no key_down, o envio já completou (não há tecla presa para soltar)
        if not is_shortcut_active and len(key) == 1 and key not in control_keys and vk == 0:
            self.sync_modifiers(ctrl=ctrl, alt=alt, shift=shift, meta=meta)
            return

        self._send_key_event(key, code, is_up=True, direct_vk=vk)
        self.sync_modifiers(ctrl=ctrl, alt=alt, shift=shift, meta=meta)

    def _send_unicode_char(self, char_str: str):
        """Injeta caractere Unicode diretamente via SendInput (0ms lag, imune a layout do Host)."""
        self._ensure_desktop()
        for char in char_str:
            char_code = ord(char)

            inp = INPUT()
            inp.type = INPUT_KEYBOARD
            inp.u.ki.wVk = 0
            inp.u.ki.wScan = char_code
            inp.u.ki.dwFlags = KEYEVENTF_UNICODE
            inp.u.ki.time = 0
            inp.u.ki.dwExtraInfo = 0
            u32.SendInput(1, ctypes.byref(inp), ctypes.sizeof(INPUT))

            inp.u.ki.dwFlags = KEYEVENTF_UNICODE | KEYEVENTF_KEYUP
            u32.SendInput(1, ctypes.byref(inp), ctypes.sizeof(INPUT))

    def _send_key_event(self, key: str, code: str, is_up: bool, direct_vk: int = 0):
        self._ensure_desktop()
        vk = direct_vk if direct_vk > 0 else (CODE_TO_VK.get(code) or CODE_TO_VK.get(key))
        if not vk:
            if len(code) == 1 and code.isalpha():
                vk = ord(code.upper())
            elif len(key) == 1 and key.isalpha():
                vk = ord(key.upper())

        if vk:
            scan = u32.MapVirtualKeyW(vk, 0)
            flags = 0
            if is_up:
                flags |= KEYEVENTF_KEYUP
                self.pressed_vks.discard(vk)
            else:
                self.pressed_vks.add(vk)

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
            self._send_unicode_char(key)

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
            elif k in ("del", "delete"):
                vks.append(0x2E)
            elif k == "tab":
                vks.append(0x09)
            elif k == "esc":
                vks.append(0x1B)
            elif len(k) == 1:
                vks.append(ord(k.upper()))

        # Pressiona teclas em ordem
        for vk in vks:
            self._send_raw_vk(vk, is_up=False)
        time.sleep(0.04)
        # Libera teclas em ordem reversa
        for vk in reversed(vks):
            self._send_raw_vk(vk, is_up=True)
        # Liberação garantida de modificadores após atalho
        self.release_all_keys()

    def _send_raw_vk(self, vk: int, is_up: bool):
        scan = u32.MapVirtualKeyW(vk, 0)
        flags = 0
        if is_up:
            flags |= KEYEVENTF_KEYUP
            self.pressed_vks.discard(vk)
        else:
            self.pressed_vks.add(vk)

        if vk in EXTENDED_KEYS:
            flags |= KEYEVENTF_EXTENDEDKEY

        inp = INPUT()
        inp.type = INPUT_KEYBOARD
        inp.u.ki.wVk = vk
        inp.u.ki.wScan = scan
        inp.u.ki.dwFlags = flags
        u32.SendInput(1, ctypes.byref(inp), ctypes.sizeof(INPUT))
