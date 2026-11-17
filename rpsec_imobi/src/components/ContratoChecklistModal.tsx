import React, { useState } from 'react';
import { 
  X, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  FileText, 
  Users, 
  Droplet, 
  Zap, 
  Shield, 
  DollarSign, 
  Camera, 
  Key, 
  Home, 
  Send, 
  Save, 
  ChevronRight, 
  Plus, 
  Trash2, 
  UploadCloud, 
  Download, 
  Eye, 
  Flame, 
  CheckSquare, 
  Square,
  Lock,
  ArrowRight
} from 'lucide-react';
import { ContratoLocacaoCompleto, Morador, Testemunha, AnexoArquivo } from '../types';
import { calcularProgressoAbertura, calcularProgressoEncerramento } from '../mockContratos';
import { useToast } from './Toast';

interface ContratoChecklistModalProps {
  contrato: ContratoLocacaoCompleto;
  onClose: () => void;
  onUpdateContrato: (contratoAtualizado: ContratoLocacaoCompleto) => void;
}

export const ContratoChecklistModal: React.FC<ContratoChecklistModalProps> = ({
  contrato: initialContrato,
  onClose,
  onUpdateContrato
}) => {
  const { showToast } = useToast();
  const [contrato, setContrato] = useState<ContratoLocacaoCompleto>(initialContrato);
  
  // Abas internas: Abertura vs Encerramento vs Anexos
  const [activeTab, setActiveTab] = useState<'abertura' | 'encerramento' | 'anexos'>(
    initialContrato.processoAtivo === 'encerramento' ? 'encerramento' : 'abertura'
  );

  // Estados de cálculo
  const progressoAbertura = calcularProgressoAbertura(contrato);
  const progressoEncerramento = calcularProgressoEncerramento(contrato);

  // Adicionar novo morador
  const [novoMoradorNome, setNovoMoradorNome] = useState('');
  const [novoMoradorVinculo, setNovoMoradorVinculo] = useState('Filho(a)');
  const [novoMoradorCpf, setNovoMoradorCpf] = useState('');
  const [novoMoradorRg, setNovoMoradorRg] = useState('');
  const [mostrarAddMorador, setMostrarAddMorador] = useState(false);

  const handleSalvar = () => {
    onUpdateContrato(contrato);
    showToast(`Informações do Contrato nº ${contrato.numeroOrdem} salvas com sucesso!`, 'success');
  };

  // Transição de Status: Ativar Contrato
  const handleAtivarContrato = () => {
    if (!progressoAbertura.estaAptoParaAtivar) {
      showToast(`Faltam ${progressoAbertura.total - progressoAbertura.concluidos} etapas obrigatórias para ativar o contrato!`, 'error');
      return;
    }

    const atualizado: ContratoLocacaoCompleto = {
      ...contrato,
      status: 'ativo',
      processoAtivo: 'abertura'
    };
    setContrato(atualizado);
    onUpdateContrato(atualizado);
    showToast(`O Contrato nº ${contrato.numeroOrdem} agora está 100% ativo e as chaves foram liberadas.`, 'success');
  };

  // Iniciar Processo de Encerramento
  const handleIniciarEncerramento = () => {
    const atualizado: ContratoLocacaoCompleto = {
      ...contrato,
      processoAtivo: 'encerramento'
    };
    setContrato(atualizado);
    setActiveTab('encerramento');
    onUpdateContrato(atualizado);
    showToast("Processo de Encerramento Iniciado. Preencha o checklist de rescisão e quitações.", 'info');
  };

  // Finalizar e Encerrar Contrato Definitivamente
  const handleConcluirEncerramento = () => {
    if (!progressoEncerramento.estaAptoParaEncerrar) {
      showToast(`Faltam ${progressoEncerramento.total - progressoEncerramento.concluidos} etapas para a quitação final!`, 'error');
      return;
    }

    const atualizado: ContratoLocacaoCompleto = {
      ...contrato,
      status: 'encerrado'
    };
    setContrato(atualizado);
    onUpdateContrato(atualizado);
    showToast(`O Contrato nº ${contrato.numeroOrdem} foi arquivado com todas as quitações e baixas concluídas.`, 'success');
  };

  // Adicionar Morador
  const handleAdicionarMorador = () => {
    if (!novoMoradorNome.trim()) {
      showToast("Informe o nome do morador.", 'error');
      return;
    }
    const novo: Morador = {
      id: `mor_${Date.now()}`,
      nome: novoMoradorNome,
      vinculo: novoMoradorVinculo,
      cpf: novoMoradorCpf || "Não informado",
      rg: novoMoradorRg || "Não informado",
      documentosAnexados: true
    };
    const novosMoradores = [...contrato.moradores, novo];
    setContrato({
      ...contrato,
      moradores: novosMoradores,
      checklistAbertura: {
        ...contrato.checklistAbertura,
        docMoradores: true
      }
    });
    setNovoMoradorNome('');
    setNovoMoradorCpf('');
    setNovoMoradorRg('');
    setMostrarAddMorador(false);
    showToast(`${novo.nome} vinculado ao imóvel com sucesso.`, 'success');
  };

  // Remover Morador
  const handleRemoverMorador = (id: string) => {
    setContrato({
      ...contrato,
      moradores: contrato.moradores.filter(m => m.id !== id)
    });
  };

  // Simular upload de novo anexo
  const handleSimularUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const novoAnexo: AnexoArquivo = {
        id: `anx_${Date.now()}`,
        nome: file.name,
        categoria: 'comprovante',
        tamanho: `${(file.size / 1024).toFixed(0)} KB`,
        dataUpload: new Date().toLocaleDateString('pt-BR')
      };
      setContrato({
        ...contrato,
        anexos: [novoAnexo, ...contrato.anexos]
      });
      showToast(`${file.name} foi adicionado à pasta digital do contrato.`, 'success');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-sm flex justify-center p-2 sm:p-4 md:p-6 animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-5xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        
        {/* CABEÇALHO DO MODAL */}
        <div className="p-6 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-500 to-red-700 text-white flex items-center justify-center font-bold text-lg shadow-lg shadow-rose-900/30">
              #{contrato.numeroOrdem}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Contrato de Locação Nº {contrato.numeroOrdem}
                </h2>
                {contrato.status === 'ativo' && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    Ativo & Regular
                  </span>
                )}
                {contrato.status === 'pendente' && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-400 border border-amber-300 dark:border-amber-800 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-amber-500" />
                    Em Abertura / Com Pendência
                  </span>
                )}
                {contrato.status === 'encerrado' && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
                    ⚪ Encerrado & Arquivado
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-2">
                <span><strong>Imóvel:</strong> {contrato.imovelEndereco} — {contrato.imovelBairro}, {contrato.imovelCidade}</span>
                <span>•</span>
                <span><strong>Aluguel:</strong> R$ {contrato.valores.aluguel.toLocaleString('pt-BR')},00</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSalvar}
              className="px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all"
            >
              <Save className="w-4 h-4 text-rose-500" />
              <span>Salvar Alterações</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* BARRA DE PROGRESSO & GATILHOS DE TRANSIÇÃO DE STATUS */}
        <div className="px-6 py-4 bg-slate-100/60 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div className="flex-1 min-w-[280px]">
            <div className="flex items-center justify-between text-xs mb-1.5 font-semibold">
              <span className="text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                {activeTab === 'abertura' ? (
                  <>Checklist de Abertura ({progressoAbertura.concluidos}/{progressoAbertura.total} concluídos)</>
                ) : (
                  <>Checklist de Encerramento ({progressoEncerramento.concluidos}/{progressoEncerramento.total} concluídos)</>
                )}
              </span>
              <span className={activeTab === 'abertura' 
                ? (progressoAbertura.estaAptoParaAtivar ? 'text-emerald-500 font-bold' : 'text-amber-500 font-bold')
                : (progressoEncerramento.estaAptoParaEncerrar ? 'text-emerald-500 font-bold' : 'text-amber-500 font-bold')
              }>
                {activeTab === 'abertura' ? `${progressoAbertura.porcentagem}%` : `${progressoEncerramento.porcentagem}%`}
              </span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-500 rounded-full ${
                  activeTab === 'abertura'
                    ? (progressoAbertura.estaAptoParaAtivar ? 'bg-emerald-500' : 'bg-gradient-to-r from-amber-500 to-rose-500')
                    : (progressoEncerramento.estaAptoParaEncerrar ? 'bg-emerald-500' : 'bg-gradient-to-r from-amber-500 to-indigo-500')
                }`}
                style={{ width: `${activeTab === 'abertura' ? progressoAbertura.porcentagem : progressoEncerramento.porcentagem}%` }}
              ></div>
            </div>
          </div>

          {/* BOTÕES DE TRANSIÇÃO RIGOROSOS CONFORME REGRA RPSECTI */}
          <div className="flex items-center gap-2">
            {contrato.status === 'pendente' && (
              <button
                onClick={handleAtivarContrato}
                disabled={!progressoAbertura.estaAptoParaAtivar}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all ${
                  progressoAbertura.estaAptoParaAtivar
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/30 cursor-pointer animate-pulse'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed opacity-70'
                }`}
                title={!progressoAbertura.estaAptoParaAtivar ? "Complete os 25 itens da abertura para liberar a ativação" : "Liberar ativação e entrega de chaves"}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{progressoAbertura.estaAptoParaAtivar ? "Ativar Contrato & Liberar Chaves 🟢" : `Faltam ${progressoAbertura.total - progressoAbertura.concluidos} itens para Ativar`}</span>
              </button>
            )}

            {contrato.status === 'ativo' && contrato.processoAtivo !== 'encerramento' && (
              <button
                onClick={handleIniciarEncerramento}
                className="px-4 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
              >
                <AlertTriangle className="w-4 h-4 text-rose-500" />
                <span>Iniciar Processo de Rescisão / Saída 🚪</span>
              </button>
            )}

            {contrato.processoAtivo === 'encerramento' && contrato.status !== 'encerrado' && (
              <button
                onClick={handleConcluirEncerramento}
                disabled={!progressoEncerramento.estaAptoParaEncerrar}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all ${
                  progressoEncerramento.estaAptoParaEncerrar
                    ? 'bg-slate-900 hover:bg-black dark:bg-white dark:hover:bg-slate-200 text-white dark:text-slate-900 cursor-pointer'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed opacity-70'
                }`}
              >
                <Lock className="w-4 h-4" />
                <span>{progressoEncerramento.estaAptoParaEncerrar ? "Concluir Encerramento Definitivo ⚪" : `Faltam ${progressoEncerramento.total - progressoEncerramento.concluidos} etapas para Encerrar`}</span>
              </button>
            )}
          </div>
        </div>

        {/* NAVEGAÇÃO DE ABAS INTERNAS */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-6">
          <button
            onClick={() => setActiveTab('abertura')}
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-all ${
              activeTab === 'abertura'
                ? 'border-rose-600 text-rose-600 dark:text-rose-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Processo 1: Abertura (25 Etapas)</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold">
              {progressoAbertura.concluidos}/{progressoAbertura.total}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('encerramento')}
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-all ${
              activeTab === 'encerramento'
                ? 'border-rose-600 text-rose-600 dark:text-rose-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Key className="w-4 h-4" />
            <span>Processo 2: Encerramento (13 Etapas)</span>
            {contrato.processoAtivo === 'encerramento' && (
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('anexos')}
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-all ${
              activeTab === 'anexos'
                ? 'border-rose-600 text-rose-600 dark:text-rose-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <UploadCloud className="w-4 h-4" />
            <span>Pasta Digital & Documentos</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold">
              {contrato.anexos.length} arquivos
            </span>
          </button>
        </div>

        {/* CONTEÚDO PRINCIPAL COM SCROLL */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* ========================================================= */}
          {/* ABA 1: PROCESSO DE ABERTURA (25 ETAPAS MAPEADAS)          */}
          {/* ========================================================= */}
          {activeTab === 'abertura' && (
            <div className="space-y-6">

              {/* CARD 1: TESTEMUNHAS OBRIGATÓRIAS (2) */}
              <div className="bg-slate-50 dark:bg-slate-950 p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                      1. Duas Testemunhas Obrigatórias do Contrato
                    </h3>
                  </div>
                  <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={contrato.checklistAbertura.testemunhasCompletas}
                      onChange={(e) => setContrato({
                        ...contrato,
                        checklistAbertura: { ...contrato.checklistAbertura, testemunhasCompletas: e.target.checked }
                      })}
                      className="rounded text-rose-600 focus:ring-rose-500 w-4 h-4"
                    />
                    <span className="text-slate-700 dark:text-slate-300">Testemunhas Conferidas</span>
                  </label>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Testemunha 1 */}
                  <div className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                    <span className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider block">
                      1ª Testemunha
                    </span>
                    <input
                      type="text"
                      placeholder="Nome Completo da 1ª Testemunha"
                      value={contrato.testemunhas[0]?.nome || ''}
                      onChange={(e) => {
                        const t = [...contrato.testemunhas];
                        t[0] = { ...t[0], nome: e.target.value };
                        setContrato({ ...contrato, testemunhas: t });
                      }}
                      className="w-full text-xs p-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="CPF da Testemunha"
                        value={contrato.testemunhas[0]?.cpf || ''}
                        onChange={(e) => {
                          const t = [...contrato.testemunhas];
                          t[0] = { ...t[0], cpf: e.target.value };
                          setContrato({ ...contrato, testemunhas: t });
                        }}
                        className="text-xs p-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700"
                      />
                      <input
                        type="email"
                        placeholder="E-mail da Testemunha"
                        value={contrato.testemunhas[0]?.email || ''}
                        onChange={(e) => {
                          const t = [...contrato.testemunhas];
                          t[0] = { ...t[0], email: e.target.value };
                          setContrato({ ...contrato, testemunhas: t });
                        }}
                        className="text-xs p-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700"
                      />
                    </div>
                  </div>

                  {/* Testemunha 2 */}
                  <div className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                    <span className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider block">
                      2ª Testemunha
                    </span>
                    <input
                      type="text"
                      placeholder="Nome Completo da 2ª Testemunha"
                      value={contrato.testemunhas[1]?.nome || ''}
                      onChange={(e) => {
                        const t = [...contrato.testemunhas];
                        t[1] = { ...t[1], nome: e.target.value };
                        setContrato({ ...contrato, testemunhas: t });
                      }}
                      className="w-full text-xs p-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="CPF da Testemunha"
                        value={contrato.testemunhas[1]?.cpf || ''}
                        onChange={(e) => {
                          const t = [...contrato.testemunhas];
                          t[1] = { ...t[1], cpf: e.target.value };
                          setContrato({ ...contrato, testemunhas: t });
                        }}
                        className="text-xs p-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700"
                      />
                      <input
                        type="email"
                        placeholder="E-mail da Testemunha"
                        value={contrato.testemunhas[1]?.email || ''}
                        onChange={(e) => {
                          const t = [...contrato.testemunhas];
                          t[1] = { ...t[1], email: e.target.value };
                          setContrato({ ...contrato, testemunhas: t });
                        }}
                        className="text-xs p-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* CARD 2: DOCUMENTOS DO INQUILINO & ESTADO CIVIL (CONDICIONAL) */}
              <div className="bg-slate-50 dark:bg-slate-950 p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                      2. Documentação Pessoal & Estado Civil do Locatário
                    </h3>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <label className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={contrato.checklistAbertura.docLocatario}
                      onChange={(e) => setContrato({
                        ...contrato,
                        checklistAbertura: { ...contrato.checklistAbertura, docLocatario: e.target.checked }
                      })}
                      className="rounded text-rose-600 w-4 h-4"
                    />
                    <div className="text-xs">
                      <span className="font-bold text-slate-800 dark:text-slate-200 block">RG/CPF ou CNH</span>
                      <span className="text-slate-500 text-[11px]">Cópia legível da CNH ou RG/CPF</span>
                    </div>
                  </label>

                  <label className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={contrato.checklistAbertura.comprovanteEndereco}
                      onChange={(e) => setContrato({
                        ...contrato,
                        checklistAbertura: { ...contrato.checklistAbertura, comprovanteEndereco: e.target.checked }
                      })}
                      className="rounded text-rose-600 w-4 h-4"
                    />
                    <div className="text-xs">
                      <span className="font-bold text-slate-800 dark:text-slate-200 block">Comprovante de Endereço</span>
                      <span className="text-slate-500 text-[11px]">Conta de consumo atualizada</span>
                    </div>
                  </label>

                  {/* Estado Civil Dinâmico */}
                  <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Estado Civil</span>
                      <select
                        value={contrato.checklistAbertura.estadoCivilTipo}
                        onChange={(e) => setContrato({
                          ...contrato,
                          checklistAbertura: {
                            ...contrato.checklistAbertura,
                            estadoCivilTipo: e.target.value as any
                          }
                        })}
                        className="text-xs p-1 rounded bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700"
                      >
                        <option value="solteiro">Solteiro</option>
                        <option value="casado">Casado</option>
                        <option value="divorciado">Divorciado</option>
                        <option value="viuvo">Viúvo</option>
                      </select>
                    </div>
                    <label className="flex items-center gap-2 text-xs cursor-pointer pt-1 border-t border-slate-100 dark:border-slate-800">
                      <input
                        type="checkbox"
                        checked={contrato.checklistAbertura.certidaoEstadoCivil}
                        onChange={(e) => setContrato({
                          ...contrato,
                          checklistAbertura: { ...contrato.checklistAbertura, certidaoEstadoCivil: e.target.checked }
                        })}
                        className="rounded text-rose-600 w-4 h-4"
                      />
                      <span className="text-[11px] text-slate-600 dark:text-slate-300">
                        {contrato.checklistAbertura.estadoCivilTipo === 'solteiro' && "Certidão de Nascimento"}
                        {contrato.checklistAbertura.estadoCivilTipo === 'casado' && "Certidão de Casamento"}
                        {contrato.checklistAbertura.estadoCivilTipo === 'divorciado' && "Certidão de Divórcio Averbada"}
                        {contrato.checklistAbertura.estadoCivilTipo === 'viuvo' && "Certidão de Óbito Averbada"}
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              {/* CARD 3: COMPROVAÇÃO DE RENDA & ANÁLISE DE CRÉDITO */}
              <div className="bg-slate-50 dark:bg-slate-950 p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                      3. Comprovações de Renda & Análise de Crédito
                    </h3>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Comprovação de Renda */}
                  <div className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Tipo de Comprovação</span>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setContrato({
                            ...contrato,
                            checklistAbertura: { ...contrato.checklistAbertura, comprovacaoRendaTipo: 'holerite' }
                          })}
                          className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                            contrato.checklistAbertura.comprovacaoRendaTipo === 'holerite'
                              ? 'bg-rose-600 text-white'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          3 Holerites
                        </button>
                        <button
                          type="button"
                          onClick={() => setContrato({
                            ...contrato,
                            checklistAbertura: { ...contrato.checklistAbertura, comprovacaoRendaTipo: 'irpf' }
                          })}
                          className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                            contrato.checklistAbertura.comprovacaoRendaTipo === 'irpf'
                              ? 'bg-rose-600 text-white'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          IRPF Completo
                        </button>
                      </div>
                    </div>
                    <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer pt-2">
                      <input
                        type="checkbox"
                        checked={contrato.checklistAbertura.comprovacaoRenda}
                        onChange={(e) => setContrato({
                          ...contrato,
                          checklistAbertura: { ...contrato.checklistAbertura, comprovacaoRenda: e.target.checked }
                        })}
                        className="rounded text-rose-600 w-4 h-4"
                      />
                      <span className="text-slate-700 dark:text-slate-300">
                        {contrato.checklistAbertura.comprovacaoRendaTipo === 'holerite'
                          ? "3 Últimos Holerites Verificados e Válidos"
                          : "Declaração de IRPF com Recibo Oficial da Receita Federal"}
                      </span>
                    </label>
                  </div>

                  {/* Análise de Crédito */}
                  <div className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Parecer de Crédito</span>
                      <select
                        value={contrato.checklistAbertura.analiseCreditoStatus}
                        onChange={(e) => setContrato({
                          ...contrato,
                          checklistAbertura: { ...contrato.checklistAbertura, analiseCreditoStatus: e.target.value as any }
                        })}
                        className="text-xs p-1 rounded bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700"
                      >
                        <option value="aprovado">🟢 Aprovado</option>
                        <option value="ressalvas">🟡 Aprovado com Ressalvas</option>
                        <option value="em_analise">⚪ Em Análise</option>
                        <option value="reprovado">🔴 Reprovado</option>
                      </select>
                    </div>
                    <div className="flex items-center justify-between text-xs pt-1">
                      <span className="text-slate-500">Score de Crédito:</span>
                      <input
                        type="number"
                        value={contrato.checklistAbertura.analiseCreditoScore}
                        onChange={(e) => setContrato({
                          ...contrato,
                          checklistAbertura: { ...contrato.checklistAbertura, analiseCreditoScore: Number(e.target.value) }
                        })}
                        className="w-20 text-xs p-1 text-right font-bold rounded bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* CARD 4: TODOS OS MORADORES QUE RESIDIRÃO NO IMÓVEL */}
              <div className="bg-slate-50 dark:bg-slate-950 p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                        4. Relação de Todos os Moradores & Documentos
                      </h3>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Quem vai residir no imóvel e cópias de documentos de cada um (RG/CPF ou CNH).
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMostrarAddMorador(!mostrarAddMorador)}
                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Adicionar Morador</span>
                  </button>
                </div>

                {/* Formulário rápido de adicionar morador */}
                {mostrarAddMorador && (
                  <div className="p-3 mb-3 bg-white dark:bg-slate-900 rounded-xl border border-rose-200 dark:border-rose-900/50 space-y-2 animate-fade-in">
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                      <input
                        type="text"
                        placeholder="Nome do Morador"
                        value={novoMoradorNome}
                        onChange={(e) => setNovoMoradorNome(e.target.value)}
                        className="text-xs p-2 rounded bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700"
                      />
                      <select
                        value={novoMoradorVinculo}
                        onChange={(e) => setNovoMoradorVinculo(e.target.value)}
                        className="text-xs p-2 rounded bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700"
                      >
                        <option value="Filho(a)">Filho(a)</option>
                        <option value="Cônjuge">Cônjuge</option>
                        <option value="Mãe/Pai">Mãe / Pai</option>
                        <option value="Parente">Outro Parente</option>
                        <option value="Outro">Outro</option>
                      </select>
                      <input
                        type="text"
                        placeholder="CPF"
                        value={novoMoradorCpf}
                        onChange={(e) => setNovoMoradorCpf(e.target.value)}
                        className="text-xs p-2 rounded bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700"
                      />
                      <input
                        type="text"
                        placeholder="RG"
                        value={novoMoradorRg}
                        onChange={(e) => setNovoMoradorRg(e.target.value)}
                        className="text-xs p-2 rounded bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700"
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setMostrarAddMorador(false)}
                        className="px-2 py-1 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-white"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={handleAdicionarMorador}
                        className="px-3 py-1 bg-emerald-600 text-white rounded text-xs font-semibold"
                      >
                        Salvar Morador
                      </button>
                    </div>
                  </div>
                )}

                {/* Lista de moradores cadastrados */}
                <div className="space-y-2">
                  {contrato.moradores.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">Nenhum morador adicional cadastrado além do inquilino principal.</p>
                  ) : (
                    contrato.moradores.map((m) => (
                      <div key={m.id} className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                          <div>
                            <span className="text-xs font-bold text-slate-900 dark:text-white">{m.nome}</span>
                            <span className="text-[11px] text-slate-500 ml-2">({m.vinculo}) • CPF: {m.cpf} • RG: {m.rg}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                            Docs OK
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoverMorador(m.id)}
                            className="p-1 text-slate-400 hover:text-red-500 rounded"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* CARD 5: SUB-CHECKLIST SABESP (ÁGUA) & CPFL (LUZ) */}
              <div className="bg-slate-50 dark:bg-slate-950 p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Droplet className="w-5 h-5 text-sky-500" />
                    <Zap className="w-5 h-5 text-amber-500" />
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                        5. Transferência de Titularidade: Água (Sabesp) & Luz (CPFL)
                      </h3>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Protocolo de concessionárias para evitar débitos residuais em nome do proprietário.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Sabesp / Água */}
                  <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2.5">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                      <span className="text-xs font-bold text-sky-600 dark:text-sky-400 flex items-center gap-1.5">
                        <Droplet className="w-4 h-4" />
                        ÁGUA & ESGOTO (SABESP / SAE)
                      </span>
                      <label className="flex items-center gap-1 text-xs font-bold cursor-pointer">
                        <input
                          type="checkbox"
                          checked={contrato.checklistAbertura.transferenciaAgua.concluido}
                          onChange={(e) => setContrato({
                            ...contrato,
                            checklistAbertura: {
                              ...contrato.checklistAbertura,
                              transferenciaAgua: {
                                ...contrato.checklistAbertura.transferenciaAgua,
                                concluido: e.target.checked
                              }
                            }
                          })}
                          className="rounded text-sky-600 w-4 h-4"
                        />
                        <span className={contrato.checklistAbertura.transferenciaAgua.concluido ? 'text-emerald-500' : 'text-slate-500'}>
                          {contrato.checklistAbertura.transferenciaAgua.concluido ? "Concluída" : "Pendente"}
                        </span>
                      </label>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={contrato.checklistAbertura.transferenciaAgua.procuracaoAssinada}
                          onChange={(e) => setContrato({
                            ...contrato,
                            checklistAbertura: {
                              ...contrato.checklistAbertura,
                              transferenciaAgua: {
                                ...contrato.checklistAbertura.transferenciaAgua,
                                procuracaoAssinada: e.target.checked
                              }
                            }
                          })}
                          className="rounded text-sky-600"
                        />
                        <span>Procuração Assinada</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={contrato.checklistAbertura.transferenciaAgua.contaAntiga}
                          onChange={(e) => setContrato({
                            ...contrato,
                            checklistAbertura: {
                              ...contrato.checklistAbertura,
                              transferenciaAgua: {
                                ...contrato.checklistAbertura.transferenciaAgua,
                                contaAntiga: e.target.checked
                              }
                            }
                          })}
                          className="rounded text-sky-600"
                        />
                        <span>Conta Antiga Anexada</span>
                      </label>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                      <div>
                        <span className="text-[10px] text-slate-500 block">Leitura do Hidrômetro:</span>
                        <input
                          type="text"
                          value={contrato.checklistAbertura.transferenciaAgua.leituraMedidor}
                          onChange={(e) => setContrato({
                            ...contrato,
                            checklistAbertura: {
                              ...contrato.checklistAbertura,
                              transferenciaAgua: {
                                ...contrato.checklistAbertura.transferenciaAgua,
                                leituraMedidor: e.target.value
                              }
                            }
                          })}
                          className="w-full p-1.5 text-xs rounded bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">Data Solicitação:</span>
                        <input
                          type="text"
                          value={contrato.checklistAbertura.transferenciaAgua.dataSolicitacao}
                          onChange={(e) => setContrato({
                            ...contrato,
                            checklistAbertura: {
                              ...contrato.checklistAbertura,
                              transferenciaAgua: {
                                ...contrato.checklistAbertura.transferenciaAgua,
                                dataSolicitacao: e.target.value
                              }
                            }
                          })}
                          className="w-full p-1.5 text-xs rounded bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700"
                        />
                      </div>
                    </div>
                  </div>

                  {/* CPFL / Luz */}
                  <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2.5">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                      <span className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                        <Zap className="w-4 h-4" />
                        ENERGIA ELÉTRICA (CPFL)
                      </span>
                      <label className="flex items-center gap-1 text-xs font-bold cursor-pointer">
                        <input
                          type="checkbox"
                          checked={contrato.checklistAbertura.transferenciaLuz.concluido}
                          onChange={(e) => setContrato({
                            ...contrato,
                            checklistAbertura: {
                              ...contrato.checklistAbertura,
                              transferenciaLuz: {
                                ...contrato.checklistAbertura.transferenciaLuz,
                                concluido: e.target.checked
                              }
                            }
                          })}
                          className="rounded text-amber-600 w-4 h-4"
                        />
                        <span className={contrato.checklistAbertura.transferenciaLuz.concluido ? 'text-emerald-500' : 'text-amber-500'}>
                          {contrato.checklistAbertura.transferenciaLuz.concluido ? "Concluída" : "Pendente"}
                        </span>
                      </label>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={contrato.checklistAbertura.transferenciaLuz.procuracaoAssinada}
                          onChange={(e) => setContrato({
                            ...contrato,
                            checklistAbertura: {
                              ...contrato.checklistAbertura,
                              transferenciaLuz: {
                                ...contrato.checklistAbertura.transferenciaLuz,
                                procuracaoAssinada: e.target.checked
                              }
                            }
                          })}
                          className="rounded text-amber-600"
                        />
                        <span>Procuração CPFL Assinada</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={contrato.checklistAbertura.transferenciaLuz.contratoAssinado}
                          onChange={(e) => setContrato({
                            ...contrato,
                            checklistAbertura: {
                              ...contrato.checklistAbertura,
                              transferenciaLuz: {
                                ...contrato.checklistAbertura.transferenciaLuz,
                                contratoAssinado: e.target.checked
                              }
                            }
                          })}
                          className="rounded text-amber-600"
                        />
                        <span>Contrato Assinado Entregue</span>
                      </label>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                      <div>
                        <span className="text-[10px] text-slate-500 block">Leitura Relógio Luz:</span>
                        <input
                          type="text"
                          value={contrato.checklistAbertura.transferenciaLuz.leituraMedidor}
                          onChange={(e) => setContrato({
                            ...contrato,
                            checklistAbertura: {
                              ...contrato.checklistAbertura,
                              transferenciaLuz: {
                                ...contrato.checklistAbertura.transferenciaLuz,
                                leituraMedidor: e.target.value
                              }
                            }
                          })}
                          className="w-full p-1.5 text-xs rounded bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">Data Solicitação:</span>
                        <input
                          type="text"
                          value={contrato.checklistAbertura.transferenciaLuz.dataSolicitacao}
                          onChange={(e) => setContrato({
                            ...contrato,
                            checklistAbertura: {
                              ...contrato.checklistAbertura,
                              transferenciaLuz: {
                                ...contrato.checklistAbertura.transferenciaLuz,
                                dataSolicitacao: e.target.value
                              }
                            }
                          })}
                          className="w-full p-1.5 text-xs rounded bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* CARD 6: GARANTIA, SEGURO INCÊNDIO & NOTA PROMISSÓRIA */}
              <div className="bg-slate-50 dark:bg-slate-950 p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                      6. Garantia Locatícia, Seguro Incêndio & Nota Promissória
                    </h3>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  
                  {/* Garantia / Caução */}
                  <div className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">Tipo de Garantia</span>
                    <select
                      value={contrato.checklistAbertura.tipoGarantidor}
                      onChange={(e) => setContrato({
                        ...contrato,
                        checklistAbertura: { ...contrato.checklistAbertura, tipoGarantidor: e.target.value as any }
                      })}
                      className="w-full text-xs p-1.5 rounded bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700"
                    >
                      <option value="caucao">Caução em Dinheiro (Depósito)</option>
                      <option value="capitalizacao">Título de Capitalização</option>
                      <option value="seguro_fianca">Seguro Fiança Locatício</option>
                      <option value="fiador">Fiador Tradicional</option>
                      <option value="credpago">CredPago</option>
                    </select>

                    <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer pt-1">
                      <input
                        type="checkbox"
                        checked={contrato.checklistAbertura.pagamentoBoletoGarantia}
                        onChange={(e) => setContrato({
                          ...contrato,
                          checklistAbertura: { ...contrato.checklistAbertura, pagamentoBoletoGarantia: e.target.checked }
                        })}
                        className="rounded text-indigo-600 w-4 h-4"
                      />
                      <span className="text-slate-700 dark:text-slate-300">Caução / Boleto Pago (R$ {contrato.valores.caucaoValor || 0})</span>
                    </label>
                  </div>

                  {/* Seguro Incêndio */}
                  <div className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Seguro Incêndio</span>
                      <Flame className="w-4 h-4 text-orange-500" />
                    </div>
                    <div className="grid grid-cols-2 gap-1 text-[11px]">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={contrato.checklistAbertura.seguroIncendioCotado}
                          onChange={(e) => setContrato({
                            ...contrato,
                            checklistAbertura: { ...contrato.checklistAbertura, seguroIncendioCotado: e.target.checked }
                          })}
                          className="rounded text-orange-600"
                        />
                        <span>Cotação Aprovada</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={contrato.checklistAbertura.seguroIncendioApolice}
                          onChange={(e) => setContrato({
                            ...contrato,
                            checklistAbertura: { ...contrato.checklistAbertura, seguroIncendioApolice: e.target.checked }
                          })}
                          className="rounded text-orange-600"
                        />
                        <span>Apólice Emitida</span>
                      </label>
                    </div>
                    <input
                      type="text"
                      placeholder="Forma: ex: 4x de R$ 85,00"
                      value={contrato.checklistAbertura.seguroIncendioParcelas}
                      onChange={(e) => setContrato({
                        ...contrato,
                        checklistAbertura: { ...contrato.checklistAbertura, seguroIncendioParcelas: e.target.value }
                      })}
                      className="w-full text-xs p-1.5 rounded bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700"
                    />
                  </div>

                  {/* Nota Promissória */}
                  <div className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">Nota Promissória</span>
                    <label className="flex items-center gap-2 text-xs cursor-pointer">
                      <input
                        type="checkbox"
                        checked={contrato.checklistAbertura.notaPromissoriaPreenchida}
                        onChange={(e) => setContrato({
                          ...contrato,
                          checklistAbertura: { ...contrato.checklistAbertura, notaPromissoriaPreenchida: e.target.checked }
                        })}
                        className="rounded text-rose-600 w-4 h-4"
                      />
                      <span className="text-slate-700 dark:text-slate-300">Promissória Preenchida</span>
                    </label>
                    <label className="flex items-center gap-2 text-xs font-bold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={contrato.checklistAbertura.notaPromissoriaAssinada}
                        onChange={(e) => setContrato({
                          ...contrato,
                          checklistAbertura: { ...contrato.checklistAbertura, notaPromissoriaAssinada: e.target.checked }
                        })}
                        className="rounded text-rose-600 w-4 h-4"
                      />
                      <span className={contrato.checklistAbertura.notaPromissoriaAssinada ? 'text-emerald-500' : 'text-amber-500'}>
                        {contrato.checklistAbertura.notaPromissoriaAssinada ? "Assinatura Coletada" : "⚠️ Assinatura Pendente"}
                      </span>
                    </label>
                  </div>

                </div>
              </div>

              {/* CARD 7: VISTORIA DE ENTRADA, MINUTAS & LANÇAMENTO */}
              <div className="bg-slate-50 dark:bg-slate-950 p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Camera className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                      7. Vistoria de Entrada, Minutas e Lançamento no Sistema
                    </h3>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  <label className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={contrato.checklistAbertura.vistoriaEntradaLaudoAssinado}
                      onChange={(e) => setContrato({
                        ...contrato,
                        checklistAbertura: { ...contrato.checklistAbertura, vistoriaEntradaLaudoAssinado: e.target.checked }
                      })}
                      className="rounded text-emerald-600 w-4 h-4"
                    />
                    <div>
                      <span className="font-bold block">Laudo de Entrada</span>
                      <span className="text-[10px] text-slate-500">Assinado com fotos</span>
                    </div>
                  </label>

                  <label className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={contrato.checklistAbertura.assinaturaContratoLocacao}
                      onChange={(e) => setContrato({
                        ...contrato,
                        checklistAbertura: { ...contrato.checklistAbertura, assinaturaContratoLocacao: e.target.checked }
                      })}
                      className="rounded text-emerald-600 w-4 h-4"
                    />
                    <div>
                      <span className="font-bold block">Contrato Locação</span>
                      <span className="text-[10px] text-slate-500">Assinado por todos</span>
                    </div>
                  </label>

                  <label className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={contrato.checklistAbertura.assinaturaContratoPrestacao}
                      onChange={(e) => setContrato({
                        ...contrato,
                        checklistAbertura: { ...contrato.checklistAbertura, assinaturaContratoPrestacao: e.target.checked }
                      })}
                      className="rounded text-emerald-600 w-4 h-4"
                    />
                    <div>
                      <span className="font-bold block">Prestação de Serviço</span>
                      <span className="text-[10px] text-slate-500">Imobiliária ↔ Proprietário</span>
                    </div>
                  </label>

                  <label className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={contrato.checklistAbertura.lancadoNoPrograma}
                      onChange={(e) => setContrato({
                        ...contrato,
                        checklistAbertura: { ...contrato.checklistAbertura, lancadoNoPrograma: e.target.checked }
                      })}
                      className="rounded text-emerald-600 w-4 h-4"
                    />
                    <div>
                      <span className="font-bold block">Lançado no Programa</span>
                      <span className="text-[10px] text-slate-500">Boletos e repasses ativos</span>
                    </div>
                  </label>
                </div>
              </div>

            </div>
          )}

          {/* ========================================================= */}
          {/* ABA 2: PROCESSO DE ENCERRAMENTO (13 ETAPAS MAPEADAS)       */}
          {/* ========================================================= */}
          {activeTab === 'encerramento' && (
            <div className="space-y-6">

              <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 flex-shrink-0" />
                <div className="text-xs">
                  <span className="font-bold text-rose-900 dark:text-rose-200 block">
                    Protocolo de Rescisão & Quitação de Saída (Regra de Ouro)
                  </span>
                  <span className="text-rose-700 dark:text-rose-300">
                    Nenhum contrato deve ser dado como encerrado ou caução devolvido antes da vistoria de saída e da quitação das faturas finais da Sabesp e CPFL.
                  </span>
                </div>
              </div>

              {/* CARD 1: COMUNICAÇÃO DE SAÍDA / QUEBRA */}
              <div className="bg-slate-50 dark:bg-slate-950 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <Key className="w-5 h-5 text-rose-500" />
                  1. Comunicação de Saída & Quebra de Contrato
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <span className="text-xs text-slate-500 block mb-1">Data Solicitada (Aviso):</span>
                    <input
                      type="text"
                      placeholder="Ex: 01/07/2026"
                      value={contrato.checklistEncerramento.comunicacaoDataSolicitada}
                      onChange={(e) => setContrato({
                        ...contrato,
                        checklistEncerramento: { ...contrato.checklistEncerramento, comunicacaoDataSolicitada: e.target.value }
                      })}
                      className="w-full text-xs p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                    />
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block mb-1">Data Efetiva de Saída:</span>
                    <input
                      type="text"
                      placeholder="Ex: 31/07/2026"
                      value={contrato.checklistEncerramento.comunicacaoDataSaida}
                      onChange={(e) => setContrato({
                        ...contrato,
                        checklistEncerramento: { ...contrato.checklistEncerramento, comunicacaoDataSaida: e.target.value }
                      })}
                      className="w-full text-xs p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                    />
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block mb-1">Motivo da Saída:</span>
                    <input
                      type="text"
                      placeholder="Ex: Mudança de cidade, compra própria"
                      value={contrato.checklistEncerramento.comunicacaoMotivo}
                      onChange={(e) => setContrato({
                        ...contrato,
                        checklistEncerramento: { ...contrato.checklistEncerramento, comunicacaoMotivo: e.target.value }
                      })}
                      className="w-full text-xs p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                    />
                  </div>
                </div>
              </div>

              {/* CARD 2: VISTORIA DE SAÍDA & ORÇAMENTO DE REPAROS */}
              <div className="bg-slate-50 dark:bg-slate-950 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <Camera className="w-5 h-5 text-indigo-500" />
                  2. Vistoria de Saída & Orçamento de Reparos / Pintura
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
                    <label className="flex items-center gap-2 cursor-pointer font-bold">
                      <input
                        type="checkbox"
                        checked={contrato.checklistEncerramento.vistoriaSaidaRealizada}
                        onChange={(e) => setContrato({
                          ...contrato,
                          checklistEncerramento: { ...contrato.checklistEncerramento, vistoriaSaidaRealizada: e.target.checked }
                        })}
                        className="rounded text-indigo-600 w-4 h-4"
                      />
                      <span>Vistoria de Saída Executada</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={contrato.checklistEncerramento.vistoriaSaidaFotosDevolucao}
                        onChange={(e) => setContrato({
                          ...contrato,
                          checklistEncerramento: { ...contrato.checklistEncerramento, vistoriaSaidaFotosDevolucao: e.target.checked }
                        })}
                        className="rounded text-indigo-600 w-4 h-4"
                      />
                      <span>Fotos de Devolução Anexadas</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={contrato.checklistEncerramento.vistoriaSaidaComparadoEntrada}
                        onChange={(e) => setContrato({
                          ...contrato,
                          checklistEncerramento: { ...contrato.checklistEncerramento, vistoriaSaidaComparadoEntrada: e.target.checked }
                        })}
                        className="rounded text-indigo-600 w-4 h-4"
                      />
                      <span>Comparativo com Laudo de Entrada Concluído</span>
                    </label>
                  </div>

                  {/* Orçamento de Reparos */}
                  <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
                    <label className="flex items-center gap-2 cursor-pointer font-bold">
                      <input
                        type="checkbox"
                        checked={contrato.checklistEncerramento.orcamentoReparosNecessita}
                        onChange={(e) => setContrato({
                          ...contrato,
                          checklistEncerramento: { ...contrato.checklistEncerramento, orcamentoReparosNecessita: e.target.checked }
                        })}
                        className="rounded text-indigo-600 w-4 h-4"
                      />
                      <span>Necessita Reparos / Pintura a Cargo do Inquilino</span>
                    </label>
                    {contrato.checklistEncerramento.orcamentoReparosNecessita && (
                      <div className="space-y-2 pt-1 animate-fade-in">
                        <input
                          type="text"
                          placeholder="Descrição dos reparos (ex: Pintura sala e fechadura)"
                          value={contrato.checklistEncerramento.orcamentoReparosDescricao}
                          onChange={(e) => setContrato({
                            ...contrato,
                            checklistEncerramento: { ...contrato.checklistEncerramento, orcamentoReparosDescricao: e.target.value }
                          })}
                          className="w-full p-1.5 text-xs rounded bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700"
                        />
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] text-slate-500">Valor do Orçamento:</span>
                          <input
                            type="number"
                            placeholder="R$ 0,00"
                            value={contrato.checklistEncerramento.orcamentoReparosValor}
                            onChange={(e) => setContrato({
                              ...contrato,
                              checklistEncerramento: { ...contrato.checklistEncerramento, orcamentoReparosValor: Number(e.target.value) }
                            })}
                            className="w-28 p-1 text-xs text-right font-bold rounded bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* CARD 3: BAIXA DE FATURAS FINAIS (ÁGUA E CPFL) */}
              <div className="bg-slate-50 dark:bg-slate-950 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <Droplet className="w-5 h-5 text-sky-500" />
                  <Zap className="w-5 h-5 text-amber-500" />
                  3. Baixas de Contas de Consumo Finais
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                    <span className="font-bold text-sky-600 block">SABESP (Água)</span>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={contrato.checklistEncerramento.baixaFaturaAguaQuitada}
                        onChange={(e) => setContrato({
                          ...contrato,
                          checklistEncerramento: {
                            ...contrato.checklistEncerramento,
                            baixaFaturaAguaQuitada: e.target.checked,
                            baixaFaturaAguaConcluida: e.target.checked
                          }
                        })}
                        className="rounded text-sky-600 w-4 h-4"
                      />
                      <span>Fatura Final Quitada & Baixada</span>
                    </label>
                  </div>

                  <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                    <span className="font-bold text-amber-600 block">CPFL (Energia)</span>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={contrato.checklistEncerramento.baixaFaturaCpflQuitada}
                        onChange={(e) => setContrato({
                          ...contrato,
                          checklistEncerramento: {
                            ...contrato.checklistEncerramento,
                            baixaFaturaCpflQuitada: e.target.checked,
                            baixaFaturaCpflConcluida: e.target.checked
                          }
                        })}
                        className="rounded text-amber-600 w-4 h-4"
                      />
                      <span>Fatura Final Quitada & Baixada</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* CARD 4: REEMBOLSO DE CAUÇÃO & QUITAÇÃO DEFINITIVA */}
              <div className="bg-slate-50 dark:bg-slate-950 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-emerald-500" />
                  4. Prestação de Contas do Caução & Baixa no Sistema
                </h3>
                <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs text-center">
                    <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950">
                      <span className="text-slate-500 block text-[10px]">Caução Inicial:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                        R$ {contrato.checklistEncerramento.reembolsoCaucaoValorInicial.toLocaleString('pt-BR')},00
                      </span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950">
                      <span className="text-slate-500 block text-[10px]">(-) Reparos:</span>
                      <span className="font-bold text-red-500 text-sm">
                        R$ {contrato.checklistEncerramento.orcamentoReparosValor.toLocaleString('pt-BR')},00
                      </span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950">
                      <span className="text-slate-500 block text-[10px]">Saldo a Devolver:</span>
                      <span className="font-bold text-emerald-500 text-sm">
                        R$ {Math.max(0, contrato.checklistEncerramento.reembolsoCaucaoValorInicial - contrato.checklistEncerramento.orcamentoReparosValor).toLocaleString('pt-BR')},00
                      </span>
                    </div>
                    <label className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center cursor-pointer">
                      <span className="text-[10px] text-slate-500 mb-1">Status Devolução:</span>
                      <input
                        type="checkbox"
                        checked={contrato.checklistEncerramento.reembolsoCaucaoPago}
                        onChange={(e) => setContrato({
                          ...contrato,
                          checklistEncerramento: {
                            ...contrato.checklistEncerramento,
                            reembolsoCaucaoPago: e.target.checked,
                            reembolsoCaucaoTermoAssinado: e.target.checked
                          }
                        })}
                        className="rounded text-emerald-600 w-4 h-4"
                      />
                    </label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={contrato.checklistEncerramento.baixaNotaPromissoria}
                        onChange={(e) => setContrato({
                          ...contrato,
                          checklistEncerramento: { ...contrato.checklistEncerramento, baixaNotaPromissoria: e.target.checked }
                        })}
                        className="rounded text-emerald-600 w-4 h-4"
                      />
                      <span>Promissória Devolvida ao Inquilino</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={contrato.checklistEncerramento.baixaSeguroIncendio}
                        onChange={(e) => setContrato({
                          ...contrato,
                          checklistEncerramento: { ...contrato.checklistEncerramento, baixaSeguroIncendio: e.target.checked }
                        })}
                        className="rounded text-emerald-600 w-4 h-4"
                      />
                      <span>Baixa no Seguro Incêndio</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={contrato.checklistEncerramento.baixaNoPrograma}
                        onChange={(e) => setContrato({
                          ...contrato,
                          checklistEncerramento: { ...contrato.checklistEncerramento, baixaNoPrograma: e.target.checked }
                        })}
                        className="rounded text-emerald-600 w-4 h-4"
                      />
                      <span>Baixa Geral no Sistema Financeiro</span>
                    </label>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* ========================================================= */}
          {/* ABA 3: PASTA DIGITAL & ANEXOS                             */}
          {/* ========================================================= */}
          {activeTab === 'anexos' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    Pasta Digital do Contrato ({contrato.anexos.length} arquivos)
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Espelho da pasta de documentos do cliente (Contratos, Docs Moradores, Sabesp, CPFL, Vistorias).
                  </p>
                </div>
                <label className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-sm transition-all">
                  <UploadCloud className="w-4 h-4" />
                  <span>Anexar Novo Arquivo</span>
                  <input type="file" onChange={handleSimularUpload} className="hidden" />
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {contrato.anexos.map((anx) => (
                  <div key={anx.id} className="p-3.5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2.5 truncate">
                      <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="truncate">
                        <span className="text-xs font-bold text-slate-900 dark:text-white truncate block">
                          {anx.nome}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {anx.tamanho} • Anexado em {anx.dataUpload}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                        Anexado
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
