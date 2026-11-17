import React, { useState } from 'react';
import { 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  Search, 
  PlusCircle, 
  Eye, 
  ChevronRight, 
  Droplet, 
  Zap, 
  Shield, 
  DollarSign, 
  Key, 
  Building, 
  Users, 
  Calendar,
  X,
  Phone,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { ContratoLocacaoCompleto, Imovel, Cliente } from '../types';
import { calcularProgressoAbertura, calcularProgressoEncerramento } from '../mockContratos';
import { ContratoChecklistModal } from './ContratoChecklistModal';
import { NovoContratoModal } from './NovoContratoModal';
import { useToast } from './Toast';

interface DesktopViewProps {
  contratos: ContratoLocacaoCompleto[];
  onUpdateContrato: (contratoAtualizado: ContratoLocacaoCompleto) => void;
  onAddContrato: (novoContrato: ContratoLocacaoCompleto) => void;
  imoveis?: Imovel[];
  clientes?: Cliente[];
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
  imoveis = [],
  clientes = []
}) => {
  const { showToast } = useToast();

  // Filtro de status: todos | pendente | ativo | encerrado
  const [statusFilter, setStatusFilter] = useState<'todos' | 'pendente' | 'ativo' | 'encerrado'>('todos');
  
  // Campo de Pesquisa: Nome do Inquilino ou Número do Contrato
  const [busca, setBusca] = useState('');

  // Modais
  const [contratoSelecionado, setContratoSelecionado] = useState<ContratoLocacaoCompleto | null>(null);
  const [modalNovoAberto, setModalNovoAberto] = useState(false);

  // Contadores & Métricas dos Contratos
  const contratosPendentes = contratos.filter(c => c.status === 'pendente');
  const contratosAtivos = contratos.filter(c => c.status === 'ativo');
  const contratosEncerrados = contratos.filter(c => c.status === 'encerrado');

  const receitaAtivaTotal = contratosAtivos.reduce((acc, c) => acc + c.valores.aluguel, 0);
  const caucaoTotalCustodia = contratosAtivos.reduce((acc, c) => acc + (c.valores.caucaoValor || 0), 0);

  // Filtragem estrita por Nome do Inquilino ou Número do Contrato
  const contratosFiltrados = contratos.filter(c => {
    // Filtro por status
    if (statusFilter !== 'todos' && c.status !== statusFilter) return false;

    // Filtro por pesquisa (Nome do Inquilino ou Número do Contrato)
    if (busca.trim()) {
      const q = busca.toLowerCase().trim();
      const matchInquilino = c.locatario.nome.toLowerCase().includes(q);
      const matchNumero = c.numeroOrdem.toLowerCase().includes(q) || `contrato ${c.numeroOrdem}`.toLowerCase().includes(q);
      return matchInquilino || matchNumero;
    }
    return true;
  });

  return (
    <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">

      {/* ═════════════════════════════════════════════════════════════
          CABEÇALHO DO PAINEL DE CONTRATOS
      ═════════════════════════════════════════════════════════════ */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm transition-colors duration-200">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Painel de Gerenciamento de Contratos
            </h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
              Manoel Jerônimo Imóveis
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Controle operacional de contratos de locação: fluxo de abertura, pendências documentais e processo de encerramento
          </p>
        </div>

        <button
          onClick={() => setModalNovoAberto(true)}
          className="px-4 py-2.5 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md shadow-rose-900/20 self-start md:self-auto transition-all"
        >
          <PlusCircle className="w-4 h-4" />
          <span>+ Novo Contrato de Locação</span>
        </button>
      </div>

      {/* ═════════════════════════════════════════════════════════════
          1º BLOCO: INFORMAÇÕES SOBRE CONTRATOS (CARDS / KPIS)
      ═════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Com Pendência / Abertura */}
        <div 
          onClick={() => setStatusFilter('pendente')}
          className={`p-5 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'pendente'
              ? 'bg-amber-500/10 border-amber-500/50 dark:bg-amber-950/40 shadow-lg'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-amber-400'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Com Pendência / Abertura
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse"></span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 dark:text-white">
              {contratosPendentes.length}
            </span>
            <span className="text-xs text-slate-500">em processo de abertura</span>
          </div>
          <p className="text-[11px] text-amber-700 dark:text-amber-300 mt-2 font-medium">
            ⚠️ Bloqueado para entrega de chaves até 100% das etapas
          </p>
        </div>

        {/* Card 2: Contratos Ativos */}
        <div 
          onClick={() => setStatusFilter('ativo')}
          className={`p-5 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'ativo'
              ? 'bg-emerald-500/10 border-emerald-500/50 dark:bg-emerald-950/40 shadow-lg'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-emerald-400'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              Contratos Ativos
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 dark:text-white">
              {contratosAtivos.length}
            </span>
            <span className="text-xs text-slate-500">contratos regulares</span>
          </div>
          <p className="text-[11px] text-emerald-700 dark:text-emerald-300 mt-2 font-medium">
            R$ {receitaAtivaTotal.toLocaleString('pt-BR')},00 / mês sob administração
          </p>
        </div>

        {/* Card 3: Contratos Encerrados */}
        <div 
          onClick={() => setStatusFilter('encerrado')}
          className={`p-5 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'encerrado'
              ? 'bg-slate-200 dark:bg-slate-800 border-slate-400 dark:border-slate-600 shadow-lg'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-400'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Key className="w-4 h-4 text-slate-400" />
              Contratos Encerrados
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 dark:text-white">
              {contratosEncerrados.length}
            </span>
            <span className="text-xs text-slate-500">histórico arquivado</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
            Quitados com vistoria de saída e Sabesp/CPFL baixadas
          </p>
        </div>

        {/* Card 4: Garantias e Caução em Custódia */}
        <div className="p-5 rounded-2xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-indigo-500" />
              Garantias & Caução
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 dark:text-white">
              R$ {caucaoTotalCustodia.toLocaleString('pt-BR')},00
            </span>
          </div>
          <p className="text-[11px] text-indigo-600 dark:text-indigo-400 mt-2 font-medium">
            Retidos em conta garantia / custódia
          </p>
        </div>

      </div>

      {/* ═════════════════════════════════════════════════════════════
          2º BLOCO: PESQUISA (ABAIXO DAS INFORMAÇÕES SOBRE CONTRATOS)
          FILTRAGEM POR NOME DO INQUILINO OU NÚMERO DO CONTRATO
      ═════════════════════════════════════════════════════════════ */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3.5">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <span className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
            <Search className="w-4 h-4" />
            Pesquisa de Contratos
          </span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            Filtre por <strong>Nome do Inquilino</strong> ou pelo <strong>Número do Contrato</strong>
          </span>
        </div>

        {/* Campo de Entrada de Busca */}
        <div className="relative">
          <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Pesquise por Nome do Inquilino (ex: Simone, Mariana) ou Número do Contrato (ex: 85, 72)..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full text-xs sm:text-sm pl-11 pr-24 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/30 font-medium"
          />
          {busca && (
            <button
              onClick={() => setBusca('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 px-2.5 py-1 text-xs text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
            >
              Limpar
            </button>
          )}
        </div>

        {/* Atalhos Rápidos de Demonstração & Abas de Status */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 border-t border-slate-100 dark:border-slate-800/80">
          
          {/* Abas de Status */}
          <div className="flex flex-wrap items-center bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setStatusFilter('todos')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                statusFilter === 'todos'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Todos ({contratos.length})
            </button>
            <button
              onClick={() => setStatusFilter('pendente')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                statusFilter === 'pendente'
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              <span>Com Pendência ({contratosPendentes.length})</span>
            </button>
            <button
              onClick={() => setStatusFilter('ativo')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                statusFilter === 'ativo'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>Ativos ({contratosAtivos.length})</span>
            </button>
            <button
              onClick={() => setStatusFilter('encerrado')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                statusFilter === 'encerrado'
                  ? 'bg-slate-700 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Encerrados ({contratosEncerrados.length})
            </button>
          </div>

          {/* Atalhos Rápidos por Inquilino ou Contrato */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-[11px] text-slate-400 font-semibold mr-1">Atalhos:</span>
            <button
              onClick={() => setBusca('Simone')}
              className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-rose-500 hover:text-white transition-colors text-[11px] font-semibold"
            >
              👤 Simone (Contrato 85)
            </button>
            <button
              onClick={() => setBusca('Mariana')}
              className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-rose-500 hover:text-white transition-colors text-[11px] font-semibold"
            >
              👤 Mariana (Contrato 72)
            </button>
            <button
              onClick={() => setBusca('61')}
              className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-rose-500 hover:text-white transition-colors text-[11px] font-semibold"
            >
              🔢 Contrato 61
            </button>
          </div>

        </div>

      </div>

      {/* ═════════════════════════════════════════════════════════════
          3º BLOCO: LISTAGEM E CONTROLE OPERACIONAL DE CONTRATOS
      ═════════════════════════════════════════════════════════════ */}
      <div className="space-y-4">
        {contratosFiltrados.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
            <FileText className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <h3 className="font-bold text-slate-700 dark:text-slate-200 text-base">
              Nenhum contrato encontrado para "{busca}"
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Verifique se o nome do inquilino ou o número do contrato está correto.
            </p>
            <button
              onClick={() => { setBusca(''); setStatusFilter('todos'); }}
              className="mt-4 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors"
            >
              Ver todos os contratos
            </button>
          </div>
        ) : (
          contratosFiltrados.map((contrato) => {
            const progressoAbertura = calcularProgressoAbertura(contrato);
            const progressoEncerramento = calcularProgressoEncerramento(contrato);
            const isEncerramento = contrato.processoAtivo === 'encerramento';

            return (
              <div 
                key={contrato.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm hover:shadow-md transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-5"
              >
                
                {/* Lado Esquerdo: Identificação do Contrato, Inquilino e Imóvel */}
                <div className="flex items-start gap-4 flex-1">
                  
                  {/* Badge Grande de Número de Ordem */}
                  <div className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center font-bold flex-shrink-0 shadow-sm ${
                    contrato.status === 'ativo'
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                      : contrato.status === 'pendente'
                        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                  }`}>
                    <span className="text-[10px] uppercase tracking-wider font-semibold opacity-70">Nº</span>
                    <span className="text-lg font-black leading-none">{contrato.numeroOrdem}</span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-extrabold text-base text-slate-900 dark:text-white">
                        Inquilino: {contrato.locatario.nome}
                      </span>
                      
                      {contrato.status === 'ativo' && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          Ativo & Regular
                        </span>
                      )}

                      {contrato.status === 'pendente' && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-400 border border-amber-300 dark:border-amber-800 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 text-amber-500" />
                          Com Pendência ({progressoAbertura.concluidos}/{progressoAbertura.total})
                        </span>
                      )}

                      {contrato.status === 'encerrado' && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
                          ⚪ Encerrado & Quitado
                        </span>
                      )}

                      {isEncerramento && contrato.status !== 'encerrado' && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-400 border border-rose-300 dark:border-rose-800">
                          Rescisão em Andamento
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                      <Building className="w-3.5 h-3.5 text-slate-400" />
                      <span><strong>Imóvel:</strong> {contrato.imovelEndereco} ({contrato.imovelBairro}, {contrato.imovelCidade})</span>
                    </p>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400 pt-0.5">
                      <span><strong>Proprietário:</strong> {contrato.locador.nome}</span>
                      <span>•</span>
                      <span><strong>Telefone Inquilino:</strong> {contrato.locatario.telefone}</span>
                      <span>•</span>
                      <span><strong>Vigência:</strong> {contrato.vigencia.inicio} a {contrato.vigencia.fim}</span>
                    </div>

                    {/* BADGES DE ALERTAS IMEDIATOS DE PENDÊNCIAS */}
                    {contrato.status === 'pendente' && progressoAbertura.pendencias.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 pt-2">
                        <span className="text-[10px] text-amber-700 dark:text-amber-300 font-bold uppercase tracking-wider mr-1">
                          Pendências imediatas:
                        </span>
                        {progressoAbertura.pendencias.slice(0, 3).map((pen, idx) => (
                          <span 
                            key={idx}
                            className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 text-[10px] font-medium"
                          >
                            ⚠️ {pen}
                          </span>
                        ))}
                        {progressoAbertura.pendencias.length > 3 && (
                          <span className="text-[10px] text-slate-400 font-semibold">
                            +{progressoAbertura.pendencias.length - 3} itens
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Lado Direito: Valores, Barra de Progresso e Ação */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 lg:border-l lg:border-slate-200 lg:dark:border-slate-800 lg:pl-6">
                  
                  {/* Valores */}
                  <div className="space-y-0.5 min-w-[130px]">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Aluguel Mensal</span>
                    <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                      R$ {contrato.valores.aluguel.toLocaleString('pt-BR')},00
                    </span>
                    <span className="text-[10px] text-slate-500 block">
                      Venc. Dia {contrato.valores.vencimentoDia} • Repasse Dia {contrato.valores.repasseDia}
                    </span>
                  </div>

                  {/* Barra de Progresso */}
                  <div className="min-w-[160px] space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-semibold">
                      <span className="text-slate-500">
                        {isEncerramento ? 'Checklist Encerramento' : 'Checklist Abertura'}
                      </span>
                      <span className={isEncerramento 
                        ? (progressoEncerramento.estaAptoParaEncerrar ? 'text-emerald-500 font-bold' : 'text-amber-500 font-bold')
                        : (progressoAbertura.estaAptoParaAtivar ? 'text-emerald-500 font-bold' : 'text-amber-500 font-bold')
                      }>
                        {isEncerramento ? `${progressoEncerramento.porcentagem}%` : `${progressoAbertura.porcentagem}%`}
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-300 ${
                          isEncerramento
                            ? (progressoEncerramento.estaAptoParaEncerrar ? 'bg-emerald-500' : 'bg-amber-500')
                            : (progressoAbertura.estaAptoParaAtivar ? 'bg-emerald-500' : 'bg-gradient-to-r from-amber-500 to-rose-500')
                        }`}
                        style={{ width: `${isEncerramento ? progressoEncerramento.porcentagem : progressoAbertura.porcentagem}%` }}
                      ></div>
                    </div>
                    <span className="text-[10px] text-slate-400 block text-right font-medium">
                      {isEncerramento 
                        ? `${progressoEncerramento.concluidos}/${progressoEncerramento.total} etapas concluídas`
                        : `${progressoAbertura.concluidos}/${progressoAbertura.total} etapas concluídas`
                      }
                    </span>
                  </div>

                  {/* Botão de Ação: Ver Informações & Checklist */}
                  <button
                    onClick={() => setContratoSelecionado(contrato)}
                    className="px-4 py-2.5 bg-slate-900 hover:bg-black dark:bg-white dark:hover:bg-slate-200 text-white dark:text-slate-900 rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all whitespace-nowrap cursor-pointer"
                  >
                    <Eye className="w-4 h-4" />
                    <span>Ver Informações & Checklist</span>
                    <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                  </button>

                </div>

              </div>
            );
          })
        )}
      </div>

      {/* MODAL DO CHECKLIST & DOSSIÊ COMPLETO */}
      {contratoSelecionado && (
        <ContratoChecklistModal
          contrato={contratoSelecionado}
          onClose={() => setContratoSelecionado(null)}
          onUpdateContrato={(atualizado) => {
            onUpdateContrato(atualizado);
            setContratoSelecionado(atualizado);
          }}
        />
      )}

      {/* MODAL DE NOVO CONTRATO */}
      {modalNovoAberto && (
        <NovoContratoModal
          onClose={() => setModalNovoAberto(false)}
          onAddContrato={onAddContrato}
          imoveis={imoveis}
          clientes={clientes}
        />
      )}

    </div>
  );
};
