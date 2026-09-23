import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  User as UserIcon,
  Bell,
  Moon,
  Sun,
  Calendar,
  Clock,
  Volume2,
  Sparkles,
  Shield,
  FileText,
  LogOut,
  Check,
  Edit2,
  X,
} from 'lucide-react';

const AVATARS = ['👤', '🧑‍💻', '🏃', '🧘', '🌿', '☕', '⚡', '📚', '🎨', '🎯', '🚀', '🥑'];

export const ProfileView: React.FC = () => {
  const { user, settings, updateSettings, updateProfile, logout } = useAuth();

  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(user?.name || '');
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);

  // Modals for Terms & Privacy
  const [modalType, setModalType] = useState<'terms' | 'privacy' | null>(null);

  if (!user) return null;

  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    if (nameInput.trim()) {
      updateProfile({ name: nameInput.trim() });
      setIsEditingName(false);
    }
  };

  const handleSelectAvatar = (av: string) => {
    updateProfile({ avatar: av });
    setShowAvatarPicker(false);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 md:py-8 space-y-6 animate-fade-in pb-24 md:pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Meu Perfil & Preferências
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Personalize sua experiência no Minha Rotina e gerencie sua conta
        </p>
      </div>

      {/* User Card */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center gap-5 relative">
        <div className="relative">
          <div
            onClick={() => setShowAvatarPicker(!showAvatarPicker)}
            className="w-20 h-20 rounded-full bg-blue-50 border-2 border-blue-200 flex items-center justify-center text-4xl shadow-inner cursor-pointer hover:scale-105 transition-transform"
            title="Mudar avatar"
          >
            {user.avatar || '👤'}
          </div>
          <button
            onClick={() => setShowAvatarPicker(!showAvatarPicker)}
            className="absolute bottom-0 right-0 p-1.5 bg-blue-600 text-white rounded-full shadow-md cursor-pointer hover:bg-blue-700"
          >
            <Edit2 className="w-3 h-3" />
          </button>

          {/* Avatar Selector Dropdown */}
          {showAvatarPicker && (
            <div className="absolute top-22 left-0 z-30 bg-white border border-slate-200 shadow-xl rounded-2xl p-3 grid grid-cols-4 gap-2 w-56 animate-fade-in">
              {AVATARS.map((av) => (
                <button
                  key={av}
                  onClick={() => handleSelectAvatar(av)}
                  className="w-10 h-10 rounded-xl hover:bg-blue-50 flex items-center justify-center text-xl cursor-pointer"
                >
                  {av}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="text-center sm:text-left flex-1 min-w-0">
          {isEditingName ? (
            <form onSubmit={handleSaveName} className="flex items-center gap-2">
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                className="px-3 py-1.5 text-sm font-bold border border-blue-400 rounded-xl focus:outline-none"
                autoFocus
              />
              <button
                type="submit"
                className="p-1.5 bg-blue-600 text-white rounded-xl cursor-pointer"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setIsEditingName(false)}
                className="p-1.5 bg-slate-200 text-slate-600 rounded-xl cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </form>
          ) : (
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <h2 className="text-lg font-bold text-slate-900 truncate">{user.name}</h2>
              <button
                onClick={() => {
                  setNameInput(user.name);
                  setIsEditingName(true);
                }}
                className="text-slate-400 hover:text-blue-600 cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <p className="text-xs text-slate-500 font-mono mt-0.5">{user.email}</p>
          <div className="mt-3 flex items-center justify-center sm:justify-start gap-2">
            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2.5 py-0.5 rounded-full">
              ✓ Dados 100% Isolados e Privados
            </span>
          </div>
        </div>
      </div>

      {/* Settings Section */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-5">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider text-slate-400">
          Configurações do Aplicativo
        </h3>

        {/* Som e Efeitos */}
        <div className="flex items-center justify-between py-2 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Volume2 className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800">Sons do cronômetro & tarefas</p>
              <p className="text-[11px] text-slate-500">Chimes suaves ao concluir itens e término de foco</p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.soundEnabled}
              onChange={(e) => updateSettings({ soundEnabled: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-10 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {/* Comemoração com Confetes */}
        <div className="flex items-center justify-between py-2 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800">Animação de comemoração</p>
              <p className="text-[11px] text-slate-500">Chuva de confetes festiva ao atingir 100% do dia</p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.celebrationEnabled}
              onChange={(e) => updateSettings({ celebrationEnabled: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-10 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {/* Primeiro Dia da Semana */}
        <div className="flex items-center justify-between py-2 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800">Primeiro dia da semana</p>
              <p className="text-[11px] text-slate-500">Organização das colunas na semana</p>
            </div>
          </div>
          <select
            value={settings.startOfWeek}
            onChange={(e) => updateSettings({ startOfWeek: Number(e.target.value) as 0 | 1 })}
            className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 bg-white text-slate-700 cursor-pointer"
          >
            <option value={1}>Segunda-feira</option>
            <option value={0}>Domingo</option>
          </select>
        </div>

        {/* Formato de Horário */}
        <div className="flex items-center justify-between py-2 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800">Formato de horário</p>
              <p className="text-[11px] text-slate-500">Padrão de exibição das horas</p>
            </div>
          </div>
          <select
            value={settings.timeFormat}
            onChange={(e) => updateSettings({ timeFormat: e.target.value as '24h' | '12h' })}
            className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 bg-white text-slate-700 cursor-pointer"
          >
            <option value="24h">24 horas (ex: 18:30)</option>
            <option value="12h">12 horas (ex: 6:30 PM)</option>
          </select>
        </div>

        {/* Notificações no navegador */}
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800">Lembretes & Notificações</p>
              <p className="text-[11px] text-slate-500">Avisos locais para suas rotinas</p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.notificationsEnabled}
              onChange={(e) => {
                if (e.target.checked && 'Notification' in window) {
                  Notification.requestPermission();
                }
                updateSettings({ notificationsEnabled: e.target.checked });
              }}
              className="sr-only peer"
            />
            <div className="w-10 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>
      </div>

      {/* Legal & Account Actions */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-3">
        <button
          onClick={() => setModalType('terms')}
          className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <FileText className="w-4 h-4 text-slate-400" />
            <span>Termos de Uso</span>
          </div>
          <span className="text-slate-400">›</span>
        </button>

        <button
          onClick={() => setModalType('privacy')}
          className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <Shield className="w-4 h-4 text-slate-400" />
            <span>Política de Privacidade</span>
          </div>
          <span className="text-slate-400">›</span>
        </button>

        <div className="pt-2 border-t border-slate-100">
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 p-3 rounded-2xl bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sair da Conta</span>
          </button>
        </div>
      </div>

      {/* Terms / Privacy Modal */}
      {modalType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                {modalType === 'terms' ? 'Termos de Uso — Minha Rotina' : 'Política de Privacidade — Minha Rotina'}
              </h3>
              <button
                onClick={() => setModalType(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 text-xs text-slate-600 space-y-3 leading-relaxed">
              {modalType === 'terms' ? (
                <>
                  <p>
                    Bem-vindo ao <strong>Minha Rotina</strong>. O objetivo do produto é fornecer uma experiência premium, confiável e pessoal para organização diária de rotinas, hábitos e foco.
                  </p>
                  <p>
                    <strong>1. Uso Pessoal:</strong> Você possui controle irrestrito sobre suas rotinas, hábitos e cronômetros cadastrados.
                  </p>
                  <p>
                    <strong>2. Disponibilidade:</strong> A aplicação opera com persistência local segura e isolada por conta de usuário, permitindo acesso ininterrupto.
                  </p>
                  <p>
                    <strong>3. Modificações:</strong> Você pode exportar, alterar ou excluir seus registros a qualquer momento diretamente nas telas de gerenciamento.
                  </p>
                </>
              ) : (
                <>
                  <p>
                    No <strong>Minha Rotina</strong>, respeitamos estritamente a privacidade e a autonomia de cada usuário.
                  </p>
                  <p>
                    <strong>1. Isolamento Rigoroso de Dados:</strong> Cada conta de usuário possui chaves de armazenamento totalmente isoladas. Nenhum usuário tem acesso aos dados, rotinas ou histórico de outros usuários.
                  </p>
                  <p>
                    <strong>2. Sem Rastreamento Publicitário:</strong> Não vendemos dados nem utilizamos rastreadores de terceiros para publicidade.
                  </p>
                  <p>
                    <strong>3. Armazenamento Local Confiável:</strong> Todos os seus dados ficam preservados no seu dispositivo de forma segura e imediata.
                  </p>
                </>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 text-right">
              <button
                onClick={() => setModalType(null)}
                className="px-5 py-2 rounded-xl bg-blue-600 text-white font-semibold text-xs cursor-pointer hover:bg-blue-700"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
