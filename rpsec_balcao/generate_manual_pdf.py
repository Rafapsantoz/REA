import os
import subprocess

html_content = """<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>Manual de Operação e Guia do Usuário — RPsec Balcão</title>
<style>
  @page {
    size: A4 portrait;
    margin: 15mm 14mm 16mm 14mm;
    @bottom-center {
      content: "RPsec Balcão v1.3.0  •  RPsecti Soluções Inteligentes  •  Página " counter(page);
      font-size: 8pt;
      font-family: 'Segoe UI', Helvetica, Arial, sans-serif;
      color: #78716c;
      font-weight: 600;
    }
  }

  @page:first {
    margin: 0;
    @bottom-center { content: ""; }
  }

  * {
    box-sizing: border-box;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  body {
    margin: 0;
    padding: 0;
    font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif;
    color: #1c1917;
    background-color: #ffffff;
    font-size: 9.6pt;
    line-height: 1.5;
  }

  .page-break {
    page-break-after: always;
  }

  .avoid-break {
    page-break-inside: avoid;
  }

  /* ====== CAPA ELEGANTE ====== */
  .cover {
    height: 100vh;
    padding: 56px 44px;
    background: linear-gradient(145deg, #7f1d1d 0%, #b91c1c 45%, #ea580c 85%, #d97706 100%);
    color: #ffffff;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    position: relative;
    overflow: hidden;
  }

  .cover::before {
    content: "";
    position: absolute;
    top: -120px;
    right: -120px;
    width: 420px;
    height: 420px;
    background: radial-gradient(circle, rgba(251, 191, 36, 0.25) 0%, rgba(251, 191, 36, 0) 70%);
    border-radius: 50%;
  }

  .cover-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 2px solid rgba(254, 240, 138, 0.35);
    padding-bottom: 20px;
  }

  .cover-brand {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .cover-logo-icon {
    width: 52px;
    height: 52px;
    background: #fbbf24;
    color: #7f1d1d;
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24pt;
    font-weight: 900;
    box-shadow: 0 10px 25px rgba(0,0,0,0.3);
    border: 3px solid #fef08a;
  }

  .cover-brand-text h2 {
    margin: 0;
    font-size: 16pt;
    font-weight: 900;
    letter-spacing: -0.5px;
    color: #ffffff;
    text-transform: uppercase;
  }

  .cover-brand-text p {
    margin: 2px 0 0 0;
    font-size: 8.5pt;
    color: #fef08a;
    font-weight: 700;
    letter-spacing: 1px;
    text-transform: uppercase;
  }

  .cover-pill {
    background: rgba(251, 191, 36, 0.2);
    border: 1.5px solid #fbbf24;
    color: #fef08a;
    padding: 6px 14px;
    border-radius: 30px;
    font-size: 8.5pt;
    font-weight: 800;
    letter-spacing: 0.5px;
    text-transform: uppercase;
  }

  .cover-body {
    margin-top: 36px;
    margin-bottom: 36px;
  }

  .cover-badge-tech {
    display: inline-block;
    background: #fbbf24;
    color: #450a0a;
    padding: 5px 12px;
    border-radius: 8px;
    font-size: 8.5pt;
    font-weight: 900;
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 18px;
  }

  .cover-title {
    font-size: 34pt;
    font-weight: 900;
    line-height: 1.1;
    margin: 0 0 14px 0;
    letter-spacing: -1px;
    color: #ffffff;
    text-shadow: 0 3px 12px rgba(0,0,0,0.3);
  }

  .cover-subtitle {
    font-size: 13pt;
    line-height: 1.45;
    color: #ffedd5;
    font-weight: 500;
    max-width: 620px;
    margin: 0 0 28px 0;
  }

  .cover-highlights {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 14px;
    max-width: 680px;
    margin-top: 20px;
  }

  .cover-highlight-card {
    background: rgba(0, 0, 0, 0.22);
    border: 1px solid rgba(254, 240, 138, 0.25);
    border-radius: 14px;
    padding: 14px 12px;
    backdrop-filter: blur(4px);
  }

  .cover-highlight-card .num {
    font-size: 15pt;
    font-weight: 900;
    color: #fbbf24;
    display: block;
    margin-bottom: 3px;
  }

  .cover-highlight-card .lbl {
    font-size: 7.8pt;
    font-weight: 700;
    color: #fed7aa;
    text-transform: uppercase;
    line-height: 1.3;
  }

  .cover-footer {
    border-top: 1px solid rgba(254, 240, 138, 0.3);
    padding-top: 18px;
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    font-size: 8.5pt;
    color: #fed7aa;
  }

  .cover-footer strong {
    color: #ffffff;
    font-weight: 800;
  }

  /* ====== ESTRUTURA GERAL DO MIOLO ====== */
  .header-rule {
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 2px solid #ea580c;
    padding-bottom: 6px;
    margin-bottom: 18px;
  }

  .header-rule .doc-tag {
    font-size: 7.5pt;
    font-weight: 800;
    color: #c2410c;
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  .header-rule .doc-ver {
    font-size: 7.5pt;
    font-weight: 700;
    color: #78716c;
  }

  h1 {
    font-size: 17pt;
    font-weight: 900;
    color: #991b1b;
    margin: 0 0 12px 0;
    letter-spacing: -0.5px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  h2 {
    font-size: 12pt;
    font-weight: 800;
    color: #7c2d12;
    margin: 14px 0 8px 0;
    border-left: 4px solid #ea580c;
    padding-left: 8px;
  }

  h3 {
    font-size: 10pt;
    font-weight: 800;
    color: #1c1917;
    margin: 12px 0 5px 0;
  }

  p {
    margin: 0 0 9px 0;
    color: #292524;
  }

  /* ====== COMPONENTES VISUAIS & CAIXAS ====== */
  .callout {
    border-radius: 10px;
    padding: 10px 13px;
    margin: 12px 0;
    display: flex;
    gap: 10px;
    align-items: flex-start;
  }

  .callout-icon {
    font-size: 13pt;
    line-height: 1;
    shrink: 0;
  }

  .callout-content {
    flex: 1;
  }

  .callout-content strong {
    display: block;
    margin-bottom: 2px;
    font-size: 9.2pt;
  }

  .callout-content p {
    margin: 0;
    font-size: 8.6pt;
    line-height: 1.4;
  }

  .callout-amber {
    background: #fffbeb;
    border: 1.5px solid #fcd34d;
    color: #78350f;
  }

  .callout-emerald {
    background: #ecfdf5;
    border: 1.5px solid #6ee7b7;
    color: #064e3b;
  }

  .callout-rose {
    background: #fff1f2;
    border: 1.5px solid #fda4af;
    color: #881337;
  }

  .callout-stone {
    background: #f5f5f4;
    border: 1.5px solid #d6d3d1;
    color: #292524;
  }

  /* ====== PASSO A PASSO ILUSTRADO ====== */
  .step-list {
    margin: 10px 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .step-item {
    display: flex;
    gap: 12px;
    background: #fafaf9;
    border: 1px solid #e7e5e4;
    border-radius: 10px;
    padding: 10px 12px;
    align-items: flex-start;
  }

  .step-num {
    width: 25px;
    height: 25px;
    background: #ea580c;
    color: #ffffff;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 8.5pt;
    font-weight: 900;
    flex-shrink: 0;
    box-shadow: 0 2px 4px rgba(234, 88, 12, 0.25);
  }

  .step-details {
    flex: 1;
  }

  .step-details h4 {
    margin: 0 0 2px 0;
    font-size: 9.4pt;
    font-weight: 800;
    color: #1c1917;
  }

  .step-details p {
    margin: 0;
    font-size: 8.5pt;
    color: #44403c;
    line-height: 1.35;
  }

  /* ====== TABELAS ====== */
  table.custom-table {
    width: 100%;
    border-collapse: collapse;
    margin: 10px 0;
    font-size: 8.5pt;
  }

  table.custom-table th {
    background: #991b1b;
    color: #ffffff;
    font-weight: 800;
    text-align: left;
    padding: 6px 9px;
    border: 1px solid #7f1d1d;
  }

  table.custom-table td {
    padding: 6px 9px;
    border: 1px solid #e7e5e4;
    color: #292524;
  }

  table.custom-table tr:nth-child(even) td {
    background: #fafaf9;
  }

  /* ====== DIAGRAMA DO FLUXO DIÁRIO ====== */
  .timeline-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 8px;
    margin: 12px 0;
  }

  .timeline-card {
    border-radius: 10px;
    padding: 10px;
    text-align: center;
    border: 1.5px solid transparent;
  }

  .timeline-card.t-morning { background: #fffbeb; border-color: #fde68a; }
  .timeline-card.t-day { background: #eff6ff; border-color: #bfdbfe; }
  .timeline-card.t-evening { background: #fdf2f8; border-color: #fbcfe8; }
  .timeline-card.t-night { background: #ecfdf5; border-color: #a7f3d0; }

  .timeline-icon { font-size: 16pt; margin-bottom: 4px; }
  .timeline-title { font-size: 8.5pt; font-weight: 900; text-transform: uppercase; color: #1c1917; margin-bottom: 3px; }
  .timeline-desc { font-size: 7.5pt; color: #57534e; line-height: 1.3; }

  /* ====== FÓRMULAS & RECIBOS ====== */
  .formula-card {
    background: #1c1917;
    color: #fef08a;
    border-radius: 10px;
    padding: 10px 14px;
    margin: 10px 0;
    border-left: 5px solid #fbbf24;
    font-family: 'Consolas', 'Courier New', monospace;
    font-size: 9pt;
    line-height: 1.4;
  }

  .formula-title {
    font-size: 7.5pt;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: #d6d3d1;
    margin-bottom: 4px;
    font-family: 'Segoe UI', sans-serif;
    font-weight: 700;
  }

  .receipt-box {
    background: #f0fdf4;
    border: 2px dashed #86efac;
    border-radius: 10px;
    padding: 10px 14px;
    margin: 10px 0;
    font-family: 'Consolas', monospace;
    font-size: 8.2pt;
    color: #14532d;
    white-space: pre-wrap;
    line-height: 1.35;
  }

  .badge-tag {
    display: inline-block;
    padding: 2px 7px;
    border-radius: 5px;
    font-size: 7.2pt;
    font-weight: 800;
    text-transform: uppercase;
    vertical-align: middle;
  }
  .b-green { background: #dcfce7; color: #166534; border: 1px solid #86efac; }
  .b-red { background: #fee2e2; color: #991b1b; border: 1px solid #fca5a5; }
  .b-amber { background: #fef3c7; color: #92400e; border: 1px solid #fcd34d; }
  .b-blue { background: #e0f2fe; color: #075985; border: 1px solid #7dd3fc; }

  /* Sumário */
  .toc-container {
    background: #fafaf9;
    border: 1px solid #e7e5e4;
    border-radius: 12px;
    padding: 16px 20px;
    margin: 14px 0;
  }

  .toc-item {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    padding: 5px 0;
    border-bottom: 1px dotted #d6d3d1;
    font-size: 8.8pt;
  }

  .toc-item strong {
    color: #7c2d12;
    font-weight: 800;
  }

  .toc-item span.p-num {
    color: #ea580c;
    font-weight: 800;
    font-size: 8.8pt;
  }

</style>
</head>
<body>

<!-- ============================================== -->
<!-- PÁGINA 1: CAPA DO MANUAL -->
<!-- ============================================== -->
<div class="cover page-break">
  <div class="cover-header">
    <div class="cover-brand">
      <div class="cover-logo-icon">🏪</div>
      <div class="cover-brand-text">
        <h2>RPsecti Soluções Inteligentes</h2>
        <p>Divisão de Software e Operações de Varejo</p>
      </div>
    </div>
    <div class="cover-pill">Manual Oficial • v1.3.0</div>
  </div>

  <div class="cover-body">
    <div class="cover-badge-tech">Guia Definitivo de Operação & Boas Práticas</div>
    <h1 class="cover-title">RPsec Balcão</h1>
    <div class="cover-subtitle">
      Manual Operacional do Ponto de Venda (PDV), Fundo de Troco, Comandas de Consumo no Local, Controle de Gaveta e Fechamento de Caixa.
    </div>

    <div class="cover-highlights">
      <div class="cover-highlight-card">
        <span class="num">⚡ 5 Segundos</span>
        <span class="lbl">Tempo máximo para registrar e finalizar uma venda completa</span>
      </div>
      <div class="cover-highlight-card">
        <span class="num">🔒 Batimento 100%</span>
        <span class="lbl">Fórmula de conferência cega contra quebras de caixa</span>
      </div>
      <div class="cover-highlight-card">
        <span class="num">📲 1 Toque</span>
        <span class="lbl">Extrato financeiro com rateio direto no WhatsApp dos sócios</span>
      </div>
    </div>
  </div>

  <div class="cover-footer">
    <div>
      <strong>RPsec Balcão / SalgadoFácil</strong><br>
      Foco: Salgaderias, Lanchonetes, Padarias e Microempreendedores (MEI)
    </div>
    <div style="text-align: right;">
      Diretoria Técnica & Produto: <strong>RPsecti</strong><br>
      Data da Edição: <strong>Novembro / 2026</strong>
    </div>
  </div>
</div>

<!-- ============================================== -->
<!-- PÁGINA 2: SUMÁRIO & CICLO DIÁRIO -->
<!-- ============================================== -->
<div class="page-break">
  <div class="header-rule">
    <span class="doc-tag">Manual do Usuário • RPsec Balcão</span>
    <span class="doc-ver">Versão 1.3.0</span>
  </div>

  <h1>📋 Sumário Executivo</h1>
  <p>Este documento foi elaborado para capacitar proprietários, gerentes e balconistas a operarem o <strong>RPsec Balcão</strong> com velocidade máxima, segurança contábil e zero atrito operacional.</p>

  <div class="toc-container">
    <div class="toc-item"><span><strong>1.</strong> Abertura de Caixa & Fundo de Troco Inicial</span><span class="p-num">Página 3</span></div>
    <div class="toc-item"><span><strong>2.</strong> O PDV / Balcão (Vendas em Menos de 3 Toques)</span><span class="p-num">Página 4</span></div>
    <div class="toc-item"><span><strong>3.</strong> Comandas de Consumo no Local (Mesas & Fila)</span><span class="p-num">Página 5</span></div>
    <div class="toc-item"><span><strong>4.</strong> Vendas no Fiado & Quitação Posterior</span><span class="p-num">Página 6</span></div>
    <div class="toc-item"><span><strong>5.</strong> Movimentações do Meio do Dia (Sangria vs. Suprimento)</span><span class="p-num">Página 7</span></div>
    <div class="toc-item"><span><strong>6.</strong> Registro de Saídas & Despesas Operacionais</span><span class="p-num">Página 8</span></div>
    <div class="toc-item"><span><strong>7.</strong> Fechamento de Caixa & Batimento da Gaveta</span><span class="p-num">Página 9</span></div>
    <div class="toc-item"><span><strong>8.</strong> Extrato Automático no WhatsApp & Histórico</span><span class="p-num">Página 10</span></div>
    <div class="toc-item"><span><strong>9.</strong> Ficha Técnica & Custos de Produção</span><span class="p-num">Página 11</span></div>
    <div class="toc-item"><span><strong>10.</strong> Segurança, Backup de Dados & Modo Escuro</span><span class="p-num">Página 12</span></div>
    <div class="toc-item"><span><strong>11.</strong> Guia Rápido de Resolução de Dúvidas (FAQ)</span><span class="p-num">Página 13</span></div>
  </div>

  <h2>🎯 Princípio Norteador: A Regra dos 5 Segundos</h2>
  <div class="callout callout-amber avoid-break">
    <div class="callout-icon">💡</div>
    <div class="callout-content">
      <strong>Velocidade no Atendimento Presencial</strong>
      <p>Em um balcão movimentado de salgados, o cliente quer pegar o alimento, pagar e sair rapidamente. O atendente não pode perder tempo navegando por menus complexos ou preenchendo cadastros burocráticos. Toda a interface foi projetada com botões grandes, contraste de alto impacto e toques diretos.</p>
    </div>
  </div>

  <h2>🕒 O Ciclo Diário de Trabalho (Linha do Tempo)</h2>
  <div class="timeline-grid avoid-break">
    <div class="timeline-card t-morning">
      <div class="timeline-icon">☀️</div>
      <div class="timeline-title">1. Manhã</div>
      <div class="timeline-desc">Abrir o caixa informando o troco inicial deixado na gaveta física.</div>
    </div>
    <div class="timeline-card t-day">
      <div class="timeline-icon">🌮</div>
      <div class="timeline-title">2. Atendimento</div>
      <div class="timeline-desc">Vender rápido, abrir comandas de mesas e receber no Pix, Dinheiro ou Cartão.</div>
    </div>
    <div class="timeline-card t-evening">
      <div class="timeline-icon">💸</div>
      <div class="timeline-title">3. Meio do Dia</div>
      <div class="timeline-desc">Lançar retiradas (Sangrias) e reforço de moedas (Suprimentos).</div>
    </div>
    <div class="timeline-card t-night">
      <div class="timeline-icon">🌙</div>
      <div class="timeline-title">4. Fechamento</div>
      <div class="timeline-desc">Contar gaveta física, bater a diferença e enviar extrato no WhatsApp.</div>
    </div>
  </div>
</div>

<!-- ============================================== -->
<!-- PÁGINA 3: MÓDULO 1 — ABERTURA DE CAIXA -->
<!-- ============================================== -->
<div class="page-break">
  <div class="header-rule">
    <span class="doc-tag">Capítulo 1 • Abertura e Fundo de Troco</span>
    <span class="doc-ver">RPsec Balcão v1.3.0</span>
  </div>

  <h1>🟢 Abertura de Caixa & Fundo de Troco</h1>
  <p>O <strong>Fundo de Troco</strong> (também chamado de caixa inicial ou flutuante) é a quantia em dinheiro vivo (moedas e cédulas miúdas) colocada na gaveta antes de começar a atender o primeiro cliente da manhã.</p>

  <h2>Por Que a Abertura é Obrigatória para a Saúde Financeira?</h2>
  <p>Se você colocar R$ 50,00 de troco na gaveta e não avisar o sistema, no fim do dia parecerá que sobrou R$ 50,00 no faturamento. O RPsec Balcão isola o seu troco do lucro real de vendas.</p>

  <div class="callout callout-emerald avoid-break">
    <div class="callout-icon">🛡️</div>
    <div class="callout-content">
      <strong>Como o Sistema Sinaliza o Status no Topo da Tela:</strong>
      <p>• <span class="badge-tag b-amber">🔒 Caixa Fechado</span>: O dia ainda não começou. O sistema convida você a abrir com 1 toque.<br>
         • <span class="badge-tag b-green">🟢 Caixa Aberto (Fundo: R$ 50,00)</span>: O caixa está pronto para registrar vendas e monitorar a gaveta física em tempo real.</p>
    </div>
  </div>

  <h2>Passo a Passo de Abertura (Em Menos de 10 Segundos)</h2>
  <div class="step-list avoid-break">
    <div class="step-item">
      <div class="step-num">1</div>
      <div class="step-details">
        <h4>Toque no Botão de Status</h4>
        <p>No cabeçalho superior (ao lado do relógio) ou no aviso pontilhado no alto do PDV, clique em <strong>"Caixa Fechado"</strong> ou vá na aba <strong>"Resumo do Dia"</strong>.</p>
      </div>
    </div>
    <div class="step-item">
      <div class="step-num">2</div>
      <div class="step-details">
        <h4>Escolha o Troco com 1 Toque</h4>
        <p>O sistema disponibiliza botões rápidos pré-configurados: <strong>Sem Troco (R$ 0)</strong>, <strong>R$ 30,00</strong>, <strong>R$ 50,00</strong>, <strong>R$ 100,00</strong>, <strong>R$ 150,00</strong> ou <strong>R$ 200,00</strong>. Caso utilize outro valor, basta digitar no campo ao lado.</p>
      </div>
    </div>
    <div class="step-item">
      <div class="step-num">3</div>
      <div class="step-details">
        <h4>Confirme e Comece a Vender</h4>
        <p>Clique no botão verde <strong>"ABRIR CAIXA"</strong>. O status muda imediatamente para verde e o turno está oficialmente aberto!</p>
      </div>
    </div>
  </div>

  <div class="callout callout-stone avoid-break">
    <div class="callout-icon">⚡</div>
    <div class="callout-content">
      <strong>E se eu começar a vender antes de abrir o caixa?</strong>
      <p>Não se preocupe! O RPsec Balcão não trava o seu atendimento se houver fila. Ele exibe um banner de lembrete no topo do PDV, permitindo que você realize a venda normalmente e abra o caixa assim que tiver um intervalo de 5 segundos.</p>
    </div>
  </div>
</div>

<!-- ============================================== -->
<!-- PÁGINA 4: MÓDULO 2 — PDV / VENDAS RÁPIDAS -->
<!-- ============================================== -->
<div class="page-break">
  <div class="header-rule">
    <span class="doc-tag">Capítulo 2 • Frente de Caixa & Vendas</span>
    <span class="doc-ver">RPsec Balcão v1.3.0</span>
  </div>

  <h1>🛒 O PDV / Balcão: Vendas em Alta Velocidade</h1>
  <p>A tela de vendas foi otimizada para toque rápido (touchscreen de tablet ou notebook). O atendente toca nos salgados com a mão direita e escolhe o pagamento com a mão esquerda.</p>

  <h2>Barra de Caixa no Topo do Balcão (3 Botões Rápidos)</h2>
  <p>Para manter o fluxo da salgaderia ágil e sem distrações, o atendente tem acesso imediato a 3 botões essenciais no topo do PDV:</p>
  <ul>
    <li><strong>🟢 Abrir o Caixa:</strong> Define o fundo de troco inicial (R$ 30, R$ 50, R$ 100...) em um único clique assim que o dia começa.</li>
    <li><strong>💸 Sangria (Retirar):</strong> Registra retiradas instantâneas em dinheiro (ex.: pagar botijão de gás ou fornecedor) sem sair da tela.</li>
    <li><strong>🔴 Fechar o Caixa:</strong> Abre o batimento de gaveta na hora, compara o dinheiro esperado com o dinheiro físico contado e gera o extrato formatado para envio no WhatsApp.</li>
  </ul>

  <h2>Componentes da Interface de Vendas</h2>
  <table class="custom-table avoid-break">
    <thead>
      <tr>
        <th style="width: 25%;">Área da Tela</th>
        <th style="width: 35%;">Função Principal</th>
        <th style="width: 40%;">Recursos de Agilidade</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Barra Superior de Caixa</strong></td>
        <td>Controle do turno no topo da tela</td>
        <td>3 Botões diretos: <strong>🟢 Abrir Caixa</strong>, <strong>💸 Sangria</strong> e <strong>🔴 Fechar Caixa</strong> sem sair do balcão.</td>
      </tr>
      <tr>
        <td><strong>Filtros de Categoria</strong></td>
        <td>Separa itens para visualização limpa</td>
        <td>Abas coloridas: <em>Todos</em>, <em>Salgados & Fritos</em>, <em>Bebidas</em> e <em>Sobremesas</em>.</td>
      </tr>
      <tr>
        <td><strong>Grade de Produtos</strong></td>
        <td>Cards gigantes com nome, categoria e valor</td>
        <td>1 Toque adiciona ao carrinho. Toques sucessivos aumentam a quantidade.</td>
      </tr>
      <tr>
        <td><strong>Carrinho / Balcão</strong></td>
        <td>Totalizador ao vivo à direita</td>
        <td>Botões de <strong>+</strong>, <strong>-</strong> e <strong>Lixeira</strong>. Subtotal atualizado em tempo real.</td>
      </tr>
      <tr>
        <td><strong>Painel de Pagamentos</strong></td>
        <td>Seleção do meio de quitação</td>
        <td>Botões de alto contraste: Pix, Dinheiro, Cartão Débito/Crédito e Fiado.</td>
      </tr>
    </tbody>
  </table>

  <h2>Dinheiro com Cálculo Automático de Troco</h2>
  <p>Ao selecionar a forma de pagamento <strong>Dinheiro</strong>, um campo numérico é ativado. Se o pedido deu R$ 14,00 e o cliente entrega uma nota de R$ 20,00:</p>
  <div class="callout callout-emerald avoid-break">
    <div class="callout-icon">💵</div>
    <div class="callout-content">
      <strong>Feedback Visual de Troco a Devolver:</strong>
      <p>O sistema destaca em letras grandes verdes: <strong>Troco a Devolver: R$ 6,00</strong>. Isso elimina erros matemáticos da atendente no calor da correria do horário de pico.</p>
    </div>
  </div>

  <h2>Contador Sequencial Diário de Pedidos (#1, #2, #3...)</h2>
  <p>Cada venda finalizada recebe um número de pedido sequencial (reiniciado a cada novo dia). Isso permite:</p>
  <ul>
    <li>Chamar o cliente pelo número do pedido enquanto o salgado esquenta ou o suco é preparado.</li>
    <li>Calcular a quantidade exata de clientes atendidos no dia e o <strong>Ticket Médio</strong> por pessoa.</li>
    <li>Identificar o horário de pico com maior volume de entradas.</li>
  </ul>
</div>

<!-- ============================================== -->
<!-- PÁGINA 5: MÓDULO 3 — COMANDAS DE CONSUMO NO LOCAL -->
<!-- ============================================== -->
<div class="page-break">
  <div class="header-rule">
    <span class="doc-tag">Capítulo 3 • Atendimento em Mesas e Balcão</span>
    <span class="doc-ver">RPsec Balcão v1.3.0</span>
  </div>

  <h1>🍽️ Comandas Abertas (Consumo no Local)</h1>
  <p>Muitos clientes preferem comer os salgados no balcão ou sentar nas mesas e <strong>pagar somente ao final</strong>. O balconista não pode confiar na memória ou na honestidade sem anotações.</p>

  <h2>Como Funciona a Fila Visual de Comandas</h2>
  <div class="step-list avoid-break">
    <div class="step-item">
      <div class="step-num">1</div>
      <div class="step-details">
        <h4>Adicione os Itens no Carrinho</h4>
        <p>Selecione os salgados e refrigerantes que o cliente está consumindo no momento (ex.: 2 Coxinhas + 1 Refrigerante).</p>
      </div>
    </div>
    <div class="step-item">
      <div class="step-num">2</div>
      <div class="step-details">
        <h4>Toque no botão "🍽️ CONSUMO LOCAL (Abrir Comanda)"</h4>
        <p>Localizado em destaque amarelo tátil no rodapé do carrinho, logo acima de <strong>FINALIZAR VENDA</strong>. Abre uma janela rápida com atalhos de 1 toque: <em>Mesa 1</em>, <em>Mesa 2</em>, <em>Mesa 3</em>, <em>Mesa 4</em>, <em>Balcão</em> ou campo livre para apelidos (ex.: "Rapaz de Boné Azul").</p>
      </div>
    </div>
    <div class="step-item">
      <div class="step-num">3</div>
      <div class="step-details">
        <h4>A Comanda Fica Flutuando no Topo</h4>
        <p>O carrinho zera para você atender o próximo da fila, e um card amarelado elegante da comanda fica aguardando no topo do PDV com número único e horário.</p>
      </div>
    </div>
    <div class="step-item">
      <div class="step-num">4</div>
      <div class="step-details">
        <h4>O Cliente Pediu Mais? Sem Problemas!</h4>
        <p>Basta clicar no card da comanda para reabri-la. Adicione o novo suco ou doce e salve novamente. Ela é atualizada na hora.</p>
      </div>
    </div>
    <div class="step-item">
      <div class="step-num">5</div>
      <div class="step-details">
        <h4>Hora de Pagar e Liberar</h4>
        <p>Quando o cliente disser *"Quero fechar a conta"*, clique na comanda dele. O carrinho é carregado com o total exato. Escolha a forma de pagamento (Pix, Dinheiro ou Cartão) e clique em **FINALIZAR VENDA**. A comanda some da fila automaticamente!</p>
      </div>
    </div>
  </div>

  <div class="callout callout-amber avoid-break">
    <div class="callout-icon">✨</div>
    <div class="callout-content">
      <strong>Controle Antiduplicação Automático:</strong>
      <p>O motor do RPsec Balcão sincroniza a numeração das comandas com o contador de vendas. Nunca haverá duas comandas com o mesmo número `#1` no mesmo dia, mantendo a organização impecável entre garçons e operadores.</p>
    </div>
  </div>
</div>

<!-- ============================================== -->
<!-- PÁGINA 6: MÓDULO 4 — VENDAS NO FIADO & QUITAÇÃO -->
<!-- ============================================== -->
<div class="page-break">
  <div class="header-rule">
    <span class="doc-tag">Capítulo 4 • Controle de Fiado & Contas a Receber</span>
    <span class="doc-ver">RPsec Balcão v1.3.0</span>
  </div>

  <h1>📝 Gestão de Fiado & Quitações Posteriores</h1>
  <p>Vender fiado para vizinhos, conhecidos ou trabalhadores de obras ao redor é a realidade de quase toda salgaderia brasileira. O problema é perder o controle do caderno e tomar prejuízo.</p>

  <h2>Como Registrar um Fiado na Hora da Venda</h2>
  <div class="step-list avoid-break">
    <div class="step-item">
      <div class="step-num">1</div>
      <div class="step-details">
        <h4>Selecione a Forma "Fiado" no Carrinho</h4>
        <p>O sistema abre o painel de seleção e cadastro do cliente imediatamente.</p>
      </div>
    </div>
    <div class="step-item">
      <div class="step-num">2</div>
      <div class="step-details">
        <h4>Cliente Já Cadastrado vs. Novo Cliente</h4>
        <p>• <strong>Cliente Existente:</strong> Selecione na lista suspensa (o sistema já avisa quanto ele já deve no total acumulado).<br>
           • <strong>Novo Cliente (Cadastro na Hora):</strong> Digite o Nome e o WhatsApp dele sem sair da tela de venda.</p>
      </div>
    </div>
    <div class="step-item">
      <div class="step-num">3</div>
      <div class="step-details">
        <h4>Finalize a Venda</h4>
        <p>O pedido é registrado no histórico como <em>Fiado em Aberto</em>. Esse valor <strong>não</strong> entra na gaveta física de dinheiro até que o cliente venha pagar de verdade.</p>
      </div>
    </div>
  </div>

  <h2>Como Dar Baixa Quando o Cliente Vier Pagar</h2>
  <p>Quando o cliente vier quitar a dívida (seja no dia seguinte ou na semana seguinte):</p>
  <div class="step-list avoid-break">
    <div class="step-item">
      <div class="step-num">1</div>
      <div class="step-details">
        <h4>Acesse a Aba "Resumo do Dia"</h4>
        <p>No bloco <strong>"Caderno de Fiados & Devedores"</strong>, localize o nome do cliente e a compra pendente.</p>
      </div>
    </div>
    <div class="step-item">
      <div class="step-num">2</div>
      <div class="step-details">
        <h4>Escolha Como Ele Está Pagando</h4>
        <p>Clique no botão <strong>"Receber Pagamento"</strong> e indique se ele está pagando em <strong>Dinheiro Vivo</strong> ou via <strong>PIX</strong>.</p>
      </div>
    </div>
  </div>

  <div class="callout callout-emerald avoid-break">
    <div class="callout-icon">⚖️</div>
    <div class="callout-content">
      <strong>Regra Contábil RPsecti (Inteligência de Caixa):</strong>
      <p>Se o cliente comprou há 3 dias e pagou R$ 20,00 em <strong>Dinheiro</strong> hoje, essa cédula física entrou na gaveta <strong>HOJE</strong>. O RPsec Balcão soma esse valor automaticamente no cálculo do dinheiro esperado na gaveta do dia de hoje, garantindo que o batimento bata 100% sem erros.</p>
    </div>
  </div>
</div>

<!-- ============================================== -->
<!-- PÁGINA 7: MÓDULO 5 — SANGRIA VS. SUPRIMENTO -->
<!-- ============================================== -->
<div class="page-break">
  <div class="header-rule">
    <span class="doc-tag">Capítulo 5 • Movimentações Durante o Expediente</span>
    <span class="doc-ver">RPsec Balcão v1.3.0</span>
  </div>

  <h1>💸 Sangria vs. Suprimento (Movimentações da Gaveta)</h1>
  <p>Esta é uma das distinções mais importantes para o bom funcionamento do caixa. O atendente precisa entender que <strong>Sangria NÃO fecha o caixa</strong>, ela apenas documenta a saída física de dinheiro.</p>

  <h2>Tabela Comparativa Didática</h2>
  <table class="custom-table avoid-break">
    <thead>
      <tr>
        <th style="width: 20%;">Operação</th>
        <th style="width: 25%;">O Que É?</th>
        <th style="width: 35%;">Exemplos Reais na Salgaderia</th>
        <th style="width: 20%;">Efeito na Gaveta</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong style="color: #b91c1c;">🔻 SANGRIA</strong><br><span class="badge-tag b-red">Retirada</span></td>
        <td>Tirar dinheiro da gaveta com a loja aberta.</td>
        <td>
          • Pagar R$ 110,00 no botijão de gás.<br>
          • Pagar entregador de bebidas na porta.<br>
          • Tirar R$ 300,00 para guardar no cofre.
        </td>
        <td><strong>Diminui</strong> o dinheiro esperado no fim do dia.</td>
      </tr>
      <tr>
        <td><strong style="color: #047857;">🔺 SUPRIMENTO</strong><br><span class="badge-tag b-green">Entrada</span></td>
        <td>Colocar mais troco durante o expediente.</td>
        <td>
          • Trazer R$ 50,00 em moedas de 1 real.<br>
          • Trocar notas de 50 por notas de 2 e 5 reais no banco ou padaria vizinha.
        </td>
        <td><strong>Aumenta</strong> o dinheiro esperado no fim do dia.</td>
      </tr>
    </tbody>
  </table>

  <h2>Como Fazer uma Sangria ou Suprimento em 3 Cliques</h2>
  <div class="step-list avoid-break">
    <div class="step-item">
      <div class="step-num">1</div>
      <div class="step-details">
        <h4>Vá na aba "Resumo do Dia"</h4>
        <p>No card de status do turno, você verá dois botões de destaque: <span class="badge-tag b-red">Retirar da Gaveta (Sangria)</span> e <span class="badge-tag b-green">Adicionar Troco (Suprimento)</span>.</p>
      </div>
    </div>
    <div class="step-item">
      <div class="step-num">2</div>
      <div class="step-details">
        <h4>Digite o Valor e o Motivo</h4>
        <p>Informe o valor retirado ou inserido. O sistema oferece atalhos de motivos: <em>Pagamento Fornecedor</em>, <em>Entrega de Gás</em> ou <em>Sangria de Segurança</em>.</p>
      </div>
    </div>
    <div class="step-item">
      <div class="step-num">3</div>
      <div class="step-details">
        <h4>Confirme a Operação</h4>
        <p>A movimentação é gravada na linha do tempo do turno com horário e valor. O sistema recalcula o saldo esperado da gaveta na mesma fração de segundo.</p>
      </div>
    </div>
  </div>

  <div class="callout callout-rose avoid-break">
    <div class="callout-icon">⚠️</div>
    <div class="callout-content">
      <strong>Aviso Importante:</strong>
      <p>Nunca tire dinheiro da gaveta para pagar despesas sem registrar a Sangria! Se você tirar R$ 50 para o almoço ou entregador e não registrar, no fechamento parecerá que faltou R$ 50 (quebra de caixa).</p>
    </div>
  </div>
</div>

<!-- ============================================== -->
<!-- PÁGINA 8: MÓDULO 6 — DESPESAS & SAÍDAS -->
<!-- ============================================== -->
<div class="page-break">
  <div class="header-rule">
    <span class="doc-tag">Capítulo 6 • Despesas e Custos Operacionais</span>
    <span class="doc-ver">RPsec Balcão v1.3.0</span>
  </div>

  <h1>📉 Registro de Saídas & Gastos Operacionais</h1>
  <p>Uma salgaderia lucrativa não é aquela que apenas vende muito, mas a que <strong>controla os gastos diários</strong>. O RPsec Balcão conta com a aba dedicada <strong>"Saídas / Gastos"</strong>.</p>

  <h2>Qual a Diferença Entre Despesa e Sangria?</h2>
  <div class="callout callout-amber avoid-break">
    <div class="callout-icon">🔍</div>
    <div class="callout-content">
      <strong>Entendendo a Diferença Contábil:</strong>
      <p>• <strong>Sangria de Gaveta:</strong> É o ato físico de tirar cédulas de dentro da gaveta do balcão.<br>
         • <strong>Despesa Operacional:</strong> É qualquer gasto da empresa, seja pago por PIX da conta do banco, cartão de crédito, boleto ou em dinheiro vivo (ex.: conta de luz, aluguel, compra de farinha no atacadista).</p>
    </div>
  </div>

  <h2>Como Cadastrar uma Despesa Rapidamente</h2>
  <div class="step-list avoid-break">
    <div class="step-item">
      <div class="step-num">1</div>
      <div class="step-details">
        <h4>Clique na Aba "Saídas / Gastos"</h4>
        <p>Localizada na barra principal do cabeçalho superior.</p>
      </div>
    </div>
    <div class="step-item">
      <div class="step-num">2</div>
      <div class="step-details">
        <h4>Preencha Descrição, Valor e Categoria</h4>
        <p>• <strong>Descrição:</strong> Ex.: *"Fardo de Óleo de Soja (20 garrafas)"* ou *"Conta de Água"*.
           • <strong>Valor:</strong> Digite o valor total pago.
           • <strong>Categoria:</strong> Insumos & Ingredientes, Contas de Consumo, Embalagens, etc.</p>
      </div>
    </div>
    <div class="step-item">
      <div class="step-num">3</div>
      <div class="step-details">
        <h4>Clique em "Salvar Gasto"</h4>
        <p>O gasto é abatido do <strong>Lucro Líquido do Dia</strong> instantaneamente no Resumo do Balcão.</p>
      </div>
    </div>
  </div>

  <h2>Cálculo do Saldo Líquido do Dia</h2>
  <p>No painel do Resumo do Dia, o sistema consolida:</p>
  <div class="formula-card avoid-break">
    <div class="formula-title">Fórmula do Lucro Líquido Diário:</div>
    SALDO LÍQUIDO DO DIA = TOTAL DE ENTRADAS (Vendas) - TOTAL DE DESPESAS (Gastos)
  </div>
  <p>Isso permite ao empresário saber com precisão quanto realmente sobrou livre no bolso naquele dia de trabalho.</p>
</div>

<!-- ============================================== -->
<!-- PÁGINA 9: MÓDULO 7 — FECHAMENTO & BATIMENTO (COMPACTO & INTEGRADO) -->
<!-- ============================================== -->
<div class="page-break">
  <div class="header-rule">
    <span class="doc-tag">Capítulo 7 • Encerramento do Dia & Auditoria</span>
    <span class="doc-ver">RPsec Balcão v1.3.0</span>
  </div>

  <h1>⚖️ Fechamento de Caixa & Batimento da Gaveta</h1>
  <p>O fechamento de caixa é o momento sagrado da auditoria diária. É nele que se descobre se todas as vendas em dinheiro entraram corretamente na gaveta e se não houve erros de troco.</p>

  <div class="formula-card avoid-break" style="margin: 6px 0; padding: 7px 12px; font-size: 8.5pt;">
    <div class="formula-title">Fórmula de Auditoria da Gaveta Física:</div>
    DINHEIRO ESPERADO = Fundo Inicial + Vendas em Dinheiro + Suprimentos - Sangrias
    <br>
    DIFERENÇA DE CAIXA = Dinheiro Físico Contado - Dinheiro Esperado
  </div>

  <h2 style="margin: 8px 0 5px 0;">Passo a Passo do Fechamento Cego</h2>
  <div class="step-list avoid-break" style="gap: 5px; margin: 4px 0;">
    <div class="step-item" style="padding: 6px 10px;">
      <div class="step-num" style="width: 22px; height: 22px; font-size: 8pt;">1</div>
      <div class="step-details">
        <h4 style="font-size: 9pt;">Acesse a Seção de Fechamento</h4>
        <p style="font-size: 8.2pt;">Vá na aba <strong>"Resumo do Dia"</strong> e role até o bloco <strong>"Batimento da Gaveta & Fechamento de Caixa"</strong>.</p>
      </div>
    </div>
    <div class="step-item" style="padding: 6px 10px;">
      <div class="step-num" style="width: 22px; height: 22px; font-size: 8pt;">2</div>
      <div class="step-details">
        <h4 style="font-size: 9pt;">Conte as Moedas e Cédulas da Gaveta</h4>
        <p style="font-size: 8.2pt;">Pegue todo o dinheiro físico que está na gaveta e conte o total (ex.: R$ 160,00).</p>
      </div>
    </div>
    <div class="step-item" style="padding: 6px 10px;">
      <div class="step-num" style="width: 22px; height: 22px; font-size: 8pt;">3</div>
      <div class="step-details">
        <h4 style="font-size: 9pt;">Digite o Valor Contado</h4>
        <p style="font-size: 8.2pt;">Insira o valor contado. *(Atalho: se você já contou e sabe que bateu exato, clique em <strong>"Copiar Esperado"</strong>).*</p>
      </div>
    </div>
  </div>

  <h2 style="margin: 8px 0 5px 0;">Feedback Imediato de Cores (Diagnóstico em Tempo Real)</h2>
  <table class="custom-table avoid-break" style="margin: 5px 0; font-size: 8.2pt;">
    <thead>
      <tr>
        <th style="width: 28%; padding: 4px 7px;">Resultado Visual</th>
        <th style="width: 28%; padding: 4px 7px;">O Que Significa?</th>
        <th style="width: 44%; padding: 4px 7px;">Causa Mais Comum</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><span class="badge-tag b-green">✓ BATEU 100%</span><br>Diferença: R$ 0,00</td>
        <td>A gaveta está perfeita.</td>
        <td>Vendas e trocos foram entregues com exatidão máxima.</td>
      </tr>
      <tr>
        <td><span class="badge-tag b-blue">🔵 SOBRA DE CAIXA</span><br>Ex.: +R$ 5,00</td>
        <td>Tem mais dinheiro do que o esperado.</td>
        <td>Venda em dinheiro não lançada ou cliente esqueceu o troco.</td>
      </tr>
      <tr>
        <td><span class="badge-tag b-red">⚠️ QUEBRA DE CAIXA</span><br>Ex.: -R$ 10,00</td>
        <td>Faltou dinheiro na gaveta.</td>
        <td>Troco passado a mais ou saída sem registrar Sangria.</td>
      </tr>
    </tbody>
  </table>

  <div class="step-item avoid-break" style="margin-top: 6px; padding: 7px 10px; background: #ecfdf5; border-color: #86efac;">
    <div class="step-num" style="background: #047857; width: 22px; height: 22px; font-size: 8pt;">4</div>
    <div class="step-details">
      <h4 style="font-size: 9pt; color: #064e3b;">Clique em "CONFIRMAR E FECHAR CAIXA DO DIA"</h4>
      <p style="font-size: 8.2pt; color: #047857;">O turno é oficialmente encerrado e arquivado. O comprovante salta na tela com o botão para disparar o extrato formatado no WhatsApp!</p>
    </div>
  </div>
</div>

<!-- ============================================== -->
<!-- PÁGINA 10: MÓDULO 8 — WHATSAPP & HISTÓRICO -->
<!-- ============================================== -->
<div class="page-break">
  <div class="header-rule">
    <span class="doc-tag">Capítulo 8 • Compartilhamento & Arquivo Morto</span>
    <span class="doc-ver">RPsec Balcão v1.3.0</span>
  </div>

  <h1>📲 Extrato no WhatsApp & Histórico de Caixas</h1>
  <p>Ao fechar o caixa ou no decorrer do expediente, você não precisa transcrever números manualmente. O sistema gera uma mensagem profissional e padronizada pronta para o WhatsApp.</p>

  <h2>Modelo Real da Mensagem do WhatsApp</h2>
  <div class="receipt-box avoid-break">
📊 *FECHAMENTO DIÁRIO — RPSEC BALCÃO*
🗓 *Data:* 09/11/2026
⏰ *Abertura:* 07:30 | *Fechamento:* 18:45

💰 *Entradas Totais:* R$ 380,00 (42 vendas)
👥 *Clientes Atendidos:* 42 (Ticket Médio: R$ 9,05)
🔥 *Horário de Pico:* 11:00 às 12:00 (16 clientes / R$ 145,00)

💵 *--- CONFERÊNCIA DA GAVETA (DINHEIRO) ---*
(+) Fundo de Troco Inicial: R$ 50,00
(+) Vendas em Dinheiro: R$ 140,00
(+) Troco Adicionado (Suprimento): +R$ 20,00
(-) Retiradas da Gaveta (Sangria): -R$ 30,00
(=) *Dinheiro Esperado na Gaveta:* R$ 180,00
🔎 *Dinheiro Contado na Gaveta:* R$ 180,00
✅ *Batimento:* Caixa bateu 100%! (Diferença: R$ 0,00)

📱 *PIX Recebido:* R$ 160,00
💳 *Cartões (Déb/Créd):* R$ 80,00
📝 *Fiados Pendentes:* R$ 25,00 (2 clientes)

🔻 *Saídas / Despesas:* R$ 110,00 (1 despesa)

⚖️ *SALDO LÍQUIDO DO DIA:* R$ 270,00

🏆 *Mais Vendidos de Hoje:*
1. Coxinha de Frango com Catupiry — 28 un. (R$ 196,00)
2. Enroladinho de Salsicha — 14 un. (R$ 91,00)
3. Refrigerante Lata — 12 un. (R$ 72,00)

_RPsec Balcão — Gestão Inteligente de Salgaderia_
  </div>

  <h2>Histórico Sanfonado de Caixas Fechados</h2>
  <p>No rodapé da aba "Resumo do Dia", clique em <strong>"Histórico de Caixas Fechados"</strong>. Você terá acesso aos caixas de ontem, da semana passada ou do mês anterior. Cada cartão mostra:</p>
  <ul>
    <li>Data, hora de abertura e fechamento.</li>
    <li>Fundo inicial e se o caixa bateu, sobrou ou quebrou.</li>
    <li>Botão <strong>"Reenviar no WhatsApp"</strong> para gerar o extrato daquele dia específico a qualquer hora.</li>
  </ul>
</div>

<!-- ============================================== -->
<!-- PÁGINA 11: MÓDULO 9 — CUSTOS & PRODUÇÃO -->
<!-- ============================================== -->
<div class="page-break">
  <div class="header-rule">
    <span class="doc-tag">Capítulo 9 • Engenharia de Custos do Salgado</span>
    <span class="doc-ver">RPsec Balcão v1.3.0</span>
  </div>

  <h1>🧑‍🍳 Ficha Técnica & Custos de Produção</h1>
  <p>Saber exatamente quanto custa fazer <strong>1 Coxinha</strong> ou <strong>1 Empada</strong> é o segredo para precificar certo e não trabalhar de graça.</p>

  <h2>Como Funciona a Ficha Técnica no App</h2>
  <div class="step-list avoid-break">
    <div class="step-item">
      <div class="step-num">1</div>
      <div class="step-details">
        <h4>Cadastro de Insumos / Ingredientes</h4>
        <p>Cadastre os ingredientes básicos com preço de compra no atacado (ex.: Farinha de Trigo 5kg = R$ 22,00; Peito de Frango 1kg = R$ 18,50; Óleo de Soja 900ml = R$ 7,50).</p>
      </div>
    </div>
    <div class="step-item">
      <div class="step-num">2</div>
      <div class="step-details">
        <h4>Montagem da Receita</h4>
        <p>Crie a receita do salgado definindo os gramas utilizados e o rendimento (ex.: Uma receita de Coxinha gasta R$ 45,00 em insumos e rende 50 coxinhas).</p>
      </div>
    </div>
    <div class="step-item">
      <div class="step-num">3</div>
      <div class="step-details">
        <h4>Cálculo Automático do Custo Unitário e Lucro Real</h4>
        <p>O sistema divide o custo pelo rendimento e calcula:</p>
      </div>
    </div>
  </div>

  <table class="custom-table avoid-break">
    <thead>
      <tr>
        <th>Produto</th>
        <th>Custo Unitário</th>
        <th>Preço de Venda</th>
        <th>Lucro Bruto por Salgado</th>
        <th>Margem de Lucro</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Coxinha de Frango</strong></td>
        <td>R$ 1,85</td>
        <td>R$ 7,00</td>
        <td><strong style="color: #047857;">+ R$ 5,15</strong></td>
        <td><span class="badge-tag b-green">73,5%</span></td>
      </tr>
      <tr>
        <td><strong>Kibe com Catupiry</strong></td>
        <td>R$ 2,20</td>
        <td>R$ 7,50</td>
        <td><strong style="color: #047857;">+ R$ 5,30</strong></td>
        <td><span class="badge-tag b-green">70,6%</span></td>
      </tr>
      <tr>
        <td><strong>Refrigerante Lata</strong></td>
        <td>R$ 3,10</td>
        <td>R$ 6,00</td>
        <td><strong style="color: #047857;">+ R$ 2,90</strong></td>
        <td><span class="badge-tag b-green">48,3%</span></td>
      </tr>
    </tbody>
  </table>

  <div class="callout callout-emerald avoid-break">
    <div class="callout-icon">📊</div>
    <div class="callout-content">
      <strong>Atualização Dinâmica de Margens:</strong>
      <p>Se o preço do queijo ou do frango subir no mercado, você altera o preço do ingrediente na ficha técnica e o custo unitário de todos os salgados afetados é recalculado automaticamente!</p>
    </div>
  </div>
</div>

<!-- ============================================== -->
<!-- PÁGINA 12: MÓDULO 10 — SEGURANÇA & BACKUP -->
<!-- ============================================== -->
<div class="page-break">
  <div class="header-rule">
    <span class="doc-tag">Capítulo 10 • Segurança, Preservação de Dados & Usabilidade</span>
    <span class="doc-ver">RPsec Balcão v1.3.0</span>
  </div>

  <h1>💾 Backup, Segurança de Dados & Tema Noturno</h1>
  <p>O RPsec Balcão funciona com arquitetura <strong>Offline-First</strong>. Isso significa que mesmo se a internet da salgaderia cair, o sistema continua vendendo e calculando o caixa com velocidade máxima, sem travar!</p>

  <h2>Rotina Segura de Backup Diário (Em 1 Toque)</h2>
  <div class="step-list avoid-break">
    <div class="step-item">
      <div class="step-num">1</div>
      <div class="step-details">
        <h4>Como Salvar o Backup (Final da Tarde)</h4>
        <p>Vá na aba <strong>"Resumo do Dia"</strong> e clique no botão <strong>"Baixar Cópia dos Dados (Backup)"</strong>. O sistema baixa um arquivo leve <code>backup_rpsec_balcao_YYYY-MM-DD.json</code> que guarda seus produtos, vendas, comandas, histórico de caixas e fichas técnicas.</p>
      </div>
    </div>
    <div class="step-item">
      <div class="step-num">2</div>
      <div class="step-details">
        <h4>Como Restaurar (Em Caso de Troca de Computador ou Pane)</h4>
        <p>Abra o sistema no novo aparelho, vá em "Resumo do Dia" e clique em <strong>"Restaurar Dados Anteriores"</strong>. Selecione o arquivo de backup. Em 2 segundos, todas as suas vendas e histórico reaparecem exatamente onde pararam.</p>
      </div>
    </div>
  </div>

  <h2>Alternador Modo Claro / Modo Escuro (Dark Mode)</h2>
  <p>No canto superior direito, há um botão com ícone de <strong>Sol / Lua</strong>:</p>
  <ul>
    <li><strong>Modo Claro:</strong> Tons acolhedores de creme e bordas douradas, excelente para ambientes bem iluminados pela manhã.</li>
    <li><strong>Modo Escuro:</strong> Fundo escuro profundo com contraste quente, perfeito para a noite, reduzindo o cansaço visual de quem passa horas na frente da tela.</li>
  </ul>
</div>

<!-- ============================================== -->
<!-- PÁGINA 13: FAQ & DÚVIDAS FREQUENTES -->
<!-- ============================================== -->
<div>
  <div class="header-rule">
    <span class="doc-tag">Capítulo 11 • Dúvidas Práticas do Dia a Dia (FAQ)</span>
    <span class="doc-ver">RPsec Balcão v1.3.0</span>
  </div>

  <h1>❓ Perguntas Frequentes (FAQ)</h1>

  <div class="step-list avoid-break">
    <div class="step-item">
      <div class="step-num">Q1</div>
      <div class="step-details">
        <h4>Esqueci de abrir o caixa pela manhã e já fiz 5 vendas. E agora?</h4>
        <p>Fique tranquilo! Basta clicar em <strong>"Caixa Fechado"</strong> no cabeçalho ou no aviso do PDV e informar o fundo de troco que você tinha colocado na gaveta no início da manhã. O sistema aplicará a fórmula retroativamente a todas as vendas do dia com 100% de precisão.</p>
      </div>
    </div>

    <div class="step-item">
      <div class="step-num">Q2</div>
      <div class="step-details">
        <h4>Tirei dinheiro para pagar o entregador de refrigerante e esqueci de lançar a Sangria na hora. Como resolver?</h4>
        <p>Vá na aba "Resumo do Dia", clique em <strong>"Retirar da Gaveta (Sangria)"</strong>, digite o valor que você pagou ao entregador e confirme. O sistema deduzirá o valor imediatamente da gaveta.</p>
      </div>
    </div>

    <div class="step-item">
      <div class="step-num">Q3</div>
      <div class="step-details">
        <h4>No fechamento, o sistema acusou "Quebra de Caixa" (faltou dinheiro). O que devo conferir?</h4>
        <p>1. Verifique se você ou algum funcionário tirou dinheiro da gaveta para comprar algo na rua e não registrou a Sangria.<br>
           2. Verifique se alguma venda foi recebida no Cartão ou Pix e clicada como Dinheiro por engano.<br>
           3. Conte as moedas e cédulas novamente para garantir que não grudou nenhuma nota de 2 ou 5 reais.</p>
      </div>
    </div>

    <div class="step-item">
      <div class="step-num">Q4</div>
      <div class="step-details">
        <h4>O cliente consumiu no local e saiu correndo sem pagar. O que faço com a comanda dele?</h4>
        <p>Se você souber quem é, abra a comanda, selecione <strong>Fiado</strong> e vincule ao nome dele para cobrar depois. Se foi uma perda irreversível, você pode clicar no ícone de lixeira do card da comanda para cancelá-la.</p>
      </div>
    </div>

    <div class="step-item">
      <div class="step-num">Q5</div>
      <div class="step-details">
        <h4>Posso usar o RPsec Balcão no celular, tablet e computador antigo?</h4>
        <p>Sim! A aplicação é 100% responsiva e foi desenvolvida especialmente com botões grandes e interface touch-friendly para rodar com fluidez em tablets ou notebooks modestos.</p>
      </div>
    </div>
  </div>

  <div class="callout callout-stone avoid-break" style="margin-top: 20px; text-align: center;">
    <div class="callout-content">
      <strong style="font-size: 9.8pt; color: #7f1d1d;">RPsecti Soluções Inteligentes</strong>
      <p style="font-size: 8.2pt; color: #57534e;">
        "Desenvolvendo softwares pragmáticos, leves e de alto valor que colocam dinheiro no bolso de negócios reais."<br>
        <strong>Suporte & Engenharia:</strong> Rafael (CEO) & Marcus (CTO) • Todos os direitos reservados.
      </p>
    </div>
  </div>
</div>

</body>
</html>
"""

html_file_path = r'c:\Users\Rafael\Desktop\antigravity\REA\rpsec_balcao\manual_documentacao.html'
pdf_file_path = r'c:\Users\Rafael\Desktop\antigravity\REA\rpsec_balcao\Manual_de_Operacao_RPsec_Balcao.pdf'

with open(html_file_path, 'w', encoding='utf-8') as f:
    f.write(html_content)

print('[OK] HTML do manual salvo com sucesso!')

chrome_path = r'C:\Program Files\Google\Chrome\Application\chrome.exe'
cmd = [
    chrome_path,
    '--headless',
    '--disable-gpu',
    '--run-all-compositor-stages-before-draw',
    f'--print-to-pdf={pdf_file_path}',
    '--no-pdf-header-footer',
    html_file_path
]

res = subprocess.run(cmd, capture_output=True, text=True)
if os.path.exists(pdf_file_path):
    size_kb = os.path.getsize(pdf_file_path) / 1024
    print(f'[SUCESSO] PDF Gerado: {pdf_file_path} ({size_kb:.1f} KB)')
else:
    print('[ERRO] Falha na geracao do PDF:', res.stderr)
