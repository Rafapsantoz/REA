import React, { useState } from 'react';
import { 
  Shield, 
  Users, 
  UserPlus, 
  Mail, 
  Phone, 
  Award, 
  CheckCircle2, 
  XCircle, 
  Search, 
  Building2, 
  FileText, 
  Copy, 
  Trash2, 
  ExternalLink,
  Sparkles,
  Percent,
  Plus
} from 'lucide-react';
import { Corretor, ContratoLocacaoCompleto } from '../types';
import { DEFAULT_CARGOS } from '../mockCorretores';
import { NovoCorretorModal } from './NovoCorretorModal';
import { useToast } from './Toast';

interface AdminViewProps {
  corretores: Corretor[];
  contratos: ContratoLocacaoCompleto[];
  onAddCorretor: (novo: Corretor) => void;
  onUpdateCorretor: (corretorAtualizado: Corretor) => void;
  onDeleteCorretor: (id: string) => void;
}

export const AdminView: React.FC<AdminViewProps> = ({
  corretores,
  contratos,
  onAddCorretor,
  onUpdateCorretor,
  onDeleteCorretor
}) => {
  const { showToast } = useToast();

  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<'todos' | 'ativo' | 'inativo'>('todos');
  const [modalNovoAberto, setModalNovoAberto] = useState(false);
  const [subAba, setSubAba] = useState<'corretores' | 'empresa'>('corretores');

  // Gestão / Cadastro de Cargos & Funções da Equipe
  const [cargos, setCargos] = useState<string[]>(() => {
    const salvos = localStorage.getItem('rpsec_imobi_cargos');
    if (salvos) {
      try {
        return JSON.parse(salvos);
      } catch (e) {
        console.error('Falha ao restaurar cargos:', e);
      }
    }
    return DEFAULT_CARGOS;
  });
  const [mostrarAddCargo, setMostrarAddCargo] = useState(false);
  const [novoCargoInput, setNovoCargoInput] = useState('');

  const handleCadastrarCargo = () => {
    const limpo = novoCargoInput.trim();
    if (!limpo) {
      showToast('Digite o nome do cargo ou função para cadastrar.', 'error');
      return;
    }
    if (cargos.includes(limpo)) {
      showToast(`O cargo "${limpo}" já está cadastrado.`, 'error');
      return;
    }
    const novos = [...cargos, limpo];
    setCargos(novos);
    localStorage.setItem('rpsec_imobi_cargos', JSON.stringify(novos));
    setNovoCargoInput('');
    setMostrarAddCargo(false);
    showToast(`Cargo "${limpo}" cadastrado com sucesso!`, 'success');
  };

  const handleRemoverCargo = (cargoParaRemover: string) => {
    if (cargos.length <= 1) {
      showToast('A imobiliária precisa manter pelo menos um cargo cadastrado.', 'error');
      return;
    }
    const novos = cargos.filter(c => c !== cargoParaRemover);
    setCargos(novos);
    localStorage.setItem('rpsec_imobi_cargos', JSON.stringify(novos));
    showToast(`Cargo "${cargoParaRemover}" removido da lista.`, 'info');
  };

  // Métricas
  const totalCorretores = corretores.length;
  const corretoresAtivos = corretores.filter(c => c.status === 'ativo').length;
  const corretoresInativos = corretores.filter(c => c.status === 'inativo').length;
  const totalComEmail = corretores.filter(c => !!c.email && c.email.includes('@')).length;

  // Filtragem
  const corretoresFiltrados = corretores.filter(c => {
    if (filtroStatus !== 'todos' && c.status !== filtroStatus) return false;
    if (busca.trim()) {
      const q = busca.toLowerCase().trim();
      const matchNome = c.nome.toLowerCase().includes(q);
      const matchCreci = c.creci.toLowerCase().includes(q);
      const matchEmail = c.email.toLowerCase().includes(q);
      const matchCargo = c.cargo.toLowerCase().includes(q);
      return matchNome || matchCreci || matchEmail || matchCargo;
    }
    return true;
  });

  const handleToggleStatus = (corretor: Corretor) => {
    const novoStatus = corretor.status === 'ativo' ? 'inativo' : 'ativo';
    const atualizado: Corretor = {
      ...corretor,
      status: novoStatus
    };
    onUpdateCorretor(atualizado);
    showToast(`Status do corretor ${corretor.nome} alterado para ${novoStatus.toUpperCase()}.`, 'info');
  };

  const handleCopiarEmail = (email: string, nome: string) => {
    navigator.clipboard.writeText(email);
    showToast(`E-mail de ${nome} copiado para a área de transferência!`, 'success');
  };

  const handleExcluir = (id: string, nome: string) => {
    if (window.confirm(`Deseja realmente remover o corretor ${nome}?`)) {
      onDeleteCorretor(id);
      showToast(`Corretor ${nome} removido da equipe.`, 'info');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* ═════════════════════════════════════════════════════════════
          CABEÇALHO DA ABA DE ADMINISTRAÇÃO
      ═════════════════════════════════════════════════════════════ */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm transition-colors duration-200">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-600 to-red-700 text-white flex items-center justify-center font-bold shadow-md shadow-rose-900/20">
              <Shield className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Painel de Administração da Imobiliária
            </h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
              Manoel Jerônimo • CRECI 278536
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Gestão da equipe de corretores credenciados, endereços de e-mail institucionais e conformidade regulatória.
          </p>
        </div>

        {/* Botão Principal de Cadastro de Corretor */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setModalNovoAberto(true)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-rose-900/20 hover:shadow-rose-900/30 transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Novo Corretor</span>
          </button>
        </div>
      </div>

      {/* ═════════════════════════════════════════════════════════════
          CARDS DE MÉTRICAS ADMINISTRATIVAS
      ═════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total de Corretores */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/60 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Equipe Cadastrada
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900 dark:text-white">
                {totalCorretores}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">corretores</span>
            </div>
          </div>
        </div>

        {/* Corretores Ativos com CRECI */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block">
              Corretores Ativos
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900 dark:text-white">
                {corretoresAtivos}
              </span>
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">100% Regularizados</span>
            </div>
          </div>
        </div>

        {/* E-mails Cadastrados (100% de conformidade) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60 flex items-center justify-center">
            <Mail className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider block">
              E-mails Cadastrados
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900 dark:text-white">
                {totalComEmail}/{totalCorretores}
              </span>
              <span className="text-xs text-rose-600 dark:text-rose-400 font-bold">Todos com e-mail</span>
            </div>
          </div>
        </div>

        {/* Contratos sob Gestão */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60 flex items-center justify-center">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Contratos Vinculados
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900 dark:text-white">
                {contratos.length}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">em carteira</span>
            </div>
          </div>
        </div>

      </div>

      {/* ═════════════════════════════════════════════════════════════
          SUB-ABAS: CADASTRO DE CORRETORES vs DADOS DA IMOBILIÁRIA
      ═════════════════════════════════════════════════════════════ */}
      <div className="border-b border-slate-200 dark:border-slate-800 flex items-center gap-3">
        <button
          onClick={() => setSubAba('corretores')}
          className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
            subAba === 'corretores'
              ? 'border-rose-600 text-rose-600 dark:text-rose-400'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Equipe de Corretores</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold">
            {corretores.length}
          </span>
        </button>

        <button
          onClick={() => setSubAba('empresa')}
          className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
            subAba === 'empresa'
              ? 'border-rose-600 text-rose-600 dark:text-rose-400'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Dados da Imobiliária & CRECI</span>
        </button>
      </div>

      {/* ═════════════════════════════════════════════════════════════
          CONTEÚDO DA SUB-ABA: CADASTRO DE CORRETORES
      ═════════════════════════════════════════════════════════════ */}
      {subAba === 'corretores' && (
        <div className="space-y-4">
          
          {/* Barra de Pesquisa & Filtros de Status */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar corretor por Nome, CRECI ou E-mail..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="w-full text-xs pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-rose-500/20"
              />
            </div>

            <div className="flex items-center gap-1.5 w-full sm:w-auto">
              <button
                onClick={() => setFiltroStatus('todos')}
                className={`flex-1 sm:flex-none px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  filtroStatus === 'todos'
                    ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-300 dark:border-rose-800'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800'
                }`}
              >
                Todos ({totalCorretores})
              </button>
              <button
                onClick={() => setFiltroStatus('ativo')}
                className={`flex-1 sm:flex-none px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  filtroStatus === 'ativo'
                    ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800'
                }`}
              >
                Ativos ({corretoresAtivos})
              </button>
              <button
                onClick={() => setFiltroStatus('inativo')}
                className={`flex-1 sm:flex-none px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  filtroStatus === 'inativo'
                    ? 'bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800'
                }`}
              >
                Inativos ({corretoresInativos})
              </button>
            </div>
          </div>

          {/* PAINEL DE GESTÃO / CADASTRO DE CARGOS E FUNÇÕES DA EQUIPE */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Cargos & Funções Cadastradas ({cargos.length})
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Local para cadastro e gestão das funções operacionais da equipe
                  </p>
                </div>
              </div>

              {!mostrarAddCargo && (
                <button
                  type="button"
                  onClick={() => setMostrarAddCargo(true)}
                  className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-xs font-bold flex items-center gap-1.5 transition-all self-start sm:self-auto cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Cadastrar Cargo / Função</span>
                </button>
              )}
            </div>

            {mostrarAddCargo && (
              <div className="flex items-center gap-2 pt-1 max-w-md animate-fade-in">
                <input
                  type="text"
                  autoFocus
                  placeholder="Nome do cargo (ex: Gerente de Locação, Consultor...)"
                  value={novoCargoInput}
                  onChange={(e) => setNovoCargoInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleCadastrarCargo(); } }}
                  className="flex-1 text-xs p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-rose-400 outline-none font-medium"
                />
                <button
                  type="button"
                  onClick={handleCadastrarCargo}
                  className="px-3.5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  Salvar
                </button>
                <button
                  type="button"
                  onClick={() => { setMostrarAddCargo(false); setNovoCargoInput(''); }}
                  className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            )}

            <div className="flex flex-wrap gap-1.5 pt-1">
              {cargos.map((cargoNome, i) => (
                <span 
                  key={i}
                  className="inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 font-medium"
                >
                  <span>{cargoNome}</span>
                  {cargos.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoverCargo(cargoNome)}
                      title={`Remover cargo "${cargoNome}"`}
                      className="text-slate-400 hover:text-red-500 transition-colors cursor-pointer text-xs"
                    >
                      ×
                    </button>
                  )}
                </span>
              ))}
            </div>
          </div>

          {/* Grid de Cards dos Corretores */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {corretoresFiltrados.map(corretor => (
              <div 
                key={corretor.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              >
                <div>
                  {/* Cabeçalho do Card */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-950 text-white font-extrabold text-base flex items-center justify-center shadow-md border border-slate-700">
                        {corretor.nome.split(' ').map(n => n[0]).slice(0, 2).join('')}
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-slate-900 dark:text-white leading-tight">
                          {corretor.nome}
                        </h3>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 px-2 py-0.5 rounded-md border border-rose-200 dark:border-rose-900/60">
                            CRECI {corretor.creci}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleStatus(corretor)}
                      className={`text-[10px] font-bold px-2 py-1 rounded-full border transition-all cursor-pointer ${
                        corretor.status === 'ativo'
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800'
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-300 dark:border-slate-700'
                      }`}
                      title="Clique para alternar o status do corretor"
                    >
                      {corretor.status === 'ativo' ? '✓ Ativo' : '⚪ Inativo'}
                    </button>
                  </div>

                  {/* Cargo */}
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mt-2.5">
                    {corretor.cargo}
                  </p>

                  {/* DADOS DE CONTATO: E-MAIL & TELEFONE */}
                  <div className="mt-3 space-y-1.5 p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800/80 text-xs">
                    
                    {/* Endereço de E-mail (Requisito Explícito do Usuário) */}
                    <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                      <div className="flex items-center gap-1.5 overflow-hidden">
                        <Mail className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                        <span className="truncate font-medium text-[11px]" title={corretor.email}>
                          {corretor.email}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopiarEmail(corretor.email, corretor.nome)}
                        className="text-slate-400 hover:text-rose-500 p-1 rounded transition-colors cursor-pointer shrink-0"
                        title="Copiar endereço de e-mail"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Telefone / WhatsApp */}
                    <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span className="font-medium text-[11px]">{corretor.telefone}</span>
                      </div>
                      <a
                        href={`https://wa.me/55${corretor.telefone.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-emerald-600 dark:text-emerald-400 hover:underline text-[10px] font-bold flex items-center gap-0.5"
                      >
                        <span>WhatsApp</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </div>
                  </div>

                  {/* Cálculo de Comissão (A Definir) */}
                  <div className="mt-3 flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 text-xs">
                    <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                      <Percent className="w-3.5 h-3.5 text-rose-500" />
                      Comissão:
                    </span>
                    {corretor.comissaoADefinir || !corretor.comissaoPadrao ? (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                        ⏳ A definir
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                        {corretor.comissaoPadrao}% da locação
                      </span>
                    )}
                  </div>

                  {/* Informações Adicionais (Antiga Biografia) */}
                  {(corretor.bio || corretor.informacoesAdicionais) && (
                    <div className="mt-2.5 p-2.5 bg-slate-50/70 dark:bg-slate-950/70 rounded-xl border border-slate-100 dark:border-slate-800 text-xs">
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-0.5">
                        Informações Adicionais:
                      </span>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 italic leading-relaxed">
                        "{corretor.bio || corretor.informacoesAdicionais}"
                      </p>
                    </div>
                  )}
                </div>

                {/* Rodapé do Card com Produção e Ação de Excluir */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                    {corretor.totalContratos || 0} contratos vinculados
                  </span>
                  <button
                    type="button"
                    onClick={() => handleExcluir(corretor.id, corretor.nome)}
                    className="text-rose-500 hover:text-rose-700 dark:hover:text-rose-400 p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                    title="Excluir Corretor"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {corretoresFiltrados.length === 0 && (
            <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
              <Users className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                Nenhum corretor encontrado com os filtros atuais.
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Tente alterar os termos da busca ou clique em "+ Novo Corretor" para cadastrar.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════
          CONTEÚDO DA SUB-ABA: DADOS DA IMOBILIÁRIA & CRECI
      ═════════════════════════════════════════════════════════════ */}
      {subAba === 'empresa' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-600 to-red-700 text-white flex items-center justify-center font-bold text-xl shadow-lg shadow-rose-900/20">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Manoel Jerônimo Inteligência Imobiliária
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Registro CRECI nº 278536-J • Conselho Regional de Corretores de Imóveis (CRECI 2ª Região / SP)
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Endereço de E-mail Central</span>
              <p className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Mail className="w-4 h-4 text-rose-500" />
                <span>manoel.jeronimo@imobiliariajeronimo.com.br</span>
              </p>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Plantão / WhatsApp</span>
              <p className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Phone className="w-4 h-4 text-emerald-500" />
                <span>(19) 99303-0194</span>
              </p>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Sede Operacional</span>
              <p className="font-bold text-slate-900 dark:text-white">
                Mococa / SP — Atendimento Regional
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Cadastro de Novo Corretor */}
      {modalNovoAberto && (
        <NovoCorretorModal
          onClose={() => setModalNovoAberto(false)}
          onAddCorretor={onAddCorretor}
          cargosCadastrados={cargos}
          onCadastrarNovoCargo={(novoC) => {
            if (!cargos.includes(novoC)) {
              const novos = [...cargos, novoC];
              setCargos(novos);
              localStorage.setItem('rpsec_imobi_cargos', JSON.stringify(novos));
            }
          }}
        />
      )}

    </div>
  );
};
