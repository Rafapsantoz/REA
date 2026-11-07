# ⚡ RPsec Link — Acesso Remoto Ultraleve

Solução proprietária de acesso remoto e controle de dispositivos da **RPsecti Soluções Inteligentes**, criada como uma alternativa enxuta e sem fricção ao AnyDesk e TeamViewer.

---

## 🌟 Diferenciais do RPsec Link

- 🚀 **Zero Instalação na Máquina Cliente:** Você controla esta máquina direto pelo navegador (Chrome, Edge, Safari, Firefox) de qualquer outro computador, notebook, tablet ou celular.
- 🚫 **Livre de Bloqueios:** Sem alertas irritantes de "uso comercial detectado", sem timeouts de 5 minutos e sem filas de espera.
- ⚡ **Desempenho Extremo:** Captura direta via Win32 GDI com aceleração OpenCV (< 50ms por frame e consumo inferior a 35MB de RAM).
- 🔒 **Acesso Protegido por PIN:** Conexão criptografada por WebSocket autorizada apenas com o PIN configurado pelo dono da máquina.
- ⌨️ **Controle Completo:** Suporte a cliques esquerdo, direito e do meio, rolagem do mouse e teclado nativo com atalhos de sistema (Win, Alt+Tab, Esc).

---

## 🚀 Como Iniciar o Servidor (Na Máquina que Será Controlada)

### Opção 1: Via Arquivo Executável / BAT
Dê um duplo-clique no arquivo:
```cmd
iniciar_rpsec_link.bat
```

### Opção 2: Via Linha de Comando (Personalizado)
```bash
python server.py --port 8765 --pin 1234
```

---

## 💻 Como Acessar e Controlar (Na Sua Outra Máquina / Celular)

1. Certifique-se de que o servidor está rodando.
2. No seu navegador, acesse o link informado no terminal do servidor:
   - **Na mesma rede (Wi-Fi/Cabo):** `http://<IP_DO_HOST>:8765` (ex: `http://192.168.0.2:8765`)
   - **Pela Internet (Fora de Casa/Trabalho):** Use via **Tailscale** (gratuito, sem abrir portas no roteador) ou **Cloudflare Tunnel**:
     ```bash
     cloudflared tunnel --url http://localhost:8765
     ```
3. Digite o seu **PIN** (padrão: `1234`) e clique em **Conectar**.
4. Pronto! A tela do seu computador aparecerá em tempo real com controle total.

---

## 🛠️ Tecnologias Utilizadas
- **Backend / Host:** Python 3.11, FastAPI, Uvicorn, WebSockets, PyWin32 (GDI / User32 API), OpenCV.
- **Frontend / Cliente:** HTML5, CSS3, Canvas API, WebSockets (Zero frameworks, carregamento instantâneo).
