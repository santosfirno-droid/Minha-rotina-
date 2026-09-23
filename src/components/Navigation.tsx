import React from 'react';
import { ActiveTab } from '../types';
import { useRoutine } from '../context/RoutineContext';
import { useAuth } from '../context/AuthContext';
import {
  CalendarDays,
  CheckCircle2,
  Layers,
  Plus,
  BarChart3,
  User as UserIcon,
  Play,
  Clock,
  Sparkles,
  Calendar,
} from 'lucide-react';
import { formatSecondsToTime } from '../utils/date';

interface NavigationProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenCreateModal: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  setActiveTab,
  onOpenCreateModal,
}) => {
  const { activeTimer, setShowTimerModal, dayProgress } = useRoutine();
  const { user } = useAuth();

  return (
    <>
      {/* ================= DESKTOP SIDEBAR ================= */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200/80 h-screen sticky top-0 px-4 py-6 justify-between select-none shadow-sm z-30">
        <div>
          {/* Brand header */}
          <div className="flex items-center gap-3 px-2 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-blue-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <h1 className="font-bold text-lg tracking-tight text-slate-900 leading-tight">Minha Rotina</h1>
              <p className="text-[11px] text-slate-500 font-medium">Viva no seu ritmo</p>
            </div>
          </div>

          {/* Quick Create Action */}
          <button
            onClick={onOpenCreateModal}
            className="w-full mb-6 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold py-3 px-4 rounded-xl shadow-sm hover:shadow transition-all duration-150 cursor-pointer"
          >
            <Plus className="w-5 h-5 stroke-[2.5]" />
            <span>Nova Rotina</span>
          </button>

          {/* Main Navigation links */}
          <nav className="space-y-1.5">
            <button
              onClick={() => setActiveTab('hoje')}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl font-medium text-sm transition-all cursor-pointer ${
                activeTab === 'hoje'
                  ? 'bg-blue-50 text-blue-700 font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">🏠</span>
                <span>Hoje</span>
              </div>
              {dayProgress.totalTasks > 0 && (
                <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                  dayProgress.percent === 100
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-blue-100 text-blue-700'
                }`}>
                  {dayProgress.percent}%
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('rotinas')}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl font-medium text-sm transition-all cursor-pointer ${
                activeTab === 'rotinas'
                  ? 'bg-blue-50 text-blue-700 font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
              }`}
            >
              <span className="text-lg">📋</span>
              <span>Rotinas</span>
            </button>

            <button
              onClick={() => setActiveTab('progresso')}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl font-medium text-sm transition-all cursor-pointer ${
                activeTab === 'progresso'
                  ? 'bg-blue-50 text-blue-700 font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
              }`}
            >
              <span className="text-lg">📊</span>
              <span>Progresso</span>
            </button>

            <button
              onClick={() => setActiveTab('calendario')}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl font-medium text-sm transition-all cursor-pointer ${
                activeTab === 'calendario'
                  ? 'bg-blue-50 text-blue-700 font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
              }`}
            >
              <span className="text-lg">📅</span>
              <span>Calendário</span>
            </button>

            <button
              onClick={() => setActiveTab('perfil')}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl font-medium text-sm transition-all cursor-pointer ${
                activeTab === 'perfil'
                  ? 'bg-blue-50 text-blue-700 font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
              }`}
            >
              <span className="text-lg">⚙️</span>
              <span>Perfil</span>
            </button>
          </nav>
        </div>

        {/* Bottom Section: Active timer pill if running + Profile snippet */}
        <div className="space-y-3 pt-4 border-t border-slate-200/80">
          {activeTimer && (
            <div
              onClick={() => setShowTimerModal(true)}
              className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl cursor-pointer hover:border-blue-300 transition-all shadow-xs"
            >
              <div className="flex items-center justify-between text-xs text-blue-700 font-semibold mb-1">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
                  Foco ativo
                </span>
                <span className="font-mono text-xs">
                  {formatSecondsToTime(
                    activeTimer.mode === 'countdown' ? activeTimer.secondsLeft : activeTimer.secondsElapsed
                  )}
                </span>
              </div>
              <p className="text-xs text-slate-700 font-medium truncate">{activeTimer.taskName}</p>
            </div>
          )}

          <div
            onClick={() => setActiveTab('perfil')}
            className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-100/80 transition-colors cursor-pointer"
          >
            <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-base shadow-xs">
              {user?.avatar || '👤'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-800 truncate">{user?.name || 'Meu Perfil'}</p>
              <p className="text-xs text-slate-500 truncate">{user?.email}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* ================= MOBILE BOTTOM NAVIGATION ================= */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200/80 z-40 px-3 py-2 pb-safe select-none shadow-lg">
        <div className="flex items-center justify-around max-w-lg mx-auto">
          {/* Hoje */}
          <button
            onClick={() => setActiveTab('hoje')}
            className={`flex flex-col items-center py-1 px-2.5 rounded-xl transition-all cursor-pointer ${
              activeTab === 'hoje' ? 'text-blue-600 font-bold scale-105' : 'text-slate-500 font-medium'
            }`}
          >
            <span className="text-xl">🏠</span>
            <span className="text-[11px] mt-0.5">Hoje</span>
          </button>

          {/* Rotinas */}
          <button
            onClick={() => setActiveTab('rotinas')}
            className={`flex flex-col items-center py-1 px-2.5 rounded-xl transition-all cursor-pointer ${
              activeTab === 'rotinas' ? 'text-blue-600 font-bold scale-105' : 'text-slate-500 font-medium'
            }`}
          >
            <span className="text-xl">📋</span>
            <span className="text-[11px] mt-0.5">Rotinas</span>
          </button>

          {/* Criar (Center prominent button) */}
          <button
            onClick={onOpenCreateModal}
            className="flex flex-col items-center justify-center -mt-5 bg-gradient-to-tr from-blue-600 to-blue-500 text-white w-12 h-12 rounded-full shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40 active:scale-95 transition-all cursor-pointer"
            aria-label="Criar nova rotina ou tarefa"
          >
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </button>

          {/* Progresso */}
          <button
            onClick={() => setActiveTab('progresso')}
            className={`flex flex-col items-center py-1 px-2.5 rounded-xl transition-all cursor-pointer ${
              activeTab === 'progresso' ? 'text-blue-600 font-bold scale-105' : 'text-slate-500 font-medium'
            }`}
          >
            <span className="text-xl">📊</span>
            <span className="text-[11px] mt-0.5">Progresso</span>
          </button>

          {/* Perfil */}
          <button
            onClick={() => setActiveTab('perfil')}
            className={`flex flex-col items-center py-1 px-2.5 rounded-xl transition-all cursor-pointer ${
              activeTab === 'perfil' ? 'text-blue-600 font-bold scale-105' : 'text-slate-500 font-medium'
            }`}
          >
            <span className="text-xl">⚙️</span>
            <span className="text-[11px] mt-0.5">Perfil</span>
          </button>
        </div>
      </nav>
    </>
  );
};
