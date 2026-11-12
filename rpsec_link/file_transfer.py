"""
RPsec Link - Módulo de Transferência de Arquivos e Integração com Clipboard Win32.
Permite copiar e colar arquivos entre o Cliente e o Host remotamente com CF_HDROP.
"""

import os
import sys
import time
import ctypes
from ctypes import wintypes
from pathlib import Path
from typing import List, Dict, Any, Optional

u32 = ctypes.windll.user32
k32 = ctypes.windll.kernel32
s32 = ctypes.windll.shell32

P = ctypes.c_void_p

# Tipagem estrita de 64-bits para APIs de Memória e Clipboard Win32
k32.GlobalAlloc.restype = P
k32.GlobalAlloc.argtypes = [wintypes.UINT, ctypes.c_size_t]

k32.GlobalLock.restype = P
k32.GlobalLock.argtypes = [P]

k32.GlobalUnlock.restype = wintypes.BOOL
k32.GlobalUnlock.argtypes = [P]

k32.GlobalFree.restype = P
k32.GlobalFree.argtypes = [P]

u32.OpenClipboard.restype = wintypes.BOOL
u32.OpenClipboard.argtypes = [P]

u32.CloseClipboard.restype = wintypes.BOOL
u32.CloseClipboard.argtypes = []

u32.EmptyClipboard.restype = wintypes.BOOL
u32.EmptyClipboard.argtypes = []

u32.SetClipboardData.restype = P
u32.SetClipboardData.argtypes = [wintypes.UINT, P]

u32.GetClipboardData.restype = P
u32.GetClipboardData.argtypes = [wintypes.UINT]

s32.DragQueryFileW.restype = wintypes.UINT
s32.DragQueryFileW.argtypes = [P, wintypes.UINT, wintypes.LPWSTR, wintypes.UINT]

CF_HDROP = 15
CF_UNICODETEXT = 13
GHND = 0x0042

class POINT(ctypes.Structure):
    _fields_ = [("x", wintypes.LONG), ("y", wintypes.LONG)]

class DROPFILES(ctypes.Structure):
    _fields_ = [
        ("pFiles", wintypes.DWORD),
        ("pt", POINT),
        ("fNC", wintypes.BOOL),
        ("fWide", wintypes.BOOL),
    ]


def get_default_transfer_dir() -> Path:
    """Retorna o diretório padrão onde arquivos recebidos são salvos no Host."""
    path = Path.home() / "Downloads" / "RPsec_Transfer"
    path.mkdir(parents=True, exist_ok=True)
    return path


def get_common_dirs() -> Dict[str, str]:
    """Retorna atalhos rápidos para as pastas principais do usuário no Host."""
    transfer_dir = get_default_transfer_dir()
    desktop = Path.home() / "Desktop"
    downloads = Path.home() / "Downloads"
    docs = Path.home() / "Documents"

    dirs = {
        "RPsec Transfer": str(transfer_dir),
        "Área de Trabalho": str(desktop) if desktop.exists() else str(transfer_dir),
        "Downloads": str(downloads) if downloads.exists() else str(transfer_dir),
        "Documentos": str(docs) if docs.exists() else str(transfer_dir),
    }
    return dirs


def format_size(size_bytes: int) -> str:
    """Formata tamanho de bytes para exibição amigável (B, KB, MB, GB)."""
    if size_bytes < 1024:
        return f"{size_bytes} B"
    elif size_bytes < 1024 * 1024:
        return f"{size_bytes / 1024:.1f} KB"
    elif size_bytes < 1024 * 1024 * 1024:
        return f"{size_bytes / (1024 * 1024):.1f} MB"
    else:
        return f"{size_bytes / (1024 * 1024 * 1024):.2f} GB"


