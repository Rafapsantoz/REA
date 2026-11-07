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

## 🚀 Como Executar

### 1. Testes de Calibração Isolados
No terminal, com o ambiente virtual ativado:

* **Testar apenas os cliques de Pronto nas 3 fakes:**
  ```powershell
  ..\gravador_windows\.venv\Scripts\python main.py --test-ready
  ```

* **Testar a sequência de suicídio das fakes (caminhada para a esquerda):**
  ```powershell
  ..\gravador_windows\.venv\Scripts\python main.py --test-suicide
  ```

* **Verificar o estado da tela via Visão Computacional:**
  ```powershell
  ..\gravador_windows\.venv\Scripts\python main.py --test-vision
  ```

### 2. Executar a Partida Completa
```powershell
..\gravador_windows\.venv\Scripts\python main.py --run
```
*(O bot fará uma contagem regressiva de 5 segundos para você posicionar as janelas).*

---

## 🧪 Bateria de Testes
```powershell
..\gravador_windows\.venv\Scripts\python tests/test_bot_core.py
```
