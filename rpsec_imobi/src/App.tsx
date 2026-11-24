import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { DesktopView } from './components/DesktopView';
import { AdminView } from './components/AdminView';
import { LoginView } from './components/LoginView';
import { INITIAL_CLIENTES, INITIAL_IMOVEIS, INITIAL_VISITAS } from './mockData';
import { INITIAL_CONTRATOS } from './mockContratos';
import { INITIAL_CORRETORES } from './mockCorretores';
import { Cliente, Imovel, VisitaLead, ContratoLocacaoCompleto, Corretor, DadosImobiliaria } from './types';
import { ToastProvider } from './components/Toast';

const DEFAULT_DADOS_EMPRESA: DadosImobiliaria = {
  nomeFantasia: 'Manoel Jerônimo Imóveis',
  creci: '278536-J',
  regiaoCreci: '2ª Região / SP',
  email: 'manoel.jeronimo@imobiliariajeronimo.com.br',
  telefone: '(19) 99303-0194',
  cidade: 'Mococa / SP',
  observacaoSede: 'Atendimento regional'
};

export function App() {
  // Controle de Sessão de Acesso / Demonstração Privada
  const [usuarioLogado, setUsuarioLogado] = useState<{ nome: string; email: string; cargo: string; avatar: string } | null>(() => {
    const savedLocal = localStorage.getItem('rpsec_auth_session');
    if (savedLocal) {
      try {
        return JSON.parse(savedLocal);
      } catch (e) {
        console.error('Falha ao restaurar sessão local:', e);
      }
    }
    const savedSession = sessionStorage.getItem('rpsec_auth_session');
    if (savedSession) {
      try {
        return JSON.parse(savedSession);
      } catch (e) {
        console.error('Falha ao restaurar sessão temporária:', e);
      }
    }
    return null;
  });

  const handleLogout = () => {
    localStorage.removeItem('rpsec_auth_session');
    sessionStorage.removeItem('rpsec_auth_session');
    setUsuarioLogado(null);
  };

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

  // Dados institucionais da imobiliária com persistência local
  const [dadosEmpresa, setDadosEmpresa] = useState<DadosImobiliaria>(() => {
    const saved = localStorage.getItem('rpsec_imobi_empresa');
    if (saved) {
      try {
        return { ...DEFAULT_DADOS_EMPRESA, ...JSON.parse(saved) };
      } catch (e) {
        console.error('Falha ao restaurar dados da imobiliária:', e);
      }
    }
    return DEFAULT_DADOS_EMPRESA;
  });

  useEffect(() => {
    localStorage.setItem('rpsec_imobi_empresa', JSON.stringify(dadosEmpresa));
  }, [dadosEmpresa]);

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

  const handleDeleteContrato = (id: string) => {
    setContratos(prev => prev.filter(c => c.id !== id));
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

  // Se não estiver logado, exibe a tela de login exclusiva da imobiliária
  if (!usuarioLogado) {
    return (
      <ToastProvider>
        <LoginView 
          onLoginSuccess={setUsuarioLogado} 
          theme={theme}
          onToggleTheme={toggleTheme}
        />
      </ToastProvider>
    );
  }

  return (
    <ToastProvider>
      <div className="min-h-screen bg-[#F7F6F2] dark:bg-[#0D1014] text-[#141619] dark:text-[#F1F3F5] flex flex-col transition-colors duration-200">
        {/* Top Navigation com Abas de Contratos & Administração */}
        <Navbar 
          theme={theme}
          onToggleTheme={toggleTheme}
          currentTab={currentTab}
          onTabChange={setCurrentTab}
          totalCorretores={corretores.length}
          usuarioLogado={usuarioLogado}
          onLogout={handleLogout}
          dadosEmpresa={dadosEmpresa}
        />

        {/* Main Content Area */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
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
              onDeleteContrato={handleDeleteContrato}
            />
          )}

          {currentTab === 'admin' && (
            <AdminView
              corretores={corretores}
              contratos={contratos}
              dadosEmpresa={dadosEmpresa}
              onUpdateDadosEmpresa={setDadosEmpresa}
              onAddCorretor={handleAddCorretor}
              onUpdateCorretor={handleUpdateCorretor}
              onDeleteCorretor={handleDeleteCorretor}
            />
          )}
        </main>

        {/* Rodapé Institucional */}
        <footer className="border-t border-[#E2DFD7] dark:border-[#252B37] bg-white dark:bg-[#151921] py-4 px-4 sm:px-6 text-xs text-[#525866] dark:text-slate-400 transition-colors duration-200">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-1 font-medium">
              <span>© {new Date().getFullYear()} {dadosEmpresa.nomeFantasia} (CRECI {dadosEmpresa.creci})</span>
              <span className="hidden sm:inline text-[#E2DFD7] dark:text-[#252B37]">|</span>
              <span>{dadosEmpresa.cidade} — Plantão {dadosEmpresa.telefone}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span>Desenvolvido por</span>
              <strong className="text-[#141619] dark:text-slate-200 font-semibold">RPsecti Soluções Inteligentes</strong>
            </div>
          </div>
        </footer>
      </div>
    </ToastProvider>
  );
}

export default App;
