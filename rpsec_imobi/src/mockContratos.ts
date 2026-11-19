import { ContratoLocacaoCompleto } from './types';

export const INITIAL_CONTRATOS: ContratoLocacaoCompleto[] = [
  // 1. CONTRATO Nº 85 (REAL DO CLIENTE - MARISTELA GALVANI / SIMONE GONÇALVES)
  // STATUS: PENDENTE (Em fase final de abertura: 22 de 25 itens concluídos, falta finalizar CPFL e assinatura de promissória)
  {
    id: "ctr-85",
    numeroOrdem: "85",
    imovelId: 447,
    imovelEndereco: "Rua Francisco Lima de Souza Dias, 195",
    imovelBairro: "Jd. Santa Clara",
    imovelCidade: "Mococa/SP",
    status: "pendente",
    processoAtivo: "abertura",
    locador: {
      nome: "Maristela Silvestre Galvani Marcelli",
      cpf: "157.849.718-32",
      rg: "22.793.283-3",
      profissao: "Do lar",
      estadoCivil: "Casada",
      telefone: "(16) 98117-8843",
      email: "marcelli27@gmail.com",
      dadosBancariosPix: "Chave PIX (E-mail): marcelli27@gmail.com",
      conjuge: {
        nome: "Marcos Marcelli",
        cpf: "056.634.458-03",
        rg: "16.525.762-3",
        profissao: "Empresário",
        telefone: "(16) 99739-2323",
        email: "marcelli.marcos@gmail.com",
        regimeBens: "Comunhão Parcial de Bens"
      }
    },
    locatario: {
      nome: "Simone Delfino Gonçalves",
      cpf: "080.828.706-05",
      rg: "MG15829555",
      profissao: "Auxiliar administrativa",
      rendaEstimada: 4200,
      estadoCivil: "viuvo",
      enderecoCorrespondencia: "Av. João Batista de Lima Figueiredo, 2347, Centro, Mococa/SP",
      telefone: "(35) 99176-8139",
      email: "goncalvessimone1717@gmail.com"
    },
    segundoLocatario: {
      id: "loc_85_1",
      nome: "Carlos Henrique Delfino",
      cpf: "105.706.308-86",
      rg: "21.905.320",
      profissao: "Açougueiro",
      telefone: "(19) 98816-9376",
      email: "delfinocarlos.50@gmail.com"
    },
    locatariosAdicionais: [
      {
        id: "loc_85_1",
        nome: "Carlos Henrique Delfino",
        cpf: "105.706.308-86",
        rg: "21.905.320",
        profissao: "Açougueiro",
        telefone: "(19) 98816-9376",
        email: "delfinocarlos.50@gmail.com"
      }
    ],
    testemunhas: [
      {
        nome: "Sara Cristina Mariano Mamede",
        cpf: "143.206.566-10",
        email: "marianosara847@gmail.com"
      },
      {
        nome: "Rafael Pereira Seles",
        cpf: "402.073.868-89",
        email: "baianobaterias12@gmail.com"
      }
    ],
    moradores: [
      {
        id: "mor_1",
        nome: "Arthur Delfino (Filho)",
        cpf: "512.449.128-09",
        rg: "55.819.321-X",
        vinculo: "Filho",
        documentosAnexados: true
      },
      {
        id: "mor_2",
        nome: "Cauã Delfino (Filho)",
        cpf: "530.118.992-14",
        rg: "58.902.114-1",
        vinculo: "Filho",
        documentosAnexados: true
      },
      {
        id: "mor_3",
        nome: "Silvia Delfino (Mãe)",
        cpf: "049.882.119-55",
        rg: "12.890.345-6",
        vinculo: "Mãe",
        documentosAnexados: true
      }
    ],
    valores: {
      aluguel: 1400,
      vencimentoDia: 10,
      repasseDia: 15,
      taxaAdmPorcentagem: 10,
      caucaoValor: 4200
    },
    vigencia: {
      inicio: "20/11/2026",
      fim: "20/11/2027",
      meses: 12
    },
    checklistAbertura: {
      docLocador: true,
      docLocatario: true,
      estadoCivilTipo: "viuvo",
      certidaoEstadoCivil: true, // Certidão de casamento com averbação de óbito conferida
      comprovanteEndereco: true,
      comprovacaoRendaTipo: "holerite",
      comprovacaoRenda: true, // 3 últimos holerites anexados
      analiseCreditoStatus: "aprovado",
      analiseCreditoScore: 785,
      docMoradores: true,
      testemunhasCompletas: true,
      tipoGarantidor: "caucao",
      obsGarantidor: "Caução em dinheiro de 3 aluguéis (R$ 4.200,00) depositado em conta garantia",
      analiseGarantidor: true,
      pagamentoBoletoGarantia: true,
      seguroIncendioCotado: true,
      seguroIncendioApolice: true,
      seguroIncendioFormaPagamento: "parcelado",
      seguroIncendioValor: 340,
      seguroIncendioParcelas: "4x de R$ 85,00",
      seguroIncendioObs: "Apólice Porto Seguro Residencial emitida",
      notaPromissoriaPreenchida: true,
      notaPromissoriaAssinada: false, // ⚠️ PENDÊNCIA: Aguardando assinatura física do locatário
      transferenciaAgua: {
        procuracaoPreenchida: true,
        procuracaoAssinada: true,
        docFotoInquilino: true,
        docFotoCorretor: true,
        contratoAssinado: true,
        contaAntiga: true,
        leituraMedidor: "18492 m³",
        docImovelIptuMatricula: true,
        dataSolicitacao: "12/11/2026",
        dataFechamento: "14/11/2026",
        concluido: true,
        observacoes: "Protocolo Sabesp nº 2026-9912 deferido com sucesso"
      },
      transferenciaLuz: {
        procuracaoPreenchida: true,
        procuracaoAssinada: true,
        docFotoInquilino: true,
        docFotoCorretor: true,
        contratoAssinado: true,
        contaAntiga: true,
        leituraMedidor: "9482 kWh",
        docImovelIptuMatricula: true,
        dataSolicitacao: "13/11/2026",
        dataFechamento: "",
        concluido: false, // ⚠️ PENDÊNCIA: Protocolo CPFL em processamento
        observacoes: "Aguardando confirmação de troca de titularidade na agência CPFL"
      },
      elaboracaoContratoLocacao: true,
      elaboracaoContratoPrestacao: true,
      vistoriaEntradaDataInicio: "12/11/2026",
      vistoriaEntradaDataFim: "15/11/2026",
      vistoriaEntradaLaudoAssinado: true,
      vistoriaEntradaFotosAnexadas: true,
      vistoriaEntradaObs: "Laudo completo com 32 fotos da casa e testado todas as torneiras e disjuntores",
      assinaturaContratoLocacao: true,
      assinaturaContratoPrestacao: true,
      lancadoNoPrograma: false, // ⚠️ PENDÊNCIA: Lançar no sistema de boletos
      obsGerais: "Família pronta para mudar assim que a luz for transferida e a promissória assinada."
    },
    checklistEncerramento: {
      comunicacaoDataSolicitada: "",
      comunicacaoDataSaida: "",
      comunicacaoMotivo: "",
      comunicacaoObs: "",
      vistoriaSaidaRealizada: false,
      vistoriaSaidaData: "",
      vistoriaSaidaFotosDevolucao: false,
      vistoriaSaidaComparadoEntrada: false,
      vistoriaSaidaObs: "",
      orcamentoReparosNecessita: false,
      orcamentoReparosDescricao: "",
      orcamentoReparosValor: 0,
      orcamentoReparosAprovadoInquilino: false,
      baixaFaturaAguaLeituraFinal: "",
      baixaFaturaAguaQuitada: false,
      baixaFaturaAguaConcluida: false,
      baixaFaturaCpflLeituraFinal: "",
      baixaFaturaCpflQuitada: false,
      baixaFaturaCpflConcluida: false,
      boletimOcorrenciaHouve: false,
      boletimOcorrenciaNumero: "",
      boletimOcorrenciaMotivo: "",
      baixaSeguroGarantidor: false,
      baixaSeguroIncendio: false,
      baixaNotaPromissoria: false,
      baixaNoPrograma: false,
      reembolsoCaucaoValorInicial: 4200,
      reembolsoCaucaoDescontoReparos: 0,
      reembolsoCaucaoDescontoFaturas: 0,
      reembolsoCaucaoValorDevolvido: 0,
      reembolsoCaucaoPago: false,
      reembolsoCaucaoTermoAssinado: false,
      dataFinalLocacao: "",
      obsSaida: ""
    },
    anexos: [
      { id: "anx_1", nome: "contrato de locação assinado.pdf", categoria: "contrato", tamanho: "1.2 MB", dataUpload: "12/11/2026" },
      { id: "anx_2", nome: "CERTIDÃO DE CASAMENTO E ÓBITO.jpeg", categoria: "doc_locatario", tamanho: "680 KB", dataUpload: "12/11/2026" },
      { id: "anx_3", nome: "CNH E CPF SIMONE.jpeg", categoria: "doc_locatario", tamanho: "450 KB", dataUpload: "12/11/2026" },
      { id: "anx_4", nome: "HOLERITES ULTIMOS 3 MESES.pdf", categoria: "doc_locatario", tamanho: "920 KB", dataUpload: "12/11/2026" },
      { id: "anx_5", nome: "PROCURACAO ASSINADA SABESP.pdf", categoria: "procuracao_sabesp", tamanho: "510 KB", dataUpload: "13/11/2026" },
      { id: "anx_6", nome: "PROCURACAO CPFL PROTOCOLO.pdf", categoria: "procuracao_cpfl", tamanho: "490 KB", dataUpload: "13/11/2026" },
      { id: "anx_7", nome: "LAUDO DE VISTORIA INICIAL COM FOTOS.pdf", categoria: "vistoria_entrada", tamanho: "8.4 MB", dataUpload: "15/11/2026" }
    ]
  },

  // 2. CONTRATO Nº 72 (CONTRATO 100% REGULAR E ATIVO)
  // STATUS: ATIVO (Todos os 25 itens da abertura concluídos, em vigência regular)
  {
    id: "ctr-72",
    numeroOrdem: "72",
    imovelId: 342,
    imovelEndereco: "Av. Gabriel do Ó, 340, Apto 22",
    imovelBairro: "Parque das Azaleias",
    imovelCidade: "Mococa/SP",
    status: "ativo",
    processoAtivo: "abertura",
    locador: {
      nome: "Carlos Alberto Siqueira",
      cpf: "145.892.308-41",
      rg: "18.339.102-1",
      profissao: "Produtor Rural",
      estadoCivil: "Casado",
      telefone: "(19) 99781-2345",
      email: "carlos.siqueira@agroregional.com.br",
      dadosBancariosPix: "Chave PIX (Telefone): (19) 99781-2345"
    },
    locatario: {
      nome: "Mariana Duarte Neves",
      cpf: "329.441.788-02",
      rg: "34.901.882-9",
      profissao: "Cirurgiã Dentista",
      rendaEstimada: 6800,
      estadoCivil: "solteiro",
      enderecoCorrespondencia: "Av. Gabriel do Ó, 340, Apto 22, Mococa/SP",
      telefone: "(19) 98877-6655",
      email: "mariana.neves@odontoclin.com.br"
    },
    testemunhas: [
      { nome: "Lucas Fontes Rezende", cpf: "220.199.308-11", email: "lucas.rezende@adv.com.br" },
      { nome: "Aline Cristina Prado", cpf: "318.990.112-70", email: "aline.prado@gmail.com" }
    ],
    moradores: [],
    valores: {
      aluguel: 1300,
      vencimentoDia: 10,
      repasseDia: 15,
      taxaAdmPorcentagem: 10,
      caucaoValor: 3900
    },
    vigencia: {
      inicio: "10/01/2025",
      fim: "10/01/2027",
      meses: 24
    },
    checklistAbertura: {
      docLocador: true,
      docLocatario: true,
      estadoCivilTipo: "solteiro",
      certidaoEstadoCivil: true,
      comprovanteEndereco: true,
      comprovacaoRendaTipo: "irpf",
      comprovacaoRenda: true,
      analiseCreditoStatus: "aprovado",
      analiseCreditoScore: 840,
      docMoradores: true,
      testemunhasCompletas: true,
      tipoGarantidor: "caucao",
      obsGarantidor: "Caução de 3 aluguéis pago à vista em conta depósito garantida",
      analiseGarantidor: true,
      pagamentoBoletoGarantia: true,
      seguroIncendioCotado: true,
      seguroIncendioApolice: true,
      seguroIncendioFormaPagamento: "a_vista",
      seguroIncendioValor: 290,
      seguroIncendioParcelas: "À vista R$ 290,00",
      seguroIncendioObs: "Apólice Tokio Marine ativa até Jan/2027",
      notaPromissoriaPreenchida: true,
      notaPromissoriaAssinada: true,
      transferenciaAgua: {
        procuracaoPreenchida: true,
        procuracaoAssinada: true,
        docFotoInquilino: true,
        docFotoCorretor: true,
        contratoAssinado: true,
        contaAntiga: true,
        leituraMedidor: "Condomínio incluso",
        docImovelIptuMatricula: true,
        dataSolicitacao: "08/01/2025",
        dataFechamento: "09/01/2025",
        concluido: true,
        observacoes: "Água individualizada pelo condomínio"
      },
      transferenciaLuz: {
        procuracaoPreenchida: true,
        procuracaoAssinada: true,
        docFotoInquilino: true,
        docFotoCorretor: true,
        contratoAssinado: true,
        contaAntiga: true,
        leituraMedidor: "4120 kWh",
        docImovelIptuMatricula: true,
        dataSolicitacao: "08/01/2025",
        dataFechamento: "09/01/2025",
        concluido: true,
        observacoes: "Transferência CPFL 100% concluída"
      },
      elaboracaoContratoLocacao: true,
      elaboracaoContratoPrestacao: true,
      vistoriaEntradaDataInicio: "07/01/2025",
      vistoriaEntradaDataFim: "09/01/2025",
      vistoriaEntradaLaudoAssinado: true,
      vistoriaEntradaFotosAnexadas: true,
      vistoriaEntradaObs: "Apartamento entregue com pintura nova Suvinil Branco Neve",
      assinaturaContratoLocacao: true,
      assinaturaContratoPrestacao: true,
      lancadoNoPrograma: true,
      obsGerais: "Contrato perfeitamente ativo e pagamentos 100% em dia."
    },
    checklistEncerramento: {
      comunicacaoDataSolicitada: "",
      comunicacaoDataSaida: "",
      comunicacaoMotivo: "",
      comunicacaoObs: "",
      vistoriaSaidaRealizada: false,
      vistoriaSaidaData: "",
      vistoriaSaidaFotosDevolucao: false,
      vistoriaSaidaComparadoEntrada: false,
      vistoriaSaidaObs: "",
      orcamentoReparosNecessita: false,
      orcamentoReparosDescricao: "",
      orcamentoReparosValor: 0,
      orcamentoReparosAprovadoInquilino: false,
      baixaFaturaAguaLeituraFinal: "",
      baixaFaturaAguaQuitada: false,
      baixaFaturaAguaConcluida: false,
      baixaFaturaCpflLeituraFinal: "",
      baixaFaturaCpflQuitada: false,
      baixaFaturaCpflConcluida: false,
      boletimOcorrenciaHouve: false,
      boletimOcorrenciaNumero: "",
      boletimOcorrenciaMotivo: "",
      baixaSeguroGarantidor: false,
      baixaSeguroIncendio: false,
      baixaNotaPromissoria: false,
      baixaNoPrograma: false,
      reembolsoCaucaoValorInicial: 3900,
      reembolsoCaucaoDescontoReparos: 0,
      reembolsoCaucaoDescontoFaturas: 0,
      reembolsoCaucaoValorDevolvido: 0,
      reembolsoCaucaoPago: false,
      reembolsoCaucaoTermoAssinado: false,
      dataFinalLocacao: "",
      obsSaida: ""
    },
    anexos: [
      { id: "anx_10", nome: "Contrato Locacao Assinado Mariano.pdf", categoria: "contrato", tamanho: "1.4 MB", dataUpload: "09/01/2025" },
      { id: "anx_11", nome: "Laudo Vistoria Entrada com Fotos.pdf", categoria: "vistoria_entrada", tamanho: "5.8 MB", dataUpload: "09/01/2025" },
      { id: "anx_12", nome: "Apolice Seguro Incendio Tokio Marine.pdf", categoria: "seguro", tamanho: "750 KB", dataUpload: "09/01/2025" },
      { id: "anx_13", nome: "Comprovante Deposito Caucao R$ 3900.pdf", categoria: "comprovante", tamanho: "320 KB", dataUpload: "08/01/2025" }
    ]
  },

  // 3. CONTRATO Nº 61 (CONTRATO 100% ENCERRADO COM TODAS AS BAIXAS E LIQUIDAÇÃO)
  // STATUS: ENCERRADO (Processo de encerramento finalizado, chaves entregues, contas quitadas, caução reembolsado)
  {
    id: "ctr-61",
    numeroOrdem: "61",
    imovelId: 362,
    imovelEndereco: "Rua Almirante Barroso, 88",
    imovelBairro: "Jd. São Domingos",
    imovelCidade: "Mococa/SP",
    status: "encerrado",
    processoAtivo: "encerramento",
    locador: {
      nome: "Carlos Alberto Siqueira",
      cpf: "145.892.308-41",
      rg: "18.339.102-1",
      telefone: "(19) 99781-2345",
      email: "carlos.siqueira@agroregional.com.br",
      dadosBancariosPix: "Chave PIX: (19) 99781-2345"
    },
    locatario: {
      nome: "Felipe Augusto Nogueira",
      cpf: "219.004.881-30",
      rg: "28.119.003-4",
      profissao: "Engenheiro Agrônomo",
      rendaEstimada: 8500,
      estadoCivil: "casado",
      enderecoCorrespondencia: "Rua Almirante Barroso, 88, Mococa/SP",
      telefone: "(19) 99234-1100",
      email: "felipe.nogueira@agropecuaria.com.br"
    },
    testemunhas: [
      { nome: "Marcos Paulo Silva", cpf: "119.882.341-00", email: "marcos.silva@gmail.com" },
      { nome: "Beatriz Helena Costa", cpf: "299.102.445-12", email: "beatriz.costa@hotmail.com" }
    ],
    moradores: [],
    valores: {
      aluguel: 1800,
      vencimentoDia: 10,
      repasseDia: 15,
      taxaAdmPorcentagem: 10,
      caucaoValor: 5400
    },
    vigencia: {
      inicio: "01/08/2023",
      fim: "01/08/2025",
      meses: 24
    },
    checklistAbertura: {
      docLocador: true,
      docLocatario: true,
      estadoCivilTipo: "casado",
      certidaoEstadoCivil: true,
      comprovanteEndereco: true,
      comprovacaoRendaTipo: "holerite",
      comprovacaoRenda: true,
      analiseCreditoStatus: "aprovado",
      analiseCreditoScore: 890,
      docMoradores: true,
      testemunhasCompletas: true,
      tipoGarantidor: "caucao",
      obsGarantidor: "Caução de 3 aluguéis (R$ 5.400,00)",
      analiseGarantidor: true,
      pagamentoBoletoGarantia: true,
      seguroIncendioCotado: true,
      seguroIncendioApolice: true,
      seguroIncendioFormaPagamento: "a_vista",
      seguroIncendioValor: 380,
      seguroIncendioParcelas: "À vista",
      seguroIncendioObs: "Apólice Porto Seguro quitada",
      notaPromissoriaPreenchida: true,
      notaPromissoriaAssinada: true,
      transferenciaAgua: {
        procuracaoPreenchida: true,
        procuracaoAssinada: true,
        docFotoInquilino: true,
        docFotoCorretor: true,
        contratoAssinado: true,
        contaAntiga: true,
        leituraMedidor: "11020 m³",
        docImovelIptuMatricula: true,
        dataSolicitacao: "28/07/2023",
        dataFechamento: "30/07/2023",
        concluido: true,
        observacoes: "Transferência concluída"
      },
      transferenciaLuz: {
        procuracaoPreenchida: true,
        procuracaoAssinada: true,
        docFotoInquilino: true,
        docFotoCorretor: true,
        contratoAssinado: true,
        contaAntiga: true,
        leituraMedidor: "6720 kWh",
        docImovelIptuMatricula: true,
        dataSolicitacao: "28/07/2023",
        dataFechamento: "30/07/2023",
        concluido: true,
        observacoes: "Transferência CPFL concluída"
      },
      elaboracaoContratoLocacao: true,
      elaboracaoContratoPrestacao: true,
      vistoriaEntradaDataInicio: "25/07/2023",
      vistoriaEntradaDataFim: "27/07/2023",
      vistoriaEntradaLaudoAssinado: true,
      vistoriaEntradaFotosAnexadas: true,
      vistoriaEntradaObs: "Entrada aprovada",
      assinaturaContratoLocacao: true,
      assinaturaContratoPrestacao: true,
      lancadoNoPrograma: true,
      obsGerais: "Locação concluída sem ocorrências."
    },
    checklistEncerramento: {
      comunicacaoDataSolicitada: "01/07/2025",
      comunicacaoDataSaida: "31/07/2025",
      comunicacaoMotivo: "Transferência de cidade a trabalho pelo empregador",
      comunicacaoObs: "Aviso prévio cumprido integralmente no prazo de 30 dias.",
      vistoriaSaidaRealizada: true,
      vistoriaSaidaData: "30/07/2025",
      vistoriaSaidaFotosDevolucao: true,
      vistoriaSaidaComparadoEntrada: true,
      vistoriaSaidaObs: "Imóvel entregue em perfeito estado, pequeno reparo de pintura na sala executado pelo inquilino.",
      orcamentoReparosNecessita: false,
      orcamentoReparosDescricao: "Sem danos estruturais; pintura refeita pelo próprio locatário antes da entrega.",
      orcamentoReparosValor: 0,
      orcamentoReparosAprovadoInquilino: true,
      baixaFaturaAguaLeituraFinal: "13.410 m³",
      baixaFaturaAguaQuitada: true,
      baixaFaturaAguaConcluida: true,
      baixaFaturaCpflLeituraFinal: "9.890 kWh",
      baixaFaturaCpflQuitada: true,
      baixaFaturaCpflConcluida: true,
      boletimOcorrenciaHouve: false,
      boletimOcorrenciaNumero: "",
      boletimOcorrenciaMotivo: "",
      baixaSeguroGarantidor: true,
      baixaSeguroIncendio: true,
      baixaNotaPromissoria: true, // Promissória devolvida e assinada recibo de devolução
      baixaNoPrograma: true,
      reembolsoCaucaoValorInicial: 5400,
      reembolsoCaucaoDescontoReparos: 0,
      reembolsoCaucaoDescontoFaturas: 0,
      reembolsoCaucaoValorDevolvido: 5400,
      reembolsoCaucaoPago: true,
      reembolsoCaucaoTermoAssinado: true,
      dataFinalLocacao: "31/07/2025",
      obsSaida: "Encerramento amigável com 100% de quitação mútua e chaves devolvidas."
    },
    anexos: [
      { id: "anx_20", nome: "Termo de Rescisão e Quitação Mútua Assinado.pdf", categoria: "contrato", tamanho: "1.1 MB", dataUpload: "31/07/2025" },
      { id: "anx_21", nome: "Laudo Vistoria Saida Devolucao com Fotos.pdf", categoria: "vistoria_saida", tamanho: "7.2 MB", dataUpload: "30/07/2025" },
      { id: "anx_22", nome: "Comprovantes Quitação Sabesp e CPFL Final.pdf", categoria: "comprovante", tamanho: "890 KB", dataUpload: "31/07/2025" },
      { id: "anx_23", nome: "Comprovante Devolucao PIX Caucao R$ 5400.pdf", categoria: "comprovante", tamanho: "410 KB", dataUpload: "31/07/2025" }
    ]
  }
];

