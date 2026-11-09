"""
RPsec Link - Interface Gráfica do Host (Desktop Agent).
Proporciona uma experiência idêntica ao AnyDesk Host / TeamViewer Host,
com design refinado em Tema Claro e Escuro, geração de PIN aleatório e proteção de segurança ativa.
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
        self.geometry("500x740")
        self.resizable(False, False)

        # Configura cores de fundo da janela principal
        self.configure(fg_color=("#f8fafc", "#0b0f17"))

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
        server.CALLBACKS["on_security_alert"] = self._on_security_alert
        server.CALLBACKS["on_devices_update"] = self._on_devices_update
        server.CALLBACKS["on_shutdown_request"] = self._exit_app

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
        # 1. Cabeçalho Linha 1: Título e Badge Online
        top_row = ctk.CTkFrame(self, fg_color="transparent")
        top_row.pack(fill="x", padx=24, pady=(24, 4))

        title_label = ctk.CTkLabel(
            top_row,
            text="⚡ RPsec Link",
            font=ctk.CTkFont(size=24, weight="bold"),
            text_color=("#0f172a", "#f8fafc")
        )
        title_label.pack(side="left")

        self.badge_status = ctk.CTkLabel(
            top_row,
            text="● ONLINE",
            font=ctk.CTkFont(size=11, weight="bold"),
            text_color="#10b981",
            fg_color=("#dcfce7", "#064e3b"),
            corner_radius=12,
            padx=12,
            pady=4
        )
        self.badge_status.pack(side="right")

        # 2. Cabeçalho Linha 2: Subtítulo e Seletor de Tema limpo (sem sobreposição!)
        sub_row = ctk.CTkFrame(self, fg_color="transparent")
        sub_row.pack(fill="x", padx=24, pady=(0, 16))

        subtitle = ctk.CTkLabel(
            sub_row,
            text="Agente Host Oficial • RPsecti Soluções",
            font=ctk.CTkFont(size=12),
            text_color=("#64748b", "#94a3b8")
        )
        subtitle.pack(side="left", anchor="w")

        self.theme_btn = ctk.CTkButton(
            sub_row,
            text="🌙 Tema Escuro",
            width=115,
            height=28,
            font=ctk.CTkFont(size=11, weight="bold"),
            fg_color=("#e2e8f0", "#1e293b"),
            hover_color=("#cbd5e1", "#334155"),
            text_color=("#0f172a", "#f8fafc"),
            border_width=1,
            border_color=("#cbd5e1", "#334155"),
            command=self._toggle_theme
        )
        self.theme_btn.pack(side="right")

        # 3. CARD 1: Endereço desta Máquina
        card_ip = ctk.CTkFrame(
            self,
            fg_color=("#ffffff", "#1e293b"),
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
            fg_color=("#f1f5f9", "#334155"),
            text_color=("#0f172a", "#f8fafc"),
            hover_color=("#e2e8f0", "#475569"),
            border_width=1,
            border_color=("#cbd5e1", "#475569"),
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

        # 4. CARD 2: PIN de Acesso (Gerado Aleatoriamente)
        card_pin = ctk.CTkFrame(
            self,
            fg_color=("#ffffff", "#1e293b"),
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
            font=ctk.CTkFont(family="Consolas", size=18, weight="bold"),
            height=38,
            justify="center",
            fg_color=("#f8fafc", "#0b0f19"),
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
            height=38,
            font=ctk.CTkFont(size=12, weight="bold"),
            fg_color=("#f1f5f9", "#334155"),
            text_color=("#0f172a", "#f8fafc"),
            hover_color=("#e2e8f0", "#475569"),
            border_width=1,
            border_color=("#cbd5e1", "#475569"),
            command=self._generate_new_pin
        )
        btn_gen_pin.pack(side="left", padx=(0, 6))

        # Botão para Salvar PIN manual
        btn_save_pin = ctk.CTkButton(
            pin_row,
            text="Salvar",
            width=80,
            height=38,
            font=ctk.CTkFont(size=12, weight="bold"),
            fg_color="#0284c7",
            hover_color="#0369a1",
            text_color="#ffffff",
            command=self._update_pin
        )
        btn_save_pin.pack(side="right")

        # 5. CARD 3: Status & Dispositivos Conectados
        self.card_session = ctk.CTkFrame(
            self,
            fg_color=("#ffffff", "#0f172a"),
            corner_radius=14,
            border_width=1,
            border_color=("#e2e8f0", "#1e293b")
        )
        self.card_session.pack(fill="x", padx=24, pady=8)

        lbl_sess_title = ctk.CTkLabel(
            self.card_session,
            text="STATUS & DISPOSITIVOS CONECTADOS",
            font=ctk.CTkFont(size=11, weight="bold"),
            text_color=("#64748b", "#94a3b8")
        )
        lbl_sess_title.pack(anchor="w", padx=16, pady=(14, 4))

        self.lbl_session_status = ctk.CTkLabel(
            self.card_session,
            text="🟢 Pronto para conexões — Nenhum dispositivo conectado",
            font=ctk.CTkFont(size=13, weight="bold"),
            text_color=("#334155", "#cbd5e1")
        )
        self.lbl_session_status.pack(anchor="w", padx=16, pady=(0, 4))

        self.lbl_res_info = ctk.CTkLabel(
            self.card_session,
            text=f"Resolução Nativa Real: {server.capturer.width}x{server.capturer.height} (1080p Nativo)",
            font=ctk.CTkFont(size=11),
            text_color=("#64748b", "#94a3b8")
        )
        self.lbl_res_info.pack(anchor="w", padx=16, pady=(0, 6))

        # Container para lista de dispositivos conectados
        self.devices_frame = ctk.CTkFrame(self.card_session, fg_color="transparent")
        self.devices_frame.pack(fill="x", padx=16, pady=(0, 6))

        # Botão para Desconectar Todos os Dispositivos (visível quando houver conexões)
        self.btn_disconnect_all = ctk.CTkButton(
            self.card_session,
            text="🔴 Desconectar Todos os Dispositivos",
            font=ctk.CTkFont(size=12, weight="bold"),
            fg_color="#ef4444",
            hover_color="#dc2626",
            text_color="#ffffff",
            height=34,
            command=self._disconnect_all_sessions
        )
        # Inicialmente oculto

        # 6. Rodapé: Abrir Cliente, Minimizar e Fechar Programa
        btn_client = ctk.CTkButton(
            self,
            text="💻 Conectar a Outro Host (Cliente Nativo)",
            font=ctk.CTkFont(size=12, weight="bold"),
            fg_color=("#e2e8f0", "#1e293b"),
            hover_color=("#cbd5e1", "#334155"),
            text_color=("#0f172a", "#f8fafc"),
            border_width=1,
            border_color=("#cbd5e1", "#475569"),
            height=36,
            command=self._launch_client
        )
        btn_client.pack(fill="x", padx=24, pady=(6, 8))

        footer_row = ctk.CTkFrame(self, fg_color="transparent")
        footer_row.pack(fill="x", padx=24, pady=(0, 12))

        btn_min = ctk.CTkButton(
            footer_row,
            text="Minimizar",
            fg_color="transparent",
            text_color=("#64748b", "#94a3b8"),
            hover_color=("#e2e8f0", "#1e293b"),
            height=32,
            command=self.iconify
        )
        btn_min.pack(side="left", expand=True, fill="x", padx=(0, 6))

        btn_exit = ctk.CTkButton(
            footer_row,
            text="🔴 Fechar e Encerrar",
            fg_color=("#fee2e2", "#3b1111"),
            hover_color=("#fca5a5", "#5c1d1d"),
            text_color="#ef4444",
            font=ctk.CTkFont(size=11, weight="bold"),
            height=32,
            command=self._exit_app
        )
        btn_exit.pack(side="right", expand=True, fill="x", padx=(6, 0))

    def _launch_client(self):
        """Abre o cliente nativo do RPsec Link em processo independente."""
        import subprocess
        client_script = BASE_DIR / "client_app.py"
        python_exe = sys.executable
        subprocess.Popen([python_exe, str(client_script)], cwd=str(BASE_DIR))

    def _toggle_theme(self):
        """Alterna entre Tema Escuro e Claro com botão único estilizado."""
        current = ctk.get_appearance_mode()
        if current == "Dark":
            ctk.set_appearance_mode("light")
            self.theme_btn.configure(text="☀️ Tema Claro")
        else:
            ctk.set_appearance_mode("dark")
            self.theme_btn.configure(text="🌙 Tema Escuro")

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
        pass  # O gerenciamento e exibição de detalhes é feito em tempo real via _on_devices_update

    def _on_client_disconnect(self, client_ip: str, total_clients: int):
        pass

    def _on_devices_update(self, devices: list):
        self.after(0, lambda: self._update_devices_ui(devices))

    def _update_devices_ui(self, devices: list):
        # Limpa itens anteriores do container
        for child in self.devices_frame.winfo_children():
            child.destroy()

        total = len(devices)
        if total > 0:
            self.badge_status.configure(
                text=f"● SESSÃO ATIVA ({total})",
                text_color="#0284c7",
                fg_color=("#bae6fd", "#0c4a6e")
            )
            self.lbl_session_status.configure(
                text=f"🔵 {total} Dispositivo(s) Conectado(s)",
                text_color="#0284c7"
            )

            for dev in devices:
                dev_id = dev["id"]
                row = ctk.CTkFrame(self.devices_frame, fg_color=("#f1f5f9", "#1e293b"), corner_radius=8)
                row.pack(fill="x", pady=2)

                icon = "💻" if dev.get("is_native") else "🌐"
                dev_text = f"{icon} {dev['ip']} ({dev['client_type']}) • {dev.get('connected_str', '')}"
                lbl = ctk.CTkLabel(row, text=dev_text, font=ctk.CTkFont(size=11, weight="bold"), text_color=("#0f172a", "#f8fafc"))
                lbl.pack(side="left", padx=10, pady=5)

                btn_dc = ctk.CTkButton(
                    row,
                    text="Desconectar",
                    width=78,
                    height=24,
                    font=ctk.CTkFont(size=10, weight="bold"),
                    fg_color="#ef4444",
                    hover_color="#dc2626",
                    command=lambda sid=dev_id: server.trigger_disconnect_device(sid)
                )
                btn_dc.pack(side="right", padx=6, pady=4)

            self.btn_disconnect_all.pack(fill="x", padx=16, pady=(4, 12))
        else:
            self.badge_status.configure(
                text="● ONLINE",
                text_color="#10b981",
                fg_color=("#dcfce7", "#064e3b")
            )
            self.lbl_session_status.configure(
                text="🟢 Pronto para conexões — Nenhum dispositivo conectado",
                text_color=("#334155", "#cbd5e1")
            )
            self.btn_disconnect_all.pack_forget()

    def _on_security_alert(self, client_ip: str, freeze_seconds: int):
        self.after(0, lambda: self._update_security_alert_ui(client_ip, freeze_seconds))

    def _disconnect_all_sessions(self):
        """Encerra todas as sessões ativas com feedback visual."""
        self.btn_disconnect_all.configure(text="Desconectando...", state="disabled")
        server.trigger_disconnect_all()
        self.after(600, lambda: self.btn_disconnect_all.configure(text="🔴 Desconectar Todos os Dispositivos", state="normal"))

    def _exit_app(self):
        """Encerra todas as sessões e fecha o programa completamente."""
        try:
            fut = server.trigger_disconnect_all()
            if fut:
                try:
                    fut.result(timeout=0.25)
                except Exception:
                    pass
        except Exception:
            pass
        self.destroy()
        os._exit(0)

    def _update_security_alert_ui(self, client_ip: str, freeze_secs: int):
        self.lbl_session_status.configure(
            text=f"⚠️ Bloqueio Ativo: {client_ip} congelado por {freeze_secs}s (3 PINs errados)",
            text_color="#ef4444"
        )


def main():
    app = HostApp()
    app.mainloop()


if __name__ == "__main__":
    main()
