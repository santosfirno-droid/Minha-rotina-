import React, { useState } from 'react';
import { useRoutine } from '../context/RoutineContext';
import { useAuth } from '../context/AuthContext';
import {
  formatDurationHuman,
  getWeekDays,
  WEEKDAYS_SHORT,
  MONTHS_FULL,
  formatCurrentDate,
} from '../utils/date';
import { RoutineIcon } from '../components/RoutineIcon';
import {
  Flame,
  Clock,
  CheckCircle2,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Target,
  BarChart3,
  Check,
  Circle,
} from 'lucide-react';

interface ProgressViewProps {
  onNavigateToCalendar?: () => void;
}

export const ProgressView: React.FC<ProgressViewProps> = ({ onNavigateToCalendar }) => {
  const { user, settings } = useAuth();
  const {
    routines,
    tasks,
    todayDate,
    selectedDate,
    setSelectedDate,
    dayProgress,
    getDayProgressForDate,
    getHabitStats,
    taskCompletions,
    toggleTask,
    isTaskCompleted,
  } = useRoutine();

  const [mainTab, setMainTab] = useState<'geral' | 'calendario'>('geral');
  const [periodTab, setPeriodTab] = useState<'hoje' | 'semana' | 'mes'>('semana');

  // Month navigation for embedded calendar
  const [currentMonthDate, setCurrentMonthDate] = useState<Date>(() => new Date());

  if (!user) return null;

  // Calculate Week Stats
  const weekDays = getWeekDays(todayDate, settings.startOfWeek);
  const weekStats = weekDays.map((w) => {
    const p = getDayProgressForDate(w.dateStr);
    return {
      ...w,
      ...p,
    };
  });

  const weekCompletedTasks = weekStats.reduce((acc, d) => acc + d.completedTasks, 0);
  const weekFocusedSeconds = weekStats.reduce((acc, d) => acc + d.focusedSeconds, 0);
  const weekActiveDays = weekStats.filter((d) => d.completedTasks > 0).length;

  // Month stats calculation
  const calendarYear = currentMonthDate.getFullYear();
  const calendarMonth = currentMonthDate.getMonth();
  const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();

  let monthCompletedTasks = 0;
  let monthFocusedSeconds = 0;
  let monthActiveDays = 0;

  for (let d = 1; d <= daysInMonth; d++) {
    const dayStr = `${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const p = getDayProgressForDate(dayStr);
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

  // Current streak (maximum current streak across habits)
  const currentStreakVal = habitTasks.reduce((max, h) => {
    const stats = getHabitStats(h.id);
    return Math.max(max, stats.currentStreak);
  }, 0);

  // Best streak (maximum best streak across habits)
  const bestStreakVal = habitTasks.reduce((max, h) => {
    const stats = getHabitStats(h.id);
    return Math.max(max, stats.bestStreak);
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
      ? dayProgress.completedTasks > 0
        ? 1
        : 0
      : periodTab === 'semana'
      ? weekActiveDays
      : monthActiveDays;

  // Calendar matrix calculation
  const firstDayOfWeek = new Date(calendarYear, calendarMonth, 1).getDay(); // 0 = Sun

  const handlePrevMonth = () => {
    setCurrentMonthDate(new Date(calendarYear, calendarMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonthDate(new Date(calendarYear, calendarMonth + 1, 1));
  };

  // Selected date details for day modal/breakdown
  const selectedDayOfWeek = new Date(selectedDate + 'T12:00:00').getDay();
  const selectedProgress = getDayProgressForDate(selectedDate);
  const selectedRoutines = routines.filter(
    (r) => r.isActive && r.daysOfWeek.includes(selectedDayOfWeek)
  );
  const activeRoutineIds = new Set(selectedRoutines.map((r) => r.id));
  const selectedTasks = tasks.filter((t) => activeRoutineIds.has(t.routineId));
  const selectedCompletedTasks = selectedTasks.filter((t) => isTaskCompleted(t.id, selectedDate));
  const selectedPendingTasks = selectedTasks.filter((t) => !isTaskCompleted(t.id, selectedDate));

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 md:py-8 space-y-6 animate-fade-in pb-24 md:pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Progresso & Evolução
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Acompanhe sua consistência, tempo focado e hábitos diários
          </p>
        </div>

        {/* Top View Switcher */}
        <div className="inline-flex bg-slate-100 p-1 rounded-2xl">
          <button
            onClick={() => setMainTab('geral')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              mainTab === 'geral'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Visão Geral</span>
          </button>
          <button
            onClick={() => setMainTab('calendario')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              mainTab === 'calendario'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CalendarIcon className="w-3.5 h-3.5" />
            <span>Calendário Mensal</span>
          </button>
        </div>
      </div>

      {mainTab === 'geral' ? (
        <>
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
              Diária
            </button>
            <button
              onClick={() => setPeriodTab('semana')}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                periodTab === 'semana'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semanal
            </button>
            <button
              onClick={() => setPeriodTab('mes')}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                periodTab === 'mes'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Mensal ({MONTHS_FULL[calendarMonth]})
            </button>
          </div>

          {/* 6 Core Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {/* 1. Tarefas Concluídas */}
            <div className="p-4 bg-white rounded-3xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Tarefas Concluídas
                </span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-2xl font-extrabold text-slate-900 font-mono">
                {activeCompleted}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">no período selecionado</p>
            </div>

            {/* 2. Tarefas Pendentes */}
            <div className="p-4 bg-white rounded-3xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Tarefas Pendentes
                </span>
                <Target className="w-4 h-4 text-slate-400" />
              </div>
              <p className="text-2xl font-extrabold text-slate-900 font-mono">
                {Math.max(0, dayProgress.totalTasks - dayProgress.completedTasks)}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">pendentes hoje</p>
            </div>

            {/* 3. Tempo Focado */}
            <div className="p-4 bg-white rounded-3xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Tempo Focado
                </span>
                <Clock className="w-4 h-4 text-blue-600" />
              </div>
              <p className="text-2xl font-extrabold text-slate-900 font-mono">
                {formatDurationHuman(activeFocused)}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">em sessões com timer</p>
            </div>

            {/* 4. Dias Ativos */}
            <div className="p-4 bg-white rounded-3xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Dias Ativos
                </span>
                <CalendarIcon className="w-4 h-4 text-blue-500" />
              </div>
              <p className="text-2xl font-extrabold text-slate-900 font-mono">
                {activeDaysCount} {activeDaysCount === 1 ? 'dia' : 'dias'}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">com rotina cumprida</p>
            </div>

            {/* 5. Sequência Atual */}
            <div className="p-4 bg-white rounded-3xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Sequência Atual
                </span>
                <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
              </div>
              <p className="text-2xl font-extrabold text-slate-900 font-mono">
                {currentStreakVal} {currentStreakVal === 1 ? 'dia' : 'dias'}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">dias consecutivos</p>
            </div>

            {/* 6. Maior Sequência */}
            <div className="p-4 bg-white rounded-3xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Maior Sequência
                </span>
                <Flame className="w-4 h-4 text-amber-600 fill-amber-600" />
              </div>
              <p className="text-2xl font-extrabold text-slate-900 font-mono">
                {bestStreakVal} {bestStreakVal === 1 ? 'dia' : 'dias'}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">recorde histórico</p>
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
                <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-xl border border-blue-200/60">
                  Tempo focado: {formatDurationHuman(weekFocusedSeconds)}
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
                  O histórico permanece preservado mesmo se perder um dia
                </p>
              </div>
              <Flame className="w-5 h-5 text-amber-500 fill-amber-500" />
            </div>

            {habitTasks.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-4 text-center">
                Você ainda não marcou tarefas como hábito. Ao editar uma tarefa, ative "Acompanhar como hábito".
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
                        <span className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-blue-600 shadow-xs shrink-0">
                          <RoutineIcon icon={routine?.icon} className="w-4 h-4" />
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
                          <span className="inline-flex items-center gap-1 font-mono font-bold text-xs text-amber-800 bg-amber-100/80 px-2.5 py-1 rounded-xl">
                            <Flame className="w-3.5 h-3.5 text-amber-600 fill-amber-600" />
                            {stats.currentStreak} {stats.currentStreak === 1 ? 'dia' : 'dias'}
                          </span>
                          <span className="block text-[10px] text-slate-400 mt-0.5 font-medium">
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
        </>
      ) : (
        /* ================= CALENDÁRIO MENSAL INTEGRADO ================= */
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-4">
            {/* Month Navigation */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <button
                onClick={handlePrevMonth}
                className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors cursor-pointer"
                title="Mês anterior"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <h2 className="text-base font-bold text-slate-900 capitalize">
                {MONTHS_FULL[calendarMonth]} {calendarYear}
              </h2>

              <button
                onClick={handleNextMonth}
                className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors cursor-pointer"
                title="Próximo mês"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Days of week header */}
            <div className="grid grid-cols-7 gap-1 text-center">
              {WEEKDAYS_SHORT.map((day) => (
                <span key={day} className="text-xs font-bold text-slate-400 py-1">
                  {day}
                </span>
              ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
              {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                <div key={`empty-${i}`} className="h-12 sm:h-14 rounded-2xl" />
              ))}

              {Array.from({ length: daysInMonth }).map((_, i) => {
                const dayNum = i + 1;
                const dateStr = `${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                const isToday = dateStr === todayDate;
                const isSelected = dateStr === selectedDate;
                const progress = getDayProgressForDate(dateStr);

                let indicatorBg = 'bg-slate-100';
                if (progress.totalTasks > 0) {
                  if (progress.percent === 100) {
                    indicatorBg = 'bg-emerald-500';
                  } else if (progress.percent >= 50) {
                    indicatorBg = 'bg-blue-600';
                  } else if (progress.percent > 0) {
                    indicatorBg = 'bg-blue-300';
                  }
                }

                return (
                  <button
                    key={dateStr}
                    onClick={() => setSelectedDate(dateStr)}
                    className={`h-12 sm:h-14 rounded-2xl p-1 flex flex-col items-center justify-between border transition-all cursor-pointer relative ${
                      isSelected
                        ? 'border-blue-600 ring-2 ring-blue-500/20 bg-blue-50/40 shadow-xs'
                        : isToday
                        ? 'border-blue-300 bg-white font-bold'
                        : 'border-slate-100 hover:border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <span
                      className={`text-xs font-semibold ${
                        isToday ? 'text-blue-600 font-extrabold' : 'text-slate-800'
                      }`}
                    >
                      {dayNum}
                    </span>

                    {progress.totalTasks > 0 ? (
                      <div className="flex items-center gap-1 mb-0.5">
                        <span className={`w-2 h-2 rounded-full ${indicatorBg}`} />
                        <span className="text-[9px] font-mono text-slate-400 hidden sm:inline">
                          {progress.percent}%
                        </span>
                      </div>
                    ) : (
                      <div className="w-1.5 h-1.5 rounded-full bg-transparent mb-0.5" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-center gap-4 text-[11px] text-slate-500 font-medium">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span>100% Concluído</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                <span>50% a 99%</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-300" />
                <span>1% a 49%</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-200" />
                <span>Sem tarefas</span>
              </div>
            </div>
          </div>

          {/* Selected Day Details Panel */}
          <section className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900 capitalize">
                  {formatCurrentDate(selectedDate)}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {selectedProgress.completedTasks} de {selectedProgress.totalTasks} tarefas concluídas ({selectedProgress.percent}%)
                </p>
              </div>

              <span
                className={`px-3 py-1 rounded-full text-xs font-bold font-mono ${
                  selectedProgress.percent === 100
                    ? 'bg-emerald-100 text-emerald-800'
                    : selectedProgress.percent > 0
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {selectedProgress.percent}%
              </span>
            </div>

            {selectedRoutines.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-4 text-center">
                Nenhuma rotina programada para este dia.
              </p>
            ) : (
              <div className="space-y-4">
                {selectedRoutines.map((routine) => {
                  const routineTasks = tasks.filter((t) => t.routineId === routine.id);

                  return (
                    <div key={routine.id} className="space-y-2">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase">
                        <RoutineIcon icon={routine.icon} className="w-3.5 h-3.5 text-blue-600" />
                        <span>{routine.name}</span>
                      </div>

                      <div className="space-y-1.5 pl-2">
                        {routineTasks.map((task) => {
                          const completed = isTaskCompleted(task.id, selectedDate);
                          return (
                            <div
                              key={task.id}
                              onClick={() =>
                                toggleTask(task.id, routine.id, task.isHabit, selectedDate)
                              }
                              className={`flex items-center justify-between p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                                completed
                                  ? 'bg-slate-50 border-slate-200/70 text-slate-400 line-through'
                                  : 'bg-white border-slate-200 text-slate-800 hover:border-blue-300'
                              }`}
                            >
                              <div className="flex items-center gap-2.5">
                                <span
                                  className={`w-4 h-4 rounded-md flex items-center justify-center ${
                                    completed
                                      ? 'bg-emerald-600 text-white'
                                      : 'border border-slate-300'
                                  }`}
                                >
                                  {completed && <Check className="w-3 h-3 stroke-[3]" />}
                                </span>
                                <span className="font-medium">{task.name}</span>
                              </div>

                              {task.isHabit && (
                                <span className="text-amber-600 flex items-center gap-1 font-bold text-[10px]">
                                  <Flame className="w-3 h-3 fill-current" /> Hábito
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
};