def set_clipboard_text(text: str) -> bool:
    """
    Coloca texto puro na Área de Transferência do Windows como CF_UNICODETEXT.
    Permite sincronização instantânea de Ctrl+V de texto entre Cliente e Host.
    """
    if not text:
        return False

    data = (text + "\x00").encode("utf-16le")
    h_mem = k32.GlobalAlloc(GHND, len(data))
    if not h_mem:
        return False

    ptr = k32.GlobalLock(h_mem)
    if not ptr:
        k32.GlobalFree(h_mem)
        return False

    ctypes.memmove(ptr, data, len(data))
    k32.GlobalUnlock(h_mem)

    for _ in range(5):
        if u32.OpenClipboard(None):
            u32.EmptyClipboard()
            res = u32.SetClipboardData(CF_UNICODETEXT, h_mem)
            u32.CloseClipboard()
            return bool(res)
        time.sleep(0.02)

    k32.GlobalFree(h_mem)
    return False


def get_clipboard_text() -> str:
    """Retorna o texto atualmente presente na Área de Transferência do Windows (se houver)."""
    for _ in range(5):
        if u32.OpenClipboard(None):
            h = u32.GetClipboardData(CF_UNICODETEXT)
            if not h:
                u32.CloseClipboard()
                return ""
            ptr = k32.GlobalLock(h)
            val = ctypes.wstring_at(ptr) if ptr else ""
            if ptr:
                k32.GlobalUnlock(h)
            u32.CloseClipboard()
            return val
        time.sleep(0.02)
    return ""


def set_clipboard_files(file_paths: List[str]) -> bool:
    """
    Coloca a lista de arquivos na Área de Transferência (Clipboard) do Windows do Host como CF_HDROP.
    Isso permite que o usuário simplesmente pressione Ctrl+V no Windows Explorer do Host
    para colar o arquivo em qualquer pasta aberta!
    """
    if not file_paths:
        return False

    valid_paths = [os.path.abspath(p) for p in file_paths if os.path.exists(p)]
    if not valid_paths:
        return False

    # Buffer em UTF-16LE com caminhos terminados em nulo e duplo nulo no final
    buffer = b""
    for p in valid_paths:
        buffer += p.encode("utf-16le") + b"\x00\x00"
    buffer += b"\x00\x00"

    df = DROPFILES()
    df.pFiles = ctypes.sizeof(DROPFILES)
    df.pt.x = 0
    df.pt.y = 0
    df.fNC = False
    df.fWide = True  # Unicode wchar_t

    total_size = ctypes.sizeof(DROPFILES) + len(buffer)
    h_mem = k32.GlobalAlloc(GHND, total_size)
    if not h_mem:
        return False

    ptr = k32.GlobalLock(h_mem)
    if not ptr:
        k32.GlobalFree(h_mem)
        return False

    ctypes.memmove(ptr, ctypes.byref(df), ctypes.sizeof(DROPFILES))
    ctypes.memmove(ptr + ctypes.sizeof(DROPFILES), buffer, len(buffer))
    k32.GlobalUnlock(h_mem)

    # Tenta abrir o clipboard até 5 vezes com pequeno intervalo
    for _ in range(5):
        if u32.OpenClipboard(None):
            u32.EmptyClipboard()
            res = u32.SetClipboardData(CF_HDROP, h_mem)
            u32.CloseClipboard()
            return bool(res)
        time.sleep(0.02)

    k32.GlobalFree(h_mem)
    return False


def get_clipboard_files() -> List[Dict[str, Any]]:
    """
    Lê os arquivos atualmente copiados na Área de Transferência do Host (se houver).
    Permite que o cliente baixe com 1 clique o arquivo que copiou com Ctrl+C no Host.
    """
    opened = False
    for _ in range(3):
        if u32.OpenClipboard(None):
            opened = True
            break
        time.sleep(0.01)

    if not opened:
        return []

    try:
        h_drop = u32.GetClipboardData(CF_HDROP)
        if not h_drop:
            return []

        count = s32.DragQueryFileW(h_drop, 0xFFFFFFFF, None, 0)
        files = []
        buf = ctypes.create_unicode_buffer(1024)

        for i in range(count):
            s32.DragQueryFileW(h_drop, i, buf, 1024)
            path_str = buf.value
            if path_str and os.path.exists(path_str):
                try:
                    stat = os.stat(path_str)
                    files.append({
                        "name": os.path.basename(path_str),
                        "path": path_str,
                        "is_dir": os.path.isdir(path_str),
                        "size": stat.st_size,
                        "size_formatted": format_size(stat.st_size),
                        "modified": time.strftime("%d/%m/%Y %H:%M", time.localtime(stat.st_mtime))
                    })
                except Exception:
                    files.append({
                        "name": os.path.basename(path_str),
                        "path": path_str,
                        "is_dir": os.path.isdir(path_str),
                        "size": 0,
                        "size_formatted": "--",
                        "modified": "--"
                    })
        return files
    finally:
        u32.CloseClipboard()


