"""
RPsec Link - Motor de Captura de Tela de Ultrabaixa Latência (Windows Win32 GDI / OpenCV).
Ativa Per-Monitor DPI Awareness para capturar a resolução nativa real (1080p sem cortes).
Cursor remoto desativado por padrão para eliminar efeito de rastro/duplicação com o cursor local.
"""

import ctypes
from ctypes import wintypes
import time
from typing import Tuple, Optional
import cv2
import numpy as np

# 1. Ativa DPI Awareness antes de qualquer chamada GDI/User32
try:
    ctypes.windll.shcore.SetProcessDpiAwareness(2)  # PROCESS_PER_MONITOR_DPI_AWARE
except Exception:
    try:
        ctypes.windll.user32.SetProcessDPIAware()
    except Exception:
        pass

# Win32 APIs
u32 = ctypes.windll.user32
gdi32 = ctypes.windll.gdi32

P = ctypes.c_void_p
I = ctypes.c_int
U = ctypes.c_uint32

# Tipagem estrita 64-bit para evitar corrupção de ponteiros HDC
u32.GetDesktopWindow.restype = P
u32.GetDC.restype = P
u32.GetDC.argtypes = [P]
u32.ReleaseDC.restype = I
u32.ReleaseDC.argtypes = [P, P]
u32.OpenInputDesktop.restype = P
u32.OpenInputDesktop.argtypes = [U, I, U]
u32.SetThreadDesktop.restype = I
u32.SetThreadDesktop.argtypes = [P]

class POINT(ctypes.Structure):
    _fields_ = [('x', ctypes.c_long), ('y', ctypes.c_long)]

class CURSORINFO(ctypes.Structure):
    _fields_ = [
        ('cbSize', wintypes.DWORD),
        ('flags', wintypes.DWORD),
        ('hCursor', P),
        ('ptScreenPos', POINT),
    ]

u32.GetCursorInfo.restype = wintypes.BOOL
u32.GetCursorInfo.argtypes = [ctypes.c_void_p]

u32.DrawIconEx.restype = wintypes.BOOL
u32.DrawIconEx.argtypes = [P, I, I, P, I, I, U, P, U]

gdi32.CreateCompatibleDC.restype = P
gdi32.CreateCompatibleDC.argtypes = [P]
gdi32.CreateCompatibleBitmap.restype = P
gdi32.CreateCompatibleBitmap.argtypes = [P, I, I]
gdi32.SelectObject.restype = P
gdi32.SelectObject.argtypes = [P, P]
gdi32.BitBlt.restype = I
gdi32.BitBlt.argtypes = [P, I, I, I, I, P, I, I, U]
gdi32.DeleteObject.restype = I
gdi32.DeleteObject.argtypes = [P]
gdi32.DeleteDC.restype = I
gdi32.DeleteDC.argtypes = [P]

class BITMAPINFOHEADER(ctypes.Structure):
    _fields_ = [
        ('biSize', wintypes.DWORD),
        ('biWidth', ctypes.c_long),
        ('biHeight', ctypes.c_long),
        ('biPlanes', ctypes.c_ushort),
        ('biBitCount', ctypes.c_ushort),
        ('biCompression', U),
        ('biSizeImage', U),
        ('biXPelsPerMeter', ctypes.c_long),
        ('biYPelsPerMeter', ctypes.c_long),
        ('biClrUsed', U),
        ('biClrImportant', U),
    ]

gdi32.GetDIBits.restype = I
gdi32.GetDIBits.argtypes = [P, P, wintypes.UINT, wintypes.UINT, P, ctypes.c_void_p, wintypes.UINT]

SRCCOPY = 0x00CC0020
DI_NORMAL = 0x0003


class ScreenCapturer:
    """Capturador Win32 nativo 100% DPI-aware de alta fidelidade."""

    def __init__(self, draw_cursor: bool = False):
        # draw_cursor = False evita o efeito de rastro fantasma no cliente
        self.draw_cursor = draw_cursor
        self._ensure_input_desktop()

        self.width = u32.GetSystemMetrics(0)
        self.height = u32.GetSystemMetrics(1)

        self.hwnd = u32.GetDesktopWindow()
        self.hdc_screen = u32.GetDC(self.hwnd)
        self.hdc_mem = gdi32.CreateCompatibleDC(self.hdc_screen)
        self.hbm = gdi32.CreateCompatibleBitmap(self.hdc_screen, self.width, self.height)
        self.old_bm = gdi32.SelectObject(self.hdc_mem, self.hbm)

        self.bi = BITMAPINFOHEADER()
        self.bi.biSize = ctypes.sizeof(BITMAPINFOHEADER)
        self.bi.biWidth = self.width
        self.bi.biHeight = -self.height  # Top-down DIB
        self.bi.biPlanes = 1
        self.bi.biBitCount = 32
        self.bi.biCompression = 0

        self.buffer = (ctypes.c_char * (self.width * self.height * 4))()

    def _ensure_input_desktop(self):
        """Garante que a thread tenha acesso ao desktop gráfico ativo."""
        try:
            hdesk = u32.OpenInputDesktop(0, False, 0x01FF)
            if hdesk:
                u32.SetThreadDesktop(hdesk)
        except Exception:
            pass

    def grab_frame_jpeg(self, quality: int = 65, scale: float = 1.0) -> bytes:
        """
        Captura o desktop físico inteiro em resolução nativa sem cortes.
        Comprime em JPEG de alta performance via OpenCV.
        """
        self._ensure_input_desktop()

        # Copia da tela física
        gdi32.BitBlt(self.hdc_mem, 0, 0, self.width, self.height, self.hdc_screen, 0, 0, SRCCOPY)

        # Opcional: Desenha cursor remoto apenas se expressamente configurado
        if self.draw_cursor:
            ci = CURSORINFO()
            ci.cbSize = ctypes.sizeof(CURSORINFO)
            if u32.GetCursorInfo(ctypes.byref(ci)) and (ci.flags & 1):
                u32.DrawIconEx(self.hdc_mem, ci.ptScreenPos.x, ci.ptScreenPos.y, ci.hCursor, 0, 0, 0, None, DI_NORMAL)

        # Extrai os bits de imagem
        gdi32.GetDIBits(self.hdc_mem, self.hbm, 0, self.height, self.buffer, ctypes.byref(self.bi), 0)

        # BGRA para BGR
        arr = np.frombuffer(self.buffer, dtype=np.uint8).reshape((self.height, self.width, 4))[:, :, :3]

        if scale < 0.99:
            new_w = int(self.width * scale)
            new_h = int(self.height * scale)
            arr = cv2.resize(arr, (new_w, new_h), interpolation=cv2.INTER_LINEAR)

        _, encoded = cv2.imencode('.jpg', arr, [cv2.IMWRITE_JPEG_QUALITY, quality])
        return encoded.tobytes()

    def close(self):
        try:
            gdi32.SelectObject(self.hdc_mem, self.old_bm)
            gdi32.DeleteObject(self.hbm)
            gdi32.DeleteDC(self.hdc_mem)
            u32.ReleaseDC(self.hwnd, self.hdc_screen)
        except Exception:
            pass

    def __del__(self):
        self.close()
