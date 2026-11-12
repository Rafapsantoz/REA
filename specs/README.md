# 📚 Especificações Técnicas & Guia de Desenvolvimento Multi-Máquinas
## RPsecti Soluções Inteligentes

> **Destinatário:** Desenvolvedor / Agente AI na Máquina de Jogos (Gaming PC).  
> **Liderança:** Rafael (CEO & Fundador) | Marcus (CTO Lead).  
> **Diretório Ativo:** `specs/`

Este diretório contém o levantamento arquitetural completo, lições aprendidas, calibrações de hardware e procedimentos de execução para dar continuidade imediata ao desenvolvimento na Máquina de Jogos sem perda de contexto.

---

## 📑 Índice de Especificações

1. [**SETUP_MAQUINA_JOGOS.md**](SETUP_MAQUINA_JOGOS.md):
   - Guia de setup do ambiente no PC de jogos (Windows 10/11, Python 3.10+, `.venv`, dependências).
   - Armadilhas de sistema resolvidas: quebras CRLF, QuickEdit mode do CMD e permissões.

2. [**DDTANK_BOT_SPEC.md**](DDTANK_BOT_SPEC.md):
   - Especificação técnica profunda do **RPsec DDTank Bot**.
   - Mapeamento de tela 1920x1080 (Grid 2x2 em monitor de 27").
   - Calibração exata de pixels dos botões `Pronto` e `Início`.
   - Sistema de Foco Neutro (Prevenção de cancelamento de Ready).
   - Rotina de Suicídio das Fakes (Zero delay com pulsos de repetição de hardware).
   - Máquina de Estados da Instância Sky City (Castelo na Cidade).

3. [**PROMPT_INICIAL_AGENTE.md**](PROMPT_INICIAL_AGENTE.md):
   - Prompt pronto para copiar e colar ao abrir uma nova sessão de chat na Máquina de Jogos.
   - Instrui o agente a assumir o papel de **Marcus (CTO)** e ler as especificações antes de atuar.

---

## 🏛️ Contexto da RPsecti Soluções Inteligentes

- **Missão:** Construir automações e ferramentas pragmáticas, leves e de alto valor que geram receita e simplificam operações.
- **Frente Atual (Cashflow / Máquina de Jogos):** Finalizar, empacotar e comercializar o **RPsec DDTank Bot** como produto fechado de alta performance.
