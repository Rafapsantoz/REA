export type TipoCliente = 'proprietario' | 'locatario' | 'comprador' | 'lead';

export interface ContratoCliente {
  id: string;
  imovelId: number;
  tipo: 'locacao' | 'venda';
  valor: number;
  vencimentoDia: number;
  statusPagamento: 'em_dia' | 'atrasado' | 'pendente';
  inicio: string;
  fim: string;
  reajusteIndice?: 'IGP-M' | 'IPCA';
}

export interface Cliente {
  id: string;
  nome: string;
  telefone: string; // Ex: "(19) 99303-0194"
  telefoneLimpo: string; // Ex: "19993030194"
  cpfCnpj: string;
  email: string;
  tipo: TipoCliente;
  corretorResponsavel: string;
  statusAtendimento: 'ativo' | 'em_negociacao' | 'finalizado' | 'atencao';
  notas: string[];
  imoveisVinculadosIds: number[];
  contratoAtivo?: ContratoCliente;
  perfilBusca?: {
    tipoImovel: string;
    faixaPrecoMax: number;
    bairroInteresse: string;
  };
}

export interface Imovel {
  id: number;
  codigo: string;
  titulo: string;
  categoria: 'rural' | 'residencial' | 'comercial';
  subtipo: 'Sítio' | 'Fazenda' | 'Chácara' | 'Casa' | 'Apartamento' | 'Galpão' | 'Salão Comercial';
  finalidade: 'venda' | 'locacao';
  bairro: string;
  cidade: string;
  valor: number;
  proprietarioId: string;
  proprietarioNome?: string;
  status: 'disponivel' | 'alugado' | 'vendido' | 'reservado' | 'em_vistoria';
  area: string;
  quartos?: number;
  suites?: number;
  vagas?: number;
  foto: string; // Foto principal / capa
  fotos: string[]; // Galeria completa de fotos para o Carrossel
  diasNoPatio: number;
  descricao?: string;
  localizacaoChave?: string;
  matricula?: string;
  iptuItr?: string;
  aceitaFinanciamento?: boolean;
  taxaAdmLocacao?: number; // Percentual de taxa adm da imobiliária (ex: 10 para 10%)
}

export interface VisitaLead {
  id: string;
  clienteId: string;
  clienteNome: string;
  clienteTelefone: string;
  imovelId: number;
  imovelTitulo: string;
  data: string;
  horario: string;
  corretor: string;
  status: 'agendada' | 'realizada' | 'proposta_enviada' | 'fechado' | 'cancelada';
  valorProposta?: number;
  observacoes: string;
}

// -------------------------------------------------------------
// MÓDULO DE GESTÃO DE CONTRATOS (ABERTURA, PENDÊNCIAS & FECHAMENTO)
// -------------------------------------------------------------

export type StatusContrato = 'pendente' | 'ativo' | 'encerrado';
export type ProcessoContrato = 'abertura' | 'encerramento';

export interface Testemunha {
  nome: string;
  cpf: string;
  email: string;
}

export interface Morador {
  id: string;
  nome: string;
  cpf: string;
  rg: string;
  telefone?: string;
  email?: string;
  vinculo: string; // Ex: "Cônjuge", "Filho(a)", "Mãe", "Parente", "Outro"
  documentosAnexados?: boolean;
}

export interface TransferenciaUtilidade {
  procuracaoPreenchida: boolean;
  procuracaoAssinada: boolean;
  docFotoInquilino: boolean;
  docFotoCorretor: boolean;
  contratoAssinado: boolean;
  contaAntiga: boolean;
  leituraMedidor: string;
  docImovelIptuMatricula: boolean;
  dataSolicitacao: string;
  dataFechamento: string;
  concluido: boolean;
  observacoes: string;
}

export interface ChecklistAbertura {
  // Bloco 1: Qualificação & Docs Pessoais
  docLocador: boolean;
  docLocatario: boolean;
  estadoCivilTipo: 'solteiro' | 'casado' | 'divorciado' | 'viuvo';
  certidaoEstadoCivil: boolean; // certidão nascimento, casamento, divórcio ou óbito
  comprovanteEndereco: boolean;
  
  // Bloco 2: Renda & Crédito
  comprovacaoRendaTipo: 'holerite' | 'irpf';
  comprovacaoRenda: boolean; // 3 holerites ou IRPF completo com recibo
  analiseCreditoStatus: 'aprovado' | 'ressalvas' | 'reprovado' | 'em_analise';
  analiseCreditoScore: number;

  // Bloco 3: Moradores & Testemunhas
  docMoradores: boolean;
  testemunhasCompletas: boolean;

  // Bloco 4: Garantia & Seguros
  tipoGarantidor: 'caucao' | 'fiador' | 'capitalizacao' | 'seguro_fianca' | 'credpago' | 'outro';
  obsGarantidor: string;
  analiseGarantidor: boolean;
  pagamentoBoletoGarantia: boolean;
  
  seguroIncendioCotado: boolean;
  seguroIncendioApolice: boolean;
  seguroIncendioFormaPagamento: 'a_vista' | 'parcelado';
  seguroIncendioValor: number;
  seguroIncendioParcelas: string; // ex: "4x R$ 85,00"
  seguroIncendioObs: string;

  notaPromissoriaPreenchida: boolean;
  notaPromissoriaAssinada: boolean;

