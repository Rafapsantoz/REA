import React, { useState } from 'react';
import { X, UserPlus, Mail, Phone, Shield, Award, CheckCircle2, Percent, FileText } from 'lucide-react';
import { Corretor } from '../types';
import { useToast } from './Toast';

interface NovoCorretorModalProps {
  onClose: () => void;
  onAddCorretor: (novo: Corretor) => void;
}

export const NovoCorretorModal: React.FC<NovoCorretorModalProps> = ({
  onClose,
  onAddCorretor
}) => {
  const { showToast } = useToast();

  const [nome, setNome] = useState('');
  const [creci, setCreci] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [cpf, setCpf] = useState('');
  const [cargo, setCargo] = useState('Corretor de Imóveis');
  const [comissaoPadrao, setComissaoPadrao] = useState<number>(50);
  const [status, setStatus] = useState<'ativo' | 'inativo'>('ativo');
  const [bio, setBio] = useState('');

  // Especialidades selecionadas
  const especialidadesDisponiveis = [
    'Locação Residencial',
    'Locação Comercial',
    'Vendas & Captação',
    'Imóveis Rurais',
    'Vistoria de Entrada/Saída',
    'Avaliação Pericial'
  ];
  const [especialidades, setEspecialidades] = useState<string[]>(['Locação Residencial']);

  const toggleEspecialidade = (item: string) => {
    setEspecialidades(prev => 
      prev.includes(item) 
        ? prev.filter(e => e !== item)
        : [...prev, item]
    );
  };

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
      cargo: cargo.trim(),
      especialidades: especialidades.length > 0 ? especialidades : ['Locação Residencial'],
      comissaoPadrao,
      status,
      dataCadastro: new Date().toLocaleDateString('pt-BR'),
      totalContratos: 0,
      totalImoveis: 0,
      bio: bio.trim() || undefined
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
                Credenciamento de equipe e controle de CRECI & E-mail institucional
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
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

            {/* Endereço de E-mail (OBRIGATÓRIO PARA TODOS OS CADASTROS) */}
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
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Cargo / Função
                </label>
                <select
                  value={cargo}
                  onChange={(e) => setCargo(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none"
                >
                  <option value="Corretor de Imóveis">Corretor de Imóveis</option>
                  <option value="Corretora Especialista em Locação">Corretora Especialista em Locação</option>
                  <option value="Coordenador Comercial">Coordenador Comercial</option>
                  <option value="Corretor Comercial & Rural">Corretor Comercial & Rural</option>
                  <option value="Avaliador Perito Imobiliário">Avaliador Perito Imobiliário</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                  <Percent className="w-3.5 h-3.5 text-rose-500" />
                  Comissão Padrão de Locação (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={comissaoPadrao}
                  onChange={(e) => setComissaoPadrao(Number(e.target.value))}
                  className="w-full text-xs p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Status de Credenciamento
                </label>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setStatus('ativo')}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
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
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                      status === 'inativo'
                        ? 'bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-400 dark:border-slate-600 shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-950 text-slate-500 border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    Inativo
                  </button>
                </div>
              </div>
            </div>

            {/* Especialidades */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-rose-500" />
                Especialidades de Atuação
              </label>
              <div className="flex flex-wrap gap-1.5">
                {especialidadesDisponiveis.map(esp => {
                  const selecionada = especialidades.includes(esp);
                  return (
                    <button
                      key={esp}
                      type="button"
                      onClick={() => toggleEspecialidade(esp)}
                      className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition-all ${
                        selecionada
                          ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border-rose-300 dark:border-rose-800 shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-950 text-slate-500 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                      }`}
                    >
                      {selecionada ? '✓ ' : '+ '}{esp}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Observações / Bio */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Biografia / Observações Internas
              </label>
              <textarea
                rows={2}
                placeholder="Observações operacionais, áreas de atuação preferencial..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
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
