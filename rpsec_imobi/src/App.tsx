import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { DesktopView } from './components/DesktopView';
import { MobileView } from './components/MobileView';
import { INITIAL_CLIENTES, INITIAL_IMOVEIS, INITIAL_VISITAS } from './mockData';
import { INITIAL_CONTRATOS } from './mockContratos';
import { Cliente, Imovel, VisitaLead, ContratoLocacaoCompleto } from './types';
import { Sparkles, CheckCircle2 } from 'lucide-react';
import { ToastProvider } from './components/Toast';

export function App() {
  const [currentView, setCurrentView] = useState<'desktop' | 'mobile'>('desktop');
  const [clientes, setClientes] = useState<Cliente[]>(INITIAL_CLIENTES);
  const [imoveis, setImoveis] = useState<Imovel[]>(INITIAL_IMOVEIS);
  const [visitas, setVisitas] = useState<VisitaLead[]>(INITIAL_VISITAS);
  const [contratos, setContratos] = useState<ContratoLocacaoCompleto[]>(INITIAL_CONTRATOS);

  // Gerenciamento de Tema (Claro / Escuro) com persistência
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('rpsec_imobi_theme');
    if (saved === 'light' || saved === 'dark') return saved;
    return 'dark'; // Padrão escuro sofisticado
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('rpsec_imobi_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const handleAddImovel = (novo: Imovel) => {
    setImoveis(prev => [novo, ...prev]);
  };

  const handleUpdateImovel = (imovelAtualizado: Imovel) => {
    setImoveis(prev => prev.map(im => im.id === imovelAtualizado.id ? imovelAtualizado : im));
  };

  const handleAddCliente = (novo: Cliente) => {
    setClientes(prev => [novo, ...prev]);
  };

  const handleUpdateImovelStatus = (id: number, status: Imovel['status']) => {
    setImoveis(prev => prev.map(im => im.id === id ? { ...im, status } : im));
  };

  const handleUpdateClienteStatus = (id: string, status: Cliente['statusAtendimento']) => {
    setClientes(prev => prev.map(c => c.id === id ? { ...c, statusAtendimento: status } : c));
  };

  const handleUpdateVisitaStatus = (id: string, status: VisitaLead['status']) => {
    setVisitas(prev => prev.map(v => v.id === id ? { ...v, status } : v));
  };

  const handleAddClienteNota = (clienteId: string, nota: string) => {
    setClientes(prev => prev.map(c => {
      if (c.id === clienteId) {
        return {
          ...c,
          notas: [nota, ...c.notas]
        };
      }
      return c;
    }));
  };

  const handleUpdateContrato = (contratoAtualizado: ContratoLocacaoCompleto) => {
    setContratos(prev => prev.map(c => c.id === contratoAtualizado.id ? contratoAtualizado : c));
  };

  const handleAddContrato = (novoContrato: ContratoLocacaoCompleto) => {
    setContratos(prev => [novoContrato, ...prev]);
  };

  return (
    <ToastProvider>
      <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-200">
        {/* Top Navigation com Botão de Tema */}
        <Navbar 
          currentView={currentView} 
          onViewChange={setCurrentView}
          theme={theme}
          onToggleTheme={toggleTheme}
        />

        {/* Main Content Area */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {currentView === 'desktop' ? (
            <DesktopView
              clientes={clientes}
              imoveis={imoveis}
              visitas={visitas}
              contratos={contratos}
              onAddImovel={handleAddImovel}
              onAddCliente={handleAddCliente}
              onUpdateImovelStatus={handleUpdateImovelStatus}
              onUpdateClienteStatus={handleUpdateClienteStatus}
              onUpdateImovel={handleUpdateImovel}
              onUpdateContrato={handleUpdateContrato}
              onAddContrato={handleAddContrato}
            />
          ) : (
            <MobileView
              clientes={clientes}
              imoveis={imoveis}
              visitas={visitas}
              onUpdateVisitaStatus={handleUpdateVisitaStatus}
              onAddClienteNota={handleAddClienteNota}
              onUpdateImovelStatus={handleUpdateImovelStatus}
            />
          )}
        </main>

        {/* Footer com Roteiro da Proposta Comercial RPsecti */}
        <footer className="border-t border-slate-200 dark:border-slate-900 bg-white dark:bg-slate-950/80 py-4 px-4 text-center text-xs text-slate-500 dark:text-slate-400 transition-colors duration-200">
          <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
              <Sparkles className="w-4 h-4 text-rose-500" />
              <span><strong>Proposta Reunião Sábado:</strong> Criação R$ 990 a R$ 1.200 + R$ 490/mês</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-[11px]">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>Sem licenças por usuário • Hospedagem na Nuvem RPsecti • PWA no Celular</span>
            </div>
          </div>
        </footer>
      </div>
    </ToastProvider>
  );
}

export default App;
