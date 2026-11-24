import React, { useState } from 'react';
import {
  FileText,
  CheckCircle2,
  AlertTriangle,
  Search,
  Plus,
  Eye,
  ChevronRight,
  Shield,
  Lock,
  Trash2
} from 'lucide-react';
import { ContratoLocacaoCompleto, Imovel, Cliente, Corretor } from '../types';
import { calcularProgressoAbertura, calcularProgressoEncerramento } from '../mockContratos';
import { ContratoChecklistModal } from './ContratoChecklistModal';
import { NovoContratoModal } from './NovoContratoModal';
import { ConfirmModal } from './ConfirmModal';
import { useToast } from './Toast';

interface DesktopViewProps {
  contratos: ContratoLocacaoCompleto[];
  onUpdateContrato: (contratoAtualizado: ContratoLocacaoCompleto) => void;
  onAddContrato: (novoContrato: ContratoLocacaoCompleto) => void;
  onDeleteContrato?: (id: string) => void;
  imoveis?: Imovel[];
  clientes?: Cliente[];
  corretores?: Corretor[];
  onAddImovel?: (novo: Imovel) => void;
  onAddCliente?: (novo: Cliente) => void;
  onUpdateImovelStatus?: (id: number, status: Imovel['status']) => void;
  onUpdateClienteStatus?: (id: string, status: Cliente['statusAtendimento']) => void;
  onUpdateImovel?: (imovelAtualizado: Imovel) => void;
  visitas?: any[];
}

