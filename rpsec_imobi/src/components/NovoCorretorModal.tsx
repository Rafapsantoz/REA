import React, { useState } from 'react';
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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-sm flex justify-center items-center p-3 sm:p-4 animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        
        {/* Cabeçalho */}
        <div className="p-5 sm:p-6 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-rose-500 to-red-700 text-white flex items-center justify-center shadow-md shadow-rose-900/20">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Cadastrar Novo Corretor
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Credenciamento de equipe, controle de CRECI e e-mail institucional
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulário com Scroll Suave */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
          
          {/* Dados Pessoais & Profissionais */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Nome Completo do Corretor *
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Carlos Eduardo de Oliveira"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="w-full text-xs p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 font-medium focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-rose-500" />
                  Registro CRECI *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: 278536-F"
                  value={creci}
                  onChange={(e) => setCreci(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 font-semibold uppercase focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                  CPF (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="000.000.000-00"
                  value={cpf}
                  onChange={(e) => setCpf(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none"
                />
              </div>
            </div>

            {/* Endereço de E-mail (OBRIGATÓRIO) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-rose-500" />
                  Endereço de E-mail Institucional *
                </span>
                <span className="text-[10px] text-rose-500 font-bold uppercase tracking-wider">Obrigatório</span>
              </label>
              <input
                type="email"
                required
                placeholder="corretor@imobiliariajeronimo.com.br"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full text-xs p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 font-medium focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none"
              />
            </div>

            {/* Telefone & Cargo/Função (com local para cadastro de novos cargos) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-emerald-500" />
                  Telefone / WhatsApp *
                </label>
                <input
                  type="text"
                  required
                  placeholder="(19) 99999-9999"
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                    Cargo / Função *
                  </label>
                  {!cadastrandoCargo && (
                    <button
                      type="button"
                      onClick={() => setCadastrandoCargo(true)}
                      className="text-[11px] font-bold text-rose-600 dark:text-rose-400 hover:text-rose-700 flex items-center gap-0.5 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Cadastrar</span>
                    </button>
                  )}
                </div>

                {cadastrandoCargo ? (
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      autoFocus
                      placeholder="Novo cargo..."
                      value={novoCargoTexto}
                      onChange={(e) => setNovoCargoTexto(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSalvarCargo(); } }}
                      className="flex-1 text-xs p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-rose-500 outline-none font-medium"
                    />
                    <button
                      type="button"
                      onClick={handleSalvarCargo}
                      className="px-2.5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl cursor-pointer"
                    >
                      Salvar
                    </button>
                    <button
                      type="button"
                      onClick={() => { setCadastrandoCargo(false); setNovoCargoTexto(''); }}
                      className="px-2 py-2.5 border border-slate-200 dark:border-slate-700 text-xs text-slate-500 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                    >
                      ✕
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
                    className="w-full text-xs p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none font-medium"
                  >
                    {listaCargos.map((c, i) => (
                      <option key={i} value={c}>{c}</option>
                    ))}
                    <option value="__novo__">+ Cadastrar Novo Cargo...</option>
                  </select>
                )}
              </div>
            </div>

            {/* Cálculo de Comissão & Status de Credenciamento */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              
              {/* Cálculo de Comissão com quadradinho "A definir" */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Percent className="w-3.5 h-3.5 text-rose-500" />
                  Cálculo de Comissão de Locação
                </label>

                {/* Quadradinho a definir porque o Manoel ainda não fechou a regra */}
                <label className="flex items-center gap-2.5 cursor-pointer bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-amber-400 dark:hover:border-amber-500 transition-colors">
                  <input
                    type="checkbox"
                    checked={comissaoADefinir}
                    onChange={(e) => setComissaoADefinir(e.target.checked)}
                    className="rounded text-amber-500 focus:ring-amber-400 w-4 h-4 cursor-pointer"
                  />
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    A definir (Regra comercial em definição)
                  </span>
                </label>

                {!comissaoADefinir && (
                  <div className="pt-1">
                    <label className="block text-[11px] text-slate-500 mb-1">
                      Percentual Padrão de Comissão (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={comissaoPadrao}
                      onChange={(e) => setComissaoPadrao(Number(e.target.value))}
                      placeholder="Ex: 50%"
                      className="w-full text-xs p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 outline-none font-semibold"
                    />
                  </div>
                )}
              </div>

              {/* Status de Credenciamento (pode ficar) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Status de Credenciamento
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setStatus('ativo')}
                    className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      status === 'ativo'
                        ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700 shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-950 text-slate-500 border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    ✓ Ativo Regular
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatus('inativo')}
                    className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      status === 'inativo'
                        ? 'bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-400 dark:border-slate-600 shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-950 text-slate-500 border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    ⚪ Inativo
                  </button>
                </div>
              </div>
            </div>

            {/* Informações Adicionais (Antiga Biografia) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Informações Adicionais
              </label>
              <textarea
                rows={2}
                placeholder="Informações adicionais, observações operacionais, anotações internas ou histórico do corretor..."
                value={informacoesAdicionais}
                onChange={(e) => setInformacoesAdicionais(e.target.value)}
                className="w-full text-xs p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none resize-none"
              />
            </div>
          </div>

          {/* Rodapé / Botão de Ação */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-rose-900/20 transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Concluir Cadastro do Corretor</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
