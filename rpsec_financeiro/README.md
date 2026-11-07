# 💳 RPsec Financeiro — Controle Familiar & Conciliação com IA

Sistema inteligente, moderno e portátil para **controle de gastos, divisão de faturas de cartão de crédito entre familiares (Rafael, Mãe e Irmã) e conciliação automática de PDFs de extratos via Google Gemini AI**.

Integrado ao portfólio de soluções inteligentes da **RPsecti Soluções Inteligentes**.

---

## 🌟 Principais Recursos

- 👨‍👩‍👧 **Rateio Familiar Preciso:** Saiba exatamente quanto a **Mãe**, a **Irmã** e o **Rafael** devem pagar na fatura de cada cartão no mês, com status individual (`Pago`, `Pendente`, `Parcial`, `Sem despesas`).
- 🤖 **Leitura Inteligente de Faturas em PDF (Gemini AI):** Arraste a fatura do cartão (PDF) e a IA multimodal extrai automaticamente compras, parcelas (ex: `02/10`) e sugere donos e categorias.
- ⚡ **Tela de Conferência em Lote:** Revise os itens extraídos pelo Gemini e atribua os donos das compras com poucos cliques antes de persistir no banco.
- ✍️ **Cadastro Manual Rápido:** Adicione gastos avulsos facilmente com data, valor, cartão, membro e parcelamento.
- 📊 **Dashboard Financeiro Interativo:** Gráficos de distribuição por categoria, resumo de faturas e Dark Mode com alto contraste.
- 🚀 **Portabilidade Máxima (Sem Docker):** Utiliza **SQLite nativo** (`financial.db`), pronto para ser executado em qualquer máquina Windows sem instalar servidores externos.

---

## 📂 Documentação e Especificações

- 📘 [PROJECT_BLUEPRINT.md](PROJECT_BLUEPRINT.md): Arquitetura completa e roadmap de implementação das 6 fases.
- 📋 [docs/SPEC.md](docs/SPEC.md): Requisitos funcionais, regras de negócio (RN01 a RN04) e casos de uso.
- 🗄️ [docs/DATA_MODEL.md](docs/DATA_MODEL.md): Mapeamento de entidades e tabelas relacionais SQLite.
- 🤖 [docs/GEMINI_PDF_PIPELINE.md](docs/GEMINI_PDF_PIPELINE.md): Pipeline multimodal de extração e schema Pydantic para o Gemini.

---

## 🛠️ Tecnologias Utilizadas

- **Backend:** Python 3.11+, FastAPI, SQLAlchemy 2.0 (assíncrono), Pydantic v2.
- **Banco de Dados:** SQLite nativo com `aiosqlite`.
- **Inteligência Artificial:** Google Gemini 2.5 Flash via SDK oficial `google-genai`.
- **Frontend:** React 18/19, TypeScript, Vite, Tailwind CSS, Lucide Icons, Radix UI.

---

## 🚀 Como Executar o Projeto (1 Clique)

### Opção 1: Clique Duplo no Windows
Basta dar um duplo clique no arquivo [`iniciar_financeiro.bat`](iniciar_financeiro.bat) (ou [`start.bat`](start.bat)).  
O script inicializa o backend FastAPI, conecta o banco SQLite, serve o frontend React e abre o navegador automaticamente em **`http://localhost:8000`**.

### Opção 2: Via Terminal PowerShell
```powershell
# Execução direta pelo script de inicialização
.\iniciar_financeiro.bat

# Ou iniciando o servidor via CLI utilitário
& ".\backend\.venv\Scripts\python.exe" "scripts\fo_cli.py" server
```

---

## 🛠️ Comandos Rápidos da CLI (`fo_cli.py`)

```powershell
$py = ".\backend\.venv\Scripts\python.exe"
$cli = ".\scripts\fo_cli.py"

# Resumo mensal e rateio familiar (Rafael, Mãe, Irmã)
& $py $cli summary --month 2026-11

# Listar contas pendentes de pagamento
& $py $cli list --pending-only

# Alternar status de pagamento (dar baixa na dívida)
& $py $cli toggle-paid <ID>

# Cadastrar despesa manual
& $py $cli add --desc "Supermercado" --value 150.0 --owner "Rafael" --cat "Mercado"

# Extrair fatura PDF usando o Gemini IA
& $py $cli extract "caminho\fatura.pdf" --confirm

# Rodar auditoria completa de rotas da API
& $py $cli validate
```

---

## 🧪 Testes Automatizados

O projeto conta com **105 testes automatizados** (unitários, de integração, regras de negócio e testes adversariais):
```powershell
cd backend
& ".\.venv\Scripts\python.exe" -m pytest
& ".\.venv\Scripts\python.exe" tests\validate_all_routes.py
```
