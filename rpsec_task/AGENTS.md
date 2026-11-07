# 📋 RPsec Task — Diretrizes de Gestão de Tarefas & Produtividade

> **Subprojeto:** RPsec Task (Momentum / Demand Organizer)  
> **Squad Responsável:** `dev_financas_fullstack`, `dev2_ui_ux`, `qa_tester`, supervisionado pelo CTO Marcus.

---

## 🎯 Propósito do Produto
Criar uma plataforma de gestão de demandas ágil, visual e superior ao Trello, combinando **Quadro Kanban dinâmico** com **gestão por horizontes temporais** (Diário, Semanal, Mensal e Longo Prazo) e categorização temática (Trabalho, Pessoal, Financeiro).

---

## ⚠️ Regras Inegociáveis de UX & Engenharia

1. **Kanban Visual Fluido:**
   - Colunas: **Pendente**, **Em Andamento**, **Concluído** e **Atrasado** (*Overdue* derivado dinamicamente do *deadline*).
   - Arraste de cartões dinâmico com `@dnd-kit/core`.

2. **Horizontes de Tempo Transparentes:**
   - Alternância instantânea no menu lateral entre visões: *Diário*, *Semanal*, *Mensal*, *Longo Prazo* ou *Todas*.
   - Sugestão inteligente de horizonte temporal com base na data de entrega.

3. **Arquitetura Desacoplada:**
   - Persistência local ágil (`local-db.ts` em `localStorage`) para operação autônoma offline.
   - Camada de abstração de API (`src/lib/api.ts`) pronta para plugar em backend FastAPI ou Postgres/Supabase sem refatorar componentes.

4. **Stack Tecnológica:**
   - React 19 + TypeScript + Vite.
   - Tailwind CSS + shadcn/ui + TanStack Query.
   - Suporte a internacionalização (i18n).

5. **Validação de Build Obrigatória:**
   - Antes de qualquer commit, garanta que a compilação do TypeScript e Vite passe com 0 erros:
   `cmd /c "npm --prefix rpsec_task run build"`
