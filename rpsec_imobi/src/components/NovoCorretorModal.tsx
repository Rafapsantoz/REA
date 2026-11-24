import React, { useState, useEffect } from 'react';
import { X, UserPlus, Mail, Phone, Shield, CheckCircle2, Percent, FileText, Plus } from 'lucide-react';
import { Corretor } from '../types';
import { DEFAULT_CARGOS } from '../mockCorretores';
import { useToast } from './Toast';

interface NovoCorretorModalProps {
  onClose: () => void;
  onAddCorretor: (novo: Corretor) => void;
  cargosCadastrados?: string[];
  onCadastrarNovoCargo?: (novoCargo: string) => void;
}

export const NovoCorretorModal: React.FC<NovoCorretorModalProps> = ({
  onClose,
  onAddCorretor,
  cargosCadastrados,
  onCadastrarNovoCargo
}) => {
  const { showToast } = useToast();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const [nome, setNome] = useState('');
  const [creci, setCreci] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [cpf, setCpf] = useState('');

  // Gestão / Cadastro de Cargos & Funções
  const [listaCargos, setListaCargos] = useState<string[]>(() => {
    if (cargosCadastrados && cargosCadastrados.length > 0) return cargosCadastrados;
    const salvos = localStorage.getItem('rpsec_imobi_cargos');
    if (salvos) {
      try {
        return JSON.parse(salvos);
      } catch (e) {
        console.error('Falha ao carregar cargos:', e);
      }
    }
    return DEFAULT_CARGOS;
  });

  const [cargo, setCargo] = useState('Corretor de Imóveis');
  const [cadastrandoCargo, setCadastrandoCargo] = useState(false);
  const [novoCargoTexto, setNovoCargoTexto] = useState('');

  const handleSalvarCargo = () => {
    const textoLimpo = novoCargoTexto.trim();
    if (!textoLimpo) {
      showToast('Digite o nome do novo cargo/função.', 'error');
      return;
    }
    if (!listaCargos.includes(textoLimpo)) {
      const novaLista = [...listaCargos, textoLimpo];
      setListaCargos(novaLista);
      localStorage.setItem('rpsec_imobi_cargos', JSON.stringify(novaLista));
      onCadastrarNovoCargo?.(textoLimpo);
    }
    setCargo(textoLimpo);
    setNovoCargoTexto('');
    setCadastrandoCargo(false);
    showToast(`Cargo "${textoLimpo}" cadastrado e selecionado!`, 'success');
  };

  // Cálculo de comissão: quadradinho a definir porque o Manoel ainda não fechou a regra
  const [comissaoADefinir, setComissaoADefinir] = useState<boolean>(true);
  const [comissaoPadrao, setComissaoPadrao] = useState<number>(50);

  // Status de credenciamento
  const [status, setStatus] = useState<'ativo' | 'inativo'>('ativo');

  // Informações adicionais (antiga biografia)
  const [informacoesAdicionais, setInformacoesAdicionais] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!nome.trim()) {
      showToast('Informe o nome completo do corretor.', 'error');
      return;
    }

    if (!creci.trim()) {
      showToast('Informe o número do registro CRECI.', 'error');
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      showToast('O endereço de e-mail é obrigatório e deve ser válido.', 'error');
      return;
    }

    if (!telefone.trim()) {
      showToast('Informe o telefone ou WhatsApp do corretor.', 'error');
      return;
    }

    const novoCorretor: Corretor = {
      id: `cor_${Date.now()}`,
      nome: nome.trim(),
      creci: creci.trim().toUpperCase(),
      email: email.trim().toLowerCase(),
      telefone: telefone.trim(),
      cpf: cpf.trim() || undefined,
      cargo: cargo.trim() || 'Corretor de Imóveis',
      comissaoADefinir: comissaoADefinir,
      comissaoPadrao: comissaoADefinir ? undefined : comissaoPadrao,
      status,
      dataCadastro: new Date().toLocaleDateString('pt-BR'),
      totalContratos: 0,
      totalImoveis: 0,
      bio: informacoesAdicionais.trim() || undefined,
      informacoesAdicionais: informacoesAdicionais.trim() || undefined
    };

    onAddCorretor(novoCorretor);
    showToast(`Corretor ${novoCorretor.nome} (CRECI ${novoCorretor.creci}) cadastrado com sucesso!`, 'success');
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="novo-corretor-title"
      onClick={onClose}
      className="fixed inset-0 z-50 overflow-y-auto bg-[#0D1014]/75 backdrop-blur-xs flex justify-center items-center p-3 sm:p-4 animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-[#151921] border border-[#E2DFD7] dark:border-[#252B37] rounded-xl w-full max-w-xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden animate-scale-up"
      >
        {/* Cabeçalho */}
        <div className="p-5 sm:p-6 bg-[#F7F6F2] dark:bg-[#0D1014] border-b border-[#E2DFD7] dark:border-[#252B37] flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#B91C1C] text-white flex items-center justify-center shrink-0">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 id="novo-corretor-title" className="font-display text-lg font-bold text-[#141619] dark:text-white">
                Cadastrar corretor
              </h2>
              <p className="text-xs sm:text-sm text-[#525866] dark:text-slate-400">
                Credenciamento de equipe, registro CRECI e contato institucional.
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
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-[#141619] dark:text-slate-200 mb-1.5">
                Nome completo *
              </label>
              <input
                type="text"
                required
                placeholder="Ex.: Carlos Eduardo de Oliveira"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="w-full text-sm px-3.5 py-2.5 rounded-lg bg-[#F7F6F2] dark:bg-[#0D1014] border border-[#E2DFD7] dark:border-[#252B37] text-[#141619] dark:text-white focus:border-[#B91C1C] outline-none transition-colors"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="text-sm font-semibold text-[#141619] dark:text-slate-200 mb-1.5 flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-[#B91C1C] dark:text-red-400" />
                  <span>Registro CRECI *</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex.: 278536-F"
                  value={creci}
                  onChange={(e) => setCreci(e.target.value)}
                  className="w-full text-sm px-3.5 py-2.5 rounded-lg bg-[#F7F6F2] dark:bg-[#0D1014] border border-[#E2DFD7] dark:border-[#252B37] text-[#141619] dark:text-white font-semibold uppercase focus:border-[#B91C1C] outline-none transition-colors tabular-nums"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-[#141619] dark:text-slate-200 mb-1.5 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-[#525866] dark:text-slate-400" />
                  <span>CPF (opcional)</span>
                </label>
                <input
                  type="text"
                  placeholder="000.000.000-00"
                  value={cpf}
                  onChange={(e) => setCpf(e.target.value)}
                  className="w-full text-sm px-3.5 py-2.5 rounded-lg bg-[#F7F6F2] dark:bg-[#0D1014] border border-[#E2DFD7] dark:border-[#252B37] text-[#141619] dark:text-white focus:border-[#B91C1C] outline-none transition-colors tabular-nums"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-[#141619] dark:text-slate-200 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Mail className="w-4 h-4 text-[#B91C1C] dark:text-red-400" />
                  <span>E-mail institucional *</span>
                </span>
                <span className="text-xs text-[#B91C1C] dark:text-red-400 font-medium">Obrigatório</span>
              </label>
              <input
                type="email"
                required
                placeholder="corretor@imobiliariajeronimo.com.br"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full text-sm px-3.5 py-2.5 rounded-lg bg-[#F7F6F2] dark:bg-[#0D1014] border border-[#E2DFD7] dark:border-[#252B37] text-[#141619] dark:text-white focus:border-[#B91C1C] outline-none transition-colors"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="text-sm font-semibold text-[#141619] dark:text-slate-200 mb-1.5 flex items-center gap-1.5">
                  <Phone className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                  <span>Telefone / WhatsApp *</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="(19) 99999-9999"
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  className="w-full text-sm px-3.5 py-2.5 rounded-lg bg-[#F7F6F2] dark:bg-[#0D1014] border border-[#E2DFD7] dark:border-[#252B37] text-[#141619] dark:text-white focus:border-[#B91C1C] outline-none transition-colors tabular-nums"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm font-semibold text-[#141619] dark:text-slate-200 block">
                    Cargo ou função *
                  </label>
                  {!cadastrandoCargo && (
                    <button
                      type="button"
                      onClick={() => setCadastrandoCargo(true)}
                      className="text-xs font-semibold text-[#B91C1C] dark:text-red-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Novo cargo</span>
                    </button>
                  )}
                </div>

                {cadastrandoCargo ? (
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      autoFocus
                      placeholder="Nome do cargo..."
                      value={novoCargoTexto}
                      onChange={(e) => setNovoCargoTexto(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSalvarCargo(); } }}
                      className="flex-1 text-sm px-3 py-2 rounded-lg bg-[#F7F6F2] dark:bg-[#0D1014] border border-[#B91C1C] text-[#141619] dark:text-white outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleSalvarCargo}
                      className="px-3 py-2 bg-[#B91C1C] hover:bg-[#991B1B] text-white text-xs font-semibold rounded-lg cursor-pointer"
                    >
                      Salvar
                    </button>
                    <button
                      type="button"
                      onClick={() => { setCadastrandoCargo(false); setNovoCargoTexto(''); }}
                      aria-label="Cancelar novo cargo"
                      className="p-2 border border-[#E2DFD7] dark:border-[#252B37] text-xs text-[#525866] dark:text-slate-400 rounded-lg hover:bg-[#EFECE6] dark:hover:bg-[#1C212B] cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <select
                    value={cargo}
                    onChange={(e) => {
                      if (e.target.value === '__novo__') {
                        setCadastrandoCargo(true);
                      } else {
                        setCargo(e.target.value);
                      }
                    }}
                    className="w-full text-sm px-3.5 py-2.5 rounded-lg bg-[#F7F6F2] dark:bg-[#0D1014] border border-[#E2DFD7] dark:border-[#252B37] text-[#141619] dark:text-slate-200 focus:border-[#B91C1C] outline-none transition-colors"
                  >
                    {listaCargos.map((c, i) => (
                      <option key={i} value={c}>{c}</option>
                    ))}
                    <option value="__novo__">Cadastrar novo cargo...</option>
                  </select>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-[#141619] dark:text-slate-200 flex items-center gap-1.5">
                  <Percent className="w-4 h-4 text-[#B91C1C] dark:text-red-400" />
                  <span>Comissão de locação</span>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer bg-[#F7F6F2] dark:bg-[#0D1014] p-2.5 rounded-lg border border-[#E2DFD7] dark:border-[#252B37] hover:border-amber-500 transition-colors">
                  <input
                    type="checkbox"
                    checked={comissaoADefinir}
                    onChange={(e) => setComissaoADefinir(e.target.checked)}
                    className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4 cursor-pointer"
                  />
                  <span className="text-xs font-semibold text-[#141619] dark:text-slate-200">
                    A definir (regra em aberto)
                  </span>
                </label>

                {!comissaoADefinir && (
                  <div className="pt-1">
                    <label className="block text-xs text-[#525866] dark:text-slate-400 mb-1">
                      Percentual padrão (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={comissaoPadrao}
                      onChange={(e) => setComissaoPadrao(Number(e.target.value))}
                      placeholder="Ex.: 50"
                      className="w-full text-sm px-3 py-2 rounded-lg bg-[#F7F6F2] dark:bg-[#0D1014] border border-[#E2DFD7] dark:border-[#252B37] text-[#141619] dark:text-white outline-none font-semibold tabular-nums"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#141619] dark:text-slate-200 mb-1.5">
                  Situação cadastral
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setStatus('ativo')}
                    className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                      status === 'ativo'
                        ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700'
                        : 'bg-[#F7F6F2] dark:bg-[#0D1014] text-[#525866] dark:text-slate-400 border-[#E2DFD7] dark:border-[#252B37]'
                    }`}
                  >
                    Ativo
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatus('inativo')}
                    className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                      status === 'inativo'
                        ? 'bg-[#141619] text-white dark:bg-slate-700 dark:text-white border-transparent'
                        : 'bg-[#F7F6F2] dark:bg-[#0D1014] text-[#525866] dark:text-slate-400 border-[#E2DFD7] dark:border-[#252B37]'
                    }`}
                  >
                    Inativo
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#141619] dark:text-slate-200 mb-1.5">
                Observações adicionais
              </label>
              <textarea
                rows={2}
                placeholder="Anotações internas ou histórico do corretor..."
                value={informacoesAdicionais}
                onChange={(e) => setInformacoesAdicionais(e.target.value)}
                className="w-full text-sm px-3.5 py-2.5 rounded-lg bg-[#F7F6F2] dark:bg-[#0D1014] border border-[#E2DFD7] dark:border-[#252B37] text-[#141619] dark:text-white focus:border-[#B91C1C] outline-none resize-none transition-colors"
              />
            </div>
          </div>

          <div className="pt-4 flex items-center justify-end gap-2.5 border-t border-[#E2DFD7] dark:border-[#252B37]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-lg border border-[#E2DFD7] dark:border-[#252B37] text-[#525866] dark:text-slate-300 text-sm font-semibold hover:bg-[#EFECE6] dark:hover:bg-[#1C212B] transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-lg bg-[#B91C1C] hover:bg-[#991B1B] text-white text-sm font-semibold flex items-center gap-2 transition-colors cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Salvar corretor</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
