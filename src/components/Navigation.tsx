import React, { useMemo } from 'react';
import { ActiveTab } from '../types';
import { useRoutine } from '../context/RoutineContext';
import { useAuth } from '../context/AuthContext';
import { AppLogo } from './AppLogo';
import { ThemeToggle } from './ThemeToggle';
import {
  CalendarCheck,
  Layers,
  Plus,
  TrendingUp,
  User as UserIcon,
  Clock,
  Sparkles,
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

  const userInitials = useMemo(() => {
    if (!user?.name) return 'MR';
    const parts = user.name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return user.name.slice(0, 2).toUpperCase();
  }, [user?.name]);

  return (
    <>
      {/* ================= DESKTOP SIDEBAR ================= */}
      <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800/80 h-screen sticky top-0 px-4 py-6 justify-between select-none shadow-xs z-30 transition-colors">
        <div>
          {/* Brand header */}
          <div className="px-2 mb-8">
            <AppLogo
              size="md"
              withText
              textClassName="text-slate-900 dark:text-white"
              subtitleClassName="text-slate-500 dark:text-slate-400"
              onClick={() => setActiveTab('hoje')}
              className="cursor-pointer"
            />
          </div>

          {/* Quick Create Action */}
          <button
            onClick={onOpenCreateModal}
            className="w-full mb-6 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-xs py-3 px-4 rounded-2xl shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Criar Rotina</span>
          </button>

          {/* Main Navigation links */}
          <nav className="space-y-1.5">
            <button
              onClick={() => setActiveTab('hoje')}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl font-medium text-xs transition-all cursor-pointer ${
                activeTab === 'hoje'
                  ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 font-bold border border-blue-200/60 dark:border-blue-900/60'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/70 dark:hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <CalendarCheck className="w-4 h-4" />
                <span>Hoje</span>
              </div>
              {dayProgress.totalTasks > 0 && (
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                    dayProgress.percent === 100
                      ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400'
                      : 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400'
                  }`}
                >
                  {dayProgress.percent}%
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('rotinas')}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl font-medium text-xs transition-all cursor-pointer ${
                activeTab === 'rotinas'
                  ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 font-bold border border-blue-200/60 dark:border-blue-900/60'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/70 dark:hover:bg-slate-800/60'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Rotinas</span>
            </button>

            <button
              onClick={() => setActiveTab('progresso')}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl font-medium text-xs transition-all cursor-pointer ${
                activeTab === 'progresso' || activeTab === 'calendario'
                  ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 font-bold border border-blue-200/60 dark:border-blue-900/60'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/70 dark:hover:bg-slate-800/60'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              <span>Progresso</span>
            </button>

            <button
              onClick={() => setActiveTab('perfil')}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl font-medium text-xs transition-all cursor-pointer ${
                activeTab === 'perfil'
                  ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 font-bold border border-blue-200/60 dark:border-blue-900/60'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/70 dark:hover:bg-slate-800/60'
              }`}
            >
              <UserIcon className="w-4 h-4" />
              <span>Perfil</span>
            </button>
          </nav>
        </div>

        {/* Bottom Section: Active timer pill + Theme Toggle button + Profile snippet */}
        <div className="space-y-3 pt-4 border-t border-slate-200/80 dark:border-slate-800/80">
          {activeTimer && (
            <div
              onClick={() => setShowTimerModal(true)}
              className="p-3 bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/80 rounded-2xl cursor-pointer hover:border-blue-300 transition-all shadow-xs"
            >
              <div className="flex items-center justify-between text-xs text-blue-700 dark:text-blue-400 font-semibold mb-1">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
                  Foco em andamento
                </span>
                <span className="font-mono text-xs">
                  {formatSecondsToTime(
                    activeTimer.mode === 'countdown'
                      ? activeTimer.secondsLeft
                      : activeTimer.secondsElapsed
                  )}
                </span>
              </div>
              <p className="text-xs text-slate-800 dark:text-slate-200 font-semibold truncate">
                {activeTimer.taskName}
              </p>
            </div>
          )}

          {/* Quick Theme Toggle Button */}
          <div className="px-0.5">
            <ThemeToggle variant="pill" />
          </div>

          <div
            onClick={() => setActiveTab('perfil')}
            className="flex items-center gap-3 p-2 rounded-2xl hover:bg-slate-100/80 dark:hover:bg-slate-800/80 transition-colors cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
              {userInitials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                {user?.name || 'Meu Perfil'}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{user?.email}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* ================= MOBILE BOTTOM NAVIGATION ================= */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/80 dark:border-slate-800/80 z-40 px-3 py-2 pb-safe select-none shadow-lg transition-colors">
        <div className="flex items-center justify-around max-w-lg mx-auto">
          {/* Hoje */}
          <button
            onClick={() => setActiveTab('hoje')}
            className={`flex flex-col items-center py-1 px-3 rounded-2xl transition-all cursor-pointer ${
              activeTab === 'hoje'
                ? 'text-blue-600 dark:text-blue-400 font-bold'
                : 'text-slate-500 dark:text-slate-400 font-medium hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <CalendarCheck className="w-5 h-5" />
            <span className="text-[10px] mt-1">Hoje</span>
          </button>

          {/* Rotinas */}
          <button
            onClick={() => setActiveTab('rotinas')}
            className={`flex flex-col items-center py-1 px-3 rounded-2xl transition-all cursor-pointer ${
              activeTab === 'rotinas'
                ? 'text-blue-600 dark:text-blue-400 font-bold'
                : 'text-slate-500 dark:text-slate-400 font-medium hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Layers className="w-5 h-5" />
            <span className="text-[10px] mt-1">Rotinas</span>
          </button>

          {/* Criar (Center prominent button) */}
          <button
            onClick={onOpenCreateModal}
            className="flex items-center justify-center -mt-5 bg-blue-600 text-white w-12 h-12 rounded-2xl shadow-md shadow-blue-500/25 active:scale-95 transition-all cursor-pointer border-2 border-white dark:border-slate-900"
            aria-label="Criar nova rotina ou tarefa"
          >
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </button>

          {/* Progresso */}
          <button
            onClick={() => setActiveTab('progresso')}
            className={`flex flex-col items-center py-1 px-3 rounded-2xl transition-all cursor-pointer ${
              activeTab === 'progresso' || activeTab === 'calendario'
                ? 'text-blue-600 dark:text-blue-400 font-bold'
                : 'text-slate-500 dark:text-slate-400 font-medium hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <TrendingUp className="w-5 h-5" />
            <span className="text-[10px] mt-1">Progresso</span>
          </button>

          {/* Perfil */}
          <button
            onClick={() => setActiveTab('perfil')}
            className={`flex flex-col items-center py-1 px-3 rounded-2xl transition-all cursor-pointer ${
              activeTab === 'perfil'
                ? 'text-blue-600 dark:text-blue-400 font-bold'
                : 'text-slate-500 dark:text-slate-400 font-medium hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <UserIcon className="w-5 h-5" />
            <span className="text-[10px] mt-1">Perfil</span>
          </button>
        </div>
      </nav>
    </>
  );
};
