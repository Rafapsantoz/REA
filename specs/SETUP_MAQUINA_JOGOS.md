# ⚙️ Guia de Instalação & Setup — Máquina de Jogos (Gaming PC)

> **Projeto:** RPsec DDTank Bot  
> **Sistema Operacional:** Windows 10 / Windows 11 (64 bits)  
> **Ambiente Local:** `rpsec_ddtank/`

---

## 1. Pré-Requisitos do Sistema

1. **Python 3.10, 3.11 ou 3.12:**
   - Durante a instalação do Python, a opção **"Add Python to PATH"** DEVE estar marcada.
   - Para verificar no terminal:
     ```powershell
     python --version
     # ou
     py --version
     ```
2. **Git para Windows:**
   - Instalado com as opções padrão de terminal.
3. **Resolução de Tela:**
   - **1920x1080** com escala de exibição do Windows em **100%** (escala nativa recomendada para monitor de 27").

---

## 2. Passo a Passo de Inicialização

### Passo 1: Atualizar o Repositório
Abra o terminal (PowerShell ou Git Bash) na pasta raiz do projeto (`REA`) e execute:

```powershell
git pull origin main
```

### Passo 2: Configuração Automática do Ambiente
O projeto conta com um instalador auto-recuperável. Basta dar dois cliques em:

```text
rpsec_ddtank\instalar.bat
```

Ou simplesmente abrir direto:

```text
rpsec_ddtank\iniciar_bot.bat
```

O script detecta o Python no PATH, cria a pasta `.venv` (se ainda não existir), atualiza o `pip` e instala silenciosamente as 3 dependências essenciais:
- `mss` (Captura de tela ultrarrápida via GDI nativo em tempo real < 10ms)
- `numpy` (Manipulação de matrizes de pixels e heurísticas de visão)
- `pillow` (Recorte e processamento leve de imagens)

---

## 3. Armadilhas de Sistema Resolvidas (Histórico de Bugs)

Se o novo agente na outra máquina precisar manter ou editar os scripts de lote, **DEVE** seguir rigorosamente as regras abaixo:

### Armadilha 1: Quebra de Linha CRLF vs LF no CMD do Windows
- **Problema:** O interpretador `cmd.exe` do Windows utiliza saltos de bytes internos. Se um arquivo `.bat` for salvo com quebras de linha Unix/Linux (`\n` / LF) e possuir caracteres acentuados (UTF-8 multibyte), o ponteiro do CMD "escorrega" e tenta executar pedaços das palavras como comandos (ex.: `'5001' não é reconhecido`, `'to-recuperação:' não é reconhecido`, `'instalar.bat' não é reconhecido`).
- **Regra Inegociável:**
  - Todos os arquivos `.bat` e `.cmd` **DEVEM** ser salvos em **ASCII puro** (sem acentos nos textos de batch) e com quebras **`\r\n` (CRLF)**.
  - O arquivo `.gitattributes` na raiz do repositório garante que o Git nunca converta scripts `.bat` para LF.

### Armadilha 2: Congelamento por *QuickEdit Mode* do Terminal
- **Problema:** No Windows, se o usuário (ou um clique do mouse) encostar na área preta do terminal, o Windows entra no modo `Selecionar Prompt de Comando` (*QuickEdit Mode*) e **suspende o processo do Python** até que a tecla Enter seja pressionada.
- **Solução Implementada:** O arquivo `main.py` possui a função `configure_console_window()` que chama a API do Windows (`kernel32.SetConsoleMode`) e desativa o QuickEdit Mode programaticamente logo no início da execução.

### Armadilha 3: Sobreposição da Janela do Terminal nos Botões do Jogo
- **Problema:** Se o terminal ficar aberto sobre o canto inferior direito de um quadrante, os cliques do bot atingem a janela do terminal em vez do jogo.
- **Solução Implementada:** A função `configure_console_window()` auto-posiciona a janela do terminal no quadrante neutro superior (`X=360, Y=80, W=540, H=340`), ficando a mais de 60 pixels de distância de qualquer botão do DDTank.

---

## 4. Comandos e Testes de Verificação

Para validar que o ambiente está íntegro na máquina de jogos, execute os testes unitários no terminal:

```powershell
rpsec_ddtank\.venv\Scripts\python -m unittest rpsec_ddtank/tests/test_bot_core.py
```

*Critério de Sucesso:* 5 testes rodados, 0 erros (`OK`).
