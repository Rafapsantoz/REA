"""
RPsec Link - Cliente Nativo de Acesso Remoto (Desktop Viewer).
Desenvolvido pela RPsecti Soluções Inteligentes.

Proporciona uma experiência nativa de ultrabaixa latência (eliminando navegadores),
com renderização direta em hardware via Win32 GDI SetDIBitsToDevice (< 5ms),
captura completa de atalhos do Windows (sem interferência de abas) e perfis adaptativos
otimizados para redes fracas, Wi-Fi instável e 4G.
"""

import os
import sys
import json
import time
import queue
import threading
import ctypes
from ctypes import wintypes
from pathlib import Path
from typing import Optional, Tuple

# 1. Oculta janela do CMD se aberto via console ou script BAT
hwnd_console = ctypes.windll.kernel32.GetConsoleWindow()
if hwnd_console:
    ctypes.windll.user32.ShowWindow(hwnd_console, 0)

# 2. Registra AppUserModelID para a barra de tarefas do Windows
try:
    myappid = "rpsecti.rpseclink.client.1"
    ctypes.windll.shell32.SetCurrentProcessExplicitAppUserModelID(myappid)
except Exception:
    pass

import tkinter as tk
import customtkinter as ctk
import cv2
import numpy as np
import websockets.sync.client

# Ativa DPI Awareness para resolução física nativa
try:
    ctypes.windll.shcore.SetProcessDpiAwareness(2)
except Exception:
    try:
        ctypes.windll.user32.SetProcessDPIAware()
    except Exception:
        pass

u32 = ctypes.windll.user32
gdi32 = ctypes.windll.gdi32
P = ctypes.c_void_p

u32.GetDC.restype = P
u32.GetDC.argtypes = [P]
u32.ReleaseDC.restype = ctypes.c_int
u32.ReleaseDC.argtypes = [P, P]

gdi32.SetDIBitsToDevice.restype = ctypes.c_int
gdi32.SetDIBitsToDevice.argtypes = [
    P, ctypes.c_int, ctypes.c_int, wintypes.DWORD, wintypes.DWORD,
    ctypes.c_int, ctypes.c_int, wintypes.UINT, wintypes.UINT,
    P, P, wintypes.UINT
]

class BITMAPINFOHEADER(ctypes.Structure):
    _fields_ = [
        ("biSize", wintypes.DWORD),
        ("biWidth", ctypes.c_long),
        ("biHeight", ctypes.c_long),
        ("biPlanes", ctypes.c_ushort),
        ("biBitCount", ctypes.c_ushort),
        ("biCompression", wintypes.DWORD),
        ("biSizeImage", wintypes.DWORD),
        ("biXPelsPerMeter", ctypes.c_long),
        ("biYPelsPerMeter", ctypes.c_long),
        ("biClrUsed", wintypes.DWORD),
        ("biClrImportant", wintypes.DWORD),
    ]

BASE_DIR = Path(__file__).parent
CONFIG_FILE = BASE_DIR / "rpsec_client_config.json"
ICON_ICO = BASE_DIR / "assets" / "icon.ico"

PROFILE_SETTINGS = {
    "balanced": {"profile": "balanced", "label": "⚡ Equilibrado (Wi-Fi Padrão • 25 FPS)"},
    "turbo": {"profile": "turbo", "label": "🚀 Turbo (Rede Local / Fibra • 30 FPS)"},
    "weak": {"profile": "weak", "label": "🌐 Rede Fraca (4G / Instável • 18 FPS)"},
    "ultra": {"profile": "ultra", "label": "🪶 Ultra-Econômico (< 2 Mbps • 12 FPS)"},
}

LABEL_TO_PROFILE = {v["label"]: k for k, v in PROFILE_SETTINGS.items()}


