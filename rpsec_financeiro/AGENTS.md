# 💳 RPsec Financeiro — Diretrizes de Engenharia & Arquitetura

> **Subprojeto:** RPsec Financeiro (Financial Organizer — Gestão Familiar & Conciliação com IA)  
> **Squad Responsável:** `dev_financas_fullstack`, `dev2_ui_ux`, `qa_tester` sob supervisão do CTO Marcus.

---

## 🎯 Propósito do Produto
Prover um sistema inteligente, ultra-rápido e portátil para **controle de gastos, rateio automático de faturas de cartão de crédito entre familiares (Rafael, Mãe e Irmã) e conciliação de extratos bancários em PDF via Google Gemini AI**, eliminando planilhas manuais e discussões sobre quem deve o quê.

---

## ⚙️ Diretrizes Técnicas & Regras de Negócio

1. **Backend Assíncrono & SQLite Nativo:**
   - FastAPI assíncrono com SQLAlchemy 2.0 e `aiosqlite`.
   - Zero dependência de Docker ou servidores pesados: banco de dados SQLite local (`financial.db`) leve e portável.
2. **Pipeline de Extração Multimodal via Gemini AI:**
   - Processamento direto de PDFs via SDK oficial `google-genai` com schema Pydantic estrito.
   - Detecção inteligente de parcelas (ex: `02/10`), data, estabelecimento e valor.
   - Heurísticas de categorização e atribuição prévia aos membros familiares.
3. **Rateio Familiar Independente (RN01 a RN04):**
   - Fechamento mensal consolidado com status individual (`Pago`, `Pendente`, `Parcial`, `Sem despesas`).
   - Apenas parcelas reais do mês vigente entram no total da fatura (`is_forecast = False`).
   - Detecção de duplicidade de compras para evitar cobranças indevidas.
4. **Interface Touch & Dark Mode:**
   - Frontend em React + TypeScript + Vite + Tailwind CSS.
   - Suporte completo a tema escuro/claro com alto contraste e acessibilidade.
   - Modal de conferência em lote para validar lançamentos extraídos antes de persistir no banco.
5. **Comandos CLI & Automação:**
   - Utilitário `scripts/fo_cli.py` para operações rápidas via terminal (resumo mensal, cadastro manual, toggle-paid e validação).
6. **Inicializador com 1 Clique:**
   - Execução via `iniciar_financeiro.bat` com detecção automática de ambiente e abertura no navegador (`http://localhost:8000`).