def list_host_directory(target_dir: Optional[str] = None) -> Dict[str, Any]:
    """
    Lista arquivos e diretórios de uma pasta no Host.
    Se nenhum caminho for informado, lista a pasta RPsec_Transfer.
    """
    if not target_dir or not os.path.exists(target_dir):
        base_path = get_default_transfer_dir()
    else:
        base_path = Path(target_dir).resolve()

    items = []
    parent_path = str(base_path.parent) if base_path.parent != base_path else None

    try:
        entries = sorted(os.scandir(base_path), key=lambda e: (not e.is_dir(), e.name.lower()))
        for entry in entries:
            try:
                stat = entry.stat()
                is_dir = entry.is_dir()
                items.append({
                    "name": entry.name,
                    "path": str(Path(entry.path).resolve()),
                    "is_dir": is_dir,
                    "size": stat.st_size if not is_dir else 0,
                    "size_formatted": format_size(stat.st_size) if not is_dir else "Pasta",
                    "modified": time.strftime("%d/%m/%Y %H:%M", time.localtime(stat.st_mtime)),
                    "ext": Path(entry.name).suffix.lower() if not is_dir else ""
                })
            except (PermissionError, FileNotFoundError):
                continue
    except PermissionError:
        return {
            "current_path": str(base_path),
            "parent_path": parent_path,
            "items": [],
            "error": "Permissão negada ao acessar este diretório."
        }
    except Exception as e:
        return {
            "current_path": str(base_path),
            "parent_path": parent_path,
            "items": [],
            "error": str(e)
        }

    return {
        "current_path": str(base_path),
        "parent_path": parent_path,
        "items": items,
        "shortcuts": get_common_dirs(),
        "error": None
    }


def save_uploaded_file(
    filename: str,
    file_bytes: bytes,
    target_dir: Optional[str] = None,
    copy_to_clipboard: bool = True
) -> Dict[str, Any]:
    """
    Salva arquivo enviado pelo cliente e opcionalmente o copia para a Área de Transferência (Ctrl+V) do Host.
    """
    safe_filename = Path(filename).name
    if not safe_filename:
        safe_filename = f"transfer_{int(time.time())}.bin"

    if target_dir and os.path.exists(target_dir) and os.path.isdir(target_dir):
        dest_folder = Path(target_dir).resolve()
    else:
        dest_folder = get_default_transfer_dir()

    dest_path = dest_folder / safe_filename
    
    # Se já existir arquivo com mesmo nome, adiciona timestamp para não sobrescrever acidentalmente
    if dest_path.exists():
        stem = dest_path.stem
        suffix = dest_path.suffix
        timestamp = time.strftime("%Y%m%d_%H%M%S")
        dest_path = dest_folder / f"{stem}_{timestamp}{suffix}"

    dest_path.write_bytes(file_bytes)

    clipboard_ok = False
    if copy_to_clipboard:
        clipboard_ok = set_clipboard_files([str(dest_path)])

    stat = dest_path.stat()
    return {
        "success": True,
        "filename": dest_path.name,
        "path": str(dest_path),
        "size": stat.st_size,
        "size_formatted": format_size(stat.st_size),
        "folder": str(dest_folder),
        "in_clipboard": clipboard_ok
    }


def open_folder_in_host_explorer(folder_path: Optional[str] = None) -> bool:
    """Abre a pasta especificada no Windows Explorer do Host."""
    target = folder_path or str(get_default_transfer_dir())
    if not os.path.exists(target):
        target = str(get_default_transfer_dir())

    try:
        os.startfile(target)
        return True
    except Exception:
        return False