export const DesktopView: React.FC<DesktopViewProps> = ({
  contratos,
  onUpdateContrato,
  onAddContrato,
  onDeleteContrato,
  imoveis = [],
  clientes = [],
  corretores = []
}) => {
  const { showToast } = useToast();

  const [modalConfirmacao, setModalConfirmacao] = useState<{
    aberto: boolean;
    titulo: string;
    mensagem: string;
    nomeItem?: string;
    onConfirmar: () => void;
  }>({
    aberto: false,
    titulo: '',
    mensagem: '',
    onConfirmar: () => {}
  });

  const handleExcluirContrato = (id: string, numeroOrdem: string, inquilinoNome: string) => {
    setModalConfirmacao({
      aberto: true,
      titulo: 'Excluir contrato',
      mensagem: `Deseja excluir permanentemente o Contrato nº ${numeroOrdem}? Os registros de checklist, pendências e vínculos serão removidos.`,
      nomeItem: `Contrato nº ${numeroOrdem} — Locatário: ${inquilinoNome}`,
      onConfirmar: () => {
        if (onDeleteContrato) {
          onDeleteContrato(id);
          showToast(`Contrato nº ${numeroOrdem} excluído.`, 'info');
        }
      }
    });
  };

  const [statusFilter, setStatusFilter] = useState<'todos' | 'pendente_abertura' | 'pendente_fechamento' | 'ativo' | 'encerrado'>('todos');
  const [busca, setBusca] = useState('');

  const [contratoSelecionado, setContratoSelecionado] = useState<ContratoLocacaoCompleto | null>(null);
  const [abaInicialModal, setAbaInicialModal] = useState<'abertura' | 'encerramento' | 'anexos'>('abertura');
  const [modalNovoAberto, setModalNovoAberto] = useState(false);

  // Métricas & Contadores
  const contratosPendentesAbertura = contratos.filter(c => c.status === 'pendente' && c.processoAtivo !== 'encerramento');
  const contratosPendentesFechamento = contratos.filter(c => c.processoAtivo === 'encerramento' && c.status !== 'encerrado');
  const contratosAtivos = contratos.filter(c => c.status === 'ativo' && c.processoAtivo !== 'encerramento');
  const contratosEncerrados = contratos.filter(c => c.status === 'encerrado');

  const receitaAtivaTotal = contratosAtivos.reduce((acc, c) => acc + c.valores.aluguel, 0);
  const caucaoTotalCustodia = contratosAtivos.reduce((acc, c) => acc + (c.valores.caucaoValor || 0), 0);
  const totalPendencias = contratosPendentesAbertura.length + contratosPendentesFechamento.length;

  const contratosFiltrados = contratos.filter(c => {
    if (statusFilter === 'pendente_abertura') {
      if (!(c.status === 'pendente' && c.processoAtivo !== 'encerramento')) return false;
    } else if (statusFilter === 'pendente_fechamento') {
      if (!(c.processoAtivo === 'encerramento' && c.status !== 'encerrado')) return false;
    } else if (statusFilter === 'ativo') {
      if (!(c.status === 'ativo' && c.processoAtivo !== 'encerramento')) return false;
    } else if (statusFilter === 'encerrado') {
      if (c.status !== 'encerrado') return false;
    }

    if (busca.trim()) {
      const q = busca.toLowerCase().trim();
      const matchInquilino = c.locatario.nome.toLowerCase().includes(q);
      const matchProprietario = c.locador.nome.toLowerCase().includes(q);
      const matchNumero = c.numeroOrdem.toLowerCase().includes(q) || `contrato ${c.numeroOrdem}`.toLowerCase().includes(q);
      return matchInquilino || matchProprietario || matchNumero;
    }
    return true;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Cabeçalho do Painel */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2 border-b border-[#E2DFD7] dark:border-[#252B37]">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#141619] dark:text-white tracking-tight">
            Contratos de locação
          </h1>
          <p className="text-sm text-[#525866] dark:text-slate-400 mt-1">
            Acompanhamento de abertura documental, vigência e processos de rescisão.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setModalNovoAberto(true)}
          className="px-4 py-2.5 bg-[#B91C1C] hover:bg-[#991B1B] text-white rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Novo contrato</span>
        </button>
      </div>

      {/* Resumo Financeiro & Operacional (não redundante com os filtros) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-[#151921] border border-[#E2DFD7] dark:border-[#252B37] rounded-xl p-4 sm:p-5">
          <span className="text-xs font-semibold text-[#525866] dark:text-slate-400 block">
            Aluguéis ativos por mês
          </span>
          <div className="mt-1.5 flex items-baseline gap-2">
            <span className="font-display text-2xl font-bold text-[#141619] dark:text-white tabular-nums">
              R$ {receitaAtivaTotal.toLocaleString('pt-BR')}
            </span>
            <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
              {contratosAtivos.length} {contratosAtivos.length === 1 ? 'contrato regular' : 'contratos regulares'}
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-[#151921] border border-[#E2DFD7] dark:border-[#252B37] rounded-xl p-4 sm:p-5">
          <span className="text-xs font-semibold text-[#525866] dark:text-slate-400 block">
            Garantias e cauções em custódia
          </span>
          <div className="mt-1.5 flex items-baseline gap-2">
            <span className="font-display text-2xl font-bold text-[#141619] dark:text-white tabular-nums">
              R$ {caucaoTotalCustodia.toLocaleString('pt-BR')}
            </span>
            <span className="text-xs text-[#525866] dark:text-slate-400">
              em contratos vigentes
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-[#151921] border border-[#E2DFD7] dark:border-[#252B37] rounded-xl p-4 sm:p-5">
          <span className="text-xs font-semibold text-[#525866] dark:text-slate-400 block">
            Pendências documentais
          </span>
          <div className="mt-1.5 flex items-baseline gap-2">
            <span className="font-display text-2xl font-bold text-[#141619] dark:text-white tabular-nums">
              {totalPendencias}
            </span>
            <span className="text-xs text-[#525866] dark:text-slate-400 tabular-nums">
              {contratosPendentesAbertura.length} em abertura, {contratosPendentesFechamento.length} em rescisão
            </span>
          </div>
        </div>
      </div>

      {/* Barra Única de Pesquisa & Filtros por Etapa */}
      <div className="bg-white dark:bg-[#151921] p-4 rounded-xl border border-[#E2DFD7] dark:border-[#252B37] space-y-3.5">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#525866] dark:text-slate-400" />
          <input
            type="text"
            aria-label="Pesquisar contratos"
            placeholder="Buscar por inquilino, proprietário ou número do contrato..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full text-sm pl-10 pr-20 py-2.5 rounded-lg bg-[#F7F6F2] dark:bg-[#0D1014] border border-[#E2DFD7] dark:border-[#252B37] text-[#141619] dark:text-white placeholder:text-[#525866]/70 dark:placeholder:text-slate-500 focus:outline-none focus:border-[#B91C1C] transition-colors"
          />
          {busca && (
            <button
              type="button"
              onClick={() => setBusca('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 px-2.5 py-1 text-xs font-semibold text-[#525866] hover:text-[#141619] dark:text-slate-400 dark:hover:text-white rounded-md hover:bg-[#EFECE6] dark:hover:bg-[#1C212B] transition-colors cursor-pointer"
            >
              Limpar
            </button>
          )}
        </div>

        <div role="tablist" aria-label="Filtrar por situação do contrato" className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            role="tab"
            aria-selected={statusFilter === 'todos'}
            onClick={() => setStatusFilter('todos')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer tabular-nums ${
              statusFilter === 'todos'
                ? 'bg-[#141619] dark:bg-white text-white dark:text-[#141619]'
                : 'bg-[#F7F6F2] dark:bg-[#0D1014] text-[#525866] dark:text-slate-400 hover:text-[#141619] dark:hover:text-white border border-[#E2DFD7] dark:border-[#252B37]'
            }`}
          >
            Todos ({contratos.length})
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={statusFilter === 'pendente_abertura'}
            onClick={() => setStatusFilter('pendente_abertura')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer tabular-nums ${
              statusFilter === 'pendente_abertura'
                ? 'bg-amber-600 text-white'
                : 'bg-[#F7F6F2] dark:bg-[#0D1014] text-amber-800 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 border border-[#E2DFD7] dark:border-[#252B37]'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Em abertura ({contratosPendentesAbertura.length})</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={statusFilter === 'pendente_fechamento'}
            onClick={() => setStatusFilter('pendente_fechamento')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer tabular-nums ${
              statusFilter === 'pendente_fechamento'
                ? 'bg-orange-600 text-white'
                : 'bg-[#F7F6F2] dark:bg-[#0D1014] text-orange-800 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950/40 border border-[#E2DFD7] dark:border-[#252B37]'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Em rescisão ({contratosPendentesFechamento.length})</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={statusFilter === 'ativo'}
            onClick={() => setStatusFilter('ativo')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer tabular-nums ${
              statusFilter === 'ativo'
                ? 'bg-emerald-700 text-white'
                : 'bg-[#F7F6F2] dark:bg-[#0D1014] text-emerald-800 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-[#E2DFD7] dark:border-[#252B37]'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Ativos ({contratosAtivos.length})</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={statusFilter === 'encerrado'}
            onClick={() => setStatusFilter('encerrado')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer tabular-nums ${
              statusFilter === 'encerrado'
                ? 'bg-[#B91C1C] text-white'
                : 'bg-[#F7F6F2] dark:bg-[#0D1014] text-[#B91C1C] dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 border border-[#E2DFD7] dark:border-[#252B37]'
            }`}
          >
            <span>Encerrados ({contratosEncerrados.length})</span>
          </button>
        </div>
      </div>

      {/* Listagem de Dossiês Contratuais */}
      <div className="space-y-3">
        {contratosFiltrados.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-[#151921] rounded-xl border border-[#E2DFD7] dark:border-[#252B37]">
            <FileText className="w-10 h-10 text-[#525866]/50 dark:text-slate-600 mx-auto mb-3" />
            <h3 className="font-display font-bold text-[#141619] dark:text-slate-100 text-base">
              {busca ? `Nenhum contrato encontrado para "${busca}"` : 'Nenhum contrato nesta categoria'}
            </h3>
            <p className="text-sm text-[#525866] dark:text-slate-400 mt-1">
              Ajuste o termo de busca ou altere o filtro de situação acima.
            </p>
            <button
              type="button"
              onClick={() => { setBusca(''); setStatusFilter('todos'); }}
              className="mt-4 px-4 py-2 bg-[#EFECE6] dark:bg-[#1C212B] hover:bg-[#E2DFD7] dark:hover:bg-[#252B37] rounded-lg text-xs font-semibold text-[#141619] dark:text-slate-200 transition-colors cursor-pointer"
            >
              Mostrar todos os contratos
            </button>
          </div>
        ) : (
          contratosFiltrados.map((contrato) => {
            const progressoAbertura = calcularProgressoAbertura(contrato);
            const progressoEncerramento = calcularProgressoEncerramento(contrato);
            const isEncerramento = contrato.processoAtivo === 'encerramento';
            const progressoAtual = isEncerramento ? progressoEncerramento : progressoAbertura;
            const corretoresTexto = contrato.corretoresResponsaveis && contrato.corretoresResponsaveis.length > 0
              ? contrato.corretoresResponsaveis.join(', ')
              : (contrato.corretorResponsavel || 'Manoel Jerônimo');

            return (
              <article
                key={contrato.id}
                className="relative bg-white dark:bg-[#151921] rounded-xl border border-[#E2DFD7] dark:border-[#252B37] hover:border-[#C9C4B8] dark:hover:border-slate-600 p-5 pr-12 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-5"
              >
                {/* Botão Excluir */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleExcluirContrato(contrato.id, contrato.numeroOrdem, contrato.locatario.nome);
                  }}
                  className="absolute top-3.5 right-3.5 p-2 text-[#525866]/60 dark:text-slate-500 hover:text-[#B91C1C] dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors cursor-pointer"
                  title={`Excluir contrato nº ${contrato.numeroOrdem}`}
                  aria-label={`Excluir contrato nº ${contrato.numeroOrdem}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                {/* Lado Esquerdo: Identificação & Partes */}
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  <div className={`w-14 h-14 rounded-lg flex flex-col items-center justify-center shrink-0 border tabular-nums ${
                    contrato.status === 'encerrado'
                      ? 'bg-red-50 text-[#B91C1C] border-red-200 dark:bg-red-950/50 dark:text-red-400 dark:border-red-900/60'
                      : isEncerramento
                        ? 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/50 dark:text-orange-400 dark:border-orange-900/60'
                        : contrato.status === 'pendente'
                          ? 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-900/60'
                          : 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-900/60'
                  }`}>
                    <span className="text-[11px] font-semibold opacity-75">Nº</span>
                    <span className="font-display text-lg font-bold leading-none">{contrato.numeroOrdem}</span>
                  </div>

                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className={`font-display font-bold text-base sm:text-lg leading-snug ${
                        contrato.status === 'encerrado'
                          ? 'text-[#B91C1C] dark:text-red-400'
                          : 'text-[#141619] dark:text-white'
                      }`}>
                        {contrato.locatario.nome}
                      </h2>

                      {contrato.locatariosAdicionais && contrato.locatariosAdicionais.length > 0 && (
                        <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-[#EFECE6] text-[#141619] dark:bg-[#1C212B] dark:text-slate-300 border border-[#E2DFD7] dark:border-[#252B37]">
                          +{contrato.locatariosAdicionais.length} {contrato.locatariosAdicionais.length === 1 ? 'co-locatário' : 'co-locatários'}
                        </span>
                      )}

                      {contrato.status === 'ativo' && !isEncerramento && (
                        <span className="px-2.5 py-0.5 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/70">
                          Ativo e regular
                        </span>
                      )}

                      {!isEncerramento && contrato.status === 'pendente' && (
                        <span className="px-2.5 py-0.5 rounded-md text-xs font-semibold bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800/70 tabular-nums">
                          Pendência de abertura ({progressoAbertura.concluidos}/{progressoAbertura.total})
                        </span>
                      )}

                      {isEncerramento && contrato.status !== 'encerrado' && (
                        <span className="px-2.5 py-0.5 rounded-md text-xs font-semibold bg-orange-50 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300 border border-orange-200 dark:border-orange-800/70 tabular-nums">
                          Pendência de fechamento ({progressoEncerramento.concluidos}/{progressoEncerramento.total})
                        </span>
                      )}

                      {contrato.status === 'encerrado' && (
                        <span className="px-2.5 py-0.5 rounded-md text-xs font-semibold bg-red-50 text-[#B91C1C] dark:bg-red-950/60 dark:text-red-300 border border-red-200 dark:border-red-800/70">
                          Encerrado e quitado
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-xs sm:text-sm text-[#525866] dark:text-slate-400">
                      <p className="truncate">
                        <span className="font-semibold text-[#141619] dark:text-slate-200">Locador:</span> {contrato.locador.nome}
                        {contrato.locador.conjuge?.nome && (
                          <span className="text-[#B91C1C] dark:text-red-400 font-medium ml-1">
                            (cônjuge: {contrato.locador.conjuge.nome})
                          </span>
                        )}
                      </p>
                      <p className="tabular-nums">
                        <span className="font-semibold text-[#141619] dark:text-slate-200">Telefone:</span> {contrato.locatario.telefone}
                      </p>
                      <p className="tabular-nums">
                        <span className="font-semibold text-[#141619] dark:text-slate-200">Vigência:</span> {contrato.vigencia.inicio} a {contrato.vigencia.fim}
                      </p>
                      <p className="flex items-center gap-1.5 truncate">
                        <Shield className="w-3.5 h-3.5 text-[#B91C1C] dark:text-red-400 shrink-0" />
                        <span className="font-semibold text-[#141619] dark:text-slate-200">Corretores:</span>
                        <span className="truncate">{corretoresTexto}</span>
                      </p>
                    </div>

                    {/* Alertas de Pendência (sem emojis) */}
                    {!isEncerramento && contrato.status === 'pendente' && progressoAbertura.pendencias.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 pt-1.5">
                        <span className="text-xs font-semibold text-amber-800 dark:text-amber-300 mr-1">
                          Faltando na abertura:
                        </span>
                        {progressoAbertura.pendencias.slice(0, 3).map((pen, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 text-xs font-medium"
                          >
                            {pen}
                          </span>
                        ))}
                        {progressoAbertura.pendencias.length > 3 && (
                          <span className="text-xs text-[#525866] dark:text-slate-400 font-medium tabular-nums">
                            +{progressoAbertura.pendencias.length - 3} itens
                          </span>
                        )}
                      </div>
                    )}

                    {isEncerramento && contrato.status !== 'encerrado' && progressoEncerramento.pendencias.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 pt-1.5">
                        <span className="text-xs font-semibold text-orange-800 dark:text-orange-300 mr-1">
                          Faltando no fechamento:
                        </span>
                        {progressoEncerramento.pendencias.slice(0, 3).map((pen, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded bg-orange-50 dark:bg-orange-950/40 text-orange-800 dark:text-orange-300 border border-orange-200 dark:border-orange-800/60 text-xs font-medium"
                          >
                            {pen}
                          </span>
                        ))}
                        {progressoEncerramento.pendencias.length > 3 && (
                          <span className="text-xs text-[#525866] dark:text-slate-400 font-medium tabular-nums">
                            +{progressoEncerramento.pendencias.length - 3} etapas
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Lado Direito: Valor, Progresso & Ações */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 lg:border-l lg:border-[#E2DFD7] lg:dark:border-[#252B37] lg:pl-6 shrink-0">
                  <div className="min-w-[130px] tabular-nums">
                    <span className="text-xs font-medium text-[#525866] dark:text-slate-400 block">
                      Aluguel mensal
                    </span>
                    <span className="font-display text-lg font-bold text-[#141619] dark:text-white">
                      R$ {contrato.valores.aluguel.toLocaleString('pt-BR')}
                    </span>
                    <span className="text-xs text-[#525866] dark:text-slate-400 block">
                      Venc. dia {contrato.valores.vencimentoDia} / Repasse dia {contrato.valores.repasseDia}
                    </span>
                  </div>

                  <div className="w-full sm:w-40 space-y-1.5 tabular-nums">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-[#525866] dark:text-slate-400">
                        {isEncerramento ? 'Fechamento' : 'Abertura'}
                      </span>
                      <span className={
                        isEncerramento
                          ? (progressoEncerramento.estaAptoParaEncerrar ? 'text-emerald-700 dark:text-emerald-400' : 'text-orange-700 dark:text-orange-400')
                          : (progressoAbertura.estaAptoParaAtivar ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400')
                      }>
                        {progressoAtual.porcentagem}%
                      </span>
                    </div>
                    <div className="w-full bg-[#EFECE6] dark:bg-[#0D1014] h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          isEncerramento
                            ? (progressoEncerramento.estaAptoParaEncerrar ? 'bg-emerald-600' : 'bg-orange-500')
                            : (progressoAbertura.estaAptoParaAtivar ? 'bg-emerald-600' : 'bg-amber-500')
                        }`}
                        style={{ width: `${progressoAtual.porcentagem}%` }}
                      />
                    </div>
                    <span className="text-xs text-[#525866] dark:text-slate-400 block text-right">
                      {progressoAtual.concluidos}/{progressoAtual.total} etapas
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setAbaInicialModal(isEncerramento ? 'encerramento' : 'abertura');
                        setContratoSelecionado(contrato);
                      }}
                      className="px-3.5 py-2 bg-[#141619] hover:bg-black dark:bg-white dark:hover:bg-slate-200 text-white dark:text-[#141619] rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer"
                    >
                      <Eye className="w-4 h-4" />
                      <span>Abrir checklist</span>
                      <ChevronRight className="w-3.5 h-3.5 opacity-70" />
                    </button>

                    {!isEncerramento && contrato.status === 'ativo' && (
                      <button
                        type="button"
                        onClick={() => {
                          setAbaInicialModal('encerramento');
                          setContratoSelecionado(contrato);
                        }}
                        className="px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-950/70 text-[#B91C1C] dark:text-red-300 border border-red-200 dark:border-red-900/60"
                        title="Iniciar checklist de rescisão e encerramento"
                      >
                        <Lock className="w-3.5 h-3.5" />
                        <span>Iniciar rescisão</span>
                      </button>
                    )}

                    {isEncerramento && contrato.status !== 'encerrado' && (
                      <button
                        type="button"
                        onClick={() => {
                          setAbaInicialModal('encerramento');
                          setContratoSelecionado(contrato);
                        }}
                        className="px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer bg-orange-50 hover:bg-orange-100 dark:bg-orange-950/40 dark:hover:bg-orange-950/70 text-orange-800 dark:text-orange-300 border border-orange-200 dark:border-orange-900/60"
                        title="Continuar checklist de rescisão"
                      >
                        <Lock className="w-3.5 h-3.5" />
                        <span>Continuar fechamento</span>
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })
        )}
      </div>

      {contratoSelecionado && (
        <ContratoChecklistModal
          contrato={contratoSelecionado}
          initialTab={abaInicialModal}
          corretores={corretores}
          onClose={() => setContratoSelecionado(null)}
          onUpdateContrato={(atualizado) => {
            onUpdateContrato(atualizado);
            setContratoSelecionado(atualizado);
          }}
        />
      )}

      {modalNovoAberto && (
        <NovoContratoModal
          onClose={() => setModalNovoAberto(false)}
          onAddContrato={onAddContrato}
          imoveis={imoveis}
          clientes={clientes}
          corretores={corretores}
          contratos={contratos}
        />
      )}

      <ConfirmModal
        isOpen={modalConfirmacao.aberto}
        title={modalConfirmacao.titulo}
        message={modalConfirmacao.mensagem}
        itemName={modalConfirmacao.nomeItem}
        confirmText="Excluir contrato"
        onClose={() => setModalConfirmacao(prev => ({ ...prev, aberto: false }))}
        onConfirm={modalConfirmacao.onConfirmar}
      />
    </div>
  );
};
