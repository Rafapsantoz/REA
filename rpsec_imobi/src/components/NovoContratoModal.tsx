import React, { useState, useMemo, useEffect } from 'react';
import { X, FileText, CheckCircle2, Building, DollarSign, Calendar, Users, Shield, Plus, Trash2, Heart, Mail, Check } from 'lucide-react';
import { ContratoLocacaoCompleto, Imovel, Cliente, Corretor } from '../types';
import { INITIAL_CORRETORES } from '../mockCorretores';
import { useToast } from './Toast';

interface NovoContratoModalProps {
  onClose: () => void;
  onAddContrato: (novoContrato: ContratoLocacaoCompleto) => void;
  imoveis: Imovel[];
  clientes: Cliente[];
  corretores?: Corretor[];
  contratos?: ContratoLocacaoCompleto[];
}

export const NovoContratoModal: React.FC<NovoContratoModalProps> = ({
  onClose,
  onAddContrato,
  imoveis,
  clientes,
  corretores = [],
  contratos = []
}) => {
  const { showToast } = useToast();

  // Autoincremento inteligente do número de ordem do contrato
  const proximoNumeroSugerido = useMemo(() => {
    if (!contratos || contratos.length === 0) return '86';
    const numeros = contratos
      .map(c => parseInt(c.numeroOrdem.replace(/\D/g, ''), 10))
      .filter(n => !isNaN(n) && n > 0);
    if (numeros.length === 0) return '1';
    const maxNum = Math.max(...numeros);
    return String(maxNum + 1);
  }, [contratos]);

  const [numeroOrdem, setNumeroOrdem] = useState(proximoNumeroSugerido);

  useEffect(() => {
    setNumeroOrdem(proximoNumeroSugerido);
  }, [proximoNumeroSugerido]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Lista consolidada de corretores disponíveis
  const listaCorretores = useMemo(() => {
    return corretores.length > 0 ? corretores : INITIAL_CORRETORES;
  }, [corretores]);

  // Seleção múltipla de corretores responsáveis (pode ser mais de um)
  const [corretoresSelecionados, setCorretoresSelecionados] = useState<string[]>(() => {
    const manoel = listaCorretores.find(c => c.nome.toLowerCase().includes('manoel'));
    if (manoel) return [manoel.nome];
    if (listaCorretores.length > 0) return [listaCorretores[0].nome];
    return ['Manoel Jerônimo'];
  });

  const toggleCorretor = (nome: string) => {
    if (corretoresSelecionados.includes(nome)) {
      if (corretoresSelecionados.length <= 1) {
        showToast("O contrato precisa ter pelo menos 1 corretor responsável.", 'error');
        return;
      }
      setCorretoresSelecionados(prev => prev.filter(n => n !== nome));
    } else {
      setCorretoresSelecionados(prev => [...prev, nome]);
    }
  };
  const [imovelId, setImovelId] = useState<number>(imoveis[0]?.id || 1);
  const [imovelEndereco, setImovelEndereco] = useState('Rua Santos Dumont, 410, Centro, Mococa/SP');
  const [imovelBairro, setImovelBairro] = useState('Centro');
  const [imovelCidade, setImovelCidade] = useState('Mococa/SP');

  // Locador
  const [locadorNome, setLocadorNome] = useState('Carlos Alberto Siqueira');
  const [locadorCpf, setLocadorCpf] = useState('145.892.308-41');
  const [locadorTelefone, setLocadorTelefone] = useState('(19) 99781-2345');
  const [locadorEmail, setLocadorEmail] = useState('carlos.siqueira@agroregional.com.br');

  // Cônjuge do Locador (Flag e dados)
  const [temConjugeLocador, setTemConjugeLocador] = useState(false);
  const [conjugeNome, setConjugeNome] = useState('');
  const [conjugeCpf, setConjugeCpf] = useState('');
  const [conjugeTelefone, setConjugeTelefone] = useState('');
  const [conjugeEmail, setConjugeEmail] = useState('');
  const [conjugeRegimeBens, setConjugeRegimeBens] = useState('Comunhão Parcial de Bens');

  // Locatário Principal
  const [locatarioNome, setLocatarioNome] = useState('');
  const [locatarioCpf, setLocatarioCpf] = useState('');
  const [locatarioTelefone, setLocatarioTelefone] = useState('');
  const [locatarioEmail, setLocatarioEmail] = useState('');
  const [locatarioRenda, setLocatarioRenda] = useState<number>(3500);

  // Locatários Adicionais (Múltiplos Locatários)
  const [locatariosAdicionais, setLocatariosAdicionais] = useState<Array<{ id: string; nome: string; cpf: string; telefone: string; email?: string }>>([]);

  const handleAddLocatario = () => {
    setLocatariosAdicionais(prev => [
      ...prev,
      { id: `loc_${Date.now()}`, nome: '', cpf: '', telefone: '', email: '' }
    ]);
  };

  const handleRemoveLocatario = (id: string) => {
    setLocatariosAdicionais(prev => prev.filter(l => l.id !== id));
  };

  const handleUpdateLocatario = (id: string, field: string, value: string) => {
    setLocatariosAdicionais(prev => prev.map(l => l.id === id ? { ...l, [field]: value } : l));
  };

  // Valores & Vigência
  const [aluguelValor, setAluguelValor] = useState<number>(1200);
  const [vencimentoDia, setVencimentoDia] = useState<number>(10);
  const [repasseDia, setRepasseDia] = useState<number>(15);
  const [tipoGarantidor, setTipoGarantidor] = useState<'caucao' | 'capitalizacao' | 'seguro_fianca' | 'fiador'>('caucao');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!locatarioNome.trim()) {
      showToast("Informe o nome do locatário principal.", 'error');
      return;
    }

    if (!locadorEmail.trim() || !locadorEmail.includes('@')) {
      showToast("O endereço de e-mail do proprietário é obrigatório.", 'error');
      return;
    }

    if (!locatarioEmail.trim() || !locatarioEmail.includes('@')) {
      showToast("O endereço de e-mail do locatário principal é obrigatório.", 'error');
      return;
    }

    if (temConjugeLocador && !conjugeNome.trim()) {
      showToast("Você marcou que o proprietário possui cônjuge. Informe o nome do cônjuge.", 'error');
      return;
    }

    if (corretoresSelecionados.length === 0) {
      showToast("Selecione ao menos 1 corretor responsável pelo contrato.", 'error');
      return;
    }

    const novoContrato: ContratoLocacaoCompleto = {
      id: `ctr-${Date.now()}`,
      numeroOrdem: numeroOrdem || `${Date.now()}`,
      imovelId: imovelId,
      imovelEndereco: imovelEndereco,
      imovelBairro: imovelBairro,
      imovelCidade: imovelCidade,
      corretorResponsavel: corretoresSelecionados[0] || 'Manoel Jerônimo',
      corretoresResponsaveis: corretoresSelecionados,
      status: 'pendente', // Sempre inicia como pendente até 100% da abertura
      processoAtivo: 'abertura',
      locador: {
        nome: locadorNome,
        cpf: locadorCpf,
        rg: "Não informado",
        telefone: locadorTelefone,
        email: locadorEmail,
        dadosBancariosPix: `PIX: ${locadorTelefone}`,
        conjuge: temConjugeLocador ? {
          nome: conjugeNome,
          cpf: conjugeCpf,
          telefone: conjugeTelefone,
          email: conjugeEmail,
          regimeBens: conjugeRegimeBens
        } : undefined
      },
      locatario: {
        nome: locatarioNome,
        cpf: locatarioCpf || "000.000.000-00",
        rg: "Não informado",
        profissao: "Não informada",
        rendaEstimada: aluguelValor * 3,
        estadoCivil: "solteiro",
        enderecoCorrespondencia: imovelEndereco,
        telefone: locatarioTelefone,
        email: locatarioEmail
      },
      locatariosAdicionais: locatariosAdicionais.filter(l => l.nome.trim() !== ''),
      testemunhas: [
        { nome: "", cpf: "", email: "" },
        { nome: "", cpf: "", email: "" }
      ],
      moradores: [],
      valores: {
        aluguel: aluguelValor,
        vencimentoDia: vencimentoDia,
        repasseDia: repasseDia,
        taxaAdmPorcentagem: 10,
        caucaoValor: aluguelValor * 3
      },
      vigencia: {
        inicio: new Date().toLocaleDateString('pt-BR'),
        fim: new Date(Date.now() + 365*24*60*60*1000).toLocaleDateString('pt-BR'),
        meses: 12
      },
      checklistAbertura: {
        docLocador: true,
        docLocatario: false,
        estadoCivilTipo: 'solteiro',
        certidaoEstadoCivil: false,
        comprovanteEndereco: false,
        comprovacaoRendaTipo: 'holerite',
        comprovacaoRenda: false,
        analiseCreditoStatus: 'em_analise',
        analiseCreditoScore: 700,
        docMoradores: false,
        testemunhasCompletas: false,
        tipoGarantidor: tipoGarantidor,
        obsGarantidor: `Garantia de 3 aluguéis (R$ ${(aluguelValor * 3).toLocaleString('pt-BR')},00)`,
        analiseGarantidor: false,
        pagamentoBoletoGarantia: false,
        seguroIncendioCotado: false,
        seguroIncendioApolice: false,
        seguroIncendioFormaPagamento: 'parcelado',
        seguroIncendioValor: 320,
        seguroIncendioParcelas: "4x de R$ 80,00",
        seguroIncendioObs: "",
        notaPromissoriaPreenchida: false,
        notaPromissoriaAssinada: false,
        transferenciaAgua: {
          procuracaoPreenchida: false,
          procuracaoAssinada: false,
          docFotoInquilino: false,
          docFotoCorretor: false,
          contratoAssinado: false,
          contaAntiga: false,
          leituraMedidor: "",
          docImovelIptuMatricula: false,
          dataSolicitacao: "",
          dataFechamento: "",
          concluido: false,
          observacoes: ""
        },
        transferenciaLuz: {
          procuracaoPreenchida: false,
          procuracaoAssinada: false,
          docFotoInquilino: false,
          docFotoCorretor: false,
          contratoAssinado: false,
          contaAntiga: false,
          leituraMedidor: "",
          docImovelIptuMatricula: false,
          dataSolicitacao: "",
          dataFechamento: "",
          concluido: false,
          observacoes: ""
        },
        elaboracaoContratoLocacao: false,
        elaboracaoContratoPrestacao: false,
        vistoriaEntradaDataInicio: "",
        vistoriaEntradaDataFim: "",
        vistoriaEntradaLaudoAssinado: false,
        vistoriaEntradaFotosAnexadas: false,
        vistoriaEntradaObs: "",
        assinaturaContratoLocacao: false,
        assinaturaContratoPrestacao: false,
        lancadoNoPrograma: false,
        obsGerais: ""
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
        reembolsoCaucaoValorInicial: aluguelValor * 3,
        reembolsoCaucaoDescontoReparos: 0,
        reembolsoCaucaoDescontoFaturas: 0,
        reembolsoCaucaoValorDevolvido: 0,
        reembolsoCaucaoPago: false,
        reembolsoCaucaoTermoAssinado: false,
        dataFinalLocacao: "",
        obsSaida: ""
      },
      anexos: []
    };

    onAddContrato(novoContrato);
    showToast(`Contrato Nº ${novoContrato.numeroOrdem} iniciado. Preencha o checklist de abertura!`, 'success');
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="novo-contrato-title"
      onClick={onClose}
      className="fixed inset-0 z-50 overflow-y-auto bg-[#0D1014]/75 backdrop-blur-xs flex justify-center items-center p-2 sm:p-4 animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-[#151921] border border-[#E2DFD7] dark:border-[#252B37] rounded-xl w-full max-w-2xl shadow-2xl max-h-[92vh] flex flex-col overflow-hidden animate-scale-up"
      >
        {/* Cabeçalho */}
        <div className="p-5 sm:p-6 bg-[#F7F6F2] dark:bg-[#0D1014] border-b border-[#E2DFD7] dark:border-[#252B37] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#B91C1C] text-white flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 id="novo-contrato-title" className="font-display text-lg font-bold text-[#141619] dark:text-white">
                Iniciar contrato de locação
              </h2>
              <p className="text-xs sm:text-sm text-[#525866] dark:text-slate-400">
                O contrato inicia em abertura até que os 25 itens obrigatórios sejam concluídos.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar janela"
            className="p-2 text-[#525866] dark:text-slate-400 hover:text-[#141619] dark:hover:text-white rounded-lg hover:bg-[#EFECE6] dark:hover:bg-[#1C212B] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs sm:text-sm font-semibold text-[#141619] dark:text-slate-200">Nº do contrato *</label>
                <span className="text-xs font-medium text-[#B91C1C] dark:text-red-400">
                  Automático
                </span>
              </div>
              <input
                type="text"
                required
                value={numeroOrdem}
                onChange={(e) => setNumeroOrdem(e.target.value)}
                placeholder={`Sugerido: ${proximoNumeroSugerido}`}
                className="w-full text-sm px-3 py-2 rounded-lg bg-[#F7F6F2] dark:bg-[#0D1014] border border-[#E2DFD7] dark:border-[#252B37] font-display font-bold text-[#B91C1C] dark:text-red-400 tabular-nums focus:border-[#B91C1C] outline-none"
              />
            </div>
            <div>
              <label className="text-xs sm:text-sm font-semibold text-[#141619] dark:text-slate-200 block mb-1.5">Dia de vencimento *</label>
              <input
                type="number"
                min="1"
                max="31"
                value={vencimentoDia}
                onChange={(e) => setVencimentoDia(Number(e.target.value))}
                className="w-full text-sm px-3 py-2 rounded-lg bg-[#F7F6F2] dark:bg-[#0D1014] border border-[#E2DFD7] dark:border-[#252B37] text-[#141619] dark:text-white font-semibold tabular-nums focus:border-[#B91C1C] outline-none"
              />
            </div>
            <div>
              <label className="text-xs sm:text-sm font-semibold text-[#141619] dark:text-slate-200 block mb-1.5">Dia de repasse *</label>
              <input
                type="number"
                min="1"
                max="31"
                value={repasseDia}
                onChange={(e) => setRepasseDia(Number(e.target.value))}
                className="w-full text-sm px-3 py-2 rounded-lg bg-[#F7F6F2] dark:bg-[#0D1014] border border-[#E2DFD7] dark:border-[#252B37] text-[#141619] dark:text-white font-semibold tabular-nums focus:border-[#B91C1C] outline-none"
              />
            </div>
          </div>

          {/* Corretores Responsáveis */}
          <div className="p-4 bg-[#F7F6F2] dark:bg-[#0D1014] rounded-xl border border-[#E2DFD7] dark:border-[#252B37] space-y-2.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <label className="text-sm font-semibold text-[#141619] dark:text-slate-200 flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-[#B91C1C] dark:text-red-400" />
                <span>Corretores responsáveis *</span>
              </label>
              <span className="text-xs font-semibold text-[#B91C1C] dark:text-red-400 tabular-nums">
                {corretoresSelecionados.length} selecionado{corretoresSelecionados.length > 1 ? 's' : ''}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {listaCorretores.map(c => {
                const isSelected = corretoresSelecionados.includes(c.nome);
                return (
                  <button
                    type="button"
                    key={c.id || c.nome}
                    onClick={() => toggleCorretor(c.nome)}
                    className={`p-2.5 rounded-lg border text-left flex items-center justify-between transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-red-50 dark:bg-red-950/40 border-[#B91C1C] dark:border-red-600'
                        : 'bg-white dark:bg-[#151921] border-[#E2DFD7] dark:border-[#252B37] hover:border-[#C9C4B8] dark:hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`w-7 h-7 rounded-md flex items-center justify-center text-xs font-bold shrink-0 ${
                        isSelected
                          ? 'bg-[#B91C1C] text-white'
                          : 'bg-[#EFECE6] dark:bg-[#1C212B] text-[#525866] dark:text-slate-300'
                      }`}>
                        {c.nome.charAt(0)}
                      </div>
                      <div className="min-w-0 truncate">
                        <p className={`text-xs truncate ${isSelected ? 'font-bold text-[#141619] dark:text-white' : 'font-medium text-[#141619] dark:text-slate-300'}`}>
                          {c.nome}
                        </p>
                        <p className="text-xs text-[#525866] dark:text-slate-400 truncate tabular-nums">
                          CRECI {c.creci}
                        </p>
                      </div>
                    </div>
                    <div className={`w-5 h-5 rounded flex items-center justify-center shrink-0 ml-2 ${
                      isSelected
                        ? 'bg-[#B91C1C] text-white'
                        : 'border border-[#C9C4B8] dark:border-slate-600 bg-white dark:bg-[#0D1014]'
                    }`}>
                      {isSelected ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : null}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dados do Locador */}
          <div className="p-4 bg-[#F7F6F2] dark:bg-[#0D1014] rounded-xl border border-[#E2DFD7] dark:border-[#252B37] space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-sm font-bold text-[#141619] dark:text-white flex items-center gap-1.5">
                <Building className="w-4 h-4 text-[#B91C1C] dark:text-red-400" />
                <span>Proprietário (locador)</span>
              </span>

              <label className="flex items-center gap-2 cursor-pointer bg-white dark:bg-[#151921] px-3 py-1.5 rounded-lg border border-[#E2DFD7] dark:border-[#252B37] hover:border-[#B91C1C] transition-colors">
                <input
                  type="checkbox"
                  checked={temConjugeLocador}
                  onChange={(e) => setTemConjugeLocador(e.target.checked)}
                  className="rounded text-[#B91C1C] focus:ring-[#B91C1C] w-4 h-4"
                />
                <span className="text-xs font-semibold text-[#141619] dark:text-slate-200 flex items-center gap-1.5">
                  <Heart className="w-3.5 h-3.5 text-[#B91C1C] dark:text-red-400" />
                  Possui cônjuge
                </span>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div>
                <label className="text-xs font-medium text-[#525866] dark:text-slate-400 block mb-1">Nome do proprietário *</label>
                <input
                  type="text"
                  required
                  placeholder="Nome completo"
                  value={locadorNome}
                  onChange={(e) => setLocadorNome(e.target.value)}
                  className="w-full text-sm px-3 py-2 rounded-lg bg-white dark:bg-[#151921] border border-[#E2DFD7] dark:border-[#252B37] text-[#141619] dark:text-white"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-[#525866] dark:text-slate-400 block mb-1">Telefone / WhatsApp</label>
                <input
                  type="text"
                  placeholder="(19) 99781-2345"
                  value={locadorTelefone}
                  onChange={(e) => setLocadorTelefone(e.target.value)}
                  className="w-full text-sm px-3 py-2 rounded-lg bg-white dark:bg-[#151921] border border-[#E2DFD7] dark:border-[#252B37] text-[#141619] dark:text-white tabular-nums"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-[#525866] dark:text-slate-400 mb-1 flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-[#B91C1C] dark:text-red-400" />
                  <span>E-mail *</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="proprietario@email.com"
                  value={locadorEmail}
                  onChange={(e) => setLocadorEmail(e.target.value)}
                  className="w-full text-sm px-3 py-2 rounded-lg bg-white dark:bg-[#151921] border border-[#E2DFD7] dark:border-[#252B37] text-[#141619] dark:text-white"
                />
              </div>
            </div>

            {temConjugeLocador && (
              <div className="p-3.5 bg-red-50/70 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-900/50 space-y-2.5 animate-fade-in">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#B91C1C] dark:text-red-300 flex items-center gap-1.5">
                    <Heart className="w-3.5 h-3.5" />
                    Dados do cônjuge (assinatura conjunta)
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="text-xs text-[#525866] dark:text-slate-400 block mb-1">Nome do cônjuge *</label>
                    <input
                      type="text"
                      placeholder="Nome completo"
                      value={conjugeNome}
                      onChange={(e) => setConjugeNome(e.target.value)}
                      className="w-full text-sm px-3 py-2 rounded-lg bg-white dark:bg-[#151921] border border-red-200 dark:border-red-900/50 text-[#141619] dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-[#525866] dark:text-slate-400 block mb-1">CPF</label>
                    <input
                      type="text"
                      placeholder="000.000.000-00"
                      value={conjugeCpf}
                      onChange={(e) => setConjugeCpf(e.target.value)}
                      className="w-full text-sm px-3 py-2 rounded-lg bg-white dark:bg-[#151921] border border-red-200 dark:border-red-900/50 text-[#141619] dark:text-white tabular-nums"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-[#525866] dark:text-slate-400 block mb-1">Telefone</label>
                    <input
                      type="text"
                      placeholder="(19) 99999-9999"
                      value={conjugeTelefone}
                      onChange={(e) => setConjugeTelefone(e.target.value)}
                      className="w-full text-sm px-3 py-2 rounded-lg bg-white dark:bg-[#151921] border border-red-200 dark:border-red-900/50 text-[#141619] dark:text-white tabular-nums"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-[#525866] dark:text-slate-400 block mb-1">Regime de bens</label>
                    <select
                      value={conjugeRegimeBens}
                      onChange={(e) => setConjugeRegimeBens(e.target.value)}
                      className="w-full text-sm px-3 py-2 rounded-lg bg-white dark:bg-[#151921] border border-red-200 dark:border-red-900/50 text-[#141619] dark:text-slate-200"
                    >
                      <option value="Comunhão Parcial de Bens">Comunhão Parcial de Bens (Padrão)</option>
                      <option value="Comunhão Universal de Bens">Comunhão Universal de Bens</option>
                      <option value="Separação Total de Bens">Separação Total de Bens</option>
                      <option value="Participação Final nos Aquestos">Participação Final nos Aquestos</option>
                      <option value="União Estável">União Estável</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-[#525866] dark:text-slate-400 block mb-1">E-mail (opcional)</label>
                    <input
                      type="email"
                      placeholder="conjuge@email.com"
                      value={conjugeEmail}
                      onChange={(e) => setConjugeEmail(e.target.value)}
                      className="w-full text-sm px-3 py-2 rounded-lg bg-white dark:bg-[#151921] border border-red-200 dark:border-red-900/50 text-[#141619] dark:text-white"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Dados do Locatário */}
          <div className="p-4 bg-[#F7F6F2] dark:bg-[#0D1014] rounded-xl border border-[#E2DFD7] dark:border-[#252B37] space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-bold text-[#141619] dark:text-white flex items-center gap-1.5">
                <Users className="w-4 h-4 text-[#B91C1C] dark:text-red-400" />
                <span>Locatários (inquilinos)</span>
              </span>

              <button
                type="button"
                onClick={handleAddLocatario}
                className="px-3 py-1.5 bg-white hover:bg-[#EFECE6] dark:bg-[#151921] dark:hover:bg-[#1C212B] text-[#141619] dark:text-slate-200 border border-[#E2DFD7] dark:border-[#252B37] rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-[#B91C1C] dark:text-red-400" />
                <span>Adicionar co-locatário</span>
              </button>
            </div>

            <div className="p-3.5 bg-white dark:bg-[#151921] rounded-lg border border-[#E2DFD7] dark:border-[#252B37] space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#141619] dark:text-slate-200">
                  1º locatário (titular principal)
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <input
                  type="text"
                  required
                  placeholder="Nome completo *"
                  value={locatarioNome}
                  onChange={(e) => setLocatarioNome(e.target.value)}
                  className="text-sm px-3 py-2 rounded-lg bg-[#F7F6F2] dark:bg-[#0D1014] border border-[#E2DFD7] dark:border-[#252B37] text-[#141619] dark:text-white"
                />
                <input
                  type="email"
                  required
                  placeholder="E-mail *"
                  value={locatarioEmail}
                  onChange={(e) => setLocatarioEmail(e.target.value)}
                  className="text-sm px-3 py-2 rounded-lg bg-[#F7F6F2] dark:bg-[#0D1014] border border-[#E2DFD7] dark:border-[#252B37] text-[#141619] dark:text-white"
                />
                <input
                  type="text"
                  placeholder="CPF"
                  value={locatarioCpf}
                  onChange={(e) => setLocatarioCpf(e.target.value)}
                  className="text-sm px-3 py-2 rounded-lg bg-[#F7F6F2] dark:bg-[#0D1014] border border-[#E2DFD7] dark:border-[#252B37] text-[#141619] dark:text-white tabular-nums"
                />
                <input
                  type="text"
                  placeholder="Telefone / WhatsApp"
                  value={locatarioTelefone}
                  onChange={(e) => setLocatarioTelefone(e.target.value)}
                  className="text-sm px-3 py-2 rounded-lg bg-[#F7F6F2] dark:bg-[#0D1014] border border-[#E2DFD7] dark:border-[#252B37] text-[#141619] dark:text-white tabular-nums"
                />
              </div>
            </div>

            {locatariosAdicionais.map((loc, idx) => (
              <div key={loc.id} className="p-3.5 bg-white dark:bg-[#151921] rounded-lg border border-[#E2DFD7] dark:border-[#252B37] space-y-2.5 animate-fade-in">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#141619] dark:text-slate-200">
                    {idx + 2}º locatário (co-inquilino)
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveLocatario(loc.id)}
                    className="text-[#B91C1C] hover:underline text-xs font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remover</span>
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <input
                    type="text"
                    required
                    placeholder="Nome completo *"
                    value={loc.nome}
                    onChange={(e) => handleUpdateLocatario(loc.id, 'nome', e.target.value)}
                    className="text-sm px-3 py-2 rounded-lg bg-[#F7F6F2] dark:bg-[#0D1014] border border-[#E2DFD7] dark:border-[#252B37] text-[#141619] dark:text-white"
                  />
                  <input
                    type="email"
                    placeholder="E-mail"
                    value={loc.email || ''}
                    onChange={(e) => handleUpdateLocatario(loc.id, 'email', e.target.value)}
                    className="text-sm px-3 py-2 rounded-lg bg-[#F7F6F2] dark:bg-[#0D1014] border border-[#E2DFD7] dark:border-[#252B37] text-[#141619] dark:text-white"
                  />
                  <input
                    type="text"
                    placeholder="CPF"
                    value={loc.cpf}
                    onChange={(e) => handleUpdateLocatario(loc.id, 'cpf', e.target.value)}
                    className="text-sm px-3 py-2 rounded-lg bg-[#F7F6F2] dark:bg-[#0D1014] border border-[#E2DFD7] dark:border-[#252B37] text-[#141619] dark:text-white tabular-nums"
                  />
                  <input
                    type="text"
                    placeholder="Telefone / WhatsApp"
                    value={loc.telefone}
                    onChange={(e) => handleUpdateLocatario(loc.id, 'telefone', e.target.value)}
                    className="text-sm px-3 py-2 rounded-lg bg-[#F7F6F2] dark:bg-[#0D1014] border border-[#E2DFD7] dark:border-[#252B37] text-[#141619] dark:text-white tabular-nums"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Valores & Garantia */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="text-sm font-semibold text-[#141619] dark:text-slate-200 block mb-1.5">Valor do aluguel (R$)</label>
              <input
                type="number"
                value={aluguelValor}
                onChange={(e) => setAluguelValor(Number(e.target.value))}
                className="w-full text-sm px-3.5 py-2.5 rounded-lg bg-[#F7F6F2] dark:bg-[#0D1014] border border-[#E2DFD7] dark:border-[#252B37] font-bold text-emerald-700 dark:text-emerald-400 tabular-nums"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-[#141619] dark:text-slate-200 block mb-1.5">Tipo de garantia</label>
              <select
                value={tipoGarantidor}
                onChange={(e) => setTipoGarantidor(e.target.value as any)}
                className="w-full text-sm px-3.5 py-2.5 rounded-lg bg-[#F7F6F2] dark:bg-[#0D1014] border border-[#E2DFD7] dark:border-[#252B37] text-[#141619] dark:text-white"
              >
                <option value="caucao">Caução em dinheiro</option>
                <option value="capitalizacao">Título de capitalização</option>
                <option value="seguro_fianca">Seguro fiança</option>
                <option value="fiador">Fiador</option>
              </select>
            </div>
          </div>

          {/* Botões */}
          <div className="flex justify-end gap-2.5 pt-4 border-t border-[#E2DFD7] dark:border-[#252B37]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-semibold text-[#525866] dark:text-slate-300 border border-[#E2DFD7] dark:border-[#252B37] hover:bg-[#EFECE6] dark:hover:bg-[#1C212B] rounded-lg transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-sm font-semibold text-white bg-[#B91C1C] hover:bg-[#991B1B] rounded-lg flex items-center gap-2 transition-colors cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Criar contrato</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
