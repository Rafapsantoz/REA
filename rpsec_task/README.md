# 📋 RPsec Task (Momentum) — Demand & Task Organizer

> Sistema moderno, ágil e visual de gestão de demandas e tarefas no estilo Kanban / Trello aprimorado, desenvolvido para alta produtividade pessoal e profissional da **RPsecti Soluções Inteligentes**.

[![React](https://img.shields.io/badge/React-19.0-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.0-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## 🎯 Sobre o Produto

O **RPsec Task** supera as limitações dos organizadores convencionais, unindo **Kanban visual** com **gestão por horizontes temporais** e categorização temática de demandas.

O sistema opera com persistência local em navegador (`localStorage`) por padrão e conta com arquitetura desacoplada em camada de serviço (`src/lib/api.ts` e `src/lib/local-db.ts`), permitindo integração transparente com APIs backend REST (FastAPI / PostgreSQL).

---

## ✨ Principais Funcionalidades

- **🗂️ Quadro Kanban Dinâmico (`@dnd-kit`):**
  - Colunas intuitivas: **Pendente**, **Em Andamento**, **Concluído** e **Atrasado** (*Overdue* calculado dinamicamente com base no *deadline*).
  - Drag-and-drop fluido para movimentação rápida de status.

- **⏱️ 4 Horizontes de Planejamento:**
  - **Diário:** Tarefas prioritárias do dia.
  - **Semanal:** Objetivos e entregas da semana corrente.
  - **Mensal:** Marcos e projetos do mês.
  - **Longo Prazo:** Metas estratégicas e visões futuras.

- **🏷️ Categorização Inteligente:**
  - Separação clara entre **Trabalho**, **Pessoal** e **Financeiro**.
  - Tags visuais e filtros rápidos por categoria no menu lateral.

- **👤 Perfil & Autenticação:**
  - Sistema de login com persistência de sessão e segurança por hash SHA-256.
  - Camada de seeds com usuário de demonstração e dados de exemplo.

- **🌐 Internacionalização & Temas:**
  - Suporte a i18n com chaveamento de idioma.
  - Interface construída com **shadcn/ui** e Tailwind CSS com Dark/Light mode responsivo.

---

## 🏛️ Estrutura de Pastas

```text
rpsec_task/
├── src/
│   ├── components/       # Componentes visuais (Kanban, Sidebar, Demand Dialog, UI shadcn)
│   ├── hooks/            # Custom hooks (useAuth, useDemands, useCategories com React Query)
│   ├── lib/              # Lógica de negócio, API client, Local DB, Seed e regras de domínios
│   ├── pages/            # Telas da aplicação (Board/Kanban, Login, NotFound)
│   ├── types/            # Tipagem TypeScript estrita (Users, ListDoapp, CategoriesDoapp, Horizon)
│   ├── App.tsx           # Provedores de contexto, tema e rotas
│   └── main.tsx          # Ponto de entrada da aplicação
├── public/               # Ativos estáticos e ícones
├── index.html            # Estrutura HTML principal
├── package.json          # Dependências e scripts
├── tailwind.config.ts    # Configuração de design system Tailwind
├── vite.config.ts        # Configuração do bundler Vite
├── AGENTS.md             # Diretrizes específicas do subprojeto
└── iniciar_task.bat      # Script de inicialização rápida no Windows
```

---

## 🚀 Como Executar Localmente

### Opção 1: Executável Rápido (Windows)
Basta dar dois cliques no arquivo:
```cmd
iniciar_task.bat
```

### Opção 2: Linha de Comando

```bash
# 1. Acesse o diretório
cd rpsec_task

# 2. Instale as dependências
npm install
# ou: pnpm install

# 3. Inicie o servidor de desenvolvimento
npm run dev
```

Acesse a aplicação no navegador em: [`http://localhost:5173`](http://localhost:5173)

---

## 🛠️ Scripts Disponíveis

| Comando | Descrição |
| :--- | :--- |
| `npm run dev` | Inicia o servidor Vite local com Hot Module Replacement (HMR) |
| `npm run build` | Executa o build de produção otimizado com TypeScript e Rollup |
| `npm run preview` | Visualiza o build de produção localmente |
| `npm run lint` | Executa o linter ESLint em todo o código-fonte |

---

## 🏢 Metodologia & Governança

Desenvolvido sob as diretrizes de engenharia de software da **RPsecti Soluções Inteligentes**, priorizando:
- **Leveza Inegociável:** Sem peso extra ou dependências desnecessárias.
- **Tipagem Rigorosa:** 100% TypeScript com validação de esquema.
- **UX Touch & Desktop:** Fluidez visual e navegação sem atrito.
