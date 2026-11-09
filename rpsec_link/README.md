# ⚡ RPsec Link — Acesso Remoto Ultraleve & Cliente Nativo

Solução proprietária de acesso remoto e controle de dispositivos da **RPsecti Soluções Inteligentes**, criada como uma alternativa enxuta, pragmática e sem limites ao AnyDesk e TeamViewer.

---

## 🌟 Diferenciais do RPsec Link

- 💻 **Cliente Nativo Desktop (Novo):** Sem navegadores, sem interferência de abas (Ctrl+W, Alt+Tab, Win capturados 100% nativamente) e renderização direta em hardware GDI (`< 5.5ms`).
- 🌐 **Cliente Web Instantâneo:** Controle também pelo navegador (Chrome, Edge, Safari) de qualquer dispositivo sem instalar nada.
- ⚡ **Desempenho Extremo & Resposta Imediata:** Captura via Win32 GDI com aceleração SIMD AVX2 (`< 7ms` por frame) e boost interativo na digitação (sem atraso de digitação).
- 📶 **Otimização para Redes Fracas:** 4 perfis adaptativos (Turbo, Equilibrado, Rede Fraca 4G e Ultra-Econômico de 120 KB/s).
- 🚫 **Livre de Bloqueios:** Sem alertas de "uso comercial detectado", sem timeouts e sem filas.
- 🔒 **Segurança Anti-Brute Force:** PIN aleatório dinâmico com bloqueio exponencial por IP em caso de tentativas incorretas.

---

## 🚀 Como Iniciar

### 1. Na Máquina Host (Trabalho / A ser controlada):
Execute:
```cmd
iniciar_rpsec_link.bat
```
*(Inicia o Host Agent silenciosamente, sem janela preta do CMD, gerando o PIN de segurança)*

### 2. Na Máquina Viewer (Pessoal / Onde você vai controlar):

#### Opção A: Cliente Nativo Desktop (Recomendado)
Execute:
```cmd
iniciar_rpsec_client.bat
```
*(Abre o visualizador nativo com atalhos completos de sistema e seletor de perfil de rede)*

#### Opção B: Via Navegador (Web)
Acesse no navegador:
`http://<IP_DO_HOST>:8765` (ex: `http://192.168.0.2:8765`)

---

## 📶 Perfis de Rede & Performance

| Perfil | Resolução | Qualidade JPEG | FPS | Consumo Médio | Indicado para |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **🚀 Turbo** | 100% (1080p) | 70% | 30 FPS | ~1.8 MB/s | Rede Local / Fibra 100+ Mbps |
| **⚡ Equilibrado** | 100% (1080p) | 55% | 25 FPS | ~900 KB/s | Wi-Fi padrão residencial/escritório |
| **🌐 Rede Fraca** | 75% (1440x810) | 40% | 18 FPS | ~280 KB/s | 4G / Wi-Fi oscilante / Hotspot |
| **🪶 Ultra-Econômico** | 60% (1152x648) | 30% | 12 FPS | ~110 KB/s | Conexões críticas (< 2 Mbps) / 3G |

---

## 🛠️ Tecnologias Utilizadas
- **Backend / Host:** Python 3.11, FastAPI, Uvicorn, WebSockets, PyWin32 (GDI / User32 API / SendInput), OpenCV.
- **Cliente Nativo:** CustomTkinter, Tkinter Canvas, Win32 GDI SetDIBitsToDevice, OpenCV SIMD, WebSockets Sync Client.
- **Cliente Web:** HTML5, CSS3, Canvas API, WebSockets (Zero dependências).
