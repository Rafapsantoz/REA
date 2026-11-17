import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  MapPin, 
  Key, 
  User, 
  FileCheck, 
  Share2, 
  Printer, 
  Check, 
  Building, 
  ShieldCheck, 
  Phone,
  Edit3,
  Save,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Upload,
  Image as ImageIcon
} from 'lucide-react';
import { Imovel, Cliente } from '../types';
import { useToast } from './Toast';

interface FichaImovelModalProps {
  imovel: Imovel | null;
  proprietario?: Cliente | null;
  onClose: () => void;
  onSaveImovel?: (imovelAtualizado: Imovel) => void;
}

export const FichaImovelModal: React.FC<FichaImovelModalProps> = ({
  imovel,
  proprietario,
  onClose,
  onSaveImovel
}) => {
  const { showToast } = useToast();
  const [copiado, setCopiado] = useState(false);
  const [modoEdicao, setModoEdicao] = useState(false);

  // Carrossel de Fotos
  const [currentFotoIndex, setCurrentFotoIndex] = useState(0);
  const [fotosGaleria, setFotosGaleria] = useState<string[]>([]);
  const [novaUrlFoto, setNovaUrlFoto] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Estados locais para edição rápida da ficha
  const [localChave, setLocalChave] = useState('');
  const [matricula, setMatricula] = useState('');
  const [iptu, setIptu] = useState('');
  const [financiamento, setFinanciamento] = useState(true);
  const [descricao, setDescricao] = useState('');
  const [area, setArea] = useState('');
  const [quartos, setQuartos] = useState<number | ''>('');
  const [vagas, setVagas] = useState<number | ''>('');
  const [valor, setValor] = useState<number | ''>('');
  const [taxaAdm, setTaxaAdm] = useState<number>(10);

  useEffect(() => {
    if (imovel) {
      const listaFotos = imovel.fotos && imovel.fotos.length > 0 ? imovel.fotos : [imovel.foto];
      setFotosGaleria(listaFotos);
      setCurrentFotoIndex(0);
      setLocalChave(imovel.localizacaoChave || 'Chaveiro na Recepção');
      setMatricula(imovel.matricula || '');
      setIptu(imovel.iptuItr || '');
      setFinanciamento(imovel.aceitaFinanciamento ?? true);
      setDescricao(imovel.descricao || '');
      setArea(imovel.area || '');
      setQuartos(imovel.quartos || '');
      setVagas(imovel.vagas || '');
      setValor(imovel.valor || '');
      setTaxaAdm(imovel.taxaAdmLocacao ?? 10);
      setModoEdicao(false);
    }
  }, [imovel]);

  if (!imovel) return null;

  // Navegação do Carrossel
  const handlePrevFoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentFotoIndex(prev => (prev === 0 ? fotosGaleria.length - 1 : prev - 1));
  };

  const handleNextFoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentFotoIndex(prev => (prev === fotosGaleria.length - 1 ? 0 : prev + 1));
  };

  // Upload de Múltiplas Fotos no Modo Edição
  const handleUploadFotos = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setFotosGaleria(prev => [...prev, reader.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });

    showToast(`${files.length} foto(s) adicionada(s) ao carrossel!`, 'success');
  };

  const handleAdicionarUrlFoto = () => {
    if (!novaUrlFoto.trim()) return;
    setFotosGaleria(prev => [...prev, novaUrlFoto.trim()]);
    setNovaUrlFoto('');
    showToast('Nova foto adicionada ao carrossel!', 'success');
  };

  const handleRemoverFoto = (indexToRemove: number) => {
    if (fotosGaleria.length <= 1) {
      showToast('O imóvel deve conter ao menos 1 foto.', 'error');
      return;
    }
    setFotosGaleria(prev => prev.filter((_, idx) => idx !== indexToRemove));
    if (currentFotoIndex >= fotosGaleria.length - 1) {
      setCurrentFotoIndex(Math.max(0, fotosGaleria.length - 2));
    }
    showToast('Foto removida da galeria.', 'info');
  };

  // Salvar Edição Completa da Ficha e das Fotos
  const handleSalvarEdicao = () => {
    if (!onSaveImovel) return;

    const fotoPrincipal = fotosGaleria[0] || imovel.foto;
    const atualizado: Imovel = {
      ...imovel,
      foto: fotoPrincipal,
      fotos: fotosGaleria,
      localizacaoChave: localChave,
      matricula,
      iptuItr: iptu,
      aceitaFinanciamento: financiamento,
      descricao,
      area,
      quartos: quartos === '' ? undefined : Number(quartos),
      vagas: vagas === '' ? undefined : Number(vagas),
      valor: valor === '' ? imovel.valor : Number(valor),
      taxaAdmLocacao: Number(taxaAdm)
    };

    onSaveImovel(atualizado);
    setModoEdicao(false);
    showToast('Ficha e Carrossel de fotos atualizados com sucesso!', 'success');
  };

  const handleCopiarWhatsApp = () => {
    const texto = `🏡 *Manoel Jerônimo Imóveis — Cód. ${imovel.codigo}*\n` +
      `*${imovel.titulo}*\n\n` +
      `📍 *Localização:* ${imovel.bairro} — ${imovel.cidade}\n` +
      `📐 *Área:* ${area || imovel.area}\n` +
      `🛏️ *Quartos:* ${quartos || imovel.quartos || '—'} | 🚗 *Vagas:* ${vagas || imovel.vagas || '—'}\n` +
      `💰 *Valor:* R$ ${(valor || imovel.valor).toLocaleString('pt-BR')}${imovel.finalidade === 'locacao' ? '/mês' : ''}\n\n` +
      `📝 *Descrição:* ${descricao || imovel.descricao || 'Excelente oportunidade em Mococa/SP.'}\n\n` +
      `📞 *Agende sua visita com a Manoel Jerônimo Imóveis:* (19) 99303-0194`;

    navigator.clipboard.writeText(texto);
    setCopiado(true);
    showToast('Resumo copiado! Pronto para colar no WhatsApp.', 'success');
    setTimeout(() => setCopiado(false), 2500);
  };

  const fotoAtual = fotosGaleria[currentFotoIndex] || imovel.foto;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-3xl w-full max-h-[92vh] overflow-y-auto shadow-2xl flex flex-col transition-colors duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Cabeçalho do Modal */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between sticky top-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md z-20">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-rose-600 text-white font-mono text-xs font-bold px-2.5 py-0.5 rounded-lg shadow-sm shadow-rose-950/20">
                CÓD: {imovel.codigo}
              </span>
              <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                imovel.status === 'alugado' 
                  ? 'bg-blue-500/10 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300' 
                  : imovel.status === 'reservado'
                  ? 'bg-amber-500/10 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300'
                  : 'bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300'
              }`}>
                {imovel.status.toUpperCase()}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium capitalize">
                {imovel.finalidade === 'venda' ? 'À Venda' : 'Para Locação'}
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white mt-1.5 line-clamp-1">
              {imovel.titulo}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
              <MapPin className="w-3.5 h-3.5 text-rose-500" />
              {imovel.bairro} • {imovel.cidade}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setModoEdicao(!modoEdicao)}
              className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors border ${
                modoEdicao
                  ? 'bg-rose-600 text-white border-rose-600 shadow-md'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{modoEdicao ? 'Visualizar' : 'Editar Ficha & Fotos'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Corpo com Grid de Informações */}
        <div className="p-6 space-y-6 text-xs">
          
          {modoEdicao && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-700 dark:text-amber-300 text-xs flex items-center justify-between">
              <span>✏️ <strong>Modo de Edição Ativo:</strong> Você pode adicionar/remover fotos do carrossel, alterar chave, matrícula e texto abaixo.</span>
              <button
                onClick={handleSalvarEdicao}
                className="px-3 py-1 bg-amber-600 text-white font-bold rounded-lg hover:bg-amber-500 transition-colors flex items-center gap-1"
              >
                <Save className="w-3.5 h-3.5" />
                Salvar Alterações
              </button>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════
              CARROSSEL INTERATIVO DE FOTOS
          ═══════════════════════════════════════════════════════════ */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            
            <div className="flex flex-col space-y-2.5">
              
              {/* Visor Principal do Carrossel */}
              <div className="relative h-60 rounded-2xl overflow-hidden bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md group">
                <img 
                  src={fotoAtual} 
                  alt={`${imovel.titulo} - Foto ${currentFotoIndex + 1}`} 
                  className="w-full h-full object-cover transition-all duration-300 select-none"
                />

                {/* Tag de Categoria */}
                <span className="absolute bottom-2.5 left-2.5 bg-slate-950/80 text-[10px] text-white font-semibold px-2.5 py-1 rounded-lg backdrop-blur-md">
                  {imovel.subtipo} • {imovel.categoria}
                </span>

                {/* Contador de Fotos */}
                {fotosGaleria.length > 1 && (
                  <span className="absolute top-2.5 right-2.5 bg-black/70 text-white font-mono text-[10px] font-bold px-2.5 py-1 rounded-full backdrop-blur-md">
                    {currentFotoIndex + 1} / {fotosGaleria.length}
                  </span>
                )}

                {/* Botões de Navegação Anterior / Próxima (Setas) */}
                {fotosGaleria.length > 1 && (
                  <>
                    <button
                      onClick={handlePrevFoto}
                      title="Foto Anterior"
                      className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center backdrop-blur-md transition-all shadow-lg hover:scale-105"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>

                    <button
                      onClick={handleNextFoto}
                      title="Próxima Foto"
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center backdrop-blur-md transition-all shadow-lg hover:scale-105"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </>
                )}
              </div>

              {/* Faixa de Miniaturas (Thumbnails) para Troca Direta */}
              {fotosGaleria.length > 1 && (
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                  {fotosGaleria.map((fotoUrl, idx) => (
                    <div 
                      key={idx}
                      className="relative group/thumb flex-shrink-0"
                    >
                      <button
                        onClick={() => setCurrentFotoIndex(idx)}
                        className={`w-14 h-11 rounded-lg overflow-hidden border-2 transition-all block ${
                          currentFotoIndex === idx
                            ? 'border-rose-600 scale-105 shadow-md shadow-rose-950/30'
                            : 'border-slate-300 dark:border-slate-700 opacity-60 hover:opacity-100'
                        }`}
                      >
                        <img src={fotoUrl} alt="Thumbnail" className="w-full h-full object-cover" />
                      </button>

                      {/* Botão de Excluir Foto no Modo Edição */}
                      {modoEdicao && fotosGaleria.length > 1 && (
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); handleRemoverFoto(idx); }}
                          title="Remover foto"
                          className="absolute -top-1 -right-1 w-4 h-4 bg-rose-600 text-white rounded-full flex items-center justify-center text-[9px] hover:bg-rose-700 shadow"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Botões para Adicionar Mais Fotos (Modo Edição) */}
              {modoEdicao && (
                <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Adicionar Mais Fotos ao Carrossel:
                  </span>
                  
                  <div className="flex gap-2">
                    <input
                      type="file"
                      ref={fileInputRef}
                      multiple
                      accept="image/*"
                      onChange={handleUploadFotos}
                      className="hidden"
                      id="carrossel-foto-upload"
                    />
                    <label
                      htmlFor="carrossel-foto-upload"
                      className="flex-1 py-1.5 px-2.5 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 cursor-pointer flex items-center justify-center gap-1.5 font-bold text-[11px] transition-colors"
                    >
                      <Upload className="w-3.5 h-3.5 text-rose-500" />
                      <span>Upload de Múltiplas Fotos</span>
                    </label>
                  </div>

                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      value={novaUrlFoto}
                      onChange={e => setNovaUrlFoto(e.target.value)}
                      placeholder="Ou cole URL da foto..."
                      className="flex-1 p-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-[11px] text-slate-900 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={handleAdicionarUrlFoto}
                      className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-bold text-[11px]"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

            </div>

            {/* Coluna da Direita: Preço, Cômodos e WhatsApp */}
            <div className="flex flex-col justify-between space-y-4">
              <div>
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                  Valor {imovel.finalidade === 'locacao' ? 'do Aluguel' : 'de Venda'}
                </span>
                
                {modoEdicao ? (
                  <div className="mt-1">
                    <input
                      type="number"
                      value={valor}
                      onChange={e => setValor(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-lg font-black text-emerald-600 dark:text-emerald-400"
                    />
                  </div>
                ) : (
                  <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-1 block">
                    R$ {(Number(valor) || imovel.valor).toLocaleString('pt-BR')}
                    {imovel.finalidade === 'locacao' && <span className="text-sm font-normal text-slate-500"> /mês</span>}
                  </span>
                )}

                {/* Grid de Atributos Físicos */}
                <div className="grid grid-cols-2 gap-2 mt-4 text-xs">
                  <div className="p-2.5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
                    <span className="text-slate-500 dark:text-slate-400 text-[10px] block">Área Total</span>
                    {modoEdicao ? (
                      <input
                        type="text"
                        value={area}
                        onChange={e => setArea(e.target.value)}
                        placeholder="Ex: 3.200 m²"
                        className="w-full mt-1 p-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-xs font-bold"
                      />
                    ) : (
                      <span className="font-bold text-slate-800 dark:text-slate-200">{area || imovel.area}</span>
                    )}
                  </div>

                  <div className="p-2.5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
                    <span className="text-slate-500 dark:text-slate-400 text-[10px] block">Dormitórios</span>
                    {modoEdicao ? (
                      <input
                        type="number"
                        value={quartos}
                        onChange={e => setQuartos(e.target.value === '' ? '' : Number(e.target.value))}
                        placeholder="Ex: 3"
                        className="w-full mt-1 p-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-xs font-bold"
                      />
                    ) : (
                      <span className="font-bold text-slate-800 dark:text-slate-200">{quartos || imovel.quartos || '—'} dormitórios</span>
                    )}
                  </div>

                  <div className="p-2.5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
                    <span className="text-slate-500 dark:text-slate-400 text-[10px] block">Vagas Garagem</span>
                    {modoEdicao ? (
                      <input
                        type="number"
                        value={vagas}
                        onChange={e => setVagas(e.target.value === '' ? '' : Number(e.target.value))}
                        placeholder="Ex: 2"
                        className="w-full mt-1 p-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-xs font-bold"
                      />
                    ) : (
                      <span className="font-bold text-slate-800 dark:text-slate-200">{vagas || imovel.vagas || '—'} vagas</span>
                    )}
                  </div>

                  <div className="p-2.5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
                    <span className="text-slate-500 dark:text-slate-400 text-[10px] block">Fotos no Álbum</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{fotosGaleria.length} fotos no carrossel</span>
                  </div>
                </div>
              </div>

              {/* Botão de Compartilhar no WhatsApp */}
              <button
                onClick={handleCopiarWhatsApp}
                className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-950/20 flex items-center justify-center gap-2 transition-all"
              >
                {copiado ? (
                  <>
                    <Check className="w-4 h-4 text-white" />
                    <span>Texto Copiado para Envio!</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-4 h-4" />
                    <span>Copiar Resumo para WhatsApp</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Descrição Detalhada da Captação */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
            <span className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] block mb-1.5">
              Memorial Descritivo / Anúncio
            </span>
            {modoEdicao ? (
              <textarea
                rows={3}
                value={descricao}
                onChange={e => setDescricao(e.target.value)}
                placeholder="Insira as características completas do imóvel..."
                className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-rose-500"
              />
            ) : (
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                {descricao || imovel.descricao || 'Imóvel cadastrado na carteira da Manoel Jerônimo Imóveis. Agende uma visita para conhecer de perto as benfeitorias e o potencial do local.'}
              </p>
            )}
          </div>

          {/* Painel Operacional Interno (Uso da Imobiliária e Corretores) */}
          <div className="p-5 rounded-2xl bg-rose-500/5 dark:bg-rose-950/20 border border-rose-500/20 dark:border-rose-900/30 space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-widest flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" />
                Dossiê Interno da Imobiliária (Balcão)
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">Sigiloso</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              
              {/* Onde está a chave */}
              <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1 mb-1">
                  <Key className="w-3 h-3 text-amber-500" />
                  Localização das Chaves
                </span>
                {modoEdicao ? (
                  <input
                    type="text"
                    value={localChave}
                    onChange={e => setLocalChave(e.target.value)}
                    placeholder="Ex: Chaveiro nº 14 na Recepção..."
                    className="w-full p-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded text-xs font-bold text-slate-900 dark:text-white"
                  />
                ) : (
                  <span className="font-bold text-slate-900 dark:text-white block">
                    {localChave || imovel.localizacaoChave || 'Chaveiro na Recepção'}
                  </span>
                )}
              </div>

              {/* Proprietário */}
              <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1 mb-1">
                  <User className="w-3 h-3 text-rose-500" />
                  Proprietário Vinculado
                </span>
                <span className="font-bold text-slate-900 dark:text-white block">
                  {proprietario?.nome || imovel.proprietarioNome || 'Carlos Alberto Siqueira'}
                </span>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-0.5">
                  <Phone className="w-3 h-3" />
                  {proprietario?.telefone || '(19) 99781-2345'}
                </span>
              </div>

              {/* Registro e Matrícula */}
              <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1 mb-1">
                  <FileCheck className="w-3 h-3 text-blue-500" />
                  Cartório / Matrícula & IPTU
                </span>
                {modoEdicao ? (
                  <div className="space-y-1">
                    <input
                      type="text"
                      value={matricula}
                      onChange={e => setMatricula(e.target.value)}
                      placeholder="Ex: Matrícula nº 41.820 RGI"
                      className="w-full p-1 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded text-[11px]"
                    />
                    <input
                      type="text"
                      value={iptu}
                      onChange={e => setIptu(e.target.value)}
                      placeholder="Ex: ITR/IPTU em dia"
                      className="w-full p-1 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded text-[11px]"
                    />
                  </div>
                ) : (
                  <>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                      {matricula || imovel.matricula || 'Matrícula regularizada'}
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      {iptu || imovel.iptuItr || 'Tributos em dia'}
                    </span>
                  </>
                )}
              </div>

              {/* Financiamento */}
              <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1 mb-1">
                  <Building className="w-3 h-3 text-emerald-500" />
                  Financiamento Bancário
                </span>
                {modoEdicao ? (
                  <select
                    value={financiamento ? 'sim' : 'nao'}
                    onChange={e => setFinanciamento(e.target.value === 'sim')}
                    className="w-full p-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded text-xs font-bold"
                  >
                    <option value="sim">Sim, Aceita Financiamento</option>
                    <option value="nao">Não, Apenas à Vista / Permuta</option>
                  </select>
                ) : (
                  <>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 block">
                      {financiamento ? 'Aceita Financiamento Bancário' : 'Somente à Vista / Permuta'}
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      Documentação apta
                    </span>
                  </>
                )}
              </div>

              {/* Taxa de Administração de Locação & Repasse */}
              {imovel.finalidade === 'locacao' && (
                <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 sm:col-span-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1 mb-1">
                    <FileCheck className="w-3 h-3 text-purple-500" />
                    Contrato de Locação & Taxa de Administração
                  </span>
                  {modoEdicao ? (
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-slate-600 dark:text-slate-400">Taxa ADM da Imobiliária (%):</label>
                      <input
                        type="number"
                        min="1"
                        max="30"
                        value={taxaAdm}
                        onChange={e => setTaxaAdm(Number(e.target.value))}
                        className="w-20 p-1 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded text-xs font-bold"
                      />
                      <span className="text-xs text-slate-500">% (Padrão: 10%)</span>
                    </div>
                  ) : (
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div>
                        <span className="font-bold text-purple-600 dark:text-purple-400">
                          Taxa Imobiliária: {taxaAdm}% (R$ {((Number(valor || imovel.valor) * taxaAdm) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })})
                        </span>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          Repasse Líquido ao Proprietário: <strong>R$ {((Number(valor || imovel.valor) * (100 - taxaAdm)) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
                        </p>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-700 dark:text-purple-300 font-mono text-[10px] font-bold">
                        Repasse todo dia 15
                      </span>
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>

        </div>

        {/* Rodapé do Modal */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between sticky bottom-0 z-20">
          <div className="flex gap-2">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir Ficha</span>
            </button>
            
            {modoEdicao && (
              <button
                onClick={handleSalvarEdicao}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-500 shadow-md transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>Salvar Ficha & Fotos</span>
              </button>
            )}
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold text-xs transition-colors"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
};
