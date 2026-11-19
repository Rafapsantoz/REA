import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { DesktopView } from './components/DesktopView';
import { AdminView } from './components/AdminView';
import { INITIAL_CLIENTES, INITIAL_IMOVEIS, INITIAL_VISITAS } from './mockData';
import { INITIAL_CONTRATOS } from './mockContratos';
import { INITIAL_CORRETORES } from './mockCorretores';
import { Cliente, Imovel, VisitaLead, ContratoLocacaoCompleto, Corretor } from './types';
import { ToastProvider } from './components/Toast';

export function App() {
  const [clientes, setClientes] = useState<Cliente[]>(INITIAL_CLIENTES);
  const [imoveis, setImoveis] = useState<Imovel[]>(INITIAL_IMOVEIS);
  const [visitas, setVisitas] = useState<VisitaLead[]>(INITIAL_VISITAS);
  const [contratos, setContratos] = useState<ContratoLocacaoCompleto[]>(INITIAL_CONTRATOS);

  // Aba Principal do Sistema: 'contratos' (Painel Operacional) ou 'admin' (Administração & Corretores)
  const [currentTab, setCurrentTab] = useState<'contratos' | 'admin'>('contratos');

  // Gestão de Corretores com persistência local
  const [corretores, setCorretores] = useState<Corretor[]>(() => {
    const saved = localStorage.getItem('rpsec_imobi_corretores');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Falha ao restaurar corretores locais:', e);
      }
    }
    return INITIAL_CORRETORES;
  });

  useEffect(() => {
    localStorage.setItem('rpsec_imobi_corretores', JSON.stringify(corretores));
  }, [corretores]);

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

  const handleUpdateContrato = (contratoAtualizado: ContratoLocacaoCompleto) => {
    setContratos(prev => prev.map(c => c.id === contratoAtualizado.id ? contratoAtualizado : c));
  };

  const handleAddContrato = (novoContrato: ContratoLocacaoCompleto) => {
    setContratos(prev => [novoContrato, ...prev]);
  };

  // Handlers de Corretores
  const handleAddCorretor = (novo: Corretor) => {
    setCorretores(prev => [novo, ...prev]);
  };

  const handleUpdateCorretor = (corretorAtualizado: Corretor) => {
    setCorretores(prev => prev.map(c => c.id === corretorAtualizado.id ? corretorAtualizado : c));
  };

  const handleDeleteCorretor = (id: string) => {
    setCorretores(prev => prev.filter(c => c.id !== id));
  };

  return (
    <ToastProvider>
      <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-200">
        {/* Top Navigation com Abas de Contratos & Administração */}
        <Navbar 
          theme={theme}
          onToggleTheme={toggleTheme}
          currentTab={currentTab}
          onTabChange={setCurrentTab}
          totalCorretores={corretores.length}
        />

        {/* Main Content Area */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {currentTab === 'contratos' && (
            <DesktopView
              clientes={clientes}
              imoveis={imoveis}
              visitas={visitas}
              contratos={contratos}
              corretores={corretores}
              onAddImovel={handleAddImovel}
              onAddCliente={handleAddCliente}
              onUpdateImovelStatus={handleUpdateImovelStatus}
              onUpdateClienteStatus={handleUpdateClienteStatus}
              onUpdateImovel={handleUpdateImovel}
              onUpdateContrato={handleUpdateContrato}
              onAddContrato={handleAddContrato}
            />
          )}

          {currentTab === 'admin' && (
            <AdminView
              corretores={corretores}
              contratos={contratos}
              onAddCorretor={handleAddCorretor}
              onUpdateCorretor={handleUpdateCorretor}
              onDeleteCorretor={handleDeleteCorretor}
            />
          )}
        </main>

        {/* Rodapé Institucional com Copyrights RPsecti */}
        <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 py-4 px-4 text-xs text-slate-500 dark:text-slate-400 transition-colors duration-200">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
            <div className="flex items-center gap-2 font-medium">
              <span>© {new Date().getFullYear()} Manoel Jerônimo Imóveis • CRECI 278536. Todos os direitos reservados.</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              <span>Desenvolvido e mantido por</span>
              <strong className="text-slate-800 dark:text-slate-200 font-bold">RPsecti Soluções Inteligentes</strong>
            </div>
          </div>
        </footer>
      </div>
    </ToastProvider>
  );
}

export default App;
