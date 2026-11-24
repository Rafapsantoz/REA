import React from 'react';
import { Sun, Moon, FileText, Shield, LogOut } from 'lucide-react';
import { DadosImobiliaria } from '../types';

interface NavbarProps {
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  currentTab: 'contratos' | 'admin';
  onTabChange: (tab: 'contratos' | 'admin') => void;
  totalCorretores?: number;
  usuarioLogado?: { nome: string; email: string; cargo: string; avatar: string } | null;
  onLogout?: () => void;
  dadosEmpresa?: DadosImobiliaria;
}

export const Navbar: React.FC<NavbarProps> = ({
  theme,
  onToggleTheme,
  currentTab,
  onTabChange,
  totalCorretores = 0,
  usuarioLogado,
  onLogout,
  dadosEmpresa
}) => {
  const nomeEmpresa = dadosEmpresa?.nomeFantasia || 'Manoel Jerônimo';
  const creciEmpresa = dadosEmpresa?.creci || '278536';
  const iniciais = nomeEmpresa
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(p => p.charAt(0).toUpperCase())
    .join('') || 'MJ';

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-[#151921]/95 backdrop-blur-md border-b border-[#E2DFD7] dark:border-[#252B37] transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Identidade da Imobiliária */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-lg bg-[#B91C1C] flex items-center justify-center text-white font-display font-bold text-sm tracking-tight">
              {iniciais}
            </div>
            <div className="leading-tight">
              <div className="flex items-center gap-2">
                <span className="font-display font-bold text-base text-[#141619] dark:text-white tracking-tight truncate max-w-[180px] sm:max-w-none">
                  {nomeEmpresa}
                </span>
                <span className="hidden sm:inline-block text-xs font-semibold px-2 py-0.5 rounded bg-red-50 text-[#B91C1C] dark:bg-red-950/50 dark:text-red-300 border border-red-200 dark:border-red-900/60 tabular-nums">
                  CRECI {creciEmpresa}
                </span>
              </div>
              <p className="hidden sm:block text-xs text-[#525866] dark:text-slate-400">
                Gestão de locações
              </p>
            </div>
          </div>

          {/* Navegação Principal */}
          <nav aria-label="Navegação principal" className="flex items-center gap-1 bg-[#EFECE6] dark:bg-[#0D1014] p-1 rounded-lg border border-[#E2DFD7] dark:border-[#252B37]">
            <button
              type="button"
              onClick={() => onTabChange('contratos')}
              className={`px-3.5 py-1.5 rounded-md text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                currentTab === 'contratos'
                  ? 'bg-white dark:bg-[#1C212B] text-[#141619] dark:text-white shadow-xs'
                  : 'text-[#525866] dark:text-slate-400 hover:text-[#141619] dark:hover:text-white'
              }`}
            >
              <FileText className="w-4 h-4 text-[#B91C1C] dark:text-red-400" />
              <span>Contratos</span>
            </button>

            <button
              type="button"
              onClick={() => onTabChange('admin')}
              className={`px-3.5 py-1.5 rounded-md text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                currentTab === 'admin'
                  ? 'bg-white dark:bg-[#1C212B] text-[#141619] dark:text-white shadow-xs'
                  : 'text-[#525866] dark:text-slate-400 hover:text-[#141619] dark:hover:text-white'
              }`}
            >
              <Shield className="w-4 h-4 text-[#B91C1C] dark:text-red-400" />
              <span>Administração</span>
              <span className={`text-xs px-1.5 py-0.5 rounded tabular-nums font-bold ${
                currentTab === 'admin'
                  ? 'bg-[#B91C1C] text-white'
                  : 'bg-[#E2DFD7] dark:bg-[#252B37] text-[#141619] dark:text-slate-300'
              }`}>
                {totalCorretores}
              </span>
            </button>
          </nav>

          {/* Ações do Usuário & Tema */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button
              type="button"
              onClick={onToggleTheme}
              title={`Alternar para tema ${theme === 'dark' ? 'claro' : 'escuro'}`}
              aria-label={`Alternar para tema ${theme === 'dark' ? 'claro' : 'escuro'}`}
              className="p-2 rounded-lg bg-[#EFECE6] dark:bg-[#1C212B] text-[#525866] dark:text-slate-300 hover:text-[#141619] dark:hover:text-white border border-[#E2DFD7] dark:border-[#252B37] transition-colors flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-4 h-4 text-amber-400" />
                  <span className="hidden lg:inline">Tema claro</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-[#525866]" />
                  <span className="hidden lg:inline">Tema escuro</span>
                </>
              )}
            </button>

            {usuarioLogado && (
              <div className="flex items-center gap-2 pl-2 border-l border-[#E2DFD7] dark:border-[#252B37]">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#141619] dark:bg-[#252B37] text-white font-display font-bold flex items-center justify-center text-xs">
                    {usuarioLogado.avatar || usuarioLogado.nome.charAt(0)}
                  </div>
                  <div className="hidden md:block text-left leading-tight">
                    <span className="text-xs font-semibold text-[#141619] dark:text-slate-200 block truncate max-w-[130px]">
                      {usuarioLogado.nome}
                    </span>
                    <span className="text-xs text-[#525866] dark:text-slate-400 block truncate max-w-[130px]">
                      {usuarioLogado.cargo}
                    </span>
                  </div>
                </div>

                {onLogout && (
                  <button
                    type="button"
                    onClick={onLogout}
                    title="Sair do sistema"
                    aria-label="Sair do sistema"
                    className="p-2 text-[#525866] dark:text-slate-400 hover:text-[#B91C1C] dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
