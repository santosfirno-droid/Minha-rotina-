import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  CheckCircle2,
  Lock,
  Mail,
  User as UserIcon,
  ShieldQuestion,
  KeyRound,
  ArrowRight,
  Sparkles,
  HelpCircle,
} from 'lucide-react';

export const AuthModal: React.FC = () => {
  const { login, signup, recoverPassword, demoLogin, getSecurityQuestion } = useAuth();

  const [mode, setMode] = useState<'login' | 'signup' | 'recovery'>('login');

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [securityQuestion, setSecurityQuestion] = useState('Qual sua cidade natal ou primeiro animal?');
  const [securityAnswer, setSecurityAnswer] = useState('');
  const [categoryChoice, setCategoryChoice] = useState('tudo');

  // Recovery state
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoveryStep, setRecoveryStep] = useState<1 | 2>(1);
  const [foundQuestion, setFoundQuestion] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');

  // Status & error
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const res = login(email, password);
    if (!res.success) {
      setError(res.error || 'Erro ao entrar.');
    }
  };

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const res = signup(name, email, password, securityQuestion, securityAnswer, categoryChoice);
    if (!res.success) {
      setError(res.error || 'Erro ao cadastrar.');
    }
  };

  const handleFindQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const q = getSecurityQuestion(recoveryEmail);
    if (!q) {
      setError('E-mail não localizado no sistema.');
      return;
    }
    setFoundQuestion(q);
    setRecoveryStep(2);
  };

  const handleFinishRecovery = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const res = recoverPassword(recoveryEmail, securityAnswer, newPassword);
    if (!res.success) {
      setError(res.error || 'Erro ao redefinir senha.');
    } else {
      setSuccessMessage('Senha atualizada com sucesso! Agora você já pode entrar.');
      setMode('login');
      setEmail(recoveryEmail);
      setPassword('');
      setRecoveryStep(1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-100 my-auto animate-fade-in">
        {/* Brand header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-blue-500 mx-auto flex items-center justify-center text-white shadow-md shadow-blue-500/20 mb-3">
            <CheckCircle2 className="w-7 h-7 stroke-[2.5]" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Minha Rotina</h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Organize seu dia. Viva no seu ritmo.
          </p>
        </div>

        {/* Tab switch */}
        {mode !== 'recovery' && (
          <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-2xl mb-6">
            <button
              onClick={() => {
                setMode('login');
                setError('');
              }}
              className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                mode === 'login' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Entrar
            </button>
            <button
              onClick={() => {
                setMode('signup');
                setError('');
              }}
              className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                mode === 'signup' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Criar Conta
            </button>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 text-xs font-semibold rounded-xl border border-red-200">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-3 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-xl border border-emerald-200">
            {successMessage}
          </div>
        )}

        {/* ================= LOGIN FORM ================= */}
        {mode === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" /> E-mail
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu.email@exemplo.com"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-slate-400" /> Senha
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setMode('recovery');
                    setRecoveryEmail(email);
                    setError('');
                  }}
                  className="text-xs text-blue-600 hover:underline font-medium cursor-pointer"
                >
                  Esqueceu a senha?
                </button>
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md shadow-blue-500/20 transition-all cursor-pointer"
            >
              Acessar Minha Rotina
            </button>

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={demoLogin}
                className="w-full py-2.5 px-4 rounded-xl border border-blue-200 bg-blue-50/50 hover:bg-blue-50 text-blue-700 font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-blue-600" />
                <span>Entrar como Demonstração (1 Clique)</span>
              </button>
            </div>
          </form>
        )}

        {/* ================= SIGNUP FORM ================= */}
        {mode === 'signup' && (
          <form onSubmit={handleSignup} className="space-y-3.5 max-h-[70vh] overflow-y-auto pr-1">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <UserIcon className="w-3.5 h-3.5 text-slate-400" /> Nome Completo
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Seu nome ou apelido"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" /> E-mail
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu.email@exemplo.com"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-slate-400" /> Senha (mínimo 4 dígitos)
              </label>
              <input
                type="password"
                required
                minLength={4}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <ShieldQuestion className="w-3.5 h-3.5 text-slate-400" /> Pergunta de Segurança para Recuperação
              </label>
              <select
                value={securityQuestion}
                onChange={(e) => setSecurityQuestion(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Qual sua cidade natal ou primeiro animal?">Qual sua cidade natal ou primeiro animal?</option>
                <option value="Qual o nome da sua escola de infância?">Qual o nome da sua escola de infância?</option>
                <option value="Qual sua comida ou fruta favorita?">Qual sua comida ou fruta favorita?</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Sua Resposta Secreta
              </label>
              <input
                type="text"
                required
                value={securityAnswer}
                onChange={(e) => setSecurityAnswer(e.target.value)}
                placeholder="Ex: Rex, Curitiba, Melancia..."
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Foco inicial do seu dia
              </label>
              <select
                value={categoryChoice}
                onChange={(e) => setCategoryChoice(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="tudo">✨ Um pouco de tudo (Manhã, Estudos, Treino, Noite)</option>
                <option value="estudos">📚 Estudos & Foco Acadêmico</option>
                <option value="treino">🏋️ Saúde, Treino & Energia</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md shadow-blue-500/20 transition-all cursor-pointer mt-2"
            >
              Criar Conta e Começar
            </button>
          </form>
        )}

        {/* ================= PASSWORD RECOVERY ================= */}
        {mode === 'recovery' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <button
                type="button"
                onClick={() => setMode('login')}
                className="text-xs text-blue-600 hover:underline font-semibold cursor-pointer"
              >
                ← Voltar ao Login
              </button>
            </div>

            <h3 className="text-base font-bold text-slate-900">
              Recuperação de Senha
            </h3>
            <p className="text-xs text-slate-500">
              Responda sua pergunta de segurança para definir uma nova senha instantaneamente.
            </p>

            {recoveryStep === 1 ? (
              <form onSubmit={handleFindQuestion} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Digite seu e-mail cadastrado
                  </label>
                  <input
                    type="email"
                    required
                    value={recoveryEmail}
                    onChange={(e) => setRecoveryEmail(e.target.value)}
                    placeholder="seu.email@exemplo.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-all cursor-pointer"
                >
                  Avançar
                </button>
              </form>
            ) : (
              <form onSubmit={handleFinishRecovery} className="space-y-3">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-[11px] text-slate-400 font-semibold block uppercase">Pergunta cadastrada:</span>
                  <p className="text-xs font-semibold text-slate-800 mt-0.5">{foundQuestion}</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Sua resposta
                  </label>
                  <input
                    type="text"
                    required
                    value={securityAnswer}
                    onChange={(e) => setSecurityAnswer(e.target.value)}
                    placeholder="Sua resposta secreta"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nova Senha
                  </label>
                  <input
                    type="password"
                    required
                    minLength={4}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Nova senha (mínimo 4 dígitos)"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-all cursor-pointer"
                >
                  Salvar Nova Senha
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
