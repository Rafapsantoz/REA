import React from 'react';
import { Building2, ShieldCheck, PhoneCall, Sun, Moon } from 'lucide-react';

interface NavbarProps {
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ theme, onToggleTheme }) => {
  return (
    <header className="sticky top-0 z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Marca */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-600 to-red-700 flex items-center justify-center shadow-lg shadow-rose-900/30 text-white font-bold">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg text-slate-900 dark:text-white tracking-tight">MANOEL JERÔNIMO</span>
                <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400 border border-rose-500/20 dark:border-rose-500/30">
                  CRECI 278536
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <span>Inteligência Imobiliária</span>
                <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600"></span>
                <span>Mococa/SP</span>
              </p>
            </div>
          </div>

          {/* Botão de Tema + Contato / Status */}
          <div className="flex items-center space-x-3">
            
            {/* Botão de Seleção de Tema (Claro / Escuro) */}
            <button
              onClick={onToggleTheme}
              title={`Alternar para tema ${theme === 'dark' ? 'claro' : 'escuro'}`}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-all flex items-center gap-1.5 text-xs font-semibold"
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-4 h-4 text-amber-400" />
                  <span className="hidden md:inline text-[11px]">Tema Claro</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-slate-700" />
                  <span className="hidden md:inline text-[11px]">Tema Escuro</span>
                </>
              )}
            </button>

            <div className="hidden lg:flex items-center space-x-4 pl-2 border-l border-slate-200 dark:border-slate-800">
              <div className="text-right">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Plantão Telefônico</span>
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center justify-end gap-1">
                  <PhoneCall className="w-3 h-3 text-emerald-500" />
                  (19) 99303-0194
                </span>
              </div>
              <div className="flex items-center space-x-1.5 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-500/20">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span className="font-medium">Nuvem RPsecti</span>
              </div>
            </div>

          </div>

        </div>
      </div>
    </header>
  );
};
