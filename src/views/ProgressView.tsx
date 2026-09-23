import React, { useState } from 'react';
import { useRoutine } from '../context/RoutineContext';
import { useAuth } from '../context/AuthContext';
import {
  getDayProgress,
  getHabitCompletions,
  getFocusSessions,
} from '../services/storage';
import {
  formatDurationHuman,
  getWeekDays,
  WEEKDAYS_SHORT,
  MONTHS_FULL,
} from '../utils/date';
import {
  BarChart3,
  Flame,
  Clock,
  CheckCircle,
  Calendar,
  Sparkles,
  TrendingUp,
  Target,
} from 'lucide-react';

interface ProgressViewProps {
  onNavigateToCalendar: () => void;
}

export const ProgressView: React.FC<ProgressViewProps> = ({ onNavigateToCalendar }) => {
  const { user, settings } = useAuth();
  const {
    routines,
    tasks,
    todayDate,
    dayProgress,
    getHabitStats,
    taskCompletions,
  } = useRoutine();

  const [periodTab, setPeriodTab] = useState<'hoje' | 'semana' | 'mes'>('semana');

  if (!user) return null;

  // Calculate Week Stats
  const weekDays = getWeekDays(todayDate, settings.startOfWeek);
  const weekStats = weekDays.map((w) => {
    const p = getDayProgress(user.id, w.dateStr);
    return {
      ...w,
      ...p,
    };
  });

  const weekCompletedTasks = weekStats.reduce((acc, d) => acc + d.completedTasks, 0);
  const weekFocusedSeconds = weekStats.reduce((acc, d) => acc + d.focusedSeconds, 0);
  const weekActiveDays = weekStats.filter((d) => d.completedTasks > 0).length;

  // Month stats calculation
  const currentMonthDate = new Date(todayDate + 'T12:00:00');
  const currentYear = currentMonthDate.getFullYear();
  const currentMonth = currentMonthDate.getMonth();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  let monthCompletedTasks = 0;
  let monthFocusedSeconds = 0;
  let monthActiveDays = 0;

  for (let d = 1; d <= daysInMonth; d++) {
    const dayStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const p = getDayProgress(user.id, dayStr);
    monthCompletedTasks += p.completedTasks;
    monthFocusedSeconds += p.focusedSeconds;
    if (p.completedTasks > 0) monthActiveDays++;
  }

  // Habits breakdown
  const habitTasks = tasks.filter((t) => t.isHabit);
  const totalHabitsCount = habitTasks.length;
  const habitsDoneToday = habitTasks.filter((h) =>
    taskCompletions.some((c) => c.taskId === h.id && c.date === todayDate)
  ).length;

  // Current streak (maximum habit streak or active days streak)
  const maxHabitStreak = habitTasks.reduce((max, h) => {
    const stats = getHabitStats(h.id);
    return Math.max(max, stats.currentStreak);
  }, 0);

  // Pick stats according to periodTab
  const activeCompleted =
    periodTab === 'hoje'
      ? dayProgress.completedTasks
      : periodTab === 'semana'
      ? weekCompletedTasks
      : monthCompletedTasks;

  const activeFocused =
    periodTab === 'hoje'
      ? dayProgress.focusedSeconds
      : periodTab === 'semana'
      ? weekFocusedSeconds
      : monthFocusedSeconds;

  const activeDaysCount =
    periodTab === 'hoje'
      ? dayProgress.completedTasks > 0 ? 1 : 0
      : periodTab === 'semana'
      ? weekActiveDays
      : monthActiveDays;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 md:py-8 space-y-6 animate-fade-in pb-24 md:pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Evolução e Progresso
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Acompanhe sua consistência, tempo focado e hábitos diários
          </p>
        </div>

        <button
          onClick={onNavigateToCalendar}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-50 text-blue-700 text-xs font-semibold hover:bg-blue-100 transition-colors cursor-pointer"
        >
          <Calendar className="w-4 h-4" />
          <span>Ver Calendário</span>
        </button>
      </div>

      {/* Period Filter Tabs */}
      <div className="flex bg-slate-100 p-1 rounded-2xl">
        <button
          onClick={() => setPeriodTab('hoje')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            periodTab === 'hoje'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Hoje
        </button>
        <button
          onClick={() => setPeriodTab('semana')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            periodTab === 'semana'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Esta Semana
        </button>
        <button
          onClick={() => setPeriodTab('mes')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            periodTab === 'mes'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Este Mês ({MONTHS_FULL[currentMonth]})
        </button>
      </div>

      {/* Core Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {/* Tarefas Concluídas */}
        <div className="p-4 bg-white rounded-3xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Concluídas
            </span>
            <CheckCircle className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900 font-mono">
            {activeCompleted}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">tarefas realizadas</p>
        </div>

        {/* Tempo Focado */}
        <div className="p-4 bg-white rounded-3xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Tempo Focado
            </span>
            <Clock className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900 font-mono">
            {formatDurationHuman(activeFocused)}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">em concentração total</p>
        </div>

        {/* Hábitos Realizados */}
        <div className="p-4 bg-white rounded-3xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Hábitos
            </span>
            <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900 font-mono">
            {habitsDoneToday}/{totalHabitsCount}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">feitos hoje</p>
        </div>

        {/* Dias Ativos */}
        <div className="p-4 bg-white rounded-3xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Dias Ativos
            </span>
            <Calendar className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900 font-mono">
            {activeDaysCount} {activeDaysCount === 1 ? 'dia' : 'dias'}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">com rotina cumprida</p>
        </div>

        {/* Sequência Atual */}
        <div className="p-4 bg-white rounded-3xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Maior Sequência
            </span>
            <span className="text-base">🔥</span>
          </div>
          <p className="text-2xl font-extrabold text-slate-900 font-mono">
            {maxHabitStreak} {maxHabitStreak === 1 ? 'dia' : 'dias'}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">sequência ininterrupta</p>
        </div>

        {/* Pendentes Hoje */}
        <div className="p-4 bg-white rounded-3xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Pendentes Hoje
            </span>
            <Target className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900 font-mono">
            {Math.max(0, dayProgress.totalTasks - dayProgress.completedTasks)}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">tarefas a concluir</p>
        </div>
      </div>

      {/* ================= WEEKLY BAR CHART ================= */}
      <section className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Esta semana</h2>
            <p className="text-xs text-slate-500">
              Você completou <span className="font-bold text-slate-800">{weekCompletedTasks} tarefas</span> esta semana.
            </p>
          </div>
          <div className="text-right">
            <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg">
              Foco: {formatDurationHuman(weekFocusedSeconds)}
            </span>
          </div>
        </div>

        <div className="space-y-3 pt-2">
          {weekStats.map((day) => {
            const hasData = day.totalTasks > 0;
            return (
              <div key={day.dateStr} className="flex items-center gap-3">
                <span
                  className={`w-10 text-xs font-semibold ${
                    day.isToday ? 'text-blue-600 font-bold' : 'text-slate-500'
                  }`}
                >
                  {day.dayShort}
                </span>

                <div className="flex-1 bg-slate-100 h-6 rounded-xl overflow-hidden p-1 relative flex items-center">
                  <div
                    className={`h-full rounded-lg transition-all duration-500 ${
                      day.percent === 100
                        ? 'bg-emerald-500'
                        : day.percent > 50
                        ? 'bg-blue-600'
                        : day.percent > 0
                        ? 'bg-blue-400'
                        : 'bg-transparent'
                    }`}
                    style={{ width: `${day.percent}%` }}
                  />
                  {hasData && (
                    <span className="absolute left-3 text-[10px] font-bold text-slate-700 select-none">
                      {day.completedTasks}/{day.totalTasks}
                    </span>
                  )}
                </div>

                <span className="w-12 text-right font-mono text-xs font-bold text-slate-700">
                  {hasData ? `${day.percent}%` : '—'}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* ================= HABITS DEEP DIVE ================= */}
      <section className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Acompanhamento de Hábitos</h2>
            <p className="text-xs text-slate-500">
              Sua disciplina diária construída dia após dia
            </p>
          </div>
          <Flame className="w-5 h-5 text-amber-500 fill-amber-500" />
        </div>

        {habitTasks.length === 0 ? (
          <p className="text-xs text-slate-400 italic py-4 text-center">
            Você ainda não marcou nenhuma tarefa como hábito. Ao criar ou editar uma tarefa, ative "Acompanhar como hábito".
          </p>
        ) : (
          <div className="space-y-3">
            {habitTasks.map((habit) => {
              const routine = routines.find((r) => r.id === habit.routineId);
              const stats = getHabitStats(habit.id);
              const doneToday = taskCompletions.some(
                (c) => c.taskId === habit.id && c.date === todayDate
              );

              return (
                <div
                  key={habit.id}
                  className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl p-2 rounded-xl bg-white border border-slate-200 shadow-xs">
                      {routine?.icon || '💧'}
                    </span>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 leading-snug">
                        {habit.name}
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        {routine?.name} • Total de {stats.totalCompleted} dias registrados
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 sm:justify-end">
                    <div className="text-left sm:text-right">
                      <span className="inline-flex items-center gap-1 font-mono font-bold text-sm text-amber-700 bg-amber-100/80 px-2.5 py-1 rounded-xl">
                        <Flame className="w-3.5 h-3.5 text-amber-600 fill-amber-600" />
                        {stats.currentStreak} {stats.currentStreak === 1 ? 'dia' : 'dias'}
                      </span>
                      <span className="block text-[10px] text-slate-400 mt-0.5">
                        Recorde: {stats.bestStreak} dias
                      </span>
                    </div>

                    <span
                      className={`text-xs px-2.5 py-1 rounded-xl font-semibold shrink-0 ${
                        doneToday
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-200/70 text-slate-600'
                      }`}
                    >
                      {doneToday ? 'Feito hoje' : 'Pendente'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
