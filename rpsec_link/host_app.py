"""
RPsec Link - Interface Gráfica do Host (Desktop Agent).
Proporciona uma experiência idêntica ao AnyDesk Host / TeamViewer Host,
com suporte a Tema Claro e Escuro, geração de PIN aleatório e identidade visual oficial RPsecti.
"""

import os
import sys
import socket
import threading
import webbrowser
import ctypes
from pathlib import Path

# 1. Oculta imediatamente a janela preta do CMD se foi aberto via BAT
hwnd_console = ctypes.windll.kernel32.GetConsoleWindow()
if hwnd_console:
    ctypes.windll.user32.ShowWindow(hwnd_console, 0)  # SW_HIDE = 0

# 2. Registra AppUserModelID para a barra de tarefas do Windows exibir o ícone correto
try:
    myappid = "rpsecti.rpseclink.host.1"
    ctypes.windll.shell32.SetCurrentProcessExplicitAppUserModelID(myappid)
except Exception:
    pass

import customtkinter as ctk
import uvicorn
import server

# Tema inicial padrão escuro
ctk.set_appearance_mode("dark")
ctk.set_default_color_theme("blue")

BASE_DIR = Path(__file__).parent
ICON_ICO = BASE_DIR / "assets" / "icon.ico"


class HostApp(ctk.CTk):
    def __init__(self):
        super().__init__()

        self.title("RPsec Link — Host Agent")
        self.geometry("500x640")
        self.resizable(False, False)

        # Aplica o ícone oficial da RPsecti na janela
        if ICON_ICO.exists():
            try:
                self.iconbitmap(str(ICON_ICO))
            except Exception:
                pass

        # Configurações de rede e PIN aleatório inicial
        self.port = server.CONFIG["port"]
        self.pin = server.CONFIG["pin"]
        self.ips = server.get_network_ips()
        self.primary_ip = self.ips[0] if self.ips else "127.0.0.1"
        self.connection_url = f"http://{self.primary_ip}:{self.port}"

        # Callbacks do servidor
        server.CALLBACKS["on_connect"] = self._on_client_connect
        server.CALLBACKS["on_disconnect"] = self._on_client_disconnect

        self._start_server_thread()
        self._build_ui()

    def _start_server_thread(self):
        """Inicia o servidor Uvicorn em background thread daemon."""
        config = uvicorn.Config(
            server.app,
            host=server.CONFIG["host"],
            port=self.port,
            log_level="error"
        )
        self.uvicorn_server = uvicorn.Server(config)
        self.server_thread = threading.Thread(target=self.uvicorn_server.run, daemon=True)
        self.server_thread.start()

    def _build_ui(self):
        # 1. Cabeçalho Superior com Marca e Controle de Tema
        header_frame = ctk.CTkFrame(self, fg_color="transparent")
        header_frame.pack(fill="x", padx=24, pady=(20, 4))

        title_label = ctk.CTkLabel(
            header_frame,
            text="⚡ RPsec Link",
            font=ctk.CTkFont(size=22, weight="bold"),
            text_color=("#0f172a", "#f8fafc")
        )
        title_label.pack(side="left")

        # Controles do lado direito (Tema + Badge Online)
        right_header = ctk.CTkFrame(header_frame, fg_color="transparent")
        right_header.pack(side="right")

        # Seletor de Tema (Escuro / Claro)
        self.theme_selector = ctk.CTkSegmentedButton(
            right_header,
            values=["🌙 Escuro", "☀️ Claro"],
            command=self._on_theme_change,
            height=28,
            font=ctk.CTkFont(size=11, weight="bold")
        )
        self.theme_selector.set("🌙 Escuro")
        self.theme_selector.pack(side="left", padx=(0, 10))

        self.badge_status = ctk.CTkLabel(
            right_header,
            text="● ONLINE",
            font=ctk.CTkFont(size=11, weight="bold"),
            text_color="#10b981",
            fg_color=("#dcfce7", "#064e3b"),
            corner_radius=12,
            padx=10,
            pady=4
        )
        self.badge_status.pack(side="right")

        subtitle = ctk.CTkLabel(
            self,
            text="Agente Host Oficial • RPsecti Soluções Inteligentes",
            font=ctk.CTkFont(size=12),
            text_color=("#64748b", "#94a3b8")
        )
        subtitle.pack(anchor="w", padx=24, pady=(0, 14))

        # 2. CARD 1: Endereço desta Máquina
        card_ip = ctk.CTkFrame(
            self,
            fg_color=("#f8fafc", "#1e293b"),
            corner_radius=14,
            border_width=1,
            border_color=("#e2e8f0", "#334155")
        )
        card_ip.pack(fill="x", padx=24, pady=8)

        lbl_ip_title = ctk.CTkLabel(
            card_ip,
            text="ENDEREÇO DESTA MÁQUINA (ID DE ACESSO)",
            font=ctk.CTkFont(size=11, weight="bold"),
            text_color=("#64748b", "#94a3b8")
        )
        lbl_ip_title.pack(anchor="w", padx=16, pady=(14, 4))

        self.lbl_ip_val = ctk.CTkLabel(
            card_ip,
            text=self.connection_url,
            font=ctk.CTkFont(family="Consolas", size=18, weight="bold"),
            text_color=("#0284c7", "#38bdf8")
        )
        self.lbl_ip_val.pack(anchor="w", padx=16, pady=(0, 12))

        btn_row = ctk.CTkFrame(card_ip, fg_color="transparent")
        btn_row.pack(fill="x", padx=16, pady=(0, 14))

        self.btn_copy = ctk.CTkButton(
            btn_row,
            text="📋 Copiar Link",
            font=ctk.CTkFont(size=12, weight="bold"),
            fg_color=("#e2e8f0", "#334155"),
            text_color=("#0f172a", "#f8fafc"),
            hover_color=("#cbd5e1", "#475569"),
            height=36,
            command=self._copy_link
        )
        self.btn_copy.pack(side="left", expand=True, fill="x", padx=(0, 6))

        btn_open = ctk.CTkButton(
            btn_row,
            text="🌐 Abrir no Navegador",
            font=ctk.CTkFont(size=12, weight="bold"),
            fg_color="#0284c7",
            hover_color="#0369a1",
            text_color="#ffffff",
            height=36,
            command=lambda: webbrowser.open(self.connection_url)
        )
        btn_open.pack(side="right", expand=True, fill="x", padx=(6, 0))

        # 3. CARD 2: PIN de Acesso (Gerado Aleatoriamente com Botão de Regenerar)
        card_pin = ctk.CTkFrame(
            self,
            fg_color=("#f8fafc", "#1e293b"),
            corner_radius=14,
            border_width=1,
            border_color=("#e2e8f0", "#334155")
        )
        card_pin.pack(fill="x", padx=24, pady=8)

        lbl_pin_title = ctk.CTkLabel(
            card_pin,
            text="SENHA / PIN DE ACESSO (GERADO ALEATORIAMENTE)",
            font=ctk.CTkFont(size=11, weight="bold"),
            text_color=("#64748b", "#94a3b8")
        )
        lbl_pin_title.pack(anchor="w", padx=16, pady=(14, 4))

        pin_row = ctk.CTkFrame(card_pin, fg_color="transparent")
        pin_row.pack(fill="x", padx=16, pady=(0, 14))

        self.entry_pin = ctk.CTkEntry(
            pin_row,
            font=ctk.CTkFont(family="Consolas", size=17, weight="bold"),
            height=36,
            justify="center",
            fg_color=("#ffffff", "#0b0f19"),
            text_color=("#0f172a", "#f8fafc"),
            border_color=("#cbd5e1", "#334155")
        )
        self.entry_pin.insert(0, self.pin)
        self.entry_pin.pack(side="left", expand=True, fill="x", padx=(0, 8))

        # Botão para Gerar Novo PIN Aleatório
        btn_gen_pin = ctk.CTkButton(
            pin_row,
            text="🎲 Novo PIN",
            width=100,
            height=36,
            font=ctk.CTkFont(size=12, weight="bold"),
            fg_color=("#e2e8f0", "#334155"),
            text_color=("#0f172a", "#f8fafc"),
            hover_color=("#cbd5e1", "#475569"),
            command=self._generate_new_pin
        )
        btn_gen_pin.pack(side="left", padx=(0, 6))

        # Botão para Salvar PIN manual
        btn_save_pin = ctk.CTkButton(
            pin_row,
            text="Salvar",
            width=80,
            height=36,
            font=ctk.CTkFont(size=12, weight="bold"),
            fg_color="#0284c7",
            hover_color="#0369a1",
            text_color="#ffffff",
            command=self._update_pin
        )
        btn_save_pin.pack(side="right")

        # 4. CARD 3: Status da Sessão
        card_session = ctk.CTkFrame(
            self,
            fg_color=("#f1f5f9", "#0f172a"),
            corner_radius=14,
            border_width=1,
            border_color=("#e2e8f0", "#1e293b")
        )
        card_session.pack(fill="x", padx=24, pady=8)

        lbl_sess_title = ctk.CTkLabel(
            card_session,
            text="STATUS DA SESSÃO REMOTA",
            font=ctk.CTkFont(size=11, weight="bold"),
            text_color=("#64748b", "#94a3b8")
        )
        lbl_sess_title.pack(anchor="w", padx=16, pady=(14, 4))

        self.lbl_session_status = ctk.CTkLabel(
            card_session,
            text="🟢 Pronto para conexões — Aguardando...",
            font=ctk.CTkFont(size=13, weight="bold"),
            text_color=("#334155", "#cbd5e1")
        )
        self.lbl_session_status.pack(anchor="w", padx=16, pady=(0, 4))

        self.lbl_res_info = ctk.CTkLabel(
            card_session,
            text=f"Resolução Nativa Real: {server.capturer.width}x{server.capturer.height} (1080p Nativo)",
            font=ctk.CTkFont(size=11),
            text_color=("#64748b", "#94a3b8")
        )
        self.lbl_res_info.pack(anchor="w", padx=16, pady=(0, 14))

        # 5. Botão de Minimizar
        btn_min = ctk.CTkButton(
            self,
            text="Minimizar para Segundo Plano",
            fg_color="transparent",
            text_color=("#64748b", "#94a3b8"),
            hover_color=("#e2e8f0", "#1e293b"),
            height=30,
            command=self.iconify
        )
        btn_min.pack(pady=(12, 0))

    def _on_theme_change(self, mode: str):
        """Alterna entre Tema Escuro e Tema Claro."""
        if "Claro" in mode:
            ctk.set_appearance_mode("light")
        else:
            ctk.set_appearance_mode("dark")

    def _generate_new_pin(self):
        """Gera um novo PIN numérico aleatório e atualiza no servidor."""
        new_pin = server.generate_random_pin()
        server.CONFIG["pin"] = new_pin
        self.pin = new_pin
        self.entry_pin.delete(0, "end")
        self.entry_pin.insert(0, new_pin)

    def _copy_link(self):
        self.clipboard_clear()
        self.clipboard_append(self.connection_url)
        self.update()
        self.btn_copy.configure(text="✓ Copiado!")
        self.after(2000, lambda: self.btn_copy.configure(text="📋 Copiar Link"))

    def _update_pin(self):
        new_pin = self.entry_pin.get().strip()
        if new_pin:
            server.CONFIG["pin"] = new_pin
            self.pin = new_pin

    def _on_client_connect(self, client_ip: str, total_clients: int):
        self.after(0, lambda: self._update_session_ui(True, client_ip, total_clients))

    def _on_client_disconnect(self, client_ip: str, total_clients: int):
        self.after(0, lambda: self._update_session_ui(False, client_ip, total_clients))

    def _update_session_ui(self, connected: bool, client_ip: str, total: int):
        if total > 0:
            self.badge_status.configure(
                text=f"● SESSÃO ATIVA ({total})",
                text_color="#0284c7",
                fg_color=("#bae6fd", "#0c4a6e")
            )
            self.lbl_session_status.configure(
                text=f"🔵 Conectado com sucesso de {client_ip}",
                text_color="#0284c7"
            )
        else:
            self.badge_status.configure(
                text="● ONLINE",
                text_color="#10b981",
                fg_color=("#dcfce7", "#064e3b")
            )
            self.lbl_session_status.configure(
                text="🟢 Pronto para conexões — Aguardando...",
                text_color=("#334155", "#cbd5e1")
            )


def main():
    app = HostApp()
    app.mainloop()


if __name__ == "__main__":
    main()