// -------------------------------------------------------------
// FUNÇÃO DE CÁLCULO E VALIDAÇÃO DA ABERTURA (25 ETAPAS)
// -------------------------------------------------------------
export function calcularProgressoAbertura(contrato: ContratoLocacaoCompleto) {
  const c = contrato.checklistAbertura;
  const pendencias: string[] = [];
  let concluidos = 0;
  const total = 25;

  // 1. Doc Locador
  if (c.docLocador) concluidos++; else pendencias.push("Doc. do Locador/Proprietário");
  // 2. Doc Locatário
  if (c.docLocatario) concluidos++; else pendencias.push("Doc. do Locatário (RG/CPF ou CNH)");
  // 3. Certidão de Estado Civil
  if (c.certidaoEstadoCivil) concluidos++; else pendencias.push("Certidão de Estado Civil correspondente");
  // 4. Comprovante de Endereço
  if (c.comprovanteEndereco) concluidos++; else pendencias.push("Comprovante de Endereço Atualizado");
  // 5. Comprovação de Renda
  if (c.comprovacaoRenda) concluidos++; else pendencias.push("Comprovação de Renda (3 Holerites ou IRPF)");
  // 6. Análise de Crédito
  if (c.analiseCreditoStatus === 'aprovado' || c.analiseCreditoStatus === 'ressalvas') concluidos++; else pendencias.push("Análise de Crédito Aprovada");
  // 7. Docs dos Moradores
  if (c.docMoradores) concluidos++; else pendencias.push("Relação & Docs de Todos os Moradores");
  // 8. Testemunhas
  if (c.testemunhasCompletas && contrato.testemunhas.length >= 2) concluidos++; else pendencias.push("Dados das 2 Testemunhas (Nome, CPF, E-mail)");
  // 9. Tipo de Garantidor
  if (c.tipoGarantidor) concluidos++; else pendencias.push("Definição do Tipo de Garantidor");
  // 10. Obs & Análise do Garantidor
  if (c.analiseGarantidor) concluidos++; else pendencias.push("Análise & Aprovação do Garantidor");
  // 11. Pagamento Boleto Garantia / Caução
  if (c.pagamentoBoletoGarantia) concluidos++; else pendencias.push("Pagamento do Boleto de Caução / Garantia");
  // 12. Seguro Incêndio Cotação
  if (c.seguroIncendioCotado) concluidos++; else pendencias.push("Cotação de Seguro Incêndio");
  // 13. Seguro Incêndio Apólice Emitida
  if (c.seguroIncendioApolice) concluidos++; else pendencias.push("Apólice de Seguro Incêndio Emitida");
  // 14. Nota Promissória Preenchida
  if (c.notaPromissoriaPreenchida) concluidos++; else pendencias.push("Preenchimento da Nota Promissória");
  // 15. Nota Promissória Assinada
  if (c.notaPromissoriaAssinada) concluidos++; else pendencias.push("Assinatura da Nota Promissória pelo Inquilino");
  // 16. Transferência Água - Procuração Assinada
  if (c.transferenciaAgua.procuracaoAssinada) concluidos++; else pendencias.push("Procuração Água (Sabesp/SAE) Assinada");
  // 17. Transferência Água - Concluída
  if (c.transferenciaAgua.concluido) concluidos++; else pendencias.push("Transferência de Titularidade de Água Concluída");
  // 18. Transferência Luz - Procuração Assinada
  if (c.transferenciaLuz.procuracaoAssinada) concluidos++; else pendencias.push("Procuração Luz (CPFL) Assinada");
  // 19. Transferência Luz - Concluída
  if (c.transferenciaLuz.concluido) concluidos++; else pendencias.push("Transferência de Titularidade de Luz (CPFL) Concluída");
  // 20. Elaboração Contrato Locação
  if (c.elaboracaoContratoLocacao) concluidos++; else pendencias.push("Elaboração da Minuta do Contrato de Locação");
  // 21. Elaboração Contrato Prestação de Serviços
  if (c.elaboracaoContratoPrestacao) concluidos++; else pendencias.push("Elaboração do Contrato de Prestação de Serviços");
  // 22. Vistoria de Entrada - Laudo Assinado
  if (c.vistoriaEntradaLaudoAssinado) concluidos++; else pendencias.push("Laudo de Vistoria de Entrada Assinado");
  // 23. Vistoria de Entrada - Fotos Anexadas
  if (c.vistoriaEntradaFotosAnexadas) concluidos++; else pendencias.push("Fotos da Vistoria de Entrada Anexadas");
  // 24. Assinaturas dos Contratos
  if (c.assinaturaContratoLocacao && c.assinaturaContratoPrestacao) concluidos++; else pendencias.push("Assinatura dos Contratos (Locação e Prestação)");
  // 25. Lançado no Programa
  if (c.lancadoNoPrograma) concluidos++; else pendencias.push("Lançamento no Sistema Financeiro/Cobrança");

  const porcentagem = Math.round((concluidos / total) * 100);
  const estaAptoParaAtivar = concluidos === total;

  return { total, concluidos, porcentagem, pendencias, estaAptoParaAtivar };
}

