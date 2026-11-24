import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Mail,
  Phone,
  Award,
  Search,
  Building2,
  Copy,
  Trash2,
  ExternalLink,
  Percent,
  Plus,
  Pencil,
  CheckCircle2,
  X,
  MapPin
} from 'lucide-react';
import { Corretor, ContratoLocacaoCompleto, DadosImobiliaria } from '../types';
import { DEFAULT_CARGOS } from '../mockCorretores';
import { NovoCorretorModal } from './NovoCorretorModal';
import { ConfirmModal } from './ConfirmModal';
import { useToast } from './Toast';

interface AdminViewProps {
  corretores: Corretor[];
  contratos: ContratoLocacaoCompleto[];
  dadosEmpresa: DadosImobiliaria;
  onUpdateDadosEmpresa: (novosDados: DadosImobiliaria) => void;
  onAddCorretor: (novo: Corretor) => void;
  onUpdateCorretor: (corretorAtualizado: Corretor) => void;
  onDeleteCorretor: (id: string) => void;
}

const SUGESTOES_CARGOS = [
  'Captador(a) de Imóveis',
  'Gerente de Contratos',
  'Consultor(a) Imobiliário',
  'Coordenador(a) de Vistorias',
  'Assistente de Locação'
];

export const AdminView: React.FC<AdminViewProps> = ({
  corretores,
  contratos,
  dadosEmpresa,
  onUpdateDadosEmpresa,
  onAddCorretor,
  onUpdateCorretor,
  onDeleteCorretor
}) => {
  const { showToast } = useToast();

  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<'todos' | 'ativo' | 'inativo'>('todos');
  const [subAba, setSubAba] = useState<'corretores' | 'cargos' | 'empresa'>('corretores');

  // Modais contextuais
  const [modalNovoCorretorAberto, setModalNovoCorretorAberto] = useState(false);
  const [modalNovoCargoAberto, setModalNovoCargoAberto] = useState(false);
  const [novoCargoInput, setNovoCargoInput] = useState('');

  // Edição dos Dados da Imobiliária
  const [editandoEmpresa, setEditandoEmpresa] = useState(false);
  const [formEmpresa, setFormEmpresa] = useState<DadosImobiliaria>(dadosEmpresa);

  useEffect(() => {
    setFormEmpresa(dadosEmpresa);
  }, [dadosEmpresa]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && modalNovoCargoAberto) {
        setModalNovoCargoAberto(false);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [modalNovoCargoAberto]);

  const [modalConfirmacao, setModalConfirmacao] = useState<{
    aberto: boolean;
    titulo: string;
    mensagem: string;
    nomeItem?: string;
    confirmText?: string;
    onConfirmar: () => void;
  }>({
    aberto: false,
    titulo: '',
    mensagem: '',
    confirmText: 'Excluir',
    onConfirmar: () => {}
  });

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

  const handleTrocarAba = (aba: 'corretores' | 'cargos' | 'empresa') => {
    setSubAba(aba);
    if (aba !== 'empresa' && editandoEmpresa) {
      setFormEmpresa(dadosEmpresa);
      setEditandoEmpresa(false);
    }
  };

  const handleCadastrarCargo = (nomeCustomizado?: string) => {
    const valor = nomeCustomizado !== undefined ? nomeCustomizado : novoCargoInput;
    const limpo = valor.trim();
    if (!limpo) {
      showToast('Digite o nome do cargo para cadastrar.', 'error');
      return;
    }
    if (cargos.some(c => c.toLowerCase() === limpo.toLowerCase())) {
      showToast(`O cargo "${limpo}" já está cadastrado.`, 'error');
      return;
    }
    const novos = [...cargos, limpo];
    setCargos(novos);
    localStorage.setItem('rpsec_imobi_cargos', JSON.stringify(novos));
    setNovoCargoInput('');
    setModalNovoCargoAberto(false);
    showToast(`Cargo "${limpo}" cadastrado.`, 'success');
  };

  const handleRemoverCargo = (cargoParaRemover: string) => {
    if (cargos.length <= 1) {
      showToast('Mantenha pelo menos um cargo cadastrado.', 'error');
      return;
    }
    const corretoresComEsseCargo = corretores.filter(c => c.cargo === cargoParaRemover);
    const avisoVinculo = corretoresComEsseCargo.length > 0
      ? ` Atenção: existem ${corretoresComEsseCargo.length} corretor(es) vinculados a esta função (${corretoresComEsseCargo.map(c => c.nome).join(', ')}).`
      : '';

    setModalConfirmacao({
      aberto: true,
      titulo: 'Excluir cargo',
      mensagem: `Deseja remover esta função da lista de cargos da imobiliária?${avisoVinculo}`,
      nomeItem: cargoParaRemover,
      confirmText: 'Excluir cargo',
      onConfirmar: () => {
        const novos = cargos.filter(c => c !== cargoParaRemover);
        setCargos(novos);
        localStorage.setItem('rpsec_imobi_cargos', JSON.stringify(novos));
        showToast(`Cargo "${cargoParaRemover}" removido.`, 'info');
      }
    });
  };

  const handleSalvarEmpresa = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!formEmpresa.nomeFantasia.trim()) {
      showToast('Informe o nome da imobiliária.', 'error');
      return;
    }
    if (!formEmpresa.creci.trim()) {
      showToast('Informe o registro CRECI.', 'error');
      return;
    }
    if (!formEmpresa.email.trim() || !formEmpresa.email.includes('@')) {
      showToast('Informe um e-mail institucional válido.', 'error');
      return;
    }
    if (!formEmpresa.telefone.trim()) {
      showToast('Informe o telefone ou WhatsApp de plantão.', 'error');
      return;
    }

    onUpdateDadosEmpresa({
      nomeFantasia: formEmpresa.nomeFantasia.trim(),
      creci: formEmpresa.creci.trim(),
      regiaoCreci: formEmpresa.regiaoCreci.trim() || '2ª Região / SP',
      email: formEmpresa.email.trim().toLowerCase(),
      telefone: formEmpresa.telefone.trim(),
      cidade: formEmpresa.cidade.trim() || 'Mococa / SP',
      observacaoSede: formEmpresa.observacaoSede.trim()
    });
    setEditandoEmpresa(false);
    showToast('Dados da imobiliária salvos.', 'success');
  };

  const totalCorretores = corretores.length;
  const corretoresAtivos = corretores.filter(c => c.status === 'ativo').length;
  const corretoresInativos = corretores.filter(c => c.status === 'inativo').length;
  const totalComEmail = corretores.filter(c => !!c.email && c.email.includes('@')).length;

  const corretoresFiltrados = corretores.filter(c => {
    if (filtroStatus !== 'todos' && c.status !== filtroStatus) return false;
    if (busca.trim()) {
      const q = busca.toLowerCase().trim();
      return (
        c.nome.toLowerCase().includes(q) ||
        c.creci.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.cargo.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleToggleStatus = (corretor: Corretor) => {
    const novoStatus = corretor.status === 'ativo' ? 'inativo' : 'ativo';
    onUpdateCorretor({ ...corretor, status: novoStatus });
    showToast(`Status de ${corretor.nome} alterado para ${novoStatus}.`, 'info');
  };

  const handleCopiarEmail = (email: string, nome: string) => {
    navigator.clipboard.writeText(email);
    showToast(`E-mail de ${nome} copiado.`, 'success');
  };

  const handleExcluir = (id: string, nome: string) => {
    setModalConfirmacao({
      aberto: true,
      titulo: 'Excluir corretor',
      mensagem: 'Deseja remover este corretor da equipe? Os contratos já vinculados permanecem no histórico.',
      nomeItem: nome,
      confirmText: 'Excluir corretor',
      onConfirmar: () => {
        onDeleteCorretor(id);
        showToast(`Corretor ${nome} removido da equipe.`, 'info');
      }
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Cabeçalho com Ação Primária Contextual por Aba */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2 border-b border-[#E2DFD7] dark:border-[#252B37]">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#141619] dark:text-white tracking-tight">
            Administração da equipe
          </h1>
          <p className="text-sm text-[#525866] dark:text-slate-400 mt-1">
            Gestão de corretores credenciados, cargos operacionais e dados da imobiliária.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {subAba === 'corretores' && (
            <button
              type="button"
              onClick={() => setModalNovoCorretorAberto(true)}
              className="px-4 py-2.5 rounded-lg bg-[#B91C1C] hover:bg-[#991B1B] text-white text-sm font-semibold flex items-center gap-2 transition-colors cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Novo corretor</span>
            </button>
          )}

          {subAba === 'cargos' && (
            <button
              type="button"
              onClick={() => setModalNovoCargoAberto(true)}
              className="px-4 py-2.5 rounded-lg bg-[#B91C1C] hover:bg-[#991B1B] text-white text-sm font-semibold flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Novo cargo</span>
            </button>
          )}

          {subAba === 'empresa' && !editandoEmpresa && (
            <button
              type="button"
              onClick={() => setEditandoEmpresa(true)}
              className="px-4 py-2.5 rounded-lg bg-[#B91C1C] hover:bg-[#991B1B] text-white text-sm font-semibold flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Pencil className="w-4 h-4" />
              <span>Editar dados</span>
            </button>
          )}

          {subAba === 'empresa' && editandoEmpresa && (
            <>
              <button
                type="button"
                onClick={() => {
                  setFormEmpresa(dadosEmpresa);
                  setEditandoEmpresa(false);
                }}
                className="px-4 py-2.5 rounded-lg border border-[#E2DFD7] dark:border-[#252B37] bg-white dark:bg-[#151921] text-sm font-semibold text-[#525866] dark:text-slate-300 hover:bg-[#EFECE6] dark:hover:bg-[#1C212B] transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => handleSalvarEmpresa()}
                className="px-4 py-2.5 rounded-lg bg-[#B91C1C] hover:bg-[#991B1B] text-white text-sm font-semibold flex items-center gap-2 transition-colors cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Salvar alterações</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Métricas Administrativas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#151921] border border-[#E2DFD7] dark:border-[#252B37] p-4 rounded-xl">
          <span className="text-xs font-semibold text-[#525866] dark:text-slate-400 block">
            Equipe cadastrada
          </span>
          <div className="mt-1 flex items-baseline gap-2 tabular-nums">
            <span className="font-display text-2xl font-bold text-[#141619] dark:text-white">{totalCorretores}</span>
            <span className="text-xs text-[#525866] dark:text-slate-400">corretores</span>
          </div>
        </div>

        <div className="bg-white dark:bg-[#151921] border border-[#E2DFD7] dark:border-[#252B37] p-4 rounded-xl">
          <span className="text-xs font-semibold text-[#525866] dark:text-slate-400 block">
            Corretores ativos
          </span>
          <div className="mt-1 flex items-baseline gap-2 tabular-nums">
            <span className="font-display text-2xl font-bold text-emerald-700 dark:text-emerald-400">{corretoresAtivos}</span>
            <span className="text-xs text-[#525866] dark:text-slate-400">em operação</span>
          </div>
        </div>

        <div className="bg-white dark:bg-[#151921] border border-[#E2DFD7] dark:border-[#252B37] p-4 rounded-xl">
          <span className="text-xs font-semibold text-[#525866] dark:text-slate-400 block">
            E-mails cadastrados
          </span>
          <div className="mt-1 flex items-baseline gap-2 tabular-nums">
            <span className="font-display text-2xl font-bold text-[#141619] dark:text-white">{totalComEmail}/{totalCorretores}</span>
            <span className="text-xs text-[#525866] dark:text-slate-400">em conformidade</span>
          </div>
        </div>

        <div className="bg-white dark:bg-[#151921] border border-[#E2DFD7] dark:border-[#252B37] p-4 rounded-xl">
          <span className="text-xs font-semibold text-[#525866] dark:text-slate-400 block">
            Contratos vinculados
          </span>
          <div className="mt-1 flex items-baseline gap-2 tabular-nums">
            <span className="font-display text-2xl font-bold text-[#141619] dark:text-white">{contratos.length}</span>
            <span className="text-xs text-[#525866] dark:text-slate-400">em carteira</span>
          </div>
        </div>
      </div>

      {/* Sub-abas */}
      <div role="tablist" aria-label="Seções da administração" className="border-b border-[#E2DFD7] dark:border-[#252B37] flex items-center gap-2 overflow-x-auto">
        <button
          type="button"
          role="tab"
          aria-selected={subAba === 'corretores'}
          onClick={() => handleTrocarAba('corretores')}
          className={`py-3 px-4 text-sm font-semibold border-b-2 flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap ${
            subAba === 'corretores'
              ? 'border-[#B91C1C] text-[#141619] dark:text-white'
              : 'border-transparent text-[#525866] dark:text-slate-400 hover:text-[#141619] dark:hover:text-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Equipe de corretores</span>
          <span className="text-xs px-2 py-0.5 rounded bg-[#EFECE6] dark:bg-[#1C212B] text-[#141619] dark:text-slate-300 font-semibold tabular-nums">
            {corretores.length}
          </span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={subAba === 'cargos'}
          onClick={() => handleTrocarAba('cargos')}
          className={`py-3 px-4 text-sm font-semibold border-b-2 flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap ${
            subAba === 'cargos'
              ? 'border-[#B91C1C] text-[#141619] dark:text-white'
              : 'border-transparent text-[#525866] dark:text-slate-400 hover:text-[#141619] dark:hover:text-slate-200'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Cargos e funções</span>
          <span className="text-xs px-2 py-0.5 rounded bg-[#EFECE6] dark:bg-[#1C212B] text-[#141619] dark:text-slate-300 font-semibold tabular-nums">
            {cargos.length}
          </span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={subAba === 'empresa'}
          onClick={() => handleTrocarAba('empresa')}
          className={`py-3 px-4 text-sm font-semibold border-b-2 flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap ${
            subAba === 'empresa'
              ? 'border-[#B91C1C] text-[#141619] dark:text-white'
              : 'border-transparent text-[#525866] dark:text-slate-400 hover:text-[#141619] dark:hover:text-slate-200'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Dados da imobiliária</span>
        </button>
      </div>

      {/* Sub-aba: Equipe de Corretores */}
      {subAba === 'corretores' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-[#151921] p-3.5 rounded-xl border border-[#E2DFD7] dark:border-[#252B37]">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-[#525866] dark:text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                aria-label="Buscar corretor"
                placeholder="Buscar por nome, CRECI ou e-mail..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="w-full text-sm pl-10 pr-3 py-2 rounded-lg bg-[#F7F6F2] dark:bg-[#0D1014] border border-[#E2DFD7] dark:border-[#252B37] text-[#141619] dark:text-white outline-none focus:border-[#B91C1C] transition-colors"
              />
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setFiltroStatus('todos')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer tabular-nums ${
                  filtroStatus === 'todos'
                    ? 'bg-[#141619] dark:bg-white text-white dark:text-[#141619] border-transparent'
                    : 'bg-[#F7F6F2] dark:bg-[#0D1014] text-[#525866] dark:text-slate-400 border-[#E2DFD7] dark:border-[#252B37]'
                }`}
              >
                Todos ({totalCorretores})
              </button>
              <button
                type="button"
                onClick={() => setFiltroStatus('ativo')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer tabular-nums ${
                  filtroStatus === 'ativo'
                    ? 'bg-emerald-700 text-white border-transparent'
                    : 'bg-[#F7F6F2] dark:bg-[#0D1014] text-emerald-800 dark:text-emerald-400 border-[#E2DFD7] dark:border-[#252B37]'
                }`}
              >
                Ativos ({corretoresAtivos})
              </button>
              <button
                type="button"
                onClick={() => setFiltroStatus('inativo')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer tabular-nums ${
                  filtroStatus === 'inativo'
                    ? 'bg-[#525866] text-white border-transparent'
                    : 'bg-[#F7F6F2] dark:bg-[#0D1014] text-[#525866] dark:text-slate-400 border-[#E2DFD7] dark:border-[#252B37]'
                }`}
              >
                Inativos ({corretoresInativos})
              </button>
            </div>
          </div>

          {/* Grid de Corretores */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {corretoresFiltrados.map(corretor => (
              <article
                key={corretor.id}
                className="bg-white dark:bg-[#151921] border border-[#E2DFD7] dark:border-[#252B37] rounded-xl p-5 flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-lg bg-[#141619] dark:bg-[#1C212B] text-white font-display font-bold text-sm flex items-center justify-center border border-[#252B37]">
                        {corretor.nome.split(' ').map(n => n[0]).slice(0, 2).join('')}
                      </div>
                      <div>
                        <h3 className="font-display font-bold text-base text-[#141619] dark:text-white leading-tight">
                          {corretor.nome}
                        </h3>
                        <span className="inline-block mt-1 text-xs font-semibold text-[#B91C1C] dark:text-red-300 bg-red-50 dark:bg-red-950/50 px-2 py-0.5 rounded border border-red-200 dark:border-red-900/60 tabular-nums">
                          CRECI {corretor.creci}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleStatus(corretor)}
                      className={`text-xs font-semibold px-2.5 py-1 rounded-md border transition-colors cursor-pointer ${
                        corretor.status === 'ativo'
                          ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                          : 'bg-[#EFECE6] text-[#525866] dark:bg-[#1C212B] dark:text-slate-400 border-[#E2DFD7] dark:border-[#252B37]'
                      }`}
                      title="Alternar status do corretor"
                    >
                      {corretor.status === 'ativo' ? 'Ativo' : 'Inativo'}
                    </button>
                  </div>

                  <p className="text-sm font-medium text-[#525866] dark:text-slate-300 mt-3">
                    {corretor.cargo}
                  </p>

                  {/* Contatos */}
                  <div className="mt-3 space-y-2 p-3 bg-[#F7F6F2] dark:bg-[#0D1014] rounded-lg border border-[#E2DFD7] dark:border-[#252B37] text-xs">
                    <div className="flex items-center justify-between gap-2 text-[#141619] dark:text-slate-300">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <Mail className="w-3.5 h-3.5 text-[#B91C1C] dark:text-red-400 shrink-0" />
                        <span className="truncate font-medium" title={corretor.email}>
                          {corretor.email}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopiarEmail(corretor.email, corretor.nome)}
                        className="text-[#525866] hover:text-[#B91C1C] dark:text-slate-400 dark:hover:text-red-400 p-1 rounded transition-colors cursor-pointer shrink-0"
                        title="Copiar e-mail"
                        aria-label={`Copiar e-mail de ${corretor.nome}`}
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between gap-2 text-[#141619] dark:text-slate-300">
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400 shrink-0" />
                        <span className="font-medium tabular-nums">{corretor.telefone}</span>
                      </div>
                      <a
                        href={`https://wa.me/55${corretor.telefone.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-emerald-700 dark:text-emerald-400 hover:underline font-semibold flex items-center gap-1"
                      >
                        <span>WhatsApp</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>

                  {/* Comissão */}
                  <div className="mt-3 flex items-center justify-between p-2.5 rounded-lg bg-[#F7F6F2] dark:bg-[#0D1014] border border-[#E2DFD7] dark:border-[#252B37] text-xs">
                    <span className="font-semibold text-[#525866] dark:text-slate-400 flex items-center gap-1.5">
                      <Percent className="w-3.5 h-3.5 text-[#B91C1C] dark:text-red-400" />
                      Comissão
                    </span>
                    {corretor.comissaoADefinir || !corretor.comissaoPadrao ? (
                      <span className="px-2 py-0.5 rounded text-xs font-semibold bg-amber-50 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200 dark:border-amber-800/70">
                        A definir
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/70 tabular-nums">
                        {corretor.comissaoPadrao}% da locação
                      </span>
                    )}
                  </div>

                  {(corretor.bio || corretor.informacoesAdicionais) && (
                    <div className="mt-2.5 p-2.5 bg-[#F7F6F2] dark:bg-[#0D1014] rounded-lg border border-[#E2DFD7] dark:border-[#252B37] text-xs">
                      <span className="font-semibold text-[#525866] dark:text-slate-400 block mb-0.5">
                        Observações
                      </span>
                      <p className="text-[#141619] dark:text-slate-300 leading-relaxed">
                        {corretor.bio || corretor.informacoesAdicionais}
                      </p>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-[#E2DFD7] dark:border-[#252B37] flex items-center justify-between text-xs">
                  <span className="text-[#525866] dark:text-slate-400 font-medium tabular-nums">
                    {corretor.totalContratos || 0} contratos vinculados
                  </span>
                  <button
                    type="button"
                    onClick={() => handleExcluir(corretor.id, corretor.nome)}
                    className="text-[#525866] hover:text-[#B91C1C] dark:text-slate-400 dark:hover:text-red-400 p-1.5 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors cursor-pointer"
                    title="Excluir corretor"
                    aria-label={`Excluir corretor ${corretor.nome}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </article>
            ))}
          </div>

          {corretoresFiltrados.length === 0 && (
            <div className="p-10 text-center bg-white dark:bg-[#151921] rounded-xl border border-[#E2DFD7] dark:border-[#252B37]">
              <Users className="w-10 h-10 text-[#525866]/50 dark:text-slate-600 mx-auto mb-2" />
              <p className="font-display text-base font-bold text-[#141619] dark:text-slate-200">
                Nenhum corretor encontrado
              </p>
              <p className="text-sm text-[#525866] dark:text-slate-400 mt-1">
                Altere os termos da busca ou clique em "Novo corretor" acima.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Sub-aba: Cargos e Funções (Grid limpo; cadastro via modal no botão contextual superior) */}
      {subAba === 'cargos' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cargos.map((cargoNome) => {
            const corretoresComEsseCargo = corretores.filter(c => c.cargo === cargoNome);
            const totalVinculados = corretoresComEsseCargo.length;

            return (
              <div
                key={cargoNome}
                className="bg-white dark:bg-[#151921] border border-[#E2DFD7] dark:border-[#252B37] rounded-xl p-5 flex flex-col justify-between space-y-3"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-red-50 dark:bg-red-950/50 text-[#B91C1C] dark:text-red-400 border border-red-200 dark:border-red-900/60 flex items-center justify-center shrink-0">
                        <Award className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="font-display font-bold text-base text-[#141619] dark:text-white leading-snug">
                          {cargoNome}
                        </h3>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded inline-block mt-1 tabular-nums ${
                          totalVinculados > 0
                            ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                            : 'bg-[#EFECE6] text-[#525866] dark:bg-[#1C212B] dark:text-slate-400'
                        }`}>
                          {totalVinculados === 0
                            ? 'Sem corretores vinculados'
                            : `${totalVinculados} ${totalVinculados === 1 ? 'corretor' : 'corretores'}`}
                        </span>
                      </div>
                    </div>

                    {cargos.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoverCargo(cargoNome)}
                        title={`Remover cargo "${cargoNome}"`}
                        aria-label={`Remover cargo ${cargoNome}`}
                        className="text-[#525866] hover:text-[#B91C1C] dark:text-slate-400 dark:hover:text-red-400 p-1.5 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {totalVinculados > 0 && (
                    <div className="pt-3 border-t border-[#E2DFD7] dark:border-[#252B37]">
                      <span className="text-xs font-semibold text-[#525866] dark:text-slate-400 block mb-1.5">
                        Profissionais vinculados
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {corretoresComEsseCargo.map(c => (
                          <span
                            key={c.id}
                            className="text-xs px-2 py-0.5 rounded bg-[#F7F6F2] dark:bg-[#0D1014] text-[#141619] dark:text-slate-300 border border-[#E2DFD7] dark:border-[#252B37] font-medium"
                          >
                            {c.nome} <span className="text-[#525866] dark:text-slate-400 tabular-nums">({c.creci})</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Sub-aba: Dados da Imobiliária (Visualização + Edição via botão contextual superior) */}
      {subAba === 'empresa' && (
        <div className="bg-white dark:bg-[#151921] border border-[#E2DFD7] dark:border-[#252B37] rounded-xl p-6">
          {!editandoEmpresa ? (
            <div className="space-y-6">
              <div className="flex items-center gap-3.5 border-b border-[#E2DFD7] dark:border-[#252B37] pb-5">
                <div className="w-11 h-11 rounded-lg bg-[#B91C1C] text-white flex items-center justify-center shrink-0">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-display text-lg font-bold text-[#141619] dark:text-white">
                    {dadosEmpresa.nomeFantasia}
                  </h2>
                  <p className="text-sm text-[#525866] dark:text-slate-400 tabular-nums">
                    CRECI nº {dadosEmpresa.creci} ({dadosEmpresa.regiaoCreci})
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                <div className="p-4 bg-[#F7F6F2] dark:bg-[#0D1014] rounded-lg border border-[#E2DFD7] dark:border-[#252B37] space-y-1.5">
                  <span className="text-xs font-semibold text-[#525866] dark:text-slate-400 block">E-mail institucional</span>
                  <p className="font-semibold text-[#141619] dark:text-white flex items-center gap-2 break-all">
                    <Mail className="w-4 h-4 text-[#B91C1C] dark:text-red-400 shrink-0" />
                    <span>{dadosEmpresa.email}</span>
                  </p>
                </div>

                <div className="p-4 bg-[#F7F6F2] dark:bg-[#0D1014] rounded-lg border border-[#E2DFD7] dark:border-[#252B37] space-y-1.5">
                  <span className="text-xs font-semibold text-[#525866] dark:text-slate-400 block">Plantão e WhatsApp</span>
                  <p className="font-semibold text-[#141619] dark:text-white flex items-center gap-2 tabular-nums">
                    <Phone className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0" />
                    <span>{dadosEmpresa.telefone}</span>
                  </p>
                </div>

                <div className="p-4 bg-[#F7F6F2] dark:bg-[#0D1014] rounded-lg border border-[#E2DFD7] dark:border-[#252B37] space-y-1.5">
                  <span className="text-xs font-semibold text-[#525866] dark:text-slate-400 block">Sede operacional</span>
                  <p className="font-semibold text-[#141619] dark:text-white flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[#B91C1C] dark:text-red-400 shrink-0" />
                    <span>
                      {dadosEmpresa.cidade}
                      {dadosEmpresa.observacaoSede ? ` — ${dadosEmpresa.observacaoSede}` : ''}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSalvarEmpresa} className="space-y-5">
              <div className="border-b border-[#E2DFD7] dark:border-[#252B37] pb-4">
                <h2 className="font-display text-lg font-bold text-[#141619] dark:text-white">
                  Editar dados da imobiliária
                </h2>
                <p className="text-sm text-[#525866] dark:text-slate-400 mt-0.5">
                  As alterações são refletidas imediatamente na barra superior e no rodapé do sistema.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-[#141619] dark:text-slate-200 mb-1.5">
                    Nome da imobiliária *
                  </label>
                  <input
                    type="text"
                    required
                    value={formEmpresa.nomeFantasia}
                    onChange={(e) => setFormEmpresa({ ...formEmpresa, nomeFantasia: e.target.value })}
                    className="w-full text-sm px-3.5 py-2.5 rounded-lg bg-[#F7F6F2] dark:bg-[#0D1014] border border-[#E2DFD7] dark:border-[#252B37] text-[#141619] dark:text-white focus:border-[#B91C1C] outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-semibold text-[#141619] dark:text-slate-200 mb-1.5">
                      Registro CRECI *
                    </label>
                    <input
                      type="text"
                      required
                      value={formEmpresa.creci}
                      onChange={(e) => setFormEmpresa({ ...formEmpresa, creci: e.target.value })}
                      className="w-full text-sm px-3.5 py-2.5 rounded-lg bg-[#F7F6F2] dark:bg-[#0D1014] border border-[#E2DFD7] dark:border-[#252B37] text-[#141619] dark:text-white tabular-nums focus:border-[#B91C1C] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[#141619] dark:text-slate-200 mb-1.5">
                      Região / UF
                    </label>
                    <input
                      type="text"
                      value={formEmpresa.regiaoCreci}
                      onChange={(e) => setFormEmpresa({ ...formEmpresa, regiaoCreci: e.target.value })}
                      className="w-full text-sm px-3.5 py-2.5 rounded-lg bg-[#F7F6F2] dark:bg-[#0D1014] border border-[#E2DFD7] dark:border-[#252B37] text-[#141619] dark:text-white focus:border-[#B91C1C] outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#141619] dark:text-slate-200 mb-1.5">
                    E-mail institucional *
                  </label>
                  <input
                    type="email"
                    required
                    value={formEmpresa.email}
                    onChange={(e) => setFormEmpresa({ ...formEmpresa, email: e.target.value })}
                    className="w-full text-sm px-3.5 py-2.5 rounded-lg bg-[#F7F6F2] dark:bg-[#0D1014] border border-[#E2DFD7] dark:border-[#252B37] text-[#141619] dark:text-white focus:border-[#B91C1C] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#141619] dark:text-slate-200 mb-1.5">
                    Plantão e WhatsApp *
                  </label>
                  <input
                    type="text"
                    required
                    value={formEmpresa.telefone}
                    onChange={(e) => setFormEmpresa({ ...formEmpresa, telefone: e.target.value })}
                    className="w-full text-sm px-3.5 py-2.5 rounded-lg bg-[#F7F6F2] dark:bg-[#0D1014] border border-[#E2DFD7] dark:border-[#252B37] text-[#141619] dark:text-white tabular-nums focus:border-[#B91C1C] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#141619] dark:text-slate-200 mb-1.5">
                    Cidade / UF
                  </label>
                  <input
                    type="text"
                    value={formEmpresa.cidade}
                    onChange={(e) => setFormEmpresa({ ...formEmpresa, cidade: e.target.value })}
                    className="w-full text-sm px-3.5 py-2.5 rounded-lg bg-[#F7F6F2] dark:bg-[#0D1014] border border-[#E2DFD7] dark:border-[#252B37] text-[#141619] dark:text-white focus:border-[#B91C1C] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#141619] dark:text-slate-200 mb-1.5">
                    Complemento de atendimento
                  </label>
                  <input
                    type="text"
                    value={formEmpresa.observacaoSede}
                    onChange={(e) => setFormEmpresa({ ...formEmpresa, observacaoSede: e.target.value })}
                    placeholder="Ex.: Atendimento regional"
                    className="w-full text-sm px-3.5 py-2.5 rounded-lg bg-[#F7F6F2] dark:bg-[#0D1014] border border-[#E2DFD7] dark:border-[#252B37] text-[#141619] dark:text-white focus:border-[#B91C1C] outline-none"
                  />
                </div>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Modal de Cadastro de Novo Corretor */}
      {modalNovoCorretorAberto && (
        <NovoCorretorModal
          onClose={() => setModalNovoCorretorAberto(false)}
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

      {/* Modal de Cadastro de Novo Cargo */}
      {modalNovoCargoAberto && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="novo-cargo-title"
          onClick={() => setModalNovoCargoAberto(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0D1014]/75 backdrop-blur-xs animate-fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-white dark:bg-[#151921] border border-[#E2DFD7] dark:border-[#252B37] rounded-xl p-6 shadow-2xl space-y-5 animate-scale-up"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#B91C1C] text-white flex items-center justify-center shrink-0">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h2 id="novo-cargo-title" className="font-display text-lg font-bold text-[#141619] dark:text-white">
                    Cadastrar cargo
                  </h2>
                  <p className="text-xs sm:text-sm text-[#525866] dark:text-slate-400">
                    Fica disponível para todos os corretores e contratos.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setModalNovoCargoAberto(false)}
                aria-label="Fechar janela"
                className="p-1.5 text-[#525866] dark:text-slate-400 hover:text-[#141619] dark:hover:text-white rounded-lg hover:bg-[#EFECE6] dark:hover:bg-[#1C212B] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleCadastrarCargo();
              }}
              className="space-y-4"
            >
              <div>
                <label htmlFor="novo-cargo-input" className="block text-sm font-semibold text-[#141619] dark:text-slate-200 mb-1.5">
                  Nome da função *
                </label>
                <input
                  id="novo-cargo-input"
                  type="text"
                  autoFocus
                  required
                  placeholder="Ex.: Gerente de Locação, Perito Avaliador..."
                  value={novoCargoInput}
                  onChange={(e) => setNovoCargoInput(e.target.value)}
                  className="w-full text-sm px-3.5 py-2.5 rounded-lg bg-[#F7F6F2] dark:bg-[#0D1014] border border-[#E2DFD7] dark:border-[#252B37] text-[#141619] dark:text-white outline-none focus:border-[#B91C1C] transition-colors"
                />
              </div>

              {SUGESTOES_CARGOS.some(s => !cargos.some(c => c.toLowerCase() === s.toLowerCase())) && (
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-[#525866] dark:text-slate-400 block">
                    Sugestões rápidas
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {SUGESTOES_CARGOS.map((sugestao) => {
                      const jaExiste = cargos.some(c => c.toLowerCase() === sugestao.toLowerCase());
                      if (jaExiste) return null;
                      return (
                        <button
                          key={sugestao}
                          type="button"
                          onClick={() => handleCadastrarCargo(sugestao)}
                          className="text-xs px-2.5 py-1.5 rounded-lg bg-[#F7F6F2] dark:bg-[#0D1014] hover:bg-red-50 dark:hover:bg-red-950/40 text-[#141619] dark:text-slate-300 hover:text-[#B91C1C] dark:hover:text-red-300 border border-[#E2DFD7] dark:border-[#252B37] hover:border-red-200 dark:hover:border-red-900/60 transition-colors cursor-pointer flex items-center gap-1 font-medium"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>{sugestao}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#E2DFD7] dark:border-[#252B37]">
                <button
                  type="button"
                  onClick={() => setModalNovoCargoAberto(false)}
                  className="px-4 py-2 rounded-lg border border-[#E2DFD7] dark:border-[#252B37] text-sm font-semibold text-[#525866] dark:text-slate-300 hover:bg-[#EFECE6] dark:hover:bg-[#1C212B] transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#B91C1C] hover:bg-[#991B1B] text-white text-sm font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Salvar cargo</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={modalConfirmacao.aberto}
        title={modalConfirmacao.titulo}
        message={modalConfirmacao.mensagem}
        itemName={modalConfirmacao.nomeItem}
        confirmText={modalConfirmacao.confirmText || 'Excluir'}
        onClose={() => setModalConfirmacao(prev => ({ ...prev, aberto: false }))}
        onConfirm={modalConfirmacao.onConfirmar}
      />
    </div>
  );
};