  // Bloco 5: Utilidades
  transferenciaAgua: TransferenciaUtilidade;
  transferenciaLuz: TransferenciaUtilidade;

  // Bloco 6: Vistoria & Minutas
  elaboracaoContratoLocacao: boolean;
  elaboracaoContratoPrestacao: boolean;
  vistoriaEntradaDataInicio: string;
  vistoriaEntradaDataFim: string;
  vistoriaEntradaLaudoAssinado: boolean;
  vistoriaEntradaFotosAnexadas: boolean;
  vistoriaEntradaObs: string;

  assinaturaContratoLocacao: boolean;
  assinaturaContratoPrestacao: boolean;
  lancadoNoPrograma: boolean;
  obsGerais: string;
}

export interface ChecklistEncerramento {
  comunicacaoDataSolicitada: string;
  comunicacaoDataSaida: string;
  comunicacaoMotivo: string;
  comunicacaoObs: string;

  vistoriaSaidaRealizada: boolean;
  vistoriaSaidaData: string;
  vistoriaSaidaFotosDevolucao: boolean;
  vistoriaSaidaComparadoEntrada: boolean;
  vistoriaSaidaObs: string;

  orcamentoReparosNecessita: boolean;
  orcamentoReparosDescricao: string;
  orcamentoReparosValor: number;
  orcamentoReparosAprovadoInquilino: boolean;

  baixaFaturaAguaLeituraFinal: string;
  baixaFaturaAguaQuitada: boolean;
  baixaFaturaAguaConcluida: boolean;

  baixaFaturaCpflLeituraFinal: string;
  baixaFaturaCpflQuitada: boolean;
  baixaFaturaCpflConcluida: boolean;

  boletimOcorrenciaHouve: boolean;
  boletimOcorrenciaNumero: string;
  boletimOcorrenciaMotivo: string;

  baixaSeguroGarantidor: boolean;
  baixaSeguroIncendio: boolean;
  baixaNotaPromissoria: boolean;
  baixaNoPrograma: boolean;

  reembolsoCaucaoValorInicial: number;
  reembolsoCaucaoDescontoReparos: number;
  reembolsoCaucaoDescontoFaturas: number;
  reembolsoCaucaoValorDevolvido: number;
  reembolsoCaucaoPago: boolean;
  reembolsoCaucaoTermoAssinado: boolean;

  dataFinalLocacao: string;
  obsSaida: string;
}

export interface AnexoArquivo {
  id: string;
  nome: string;
  categoria: 'contrato' | 'doc_locatario' | 'testemunhas' | 'moradores' | 'procuracao_sabesp' | 'procuracao_cpfl' | 'seguro' | 'vistoria_entrada' | 'vistoria_saida' | 'comprovante';
  tamanho: string;
  dataUpload: string;
}

export interface Corretor {
  id: string;
  nome: string;
  creci: string;
  email: string;
  telefone: string;
  cpf?: string;
  cargo: string; // Ex: "Corretor de Imóveis", "Especialista em Locação", "Coordenador Comercial", "Avaliador Perito"
  especialidades: string[]; // Ex: ["Locação Residencial", "Comercial", "Vistoria"]
  comissaoPadrao?: number; // Percentual padrão, ex: 50%
  status: 'ativo' | 'inativo';
  dataCadastro: string;
  totalContratos?: number;
  totalImoveis?: number;
  avatarUrl?: string;
  bio?: string;
}

export interface LocatarioAdicional {
  id: string;
  nome: string;
  cpf: string;
  rg?: string;
  profissao?: string;
  telefone: string;
  email?: string;
}

export interface ContratoLocacaoCompleto {
  id: string;
  numeroOrdem: string; // Ex: "85"
  imovelId: number;
  imovelEndereco: string;
  imovelBairro: string;
  imovelCidade: string;
  corretorResponsavel?: string; // Nome ou ID do corretor responsável
  
  status: StatusContrato; // 'pendente' | 'ativo' | 'encerrado'
  processoAtivo: ProcessoContrato; // 'abertura' | 'encerramento'
  
  locador: {
    nome: string;
    cpf: string;
    rg: string;
    profissao?: string;
    estadoCivil?: string;
    telefone: string;
    email: string;
    dadosBancariosPix: string;
    conjuge?: {
      nome: string;
      cpf: string;
      rg?: string;
      profissao?: string;
      telefone?: string;
      email?: string;
      regimeBens?: string;
    };
  };

  locatario: {
    nome: string;
    cpf: string;
    rg: string;
    profissao: string;
    rendaEstimada: number;
    estadoCivil: 'solteiro' | 'casado' | 'divorciado' | 'viuvo';
    enderecoCorrespondencia: string;
    telefone: string;
    email: string;
  };

  segundoLocatario?: LocatarioAdicional;
  locatariosAdicionais?: LocatarioAdicional[];

  testemunhas: Testemunha[];
  moradores: Morador[];

  valores: {
    aluguel: number;
    vencimentoDia: number;
    repasseDia: number;
    taxaAdmPorcentagem: number;
    caucaoValor?: number;
  };

  vigencia: {
    inicio: string; // Ex: "20/11/2026"
    fim: string; // Ex: "20/11/2027"
    meses: number;
  };

  checklistAbertura: ChecklistAbertura;
  checklistEncerramento: ChecklistEncerramento;
  anexos: AnexoArquivo[];
}
