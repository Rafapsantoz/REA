# 🎮 Especificação Técnica — RPsec DDTank Bot (Sky City)

> **Módulo:** `rpsec_ddtank/`  
> **Objetivo:** Automação de alta velocidade e precisão para instâncias de DDTank (Foco: Sky City / Castelo na Cidade).  
> **Arquitetura:** Python puro + Win32 GDI / SendInput nativo (Ultra-leve, sem dependência pesada de OpenCV ou PyAutoGUI).

---

## 1. Topologia de Tela & Mapeamento de Janelas (Grid 2x2)

O bot opera exclusivamente na resolução **1920x1080** com 4 janelas do launcher do DDTank organizadas perfeitamente em 4 quadrantes de **960x540**:

```
+------------------------------------+------------------------------------+
| QUADRANTE TOP-LEFT (TL)            | QUADRANTE TOP-RIGHT (TR)           |
| Conta: Fake 1                      | Conta: CONTA PRINCIPAL (LV 70)     |
| Papel: Convidada / Suicídio        | Papel: Líder da Sala (Host) / Dano |
| Foco Neutro: (480, 270)            | Foco Neutro: (1440, 270)           |
| Botão Pronto: (910, 435)           | Botão Início / Pronto: (1870, 435) |
+------------------------------------+------------------------------------+
| QUADRANTE BOTTOM-LEFT (BL)         | QUADRANTE BOTTOM-RIGHT (BR)        |
| Conta: Fake 2                      | Conta: Fake 3                      |
| Papel: Convidada / Suicídio        | Papel: Convidada / Host Opcional   |
| Foco Neutro: (480, 800)            | Foco Neutro: (1440, 800)           |
| Botão Pronto: (910, 995)           | Botão Pronto / Início: (1870, 995) |
+------------------------------------+------------------------------------+
```

---

## 2. Calibração Milimétrica de Coordenadas (Telemetria Real)

Medidas extraídas diretamente dos frames reais do monitor do usuário (gravados em 1080p):

| Ação / Elemento | Quadrante | Coordenada X | Coordenada Y | Função |
|---|---|---|---|---|
| **Botão de Ação** | TL | `910` | `435` | Clicar em "Pronto" na Fake 1 |
| **Botão de Ação** | TR | `1870` | `435` | Clicar em "Início" (Host) ou "Pronto" |
| **Botão de Ação** | BL | `910` | `995` | Clicar em "Pronto" na Fake 2 |
| **Botão de Ação** | BR | `1870` | `995` | Clicar em "Pronto" na Fake 3 |
| **Foco Neutro** | TL | `480` | `270` | Centro da tela (despertar sem tocar em botões) |
| **Foco Neutro** | TR | `1440` | `270` | Centro da tela (despertar sem tocar em botões) |
| **Foco Neutro** | BL | `480` | `800` | Centro da tela (despertar sem tocar em botões) |
| **Foco Neutro** | BR | `1440` | `800` | Centro da tela (despertar sem tocar em botões) |

---

## 3. Dinâmica de Foco e Prevenção de Desclique (Dual-Step)

### A Armadilha do Botão de Alternância (*Toggle*)
No DDTank:
- O botão **"Pronto"** vira **"Cancelar"** assim que clicado.
- Se o bot clicar duas vezes no mesmo botão com intervalo curto, o segundo clique desmarca o Pronto.

### O Véu do Flash Player
Quando uma janela de launcher perde o foco, o Flash Player escurece a tela e exibe a mensagem:
`"Clique no jogo, para continuar jogando"`.

### O Algoritmo de Acionamento Seguro (`trigger_action_button`)
Para garantir 100% de sucesso sem jamais desmarcar o Pronto:
1. **Toque 1 (Foco Neutro no Chão):** O bot clica no ponto neutro da tela `(focus_x, focus_y)` — longe de qualquer menu. Isso restaura o foco da janela e dissipa o véu do Flash.
2. **Pausa Tática (180ms):** Aguarda o processamento interno do Flash stage.
3. **Toque 2 (Clique Único no Botão):** O cursor posiciona com precisão sobre `(btn_x, btn_y)` e emite **um único evento de clique**.

---

## 4. Rotina de Suicídio das Fakes (Zero Latência)

### Por que NÃO usar o Modo "Confiar":
O modo automático nativo ("Confiar") aguarda cerca de 15 a 20 segundos para a IA do jogo decidir o turno de cada fake. Com 3 fakes, isso adiciona quase 1 minuto de perda de tempo por partida.

### A Estratégia de Suicídio Rápido:
Ao invés de passar a vez, o bot foca cada uma das 3 contas fakes em sequência e segura a **Seta Esquerda (`left`) por 3.5 segundos**:
- O personagem caminha continuamente até a borda e cai no buraco da arena.
- Ao morrer imediatamente, a fake é eliminada da fila de turnos.
- **Resultado:** Apenas a Conta Principal (TR) joga contra o Boss, triplicando a velocidade de farming.

### Repetição Física de Hardware (`hold_key`):
Como engines baseadas em DirectInput/Flash exigem eventos repetidos de `WM_KEYDOWN` para locomoção contínua:
- O método `hold_key(key, duration_sec, repeat_interval=0.04)` emite um pulso de hardware via Win32 `SendInput` a cada 40ms, simulando fisicamente a taxa de repetição do teclado do Windows.

---

## 5. Sequência Tática da Conta Principal (Sky City)

1. **Turno 1 — Avião Tático (F):**
   - Pressiona tecla `f` (Scan code `0x21`).
   - Carrega barra de espaço por `0.55s` para pousar na plataforma elevada esquerda.
   - Aguarda ação do Boss (~16s).
2. **Turno 2 — Posicionamento & Buffs:**
   - Foca a conta principal em `(1440, 270)`.
   - Caminha para a direita (`right`) por `1.4s`.
   - Ativa itens de buffs rápidos (`1` e `2` -> +2 tiros e +1 tiro).
3. **Turno 3 — Disparo Letal:**
   - Carrega barra de espaço por `1.05s` calibrado no ângulo de disparo contra o Boss.

---

## 6. Módulos do Código Fonte

- `src/config.py`: Definição de coordenadas, tempos de carga, alternância de líder (Host TR ou BR) e dataclass `BotConfig`.
- `src/input_sim.py`: Wrapper Win32 ctypes para `SendInput`, `SetCursorPos`, scan codes de teclado e desativação do QuickEdit mode.
- `src/window_manager.py`: Orquestrador de quadrantes, ativação segura em duas etapas, rotina de pronto e sequência de suicídio.
- `src/vision_engine.py`: Detector de estados de jogo (`LOBBY`, `LOADING`, `BATTLE`) usando `mss` e análise de matriz `numpy`.
- `src/battle_controller.py`: Máquina de estados completa que conecta Lobby -> Batalha -> Suicídio -> Ataque.
- `main.py`: Painel interativo com menu de 5 opções e argumentos CLI (`--run`, `--test-ready`, `--test-suicide`, `--test-vision`, `--host`).
