# 💰 RPsec Balcão — Diretrizes do App de Controle Financeiro

> **Subprojeto:** RPsec Balcão (SalgadoFácil)  
> **Squad Responsável:** `dev_financas_fullstack`, `dev2_ui_ux`, `qa_tester` sob supervisão do CTO Marcus.

---

## 🎯 Propósito do Produto
Criar a ferramenta de balcão e gestão financeira diária mais simples do mercado brasileiro, desenvolvida especificamente para pequenos comércios de alimentação (como a salgaderia da família) e MEIs que não toleram sistemas contábeis complexos.

---

## ⚠️ Regras Inegociáveis de UX & Engenharia

1. **A Regra dos 5 Segundos:** Registrar uma venda completa de 1 salgado e 1 bebida não pode demorar mais que 5 segundos nem exigir mais de 3 toques na tela.
2. **Touch-First & Botões Grandes:** Interface otimizada para tablets ou telas touch de notebooks antigos. Botões coloridos, contraste alto, fontes legíveis.
3. **Zero Burocracia Contábil:** Sem plano de contas complexo, sem códigos fiscais (NCM) obrigatórios no MVP, sem popups bloqueantes.
4. **Fechamento de Caixa Cristalino:** Ao final do dia, o comerciante precisa saber exatamente:
   - Quanto entrou no caixa (total e discriminado por Pix, Dinheiro, Cartão de Débito/Crédito e Fiado).
   - Quanto saiu em despesas (ingredientes, gás, retiradas).
   - Qual foi o lucro líquido real do dia.
5. **Stack Tecnológica:**
   - React 19 + TypeScript + Vite
   - TailwindCSS + Lucide Icons
   - Persistência local ágil (LocalStorage / IndexedDB) preparada para sincronização via Supabase/FastAPI.
6. **Validação de Build Obrigatória:** Sempre execute o build de verificação antes de concluir tarefas:
   `cmd /c "npm --prefix rpsec_balcao run build"`
