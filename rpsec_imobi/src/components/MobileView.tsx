import React, { useState } from 'react';
import { 
  Search, 
  Phone, 
  PhoneCall, 
  User, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Calendar, 
  Plus, 
  Share2, 
  Home, 
  SlidersHorizontal,
  ChevronRight,
  RotateCcw
} from 'lucide-react';
import { Cliente, Imovel, VisitaLead } from '../types';
import { useToast } from './Toast';

interface MobileViewProps {
  clientes: Cliente[];
  imoveis: Imovel[];
  visitas: VisitaLead[];
  onUpdateVisitaStatus: (id: string, status: VisitaLead['status']) => void;
  onAddClienteNota: (clienteId: string, nota: string) => void;
  onUpdateImovelStatus: (id: number, status: Imovel['status']) => void;
}

export const MobileView: React.FC<MobileViewProps> = ({
  clientes,
  imoveis,
  visitas,
  onUpdateVisitaStatus,
  onAddClienteNota,
  onUpdateImovelStatus
}) => {
  const { showToast } = useToast();
  const [mobileTab, setMobileTab] = useState<'busca' | 'imoveis' | 'visitas' | 'ajustes'>('busca');
  const [searchQuery, setSearchQuery] = useState<string>('19997812345');
  const [novaNotaTexto, setNovaNotaTexto] = useState('');
  const [filtroTipo, setFiltroTipo] = useState<'todos' | 'proprietario' | 'locatario' | 'comprador'>('todos');
  const [selectedImovelAjuste, setSelectedImovelAjuste] = useState<number>(imoveis[0]?.id || 430);

  // Filtragem ágil
  const filteredClientes = clientes.filter(c => {
    const matchesQuery = 
      c.telefoneLimpo.includes(searchQuery.replace(/\D/g, '')) ||
      c.telefone.includes(searchQuery) ||
      c.nome.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (filtroTipo === 'todos') return matchesQuery;
    return matchesQuery && c.tipo === filtroTipo;
  });

  const activeCliente = filteredClientes[0] || clientes[0];
  const imoveisDoCliente = imoveis.filter(i => activeCliente?.imoveisVinculadosIds.includes(i.id));

  const handleAdicionarNotaRapida = (e: React.FormEvent) => {
    e.preventDefault();
    if (!novaNotaTexto.trim() || !activeCliente) return;
    onAddClienteNota(activeCliente.id, `📱 [Campo] ${novaNotaTexto.trim()}`);
    setNovaNotaTexto('');
    showToast('Nota de campo registrada com sucesso!', 'success');
  };

  return (
    <div className="flex flex-col items-center justify-center py-2">
      
      {/* Banner de Apresentação da Versão Mobile */}
      <div className="w-full max-w-md mb-4 bg-emerald-950/40 border border-emerald-800/40 p-3.5 rounded-2xl flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 text-emerald-300">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span><strong>Modo Corretor na Rua:</strong> Consulta instantânea por telefone & ajustes rápidos.</span>
        </div>
        <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-bold px-2 py-0.5 rounded">
          Mobile First
        </span>
      </div>

      {/* Moldura de Smartphone (Mockup Realista) */}
      <div className="w-full max-w-[390px] h-[780px] bg-slate-950 rounded-[44px] border-[10px] border-slate-800 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col relative">
        
        {/* Dynamic Island / Notch */}
        <div className="w-full h-7 bg-slate-950 flex items-center justify-between px-7 pt-2 select-none z-30">
          <span className="text-[11px] font-bold text-slate-300">09:41</span>
          <div className="w-20 h-4 bg-slate-900 rounded-full flex items-center justify-center">
            <div className="w-2.5 h-2.5 rounded-full bg-slate-950 border border-slate-800"></div>
          </div>
          <div className="flex items-center gap-1 text-slate-300">
            <span className="text-[9px] font-bold">5G</span>
            <div className="w-4 h-2 rounded-sm border border-slate-400 p-0.5 flex">
              <div className="h-full w-full bg-emerald-400"></div>
            </div>
          </div>
        </div>

        {/* Topo do App Mobile */}
        <div className="bg-slate-900 border-b border-slate-800/80 px-4 py-2.5 flex items-center justify-between z-20">
          <div>
            <span className="text-[10px] uppercase font-bold text-rose-500 tracking-wider">Manoel Jerônimo</span>
            <h2 className="text-xs font-black text-white">Dossiê do Cliente</h2>
          </div>
          <a
            href="tel:19993030194"
            className="flex items-center gap-1 px-2 py-1 rounded-full bg-slate-800 text-[10px] font-semibold text-slate-300 border border-slate-700"
          >
            <PhoneCall className="w-3 h-3 text-emerald-400" />
            Plantão
          </a>
        </div>

        {/* Corpo com Scroll do Mobile */}
        <div className="flex-1 overflow-y-auto p-3.5 space-y-4 pb-20 text-slate-200">
          
          {/* ─────────────────────────────────────────────────────────────
              ABA MOBILE 1: PESQUISA RÁPIDA & DOSSIÊ POR TELEFONE
          ───────────────────────────────────────────────────────────── */}
          {mobileTab === 'busca' && (
            <div className="space-y-3.5">
              
              {/* Input de Busca Mobile */}
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Mude o número: (19) 99781..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
                />
              </div>

              {/* Botões Rápidos de Troca de Número (Para impressionar na reunião) */}
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1.5">
                  Trocar Número Rápido:
                </span>
                <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                  <button
                    onClick={() => setSearchQuery('19997812345')}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold whitespace-nowrap transition-all ${
                      searchQuery.includes('99781')
                        ? 'bg-rose-600 text-white'
                        : 'bg-slate-900 text-slate-400 border border-slate-800'
                    }`}
                  >
                    Carlos (Proprietário)
                  </button>
                  <button
                    onClick={() => setSearchQuery('19988776655')}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold whitespace-nowrap transition-all ${
                      searchQuery.includes('98877')
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-900 text-slate-400 border border-slate-800'
                    }`}
                  >
                    Mariana (Inquilina)
                  </button>
                  <button
                    onClick={() => setSearchQuery('19996554433')}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold whitespace-nowrap transition-all ${
                      searchQuery.includes('99655')
                        ? 'bg-amber-600 text-white'
                        : 'bg-slate-900 text-slate-400 border border-slate-800'
                    }`}
                  >
                    Fernanda (Atraso)
                  </button>
                  <button
                    onClick={() => setSearchQuery('19991223344')}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold whitespace-nowrap transition-all ${
                      searchQuery.includes('99122')
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-900 text-slate-400 border border-slate-800'
                    }`}
                  >
                    Roberto (Comprador)
                  </button>
                </div>
              </div>

              {/* Card Dossiê 360° do Cliente */}
              {activeCliente ? (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3.5 shadow-lg">
                  
                  {/* Cabeçalho do Cliente */}
                  <div className="flex items-start justify-between">
                    <div>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase ${
                        activeCliente.tipo === 'proprietario'
                          ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                          : activeCliente.tipo === 'locatario'
                          ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}>
                        {activeCliente.tipo}
                      </span>
                      <h3 className="text-sm font-black text-white mt-1">{activeCliente.nome}</h3>
                      <p className="text-[11px] text-slate-400 font-mono">{activeCliente.telefone}</p>
                    </div>
                    
                    <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-1 rounded-lg border border-slate-700">
                      {activeCliente.corretorResponsavel}
                    </span>
                  </div>

                  {/* Ações Rápidas: WhatsApp & Ligar */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <a
                      href={`https://wa.me/55${activeCliente.telefoneLimpo}?text=Ol%C3%A1%20${encodeURIComponent(activeCliente.nome)},%20sou%20da%20Manoel%20Jer%C3%B4nimo%20Im%C3%B3veis!`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all"
                    >
                      <span>🟢 WhatsApp</span>
                    </a>
                    <a
                      href={`tel:${activeCliente.telefoneLimpo}`}
                      className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition-all"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>Ligar</span>
                    </a>
                  </div>

                  {/* Situação Financeira / Aluguel (Se Locatário) */}
                  {activeCliente.contratoAtivo && (
                    <div className={`p-3 rounded-xl border text-xs ${
                      activeCliente.contratoAtivo.statusPagamento === 'atrasado'
                        ? 'bg-amber-950/30 border-amber-800/60'
                        : 'bg-emerald-950/30 border-emerald-800/60'
                    }`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-[11px] text-slate-300">Situação do Aluguel:</span>
                        <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded ${
                          activeCliente.contratoAtivo.statusPagamento === 'atrasado'
                            ? 'bg-amber-500/20 text-amber-300'
                            : 'bg-emerald-500/20 text-emerald-300'
                        }`}>
                          {activeCliente.contratoAtivo.statusPagamento === 'atrasado' ? '⚠️ Boleto Atrasado' : '✅ Pago em Dia'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Vence dia <strong>{activeCliente.contratoAtivo.vencimentoDia}</strong> • R$ {activeCliente.contratoAtivo.valor.toLocaleString('pt-BR')} /mês
                      </p>
                    </div>
                  )}

                  {/* Imóveis do Cliente */}
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-2">
                      Imóveis ({imoveisDoCliente.length})
                    </span>

                    <div className="space-y-2">
                      {imoveisDoCliente.map(imovel => (
                        <div key={imovel.id} className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                          <div className="truncate max-w-[200px]">
                            <span className="font-bold text-xs text-white block truncate">{imovel.codigo} - {imovel.titulo}</span>
                            <span className="text-[10px] text-slate-400">{imovel.bairro}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-black text-emerald-400 block">
                              R$ {imovel.valor.toLocaleString('pt-BR')}
                            </span>
                            <span className="text-[9px] uppercase font-bold text-slate-400">{imovel.status}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Histórico / Anotação */}
                  <div className="pt-2 border-t border-slate-800/80">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Última Nota:</span>
                    <p className="text-[11px] text-slate-300 bg-slate-950/80 p-2 rounded-lg border border-slate-800">
                      {activeCliente.notas[0] || 'Nenhuma anotação recente.'}
                    </p>
                  </div>

                </div>
              ) : (
                <div className="p-6 text-center text-xs text-slate-400 bg-slate-900 rounded-2xl border border-slate-800">
                  Nenhum cliente encontrado com esse número.
                </div>
              )}

            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────
              ABA MOBILE 2: CARTEIRA DE IMÓVEIS (VISUALIZAÇÃO RÁPIDA)
          ───────────────────────────────────────────────────────────── */}
          {mobileTab === 'imoveis' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">Imóveis em Destaque</span>
                <span className="text-[10px] text-slate-400">{imoveis.length} cadastrados</span>
              </div>

              {imoveis.map(imovel => (
                <div key={imovel.id} className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                  <div className="h-28 relative">
                    <img src={imovel.foto} alt={imovel.titulo} className="w-full h-full object-cover" />
                    <span className="absolute top-2 left-2 bg-slate-950/80 text-[9px] font-bold text-white px-2 py-0.5 rounded">
                      {imovel.codigo}
                    </span>
                    <span className="absolute top-2 right-2 bg-emerald-600 text-[9px] font-bold text-white px-2 py-0.5 rounded uppercase">
                      {imovel.status}
                    </span>
                  </div>
                  <div className="p-3">
                    <span className="text-[10px] text-slate-400">{imovel.bairro} • {imovel.area}</span>
                    <h4 className="text-xs font-bold text-white line-clamp-1">{imovel.titulo}</h4>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-xs font-black text-emerald-400">
                        R$ {imovel.valor.toLocaleString('pt-BR')}
                      </span>
                      <span className="text-[10px] text-slate-400 capitalize">{imovel.finalidade}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────
              ABA MOBILE 3: VISITAS DO DIA (CAMPO)
          ───────────────────────────────────────────────────────────── */}
          {mobileTab === 'visitas' && (
            <div className="space-y-3">
              <span className="text-xs font-bold text-white block">Atendimentos & Visitas Agendadas</span>

              {visitas.map(vis => (
                <div key={vis.id} className="bg-slate-900 border border-slate-800 p-3 rounded-2xl space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] text-rose-400 font-bold">{vis.data} às {vis.horario}</span>
                      <h4 className="text-xs font-bold text-white">{vis.clienteNome}</h4>
                      <p className="text-[10px] text-slate-400">{vis.imovelTitulo}</p>
                    </div>
                    <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded ${
                      vis.status === 'proposta_enviada'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-blue-500/20 text-blue-400'
                    }`}>
                      {vis.status.replace('_', ' ')}
                    </span>
                  </div>

                  <p className="text-[10px] text-slate-300 bg-slate-950 p-2 rounded-lg border border-slate-800/80">
                    "{vis.observacoes}"
                  </p>

                  {/* Pequeno Ajuste Rápido: Mudar Status da Visita */}
                  <div className="pt-1 flex items-center justify-between text-[10px]">
                    <span className="text-slate-400">Ajuste rápido:</span>
                    <div className="flex gap-1">
                      <button
                        onClick={() => onUpdateVisitaStatus(vis.id, 'realizada')}
                        className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
                      >
                        ✓ Feita
                      </button>
                      <button
                        onClick={() => onUpdateVisitaStatus(vis.id, 'proposta_enviada')}
                        className="px-2 py-0.5 rounded bg-emerald-900/60 hover:bg-emerald-800 text-emerald-300 border border-emerald-700"
                      >
                        📄 Proposta
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────
              ABA MOBILE 4: PEQUENOS AJUSTES (SEM CADASTROS PESADOS)
          ───────────────────────────────────────────────────────────── */}
          {mobileTab === 'ajustes' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-xs font-bold text-white">Pequenos Ajustes Rápidos</h3>
                <p className="text-[10px] text-slate-400">Cadastros completos são feitos no Desktop.</p>
              </div>

              {/* Ajuste 1: Adicionar Nota de Campo no Cliente Ativo */}
              <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-2xl space-y-2.5">
                <span className="text-[11px] font-bold text-slate-200 flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5 text-emerald-400" />
                  Nota Rápida em {activeCliente?.nome}
                </span>

                <form onSubmit={handleAdicionarNotaRapida} className="space-y-2">
                  <textarea
                    rows={2}
                    value={novaNotaTexto}
                    onChange={(e) => setNovaNotaTexto(e.target.value)}
                    placeholder="Ex: Cliente visitou o sítio, adorou as nascentes e fará proposta amanhã..."
                    className="w-full p-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
                  />
                  <button
                    type="submit"
                    className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-all"
                  >
                    Salvar Nota de Campo
                  </button>
                </form>
              </div>

              {/* Ajuste 2: Alterar Disponibilidade do Imóvel na Rua */}
              <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-2xl space-y-2.5">
                <span className="text-[11px] font-bold text-slate-200 flex items-center gap-1.5">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-blue-400" />
                  Atualizar Status de Imóvel
                </span>

                <select
                  value={selectedImovelAjuste}
                  onChange={(e) => setSelectedImovelAjuste(Number(e.target.value))}
                  className="w-full p-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
                >
                  {imoveis.map(im => (
                    <option key={im.id} value={im.id}>
                      {im.codigo} - {im.titulo.substring(0, 30)}...
                    </option>
                  ))}
                </select>

                <div className="grid grid-cols-2 gap-1.5 text-xs">
                  <button
                    onClick={() => { onUpdateImovelStatus(selectedImovelAjuste, 'reservado'); showToast('Status alterado para RESERVADO!', 'info'); }}
                    className="py-1.5 px-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg text-[10px]"
                  >
                    Marcar Reservado
                  </button>
                  <button
                    onClick={() => { onUpdateImovelStatus(selectedImovelAjuste, 'disponivel'); showToast('Status alterado para DISPONÍVEL!', 'success'); }}
                    className="py-1.5 px-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-[10px]"
                  >
                    Marcar Disponível
                  </button>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Bottom Tab Bar do Smartphone */}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 flex items-center justify-around px-2 z-30">
          <button
            onClick={() => setMobileTab('busca')}
            className={`flex flex-col items-center py-1 transition-all ${
              mobileTab === 'busca' ? 'text-rose-500 font-bold' : 'text-slate-400'
            }`}
          >
            <Search className="w-4 h-4" />
            <span className="text-[10px] mt-0.5">Buscar</span>
          </button>

          <button
            onClick={() => setMobileTab('imoveis')}
            className={`flex flex-col items-center py-1 transition-all ${
              mobileTab === 'imoveis' ? 'text-rose-500 font-bold' : 'text-slate-400'
            }`}
          >
            <Home className="w-4 h-4" />
            <span className="text-[10px] mt-0.5">Imóveis</span>
          </button>

          <button
            onClick={() => setMobileTab('visitas')}
            className={`flex flex-col items-center py-1 transition-all ${
              mobileTab === 'visitas' ? 'text-rose-500 font-bold' : 'text-slate-400'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span className="text-[10px] mt-0.5">Visitas</span>
          </button>

          <button
            onClick={() => setMobileTab('ajustes')}
            className={`flex flex-col items-center py-1 transition-all ${
              mobileTab === 'ajustes' ? 'text-rose-500 font-bold' : 'text-slate-400'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span className="text-[10px] mt-0.5">Ajustes</span>
          </button>
        </div>

        {/* Home Indicator Bar */}
        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-32 h-1 bg-slate-700 rounded-full z-40"></div>

      </div>

    </div>
  );
};
