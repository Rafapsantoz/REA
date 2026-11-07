# 🏹 RPsec DDTank Bot — Automação Sky City (Castelo na Cidade)
*Um produto RPsecti Soluções Inteligentes*

Automação inteligente de alta performance para a instância **Sky City (Castelo na Cidade)** no DDTank Brasil, desenvolvida sob a filosofia de visão computacional não invasiva (Zero Injeção / Zero Risco de Ban).

---

## ✨ Características Principais

- ⚡ **Estratégia de Suicídio Rápido das Fakes:** Em vez de usar o modo `Confiar` (que gera filas longas de espera em cada rodada), o bot foca as 3 contas secundárias e as faz caminhar para a esquerda, caindo no abismo e morrendo imediatamente. Com as fakes mortas, os turnos passam instantaneamente, acelerando a partida em **mais de 300%**.
- 🖥️ **Mapeamento Grid 2x2 (Monitor 1920x1080):** 
  - `TL` (Top-Left): Fake 1 (Pronto)
  - `TR` (Top-Right): **Conta Principal / Líder**
  - `BL` (Bottom-Left): Fake 2 (Pronto)
  - `BR` (Bottom-Right): Fake 3 (Pronto)
- 🚀 **Execução Tática Automatizada:**
  - **Turno 1:** Dispara o **Avião (F)** para a plataforma elevada segura à esquerda.
  - **Turno 2:** Avança para a direita com setas para limpar a linha de tiro e ativa buffs.
  - **Turno 3:** Dispara com tempo milimétrico de barra de espaço no Chefe.
- 👁️ **Visão Computacional de Baixa Latência:** Reconhecimento automático de estados (`LOBBY`, `LOADING`, `BATTLE`, `VICTORY`) via `MSS` sem pesar no processador.

---

## 🚀 Como Executar na Máquina de Jogo

### 1. Instalação Inicial (1 Clique)
Basta dar dois cliques no arquivo:
* 🟢 **`instalar.bat`** (cria o `.venv` local e instala `mss`, `numpy` e `pillow` automaticamente).

---

### 2. Execução Rápida via Atalhos (.BAT)
Você pode executar diretamente via scripts prontos:
* 🏹 **`iniciar_bot.bat`**: Inicia a partida completa de Sky City (com contagem regressiva de 5 segundos).
* 💀 **`testar_suicidio.bat`**: Testa apenas a rotina de suicídio das 3 fakes (andar para a esquerda no abismo).
* 🟡 **`testar_pronto.bat`**: Testa apenas os cliques no botão Pronto das 3 fakes no Lobby.

---

### 3. Execução via Terminal (PowerShell / CMD)
Se preferir rodar via linha de comando dentro da pasta `rpsec_ddtank`:

* **Iniciar partida completa:**
  ```powershell
  .venv\Scripts\python main.py --run
  ```

* **Testar suicídio das 3 fakes:**
  ```powershell
  .venv\Scripts\python main.py --test-suicide
  ```

* **Testar cliques de Pronto:**
  ```powershell
  .venv\Scripts\python main.py --test-ready
  ```

* **Diagnóstico de Visão Computacional:**
  ```powershell
  .venv\Scripts\python main.py --test-vision
  ```

---

## 🧪 Bateria de Testes Automatizados
```powershell
.venv\Scripts\python tests/test_bot_core.py
```