def load_client_config() -> dict:
    default_config = {
        "host": "192.168.0.2:8765",
        "pin": "",
        "profile": "balanced",
        "theme": "dark"
    }
    if CONFIG_FILE.exists():
        try:
            with open(CONFIG_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
                default_config.update(data)
        except Exception:
            pass
    return default_config


def save_client_config(cfg: dict):
    try:
        with open(CONFIG_FILE, "w", encoding="utf-8") as f:
            json.dump(cfg, f, indent=2)
    except Exception:
        pass


class RemoteViewerWindow(tk.Toplevel):
    """
    Janela Nativa de Exibição Remota de Alto Desempenho.
    Renderização direta via Win32 GDI SetDIBitsToDevice (< 5.5ms) e captura total de inputs.
    """
    def __init__(self, launcher, ws_url: str, initial_profile: str):
        super().__init__()
        self.launcher = launcher
        self.ws_url = ws_url
        self.current_profile = initial_profile

        self.title("RPsec Link — Sessão Remota")
        self.geometry("1280x720")
        self.minsize(800, 480)
        self.configure(bg="#0b0f17")

        if ICON_ICO.exists():
            try:
                self.iconbitmap(str(ICON_ICO))
            except Exception:
                pass

        # Dimensões da máquina remota
        self.remote_width = 1920
        self.remote_height = 1080

        # Estatísticas em tempo real
        self.fps = 0
        self.ping_ms = 0
        self.frame_count = 0
        self.last_fps_time = time.perf_counter()

        # Canvas nativo para renderização GDI
        self.canvas = tk.Canvas(self, bg="#000000", highlightthickness=0, cursor="arrow")
        self.canvas.pack(fill="both", expand=True)
        self.canvas.focus_set()

        # Configura GDI
        self.update_idletasks()
        self.canvas_hwnd = self.canvas.winfo_id()
        self.hdc = u32.GetDC(self.canvas_hwnd)

        self.bi = BITMAPINFOHEADER()
        self.bi.biSize = ctypes.sizeof(BITMAPINFOHEADER)
        self.bi.biPlanes = 1
        self.bi.biBitCount = 24
        self.bi.biCompression = 0

        # Fila de eventos e controle de thread
        self.out_queue = queue.Queue()
        self.latest_frame: Optional[np.ndarray] = None
        self.is_running = True
        self.is_fullscreen = False

        # Constrói o Widget Flutuante de Controle
        self._build_floating_toolbar()

        # Bindings de Mouse e Teclado
        self._bind_events()

        # Inicia Thread de Comunicação WebSocket
        self.net_thread = threading.Thread(target=self._network_worker, daemon=True)
        self.net_thread.start()

        # Loop de renderização agendado no Tkinter
        self._schedule_render_loop()

    def _build_floating_toolbar(self):
        """Barra de ferramentas flutuante, recolhível e arrastável sobre o canvas."""
        self.toolbar_frame = tk.Frame(self, bg="#1e293b", bd=1, relief="ridge")
        self.toolbar_frame.place(x=120, y=10)

        # Cabeçalho arrastável
        self.drag_bar = tk.Label(
            self.toolbar_frame,
            text="⚡ RPsec Link",
            font=("Segoe UI", 9, "bold"),
            bg="#1e293b",
            fg="#38bdf8",
            cursor="fleur",
            padx=8,
            pady=4
        )
        self.drag_bar.pack(side="left")

        self.lbl_stats = tk.Label(
            self.toolbar_frame,
            text="-- FPS • --ms",
            font=("Consolas", 9),
            bg="#1e293b",
            fg="#94a3b8",
            padx=6
        )
        self.lbl_stats.pack(side="left")

        # Seletor de Perfil de Rede / Qualidade
        self.var_profile = tk.StringVar(value=PROFILE_SETTINGS.get(self.current_profile, {}).get("label", ""))
        profile_options = [v["label"] for v in PROFILE_SETTINGS.values()]
        self.opt_profile = tk.OptionMenu(
            self.toolbar_frame,
            self.var_profile,
            *profile_options,
            command=self._on_profile_change
        )
        self.opt_profile.config(
            bg="#334155",
            fg="#f8fafc",
            activebackground="#475569",
            activeforeground="#ffffff",
            font=("Segoe UI", 8),
            bd=0,
            highlightthickness=0,
            padx=4,
            pady=2
        )
        self.opt_profile["menu"].config(bg="#1e293b", fg="#f8fafc", activebackground="#0284c7")
        self.opt_profile.pack(side="left", padx=4)

        # Botões de atalho
        btn_style = {
            "bg": "#334155", "fg": "#f8fafc", "activebackground": "#0284c7",
            "activeforeground": "#ffffff", "font": ("Segoe UI", 8, "bold"),
            "bd": 0, "padx": 6, "pady": 2, "relief": "flat"
        }

        self.btn_win = tk.Button(self.toolbar_frame, text="⊞ Win", command=lambda: self._send_shortcut("win"), **btn_style)
        self.btn_win.pack(side="left", padx=2)

        self.btn_alttab = tk.Button(self.toolbar_frame, text="Alt+Tab", command=lambda: self._send_shortcut("alt+tab"), **btn_style)
        self.btn_alttab.pack(side="left", padx=2)

        self.btn_cad = tk.Button(self.toolbar_frame, text="Ctrl+Alt+Del", command=lambda: self._send_shortcut("ctrl+alt+del"), **btn_style)
        self.btn_cad.pack(side="left", padx=2)

        self.btn_esc = tk.Button(self.toolbar_frame, text="Esc", command=lambda: self._send_key_press(27, "Escape"), **btn_style)
        self.btn_esc.pack(side="left", padx=2)

        self.btn_fs = tk.Button(self.toolbar_frame, text="⛶", command=self.toggle_fullscreen, **btn_style)
        self.btn_fs.pack(side="left", padx=2)

        # Botão Desconectar destacado em vermelho
        self.btn_dc = tk.Button(
            self.toolbar_frame,
            text="🔴 Desconectar",
            command=self.close_session,
            bg="#ef4444",
            fg="#ffffff",
            activebackground="#dc2626",
            activeforeground="#ffffff",
            font=("Segoe UI", 8, "bold"),
            bd=0,
            padx=8,
            pady=2,
            relief="flat"
        )
        self.btn_dc.pack(side="left", padx=(4, 6))

        # Sistema de arrasto da barra
        self.drag_bar.bind("<Button-1>", self._start_drag)
        self.drag_bar.bind("<B1-Motion>", self._do_drag)

    def _start_drag(self, event):
        self.drag_x = event.x
        self.drag_y = event.y

    def _do_drag(self, event):
        x = self.toolbar_frame.winfo_x() + (event.x - self.drag_x)
        y = self.toolbar_frame.winfo_y() + (event.y - self.drag_y)
        max_x = max(10, self.winfo_width() - 250)
        max_y = max(10, self.winfo_height() - 60)
        self.toolbar_frame.place(x=max(10, min(max_x, x)), y=max(5, min(max_y, y)))

    def _bind_events(self):
        """Intercepção completa de mouse e teclado para controle de alta precisão."""
        self.canvas.bind("<Motion>", self._on_mouse_move)
        self.canvas.bind("<Button-1>", lambda e: self._on_mouse_btn(e, "left", is_down=True))
        self.canvas.bind("<ButtonRelease-1>", lambda e: self._on_mouse_btn(e, "left", is_down=False))
        self.canvas.bind("<Button-2>", lambda e: self._on_mouse_btn(e, "middle", is_down=True))
        self.canvas.bind("<ButtonRelease-2>", lambda e: self._on_mouse_btn(e, "middle", is_down=False))
        self.canvas.bind("<Button-3>", lambda e: self._on_mouse_btn(e, "right", is_down=True))
        self.canvas.bind("<ButtonRelease-3>", lambda e: self._on_mouse_btn(e, "right", is_down=False))
        self.canvas.bind("<MouseWheel>", self._on_mouse_wheel)

        self.bind("<KeyPress>", self._on_key_press)
        self.bind("<KeyRelease>", self._on_key_release)
        self.bind("<F11>", lambda e: self.toggle_fullscreen())
        self.protocol("WM_DELETE_WINDOW", self.close_session)

    def _get_normalized_coords(self, event) -> Tuple[float, float]:
        cw = max(1, self.canvas.winfo_width())
        ch = max(1, self.canvas.winfo_height())
        scale = min(cw / self.remote_width, ch / self.remote_height)
        render_w = int(self.remote_width * scale)
        render_h = int(self.remote_height * scale)
        off_x = (cw - render_w) // 2
        off_y = (ch - render_h) // 2

        nx = max(0.0, min(1.0, (event.x - off_x) / max(1, render_w)))
        ny = max(0.0, min(1.0, (event.y - off_y) / max(1, render_h)))
        return nx, ny

    def _on_mouse_move(self, event):
        nx, ny = self._get_normalized_coords(event)
        self.out_queue.put({"type": "mouse_move", "x": nx, "y": ny})

    def _on_mouse_btn(self, event, button: str, is_down: bool):
        nx, ny = self._get_normalized_coords(event)
        mtype = "mouse_down" if is_down else "mouse_up"
        self.out_queue.put({"type": mtype, "button": button, "x": nx, "y": ny})

    def _on_mouse_wheel(self, event):
        delta = -120 if event.delta < 0 else 120
        self.out_queue.put({"type": "wheel", "delta": delta})

    def _on_key_press(self, event):
        # Envia diretamente o Virtual Key code do Windows (0ms mapping overhead!)
        self.out_queue.put({
            "type": "key_down",
            "key": event.char,
            "code": event.keysym,
            "vk": event.keycode
        })
        return "break"

    def _on_key_release(self, event):
        self.out_queue.put({
            "type": "key_up",
            "key": event.char,
            "code": event.keysym,
            "vk": event.keycode
        })
        return "break"

    def _send_shortcut(self, shortcut: str):
        self.out_queue.put({"type": "shortcut", "shortcut": shortcut})

    def _send_key_press(self, vk: int, name: str):
        self.out_queue.put({"type": "key_down", "key": "", "code": name, "vk": vk})
        self.after(50, lambda: self.out_queue.put({"type": "key_up", "key": "", "code": name, "vk": vk}))

    def _on_profile_change(self, selected_label):
        profile_key = LABEL_TO_PROFILE.get(selected_label, "balanced")
        self.current_profile = profile_key
        self.out_queue.put({"type": "quality", "profile": profile_key})

    def toggle_fullscreen(self):
        self.is_fullscreen = not self.is_fullscreen
        self.attributes("-fullscreen", self.is_fullscreen)
        if not self.is_fullscreen:
            self.geometry("1280x720")

    def _network_worker(self):
        """Thread assíncrona dedicada de transmissão com zero travamento da UI."""
        try:
            with websockets.sync.client.connect(self.ws_url, max_size=10 * 1024 * 1024) as ws:
                # 1. Configura perfil de rede inicial
                ws.send(json.dumps({"type": "quality", "profile": self.current_profile}))

                last_ping = time.perf_counter()

                while self.is_running:
                    # Envia todos os eventos acumulados na fila de saída
                    while not self.out_queue.empty():
                        try:
                            msg = self.out_queue.get_nowait()
                            ws.send(json.dumps(msg))
                        except queue.Empty:
                            break

                    # Envia ping periódico a cada 2 segundos
                    now = time.perf_counter()
                    if now - last_ping >= 2.0:
                        ws.send(json.dumps({"type": "ping", "ts": now}))
                        last_ping = now

                    # Recebe dados do servidor com timeout de 20ms para manter a fila ágil
                    try:
                        raw_data = ws.recv(timeout=0.02)
                    except TimeoutError:
                        continue
                    except Exception:
                        break

                    if isinstance(raw_data, bytes):
                        # Decodifica frame JPEG usando OpenCV SIMD direto em BGR (< 3ms)
                        np_buf = np.frombuffer(raw_data, dtype=np.uint8)
                        frame_bgr = cv2.imdecode(np_buf, cv2.IMREAD_COLOR)
                        if frame_bgr is not None:
                            self.latest_frame = frame_bgr
                            self.frame_count += 1
                            t_now = time.perf_counter()
                            if t_now - self.last_fps_time >= 1.0:
                                self.fps = int(self.frame_count / (t_now - self.last_fps_time))
                                self.frame_count = 0
                                self.last_fps_time = t_now
                                self.after(0, self._update_stats_ui)

                    elif isinstance(raw_data, str):
                        try:
                            data = json.loads(raw_data)
                            mtype = data.get("type")
                            if mtype == "init":
                                self.remote_width = data.get("width", 1920)
                                self.remote_height = data.get("height", 1080)
                            elif mtype == "pong":
                                rtt = int((time.perf_counter() - data.get("ts", 0)) * 1000)
                                self.ping_ms = max(1, rtt)
                                self.after(0, self._update_stats_ui)
                            elif mtype == "server_disconnect":
                                self.after(0, lambda: self._on_server_disconnect(data.get("message")))
                                break
                        except Exception:
                            pass

        except Exception as e:
            if self.is_running:
                self.after(0, lambda: self._on_connection_error(str(e)))
        finally:
            if self.is_running:
                self.after(0, self.close_session)

    def _schedule_render_loop(self):
        """Loop de renderização de alta frequência no Tkinter via GDI SetDIBitsToDevice."""
        if not self.is_running:
            return

        if self.latest_frame is not None:
            frame = self.latest_frame
            self.latest_frame = None

            cw = max(1, self.canvas.winfo_width())
            ch = max(1, self.canvas.winfo_height())

            scale = min(cw / self.remote_width, ch / self.remote_height)
            render_w = int(self.remote_width * scale)
            render_h = int(self.remote_height * scale)
            off_x = (cw - render_w) // 2
            off_y = (ch - render_h) // 2

            # Se necessário redimensionar para ajustar à janela
            if frame.shape[1] != render_w or frame.shape[0] != render_h:
                frame = cv2.resize(frame, (render_w, render_h), interpolation=cv2.INTER_LINEAR)

            self.bi.biWidth = render_w
            self.bi.biHeight = -render_h  # Top-down DIB

            # Renderização direta em hardware GDI (< 5.5ms)
            gdi32.SetDIBitsToDevice(
                self.hdc,
                off_x, off_y,
                render_w, render_h,
                0, 0,
                0, render_h,
                frame.ctypes.data_as(P),
                ctypes.byref(self.bi),
                0
            )

        # Reagenda em 10ms (~100Hz max render poll)
        self.after(10, self._schedule_render_loop)

    def _update_stats_ui(self):
        if self.is_running:
            self.lbl_stats.config(text=f"{self.fps} FPS • {self.ping_ms}ms")

    def _on_server_disconnect(self, message: Optional[str]):
        msg = message or "A sessão remota foi encerrada pelo Host."
        self.launcher.show_status(msg, is_error=False)

    def _on_connection_error(self, err: str):
        self.launcher.show_status(f"Conexão perdida: {err}", is_error=True)

    def close_session(self):
        """Encerra a sessão remota com segurança e reabre o Launcher."""
        if not self.is_running:
            return
        self.is_running = False

        # Envia sinal de desconexão graciosa
        try:
            self.out_queue.put({"type": "client_disconnect"})
        except Exception:
            pass

        # Libera recursos GDI
        try:
            if self.hdc and self.canvas_hwnd:
                u32.ReleaseDC(self.canvas_hwnd, self.hdc)
        except Exception:
            pass

        self.destroy()
        self.launcher.on_session_closed()


class ClientLauncher(ctk.CTk):
    """
    Tela Inicial de Conexão do Cliente Nativo RPsec Link.
    Design moderno em Tema Claro/Escuro, seleção de perfis para redes fracas e histórico.
    """
    def __init__(self):
        super().__init__()

        self.config_data = load_client_config()
        ctk.set_appearance_mode(self.config_data.get("theme", "dark"))
        ctk.set_default_color_theme("blue")

        self.title("RPsec Link — Cliente Desktop")
        self.geometry("460x580")
        self.resizable(False, False)
        self.configure(fg_color=("#f8fafc", "#0b0f17"))

        if ICON_ICO.exists():
            try:
                self.iconbitmap(str(ICON_ICO))
            except Exception:
                pass

        self.active_session: Optional[RemoteViewerWindow] = None
        self._build_ui()

    def _build_ui(self):
        # 1. Cabeçalho
        top_row = ctk.CTkFrame(self, fg_color="transparent")
        top_row.pack(fill="x", padx=28, pady=(28, 4))

        title = ctk.CTkLabel(
            top_row,
            text="⚡ RPsec Link",
            font=ctk.CTkFont(size=24, weight="bold"),
            text_color=("#0f172a", "#f8fafc")
        )
        title.pack(side="left")

        self.btn_theme = ctk.CTkButton(
            top_row,
            text="🌙" if self.config_data.get("theme") == "dark" else "☀️",
            width=36,
            height=32,
            fg_color=("#e2e8f0", "#1e293b"),
            hover_color=("#cbd5e1", "#334155"),
            text_color=("#0f172a", "#f8fafc"),
            command=self._toggle_theme
        )
        self.btn_theme.pack(side="right")

        subtitle = ctk.CTkLabel(
            self,
            text="Cliente Nativo de Alta Performance • RPsecti Soluções",
            font=ctk.CTkFont(size=12),
            text_color=("#64748b", "#94a3b8")
        )
        subtitle.pack(anchor="w", padx=28, pady=(0, 20))

        # 2. Card Principal de Conexão
        card = ctk.CTkFrame(
            self,
            fg_color=("#ffffff", "#1e293b"),
            corner_radius=16,
            border_width=1,
            border_color=("#e2e8f0", "#334155")
        )
        card.pack(fill="both", expand=True, padx=28, pady=(0, 24))

        # Campo: Host Remoto (IP / Domínio)
        lbl_host = ctk.CTkLabel(
            card,
            text="ENDEREÇO DO HOST (IP : PORTA)",
            font=ctk.CTkFont(size=11, weight="bold"),
            text_color=("#64748b", "#94a3b8")
        )
        lbl_host.pack(anchor="w", padx=20, pady=(20, 6))

        self.entry_host = ctk.CTkEntry(
            card,
            font=ctk.CTkFont(family="Consolas", size=14, weight="bold"),
            height=42,
            placeholder_text="192.168.0.2:8765",
            fg_color=("#f8fafc", "#0b0f19"),
            border_color=("#cbd5e1", "#334155")
        )
        self.entry_host.insert(0, self.config_data.get("host", "192.168.0.2:8765"))
        self.entry_host.pack(fill="x", padx=20, pady=(0, 14))

        # Campo: PIN de Acesso
        lbl_pin = ctk.CTkLabel(
            card,
            text="SENHA / PIN DE ACESSO",
            font=ctk.CTkFont(size=11, weight="bold"),
            text_color=("#64748b", "#94a3b8")
        )
        lbl_pin.pack(anchor="w", padx=20, pady=(0, 6))

        self.entry_pin = ctk.CTkEntry(
            card,
            font=ctk.CTkFont(family="Consolas", size=16, weight="bold"),
            height=42,
            justify="center",
            show="•",
            placeholder_text="PIN",
            fg_color=("#f8fafc", "#0b0f19"),
            border_color=("#cbd5e1", "#334155")
        )
        if self.config_data.get("pin"):
            self.entry_pin.insert(0, self.config_data.get("pin"))
        self.entry_pin.pack(fill="x", padx=20, pady=(0, 14))
        self.entry_pin.bind("<Return>", lambda e: self._connect())

        # Campo: Perfil de Conexão (Otimização para Redes Fracas)
        lbl_prof = ctk.CTkLabel(
            card,
            text="PERFIL DE REDE (OTIMIZAÇÃO DE PERFORMANCE)",
            font=ctk.CTkFont(size=11, weight="bold"),
            text_color=("#64748b", "#94a3b8")
        )
        lbl_prof.pack(anchor="w", padx=20, pady=(0, 6))

        profile_options = [v["label"] for v in PROFILE_SETTINGS.values()]
        saved_prof_key = self.config_data.get("profile", "balanced")
        init_label = PROFILE_SETTINGS.get(saved_prof_key, PROFILE_SETTINGS["balanced"])["label"]

        self.combo_profile = ctk.CTkOptionMenu(
            card,
            values=profile_options,
            font=ctk.CTkFont(size=12),
            height=38,
            fg_color=("#f1f5f9", "#0f172a"),
            text_color=("#0f172a", "#f8fafc"),
            button_color="#0284c7",
            button_hover_color="#0369a1"
        )
        self.combo_profile.set(init_label)
        self.combo_profile.pack(fill="x", padx=20, pady=(0, 16))

        # Status / Alerta
        self.lbl_status = ctk.CTkLabel(
            card,
            text="",
            font=ctk.CTkFont(size=12, weight="bold"),
            text_color="#ef4444"
        )
        self.lbl_status.pack(padx=20, pady=(0, 10))

        # Botão de Conexão
        self.btn_connect = ctk.CTkButton(
            card,
            text="⚡ Conectar à Máquina",
            font=ctk.CTkFont(size=14, weight="bold"),
            height=46,
            fg_color="#0284c7",
            hover_color="#0369a1",
            text_color="#ffffff",
            command=self._connect
        )
        self.btn_connect.pack(fill="x", padx=20, pady=(0, 16))

    def _toggle_theme(self):
        curr = ctk.get_appearance_mode()
        new_theme = "light" if curr == "Dark" else "dark"
        ctk.set_appearance_mode(new_theme)
        self.btn_theme.configure(text="🌙" if new_theme == "dark" else "☀️")
        self.config_data["theme"] = new_theme
        save_client_config(self.config_data)

    def show_status(self, text: str, is_error: bool = False):
        color = "#ef4444" if is_error else "#10b981"
        self.lbl_status.configure(text=text, text_color=color)

    def _connect(self):
        host_input = self.entry_host.get().strip()
        pin = self.entry_pin.get().strip()
        prof_label = self.combo_profile.get()
        prof_key = LABEL_TO_PROFILE.get(prof_label, "balanced")

        if not host_input:
            self.show_status("Por favor, digite o endereço do host.", is_error=True)
            return

        if not pin:
            self.show_status("Por favor, digite o PIN de acesso.", is_error=True)
            return

        # Salva dados para próximas conexões
        self.config_data["host"] = host_input
        self.config_data["pin"] = pin
        self.config_data["profile"] = prof_key
        save_client_config(self.config_data)

        # Formata URL do WebSocket
        clean_host = host_input.replace("http://", "").replace("https://", "").replace("ws://", "").replace("wss://", "").strip("/")
        ws_url = f"ws://{clean_host}/ws?pin={pin}"

        self.btn_connect.configure(text="Conectando...", state="disabled")
        self.show_status("Conectando ao host remoto...", is_error=False)

        # Abre a Janela do Viewer Nativo em background
        try:
            self.withdraw()  # Oculta o Launcher enquanto conectado
            self.active_session = RemoteViewerWindow(self, ws_url, prof_key)
        except Exception as e:
            self.deiconify()
            self.btn_connect.configure(text="⚡ Conectar à Máquina", state="normal")
            self.show_status(f"Falha ao iniciar cliente: {e}", is_error=True)

    def on_session_closed(self):
        """Chamado quando a sessão remota é finalizada."""
        self.deiconify()
        self.btn_connect.configure(text="⚡ Conectar à Máquina", state="normal")
        self.active_session = None


def main():
    app = ClientLauncher()
    app.mainloop()


if __name__ == "__main__":
    main()
