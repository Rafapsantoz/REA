import React, { useState } from 'react';
import { 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
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
  Lock,
  ArrowRight
} from 'lucide-react';
import { ContratoLocacaoCompleto, Imovel, Cliente } from '../types';
import { calcularProgressoAbertura, calcularProgressoEncerramento } from '../mockContratos';
import { ContratoChecklistModal } from './ContratoChecklistModal';
import { NovoContratoModal } from './NovoContratoModal';

interface GestaoContratosProps {
  contratos: ContratoLocacaoCompleto[];
  onUpdateContrato: (contrato: ContratoLocacaoCompleto) => void;
  onAddContrato: (novoContrato: ContratoLocacaoCompleto) => void;
  imoveis: Imovel[];
  clientes: Cliente[];
}

export const GestaoContratos: React.FC<GestaoContratosProps> = ({
  contratos,
  onUpdateContrato,
  onAddContrato,
  imoveis,
  clientes
}) => {
  // Filtro de status: todos | pendente | ativo | encerrado
  const [statusFilter, setStatusFilter] = useState<'todos' | 'pendente' | 'ativo' | 'encerrado'>('todos');
  const [busca, setBusca] = useState('');

  // Modais
  const [contratoSelecionado, setContratoSelecionado] = useState<ContratoLocacaoCompleto | null>(null);
  const [modalNovoAberto, setModalNovoAberto] = useState(false);

  // Contadores
  const contratosPendentes = contratos.filter(c => c.status === 'pendente');
  const contratosAtivos = contratos.filter(c => c.status === 'ativo');
  const contratosEncerrados = contratos.filter(c => c.status === 'encerrado');

  const receitaAtivaTotal = contratosAtivos.reduce((acc, c) => acc + c.valores.aluguel, 0);
  const caucaoTotalCustodia = contratosAtivos.reduce((acc, c) => acc + (c.valores.caucaoValor || 0), 0);

  // Filtragem
  const contratosFiltrados = contratos.filter(c => {
    // Filtro por status
    if (statusFilter !== 'todos' && c.status !== statusFilter) return false;

    // Filtro por texto
    if (busca.trim()) {
      const q = busca.toLowerCase();
      const matchNum = c.numeroOrdem.toLowerCase().includes(q);
      const matchInquilino = c.locatario.nome.toLowerCase().includes(q);
      const matchProprietario = c.locador.nome.toLowerCase().includes(q);
      const matchEndereco = c.imovelEndereco.toLowerCase().includes(q);
      return matchNum || matchInquilino || matchProprietario || matchEndereco;
    }
    return true;
  });

  return (
    <div className="space-y-6">

      {/* KPI CARDS: COCKPIT DE CONTRATOS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Com Pendência */}
        <div 
          onClick={() => setStatusFilter('pendente')}
          className={`p-5 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'pendente'
              ? 'bg-amber-500/10 border-amber-500/50 dark:bg-amber-950/40 shadow-lg'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-amber-400'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
              Com Pendência / Abertura
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {contratosPendentes.length}
            </span>
            <span className="text-xs text-slate-500">em processo de abertura</span>
          </div>
          <p className="text-[11px] text-amber-700 dark:text-amber-300 mt-2 font-medium">
            ⚠️ Bloqueados para ativação até 100% dos itens
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
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              Contratos Ativos
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {contratosAtivos.length}
            </span>
            <span className="text-xs text-slate-500">contratos regulares</span>
          </div>
          <p className="text-[11px] text-emerald-700 dark:text-emerald-300 mt-2 font-medium">
            R$ {receitaAtivaTotal.toLocaleString('pt-BR')},00 / mês administrados
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
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
              Contratos Encerrados
            </span>
            <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center justify-center">
              <Key className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {contratosEncerrados.length}
            </span>
            <span className="text-xs text-slate-500">histórico arquivado</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
            Quitados com vistoria de saída e Sabesp/CPFL
          </p>
        </div>

        {/* Card 4: Cauções em Custódia */}
        <div className="p-5 rounded-2xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
              Garantias / Caução Retido
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Shield className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              R$ {caucaoTotalCustodia.toLocaleString('pt-BR')},00
            </span>
          </div>
          <p className="text-[11px] text-indigo-600 dark:text-indigo-400 mt-2 font-medium">
            Contas de depósito de garantia ativas
          </p>
        </div>

      </div>

      {/* BARRA DE PESQUISA, FILTROS E AÇÃO NOVO CONTRATO */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
        
        {/* Abas de Status */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800 w-full md:w-auto">
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

        {/* Input de Busca & Botão Novo */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por Nº, inquilino, imóvel..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full text-xs pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400"
            />
          </div>

          <button
            onClick={() => setModalNovoAberto(true)}
            className="px-4 py-2 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md shadow-rose-900/20 whitespace-nowrap transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Novo Contrato</span>
          </button>
        </div>

      </div>

      {/* LISTA / CARDS DE CONTRATOS */}
      <div className="space-y-4">
        {contratosFiltrados.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
            <FileText className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <h3 className="font-bold text-slate-700 dark:text-slate-200 text-base">Nenhum contrato encontrado</h3>
            <p className="text-xs text-slate-400 mt-1">Tente ajustar seus termos de pesquisa ou o filtro de status selecionado.</p>
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
                
                {/* Lado Esquerdo: Identificação & Partes */}
                <div className="flex items-start gap-4 flex-1">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-base flex-shrink-0 shadow-sm ${
                    contrato.status === 'ativo'
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                      : contrato.status === 'pendente'
                        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                  }`}>
                    #{contrato.numeroOrdem}
                  </div>

                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-sm text-slate-900 dark:text-white">
                        Contrato nº {contrato.numeroOrdem}
                      </span>
                      
                      {contrato.status === 'ativo' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          Ativo & Regular
                        </span>
                      )}

                      {contrato.status === 'pendente' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-400 border border-amber-300 dark:border-amber-800 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 text-amber-500" />
                          Com Pendência ({progressoAbertura.concluidos}/{progressoAbertura.total})
                        </span>
                      )}

                      {contrato.status === 'encerrado' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
                          ⚪ Encerrado
                        </span>
                      )}

                      {isEncerramento && contrato.status !== 'encerrado' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-400 border border-rose-300 dark:border-rose-800">
                          Rescisão em Andamento
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 flex items-center gap-1">
                      <Building className="w-3.5 h-3.5 text-slate-400" />
                      <span><strong>{contrato.imovelEndereco}</strong> ({contrato.imovelBairro}, {contrato.imovelCidade})</span>
                    </p>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400 pt-1">
                      <span><strong>Locatário:</strong> {contrato.locatario.nome}</span>
                      <span>•</span>
                      <span><strong>Locador:</strong> {contrato.locador.nome}</span>
                      <span>•</span>
                      <span><strong>Vigência:</strong> {contrato.vigencia.inicio} a {contrato.vigencia.fim}</span>
                    </div>

                    {/* BADGES DE PENDÊNCIAS IMEDIATAS (ALERTAS VISUAIS RÁPIDOS) */}
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

                {/* Centro: Valores & Progresso */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 lg:border-l lg:border-slate-200 lg:dark:border-slate-800 lg:pl-6">
                  
                  {/* Valores */}
                  <div className="space-y-0.5 min-w-[130px]">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Aluguel Mensal</span>
                    <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">
                      R$ {contrato.valores.aluguel.toLocaleString('pt-BR')},00
                    </span>
                    <span className="text-[10px] text-slate-500 block">
                      Venc. Dia {contrato.valores.vencimentoDia} • Repasse Dia {contrato.valores.repasseDia}
                    </span>
                  </div>

                  {/* Barra de Progresso do Checklist */}
                  <div className="min-w-[160px] space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-semibold">
                      <span className="text-slate-500">
                        {isEncerramento ? 'Checklist Saída' : 'Checklist Abertura'}
                      </span>
                      <span className={isEncerramento 
                        ? (progressoEncerramento.estaAptoParaEncerrar ? 'text-emerald-500 font-bold' : 'text-amber-500 font-bold')
                        : (progressoAbertura.estaAptoParaAtivar ? 'text-emerald-500 font-bold' : 'text-amber-500 font-bold')
                      }>
                        {isEncerramento ? `${progressoEncerramento.porcentagem}%` : `${progressoAbertura.porcentagem}%`}
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-300 ${
                          isEncerramento
                            ? (progressoEncerramento.estaAptoParaEncerrar ? 'bg-emerald-500' : 'bg-amber-500')
                            : (progressoAbertura.estaAptoParaAtivar ? 'bg-emerald-500' : 'bg-gradient-to-r from-amber-500 to-rose-500')
                        }`}
                        style={{ width: `${isEncerramento ? progressoEncerramento.porcentagem : progressoAbertura.porcentagem}%` }}
                      ></div>
                    </div>
                    <span className="text-[10px] text-slate-400 block text-right">
                      {isEncerramento 
                        ? `${progressoEncerramento.concluidos}/${progressoEncerramento.total} etapas`
                        : `${progressoAbertura.concluidos}/${progressoAbertura.total} etapas`
                      }
                    </span>
                  </div>

                  {/* Botão de Ação: Abrir Checklist & Dossiê */}
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
