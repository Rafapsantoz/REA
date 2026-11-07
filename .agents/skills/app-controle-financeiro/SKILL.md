---
name: app-controle-financeiro
description: >-
  Instruções completas para projetar, desenvolver, testar e expandir o App de Controle Financeiro (RPsec Balcão / SalgadoFácil). Ative quando o usuário trabalhar em vendas, PDV, produtos, despesas, fluxo de caixa diário ou telas para microempreendedores.
---

# 💰 Desenvolvimento do App de Controle Financeiro (RPsec Balcão)

Esta skill orienta o desenvolvimento de funcionalidades para o aplicativo de controle financeiro da RPsecti Soluções Inteligentes.

## 📌 Premissas de Negócio e de Usabilidade
- **Perfil do Usuário Principal:** Mãe do fundador e microempreendedores que operam na correria do balcão e não têm tempo ou paciência para telas com muitos campos.
- **Regra dos 5 Segundos:** Fechar uma venda deve levar no máximo 3 toques e menos de 5 segundos.
- **Visual:** Cards grandes, fontes legíveis, cores distintivas para produtos (ex: coxinhas, bebidas, doces) e botões de ação com alto contraste.

## 🛠️ Arquitetura Técnica
- **Diretório:** `rpsec_balcao/`
- **Tecnologias:** React 19, TypeScript, Vite, TailwindCSS, Lucide React.
- **Módulos Principais:**
  1. `PDV Balcão (PosView.tsx)`: Grade de seleção rápida, comanda/carrinho ágil, botões de pagamento direto (Pix, Dinheiro, Cartão de Crédito/Débito, Fiado).
  2. `Despesas (ExpensesView.tsx)`: Lançamento em 3 campos (Valor, Descrição, Categoria).
  3. `Resumo Diário (DailySummaryView.tsx)`: Total arrecadado no dia (discriminado por método de pagamento), total gasto em despesas e saldo líquido real.
  4. `Catálogo de Produtos (ProductsView.tsx)`: Cadastro instantâneo de novos itens com categoria e preço unitário.

## 📋 Checklist de Validação de Código
Antes de finalizar qualquer alteração neste módulo:
1. Verifique se o código compila perfeitamente:
   ```bash
   cmd /c "npm --prefix rpsec_balcao run build"
   ```
2. Garanta que o estado persiste localmente para não perder dados ao atualizar a página.
3. Certifique-se de que nenhum campo desnecessário foi adicionado à experiência do usuário.
