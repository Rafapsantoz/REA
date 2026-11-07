# 🎯 RPsec DDTank Bot — Diretrizes de Engenharia & Monetização

> **Subprojeto:** RPsec DDTank Bot (Sky City & Automação Gaming)  
> **Squad Responsável:** `agent_automation_core`, `agent_vision`, `agent_math_ballistics`, `agent_product_gaming`, `agent_devops_auth`, `agent_growth_biz`.

---

## 🎯 Propósito do Produto
Gerar **caixa rápido e receita recorrente** para a RPsecti Soluções Inteligentes através de automação de alto desempenho, não-invasiva e confiável para instâncias competitivas de DDTank (Sky City).

---

## ⚙️ Diretrizes Técnicas & de Segurança

1. **Visão Computacional Não-Invasiva:** Toda leitura de estado (minimapa, barras de vento, turnos de Boss) deve ser feita exclusivamente via captura de tela ultrarrápida (MSS/OpenCV) e nunca por injeção de memória de processos.
2. **Tempo de Resposta em Tempo Real:** Ciclo de captura + processamento de imagem inferior a 10ms por frame.
3. **Simulação Humana com Jitter:** Inclusão de ruído gaussiano (delays randômicos entre 15ms e 45ms) para evitar padrões robóticos de clique e input.
4. **Orquestração Multi-Janela:** Gerenciamento dos 4 quadrantes (tela principal com atirador e 3 instâncias de suporte/fake com aceleração e suicídio de turnos).
5. **Licenciamento & Proteção HWID:** Compilação com proteção de código e amarração de licença ao identificador de hardware do cliente (HWID) antes da distribuição comercial.
