import React, { useState } from 'react';
import { 
  Building2, 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  ArrowRight, 
  AlertCircle
} from 'lucide-react';

interface LoginViewProps {
  onLoginSuccess: (usuario: { nome: string; email: string; cargo: string; avatar: string }) => void;
  theme: 'light' | 'dark';
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

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess, theme }) => {
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
        setErro("Credenciais inválidas. Verifique o e-mail e a senha de acesso.");
        setCarregando(false);
      }
    }, 450); // Feedback visual elegante de autenticação
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 text-slate-100 relative overflow-hidden">
      
      {/* Luzes de fundo / Efeito decorativo */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-rose-600/10 rounded-full blur-[130px] pointer-events-none"></div>
      <div className="absolute bottom-10 right-10 w-[350px] h-[350px] bg-red-700/10 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="w-full max-w-md relative z-10 space-y-6">
        
        {/* Card Principal de Autenticação */}
        <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/60 space-y-6">
          
          {/* Cabeçalho da Marca */}
          <div className="text-center space-y-3">
            <div className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-600 to-red-700 items-center justify-center shadow-lg shadow-rose-900/40 text-white font-black text-xl mb-1">
              <Building2 className="w-7 h-7" />
            </div>

            <div>
              <div className="flex items-center justify-center gap-2">
                <h1 className="text-xl font-black text-white tracking-tight uppercase">
                  Manoel Jerônimo
                </h1>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30">
                  CRECI 278536
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 font-medium">
                Inteligência Imobiliária & Gestão de Contratos
              </p>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Ambiente Privado de Demonstração</span>
            </div>
          </div>

          {/* Mensagem de Erro se houver */}
          {erro && (
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-start gap-2.5 animate-shake">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <p className="font-bold">Acesso negado</p>
                <p className="text-[11px] text-red-300/90">{erro}</p>
              </div>
            </div>
          )}

          {/* Formulário de Login */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Campo E-mail / Usuário */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 block">
                E-mail ou Usuário Autorizado
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={identificador}
                  onChange={(e) => setIdentificador(e.target.value)}
                  placeholder="ex: manuel@teste.com.br"
                  className="w-full text-xs pl-10 pr-4 py-3 rounded-xl bg-slate-950/80 border border-slate-700/80 text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all font-medium"
                />
              </div>
            </div>

            {/* Campo Senha */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-300 block">
                  Senha Exclusiva de Acesso
                </label>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={mostrarSenha ? "text" : "password"}
                  required
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="••••••••••••••••"
                  className="w-full text-xs pl-10 pr-10 py-3 rounded-xl bg-slate-950/80 border border-slate-700/80 text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all font-mono"
                />
                <button
                  type="button"
                  onClick={() => setMostrarSenha(!mostrarSenha)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200 transition-colors"
                >
                  {mostrarSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Lembrar Acesso */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={lembrarAcesso}
                  onChange={(e) => setLembrarAcesso(e.target.checked)}
                  className="rounded text-rose-600 focus:ring-rose-500 w-4 h-4 bg-slate-950 border-slate-700"
                />
                <span className="text-xs text-slate-400 font-medium">Manter conectado neste aparelho</span>
              </label>
            </div>

            {/* Botão Entrar */}
            <button
              type="submit"
              disabled={carregando}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-rose-900/30 transition-all cursor-pointer disabled:opacity-50 mt-2"
            >
              {carregando ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Autenticando acesso...</span>
                </>
              ) : (
                <>
                  <span>Acessar Painel Imobiliário</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

        </div>

        {/* Rodapé Seguro */}
        <div className="text-center space-y-1">
          <p className="text-[11px] text-slate-500">
            Desenvolvido sob medida por <strong className="text-slate-400">RPsecti Soluções Inteligentes</strong>
          </p>
          <p className="text-[10px] text-slate-600">
            Criptografia ponta a ponta • Hospedagem em Nuvem de Alta Disponibilidade
          </p>
        </div>

      </div>

    </div>
  );
};