// -------------------------------------------------------------
// FUNÇÃO DE CÁLCULO E VALIDAÇÃO DO ENCERRAMENTO (13 ETAPAS)
// -------------------------------------------------------------
export function calcularProgressoEncerramento(contrato: ContratoLocacaoCompleto) {
  const c = contrato.checklistEncerramento;
  const pendencias: string[] = [];
  let concluidos = 0;
  const total = 13;

  // 1. Comunicação de quebra / aviso prévio
  if (c.comunicacaoDataSolicitada && c.comunicacaoDataSaida) concluidos++; else pendencias.push("Data solicitada e data de saída agendada");
  // 2. Vistoria de Saída realizada
  if (c.vistoriaSaidaRealizada) concluidos++; else pendencias.push("Realização da Vistoria de Saída");
  // 3. Fotos de devolução anexadas
  if (c.vistoriaSaidaFotosDevolucao) concluidos++; else pendencias.push("Fotos da Vistoria de Devolução Anexadas");
  // 4. Comparativo de entrada e saída
  if (c.vistoriaSaidaComparadoEntrada) concluidos++; else pendencias.push("Comparação com Laudo de Entrada");
  // 5. Orçamento de Reparos conferido/aprovado
  if (!c.orcamentoReparosNecessita || (c.orcamentoReparosNecessita && c.orcamentoReparosAprovadoInquilino)) concluidos++; else pendencias.push("Aprovação/Quitação de Orçamento de Reparos");
  // 6. Baixa Fatura Água
  if (c.baixaFaturaAguaQuitada && c.baixaFaturaAguaConcluida) concluidos++; else pendencias.push("Baixa e Quitação da Conta Final de Água");
  // 7. Baixa Fatura CPFL
  if (c.baixaFaturaCpflQuitada && c.baixaFaturaCpflConcluida) concluidos++; else pendencias.push("Baixa e Quitação da Conta Final de Luz (CPFL)");
  // 8. B.O. (se aplicável conferido)
  concluidos++; // Item de conferência
  // 9. Baixa Seguros / Garantidor
  if (c.baixaSeguroGarantidor) concluidos++; else pendencias.push("Baixa de Seguro Garantidor / Fiador");
  // 10. Baixa Seguro Incêndio
  if (c.baixaSeguroIncendio) concluidos++; else pendencias.push("Baixa e Cancelamento da Apólice de Incêndio");
  // 11. Baixa Nota Promissória
  if (c.baixaNotaPromissoria) concluidos++; else pendencias.push("Devolução/Cancelamento da Nota Promissória");
  // 12. Reembolso do Caução & Termo de Quitação Assinado
  if (c.reembolsoCaucaoTermoAssinado && (c.reembolsoCaucaoValorDevolvido === 0 || c.reembolsoCaucaoPago)) concluidos++; else pendencias.push("Termo de Quitação Assinado & Devolução do Saldo de Caução");
  // 13. Baixa no Programa
  if (c.baixaNoPrograma) concluidos++; else pendencias.push("Baixa no Sistema de Cobrança");

  const porcentagem = Math.round((concluidos / total) * 100);
  const estaAptoParaEncerrar = concluidos === total;

  return { total, concluidos, porcentagem, pendencias, estaAptoParaEncerrar };
}
