import React, { useState } from 'react';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  Sun,
  Moon
} from 'lucide-react';

interface LoginViewProps {
  onLoginSuccess: (usuario: { nome: string; email: string; cargo: string; avatar: string }) => void;
  theme: 'light' | 'dark';
  onToggleTheme?: () => void;
}

// Credenciais Autorizadas para a Demonstração Exclusiva
export const CREDENCIAIS_AUTORIZADAS = [
  {
    nome: "Manoel Jerônimo",
    cargo: "Diretor & Responsável Técnico",
    creci: "278536",
    emails: ["manuel@teste.com.br", "manuel", "manoel@teste.com.br", "manoel.jeronimo@imobiliariajeronimo.com.br"],
    senha: "ManoelJeronimo#278536@Mococa2026",
    avatar: "M"
  },
  {
    nome: "Rafael Seles",
    cargo: "Fundador & CTO RPsecti",
    creci: "RPsecti Tech",
    emails: ["rafael@rpsecti.com.br", "admin", "rafael"],
    senha: "RPsec#2026@Master",
    avatar: "R"
  }
];

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess, theme, onToggleTheme }) => {
  const [identificador, setIdentificador] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [lembrarAcesso, setLembrarAcesso] = useState(true);
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    setCarregando(true);

    setTimeout(() => {
      const idLimpo = identificador.trim().toLowerCase();
      const senhaLimpa = senha.trim();

      const usuarioEncontrado = CREDENCIAIS_AUTORIZADAS.find(
        user => user.emails.some(email => email.toLowerCase() === idLimpo) && user.senha === senhaLimpa
      );

      if (usuarioEncontrado) {
        const dadosSessao = {
          nome: usuarioEncontrado.nome,
          email: usuarioEncontrado.emails[0],
          cargo: usuarioEncontrado.cargo,
          avatar: usuarioEncontrado.avatar
        };

        if (lembrarAcesso) {
          localStorage.setItem('rpsec_auth_session', JSON.stringify(dadosSessao));
        } else {
          sessionStorage.setItem('rpsec_auth_session', JSON.stringify(dadosSessao));
        }

        onLoginSuccess(dadosSessao);
      } else {
        setErro("Credenciais inválidas. Confira o usuário e a senha informados.");
        setCarregando(false);
      }
    }, 450);
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-between p-4 sm:p-6 bg-[#F7F6F2] dark:bg-[#0D1014] text-[#141619] dark:text-[#F1F3F5] transition-colors duration-200">
      {/* Barra superior discreta com alternador de tema */}
      <div className="max-w-5xl w-full mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#B91C1C] text-white font-display font-bold text-sm flex items-center justify-center tracking-tight">
            MJ
          </div>
          <span className="font-display font-semibold text-sm tracking-tight text-[#141619] dark:text-slate-100">
            Manoel Jerônimo Imóveis
          </span>
        </div>

        {onToggleTheme && (
          <button
            type="button"
            onClick={onToggleTheme}
            aria-label={`Alternar para tema ${theme === 'dark' ? 'claro' : 'escuro'}`}
            className="px-3 py-2 rounded-lg border border-[#E2DFD7] dark:border-[#252B37] bg-white dark:bg-[#151921] text-xs font-semibold text-[#525866] dark:text-slate-300 hover:text-[#141619] dark:hover:text-white transition-colors flex items-center gap-2 cursor-pointer"
          >
            {theme === 'dark' ? (
              <>
                <Sun className="w-4 h-4 text-amber-400" />
                <span>Tema claro</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-[#525866]" />
                <span>Tema escuro</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Container Principal */}
      <div className="w-full max-w-md mx-auto my-8 animate-scale-up">
        <div className="bg-white dark:bg-[#151921] border border-[#E2DFD7] dark:border-[#252B37] rounded-xl p-6 sm:p-8 shadow-sm">
          {/* Cabeçalho da Marca */}
          <div className="border-b border-[#E2DFD7] dark:border-[#252B37] pb-5 mb-6">
            <div className="flex items-center justify-between gap-3 mb-2">
              <h1 className="font-display text-2xl font-bold tracking-tight text-[#141619] dark:text-white">
                Acesso ao sistema
              </h1>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-red-50 text-[#B91C1C] dark:bg-red-950/50 dark:text-red-300 border border-red-200 dark:border-red-900/60 tabular-nums">
                CRECI 278536
              </span>
            </div>
            <p className="text-sm text-[#525866] dark:text-slate-400 leading-relaxed">
              Gestão de contratos de locação e administração da equipe em Mococa/SP.
            </p>
          </div>

          {/* Mensagem de Erro */}
          {erro && (
            <div
              role="alert"
              className="mb-5 p-3.5 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-800 dark:text-red-200 text-sm flex items-start gap-2.5 animate-shake"
            >
              <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <p className="font-semibold">Acesso não autorizado</p>
                <p className="text-xs text-red-700 dark:text-red-300/90">{erro}</p>
              </div>
            </div>
          )}

          {/* Formulário de Login */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="login-identificador" className="text-sm font-semibold text-[#141619] dark:text-slate-200 block">
                E-mail ou usuário
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#525866] dark:text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="login-identificador"
                  type="text"
                  required
                  autoComplete="username"
                  value={identificador}
                  onChange={(e) => setIdentificador(e.target.value)}
                  placeholder="seu@email.com.br"
                  className="w-full text-sm pl-10 pr-4 py-2.5 rounded-lg bg-[#F7F6F2] dark:bg-[#0D1014] border border-[#E2DFD7] dark:border-[#252B37] text-[#141619] dark:text-white placeholder-[#525866]/60 dark:placeholder-slate-500 focus:outline-none focus:border-[#B91C1C] transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="login-senha" className="text-sm font-semibold text-[#141619] dark:text-slate-200 block">
                Senha de acesso
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#525866] dark:text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="login-senha"
                  type={mostrarSenha ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="Digite sua senha"
                  className="w-full text-sm pl-10 pr-11 py-2.5 rounded-lg bg-[#F7F6F2] dark:bg-[#0D1014] border border-[#E2DFD7] dark:border-[#252B37] text-[#141619] dark:text-white placeholder-[#525866]/60 dark:placeholder-slate-500 focus:outline-none focus:border-[#B91C1C] transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setMostrarSenha(!mostrarSenha)}
                  aria-label={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#525866] dark:text-slate-400 hover:text-[#141619] dark:hover:text-white transition-colors cursor-pointer"
                >
                  {mostrarSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={lembrarAcesso}
                  onChange={(e) => setLembrarAcesso(e.target.checked)}
                  className="rounded text-[#B91C1C] focus:ring-[#B91C1C] w-4 h-4 bg-[#F7F6F2] dark:bg-[#0D1014] border-[#E2DFD7] dark:border-[#252B37]"
                />
                <span className="text-xs text-[#525866] dark:text-slate-400 font-medium">
                  Manter conectado neste aparelho
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={carregando}
              className="w-full py-3 px-4 bg-[#B91C1C] hover:bg-[#991B1B] text-white rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50 mt-2"
            >
              {carregando ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Entrando...</span>
                </>
              ) : (
                <>
                  <span>Entrar no sistema</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Rodapé discreto */}
      <footer className="text-center text-xs text-[#525866] dark:text-slate-500">
        Desenvolvido por <strong className="text-[#141619] dark:text-slate-300 font-semibold">RPsecti Soluções Inteligentes</strong>
      </footer>
    </div>
  );
};
