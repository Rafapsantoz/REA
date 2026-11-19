import React, { useState } from 'react';
import { X, FileText, CheckCircle2, Building, DollarSign, Calendar, Users, Shield, Plus, Trash2, Heart } from 'lucide-react';
import { ContratoLocacaoCompleto, Imovel, Cliente } from '../types';
import { useToast } from './Toast';

interface NovoContratoModalProps {
  onClose: () => void;
  onAddContrato: (novoContrato: ContratoLocacaoCompleto) => void;
  imoveis: Imovel[];
  clientes: Cliente[];
}

export const NovoContratoModal: React.FC<NovoContratoModalProps> = ({
  onClose,
  onAddContrato,
  imoveis,
  clientes
}) => {
  const { showToast } = useToast();

  const [numeroOrdem, setNumeroOrdem] = useState('86');
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

    if (temConjugeLocador && !conjugeNome.trim()) {
      showToast("Você marcou que o proprietário possui cônjuge. Informe o nome do cônjuge.", 'error');
      return;
    }

    const novoContrato: ContratoLocacaoCompleto = {
      id: `ctr-${Date.now()}`,
      numeroOrdem: numeroOrdem || `${Date.now()}`,
      imovelId: imovelId,
      imovelEndereco: imovelEndereco,
      imovelBairro: imovelBairro,
      imovelCidade: imovelCidade,
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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-sm flex justify-center items-center p-2 sm:p-4 animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* Cabeçalho */}
        <div className="p-6 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-red-600 text-white flex items-center justify-center font-bold">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Iniciar Novo Contrato de Locação
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                O contrato entrará com status <strong>Em Abertura / Pendente</strong> até que todos os 25 itens do checklist sejam cumpridos.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-xl">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulário com rolagem independente */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Nº Ordem Contrato *</label>
              <input
                type="text"
                required
                value={numeroOrdem}
                onChange={(e) => setNumeroOrdem(e.target.value)}
                placeholder="Ex: 86"
                className="w-full text-xs p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 font-bold"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Dia Vencimento *</label>
              <input
                type="number"
                value={vencimentoDia}
                onChange={(e) => setVencimentoDia(Number(e.target.value))}
                className="w-full text-xs p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700"
              />
            </div>
          </div>

          {/* Dados do Locador */}
          <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-xs font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1.5 uppercase tracking-wider">
                <Building className="w-4 h-4" />
                Dados do Proprietário (Locador)
              </span>

              {/* FLAG / CHECKBOX PARA CÔNJUGE */}
              <label className="flex items-center gap-2 cursor-pointer bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-rose-300 dark:hover:border-rose-700 transition-colors">
                <input
                  type="checkbox"
                  checked={temConjugeLocador}
                  onChange={(e) => setTemConjugeLocador(e.target.checked)}
                  className="rounded text-rose-600 focus:ring-rose-500 w-4 h-4"
                />
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Heart className="w-3.5 h-3.5 text-rose-500" />
                  Possui Cônjuge (Casado/União Estável)
                </span>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] text-slate-500 block mb-0.5">Nome do Proprietário *</label>
                <input
                  type="text"
                  required
                  placeholder="Nome do Locador"
                  value={locadorNome}
                  onChange={(e) => setLocadorNome(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-medium"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-500 block mb-0.5">Telefone / WhatsApp</label>
                <input
                  type="text"
                  placeholder="(19) 99781-2345"
                  value={locadorTelefone}
                  onChange={(e) => setLocadorTelefone(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-medium"
                />
              </div>
            </div>

            {/* SEÇÃO CONDICIONAL: DADOS DO CÔNJUGE DO LOCADOR */}
            {temConjugeLocador && (
              <div className="p-3.5 bg-rose-500/5 dark:bg-rose-950/20 rounded-xl border border-rose-500/20 space-y-2.5 animate-fade-in">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-rose-700 dark:text-rose-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Heart className="w-3.5 h-3.5 text-rose-500" />
                    Informações do Cônjuge do Proprietário
                  </span>
                  <span className="text-[10px] text-rose-500 font-medium">Requerido para assinatura conjunta</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-500 block mb-0.5">Nome do Cônjuge *</label>
                    <input
                      type="text"
                      placeholder="Nome Completo do Cônjuge"
                      value={conjugeNome}
                      onChange={(e) => setConjugeNome(e.target.value)}
                      className="w-full text-xs p-2 rounded-lg bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/50"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 block mb-0.5">CPF do Cônjuge</label>
                    <input
                      type="text"
                      placeholder="000.000.000-00"
                      value={conjugeCpf}
                      onChange={(e) => setConjugeCpf(e.target.value)}
                      className="w-full text-xs p-2 rounded-lg bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/50"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 block mb-0.5">Telefone / WhatsApp</label>
                    <input
                      type="text"
                      placeholder="(19) 99999-9999"
                      value={conjugeTelefone}
                      onChange={(e) => setConjugeTelefone(e.target.value)}
                      className="w-full text-xs p-2 rounded-lg bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/50"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-500 block mb-0.5">Regime de Bens</label>
                    <select
                      value={conjugeRegimeBens}
                      onChange={(e) => setConjugeRegimeBens(e.target.value)}
                      className="w-full text-xs p-2 rounded-lg bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/50 text-slate-700 dark:text-slate-200"
                    >
                      <option value="Comunhão Parcial de Bens">Comunhão Parcial de Bens (Padrão)</option>
                      <option value="Comunhão Universal de Bens">Comunhão Universal de Bens</option>
                      <option value="Separação Total de Bens">Separação Total de Bens</option>
                      <option value="Participação Final nos Aquestos">Participação Final nos Aquestos</option>
                      <option value="União Estável">União Estável</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 block mb-0.5">E-mail do Cônjuge (Opcional)</label>
                    <input
                      type="email"
                      placeholder="conjuge@email.com"
                      value={conjugeEmail}
                      onChange={(e) => setConjugeEmail(e.target.value)}
                      className="w-full text-xs p-2 rounded-lg bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/50"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Dados do Locatário Principal e Co-inquilinos */}
          <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5 uppercase tracking-wider">
                <Users className="w-4 h-4" />
                Dados do(s) Inquilino(s) / Locatário(s)
              </span>

              {/* BOTÃO + PARA ADICIONAR MAIS DE UM LOCATÁRIO */}
              <button
                type="button"
                onClick={handleAddLocatario}
                className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                title="Adicionar co-locatário ao contrato"
              >
                <Plus className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Adicionar Locatário</span>
              </button>
            </div>

            {/* 1º Locatário (Principal / Titular) */}
            <div className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold text-slate-700 dark:text-slate-300 uppercase flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                  1º Locatário (Titular Principal)
                </span>
                <span className="text-[10px] text-slate-400 font-medium">Responsável principal</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input
                  type="text"
                  required
                  placeholder="Nome Completo *"
                  value={locatarioNome}
                  onChange={(e) => setLocatarioNome(e.target.value)}
                  className="text-xs p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 font-medium"
                />
                <input
                  type="text"
                  placeholder="CPF"
                  value={locatarioCpf}
                  onChange={(e) => setLocatarioCpf(e.target.value)}
                  className="text-xs p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700"
                />
                <input
                  type="text"
                  placeholder="Telefone / WhatsApp"
                  value={locatarioTelefone}
                  onChange={(e) => setLocatarioTelefone(e.target.value)}
                  className="text-xs p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700"
                />
              </div>
            </div>

            {/* Locatários Adicionais */}
            {locatariosAdicionais.map((loc, idx) => (
              <div key={loc.id} className="p-3.5 bg-indigo-50/60 dark:bg-indigo-950/20 rounded-xl border border-indigo-200 dark:border-indigo-800/60 space-y-2 animate-fade-in">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold text-indigo-700 dark:text-indigo-300 uppercase flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
                    {idx + 2}º Locatário (Co-inquilino)
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveLocatario(loc.id)}
                    className="text-rose-500 hover:text-rose-700 dark:hover:text-rose-400 p-1 hover:bg-rose-100 dark:hover:bg-rose-950/40 rounded-lg transition-colors flex items-center gap-1 text-[11px] font-bold cursor-pointer"
                    title="Remover este locatário"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remover</span>
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Nome Completo *"
                    value={loc.nome}
                    onChange={(e) => handleUpdateLocatario(loc.id, 'nome', e.target.value)}
                    className="text-xs p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-medium"
                  />
                  <input
                    type="text"
                    placeholder="CPF"
                    value={loc.cpf}
                    onChange={(e) => handleUpdateLocatario(loc.id, 'cpf', e.target.value)}
                    className="text-xs p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                  />
                  <input
                    type="text"
                    placeholder="Telefone / WhatsApp"
                    value={loc.telefone}
                    onChange={(e) => handleUpdateLocatario(loc.id, 'telefone', e.target.value)}
                    className="text-xs p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Valores & Garantia */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Valor Aluguel (R$)</label>
              <input
                type="number"
                value={aluguelValor}
                onChange={(e) => setAluguelValor(Number(e.target.value))}
                className="w-full text-xs p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 font-bold text-emerald-500"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Garantia</label>
              <select
                value={tipoGarantidor}
                onChange={(e) => setTipoGarantidor(e.target.value as any)}
                className="w-full text-xs p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700"
              >
                <option value="caucao">Caução Dinheiro</option>
                <option value="capitalizacao">Capitalização</option>
                <option value="seguro_fianca">Seguro Fiança</option>
                <option value="fiador">Fiador</option>
              </select>
            </div>
          </div>

          {/* Botões */}
          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-md shadow-rose-900/20 flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Criar Contrato & Abrir Checklist</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
