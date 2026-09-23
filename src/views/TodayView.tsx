import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRoutine } from '../context/RoutineContext';
import { RoutineTask, Routine } from '../types';
import {
  formatGreeting,
  formatCurrentDate,
  getMotivationalMessage,
  formatTimeRange,
  isTaskOverdue,
  parseTimeToMinutes,
  getCurrentMinutesToday,
} from '../utils/date';
import { RoutineIcon } from '../components/RoutineIcon';
import { AppLogo } from '../components/AppLogo';
import { ThemeToggle } from '../components/ThemeToggle';
import {
  Check,
  Clock,
  Play,
  Flame,
  Plus,
  MoreVertical,
  Edit2,
  Trash2,
  Calendar,
  AlertCircle,
  ArrowRight,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';

interface TodayViewProps {
  onOpenCreateRoutine: () => void;
  onOpenTaskModal: (taskToEdit?: RoutineTask, defaultRoutineId?: string) => void;
}

export const TodayView: React.FC<TodayViewProps> = ({
  onOpenCreateRoutine,
  onOpenTaskModal,
}) => {
  const { user } = useAuth();
  const {
    routines,
    tasks,
    selectedDate,
    todayDate,
    toggleTask,
    isTaskCompleted,
    getHabitStats,
    startTimer,
    removeTask,
    dayProgress,
    isLoadingData,
  } = useRoutine();

  const [activeTaskMenu, setActiveTaskMenu] = useState<string | null>(null);

  const isViewingToday = selectedDate === todayDate;
  const currentDayOfWeek = new Date(selectedDate + 'T12:00:00').getDay();

  // Active routines for this day of week, sorted by order
  const activeRoutines = useMemo(() => {
    return routines.filter((r) => r.isActive && r.daysOfWeek.includes(currentDayOfWeek));
  }, [routines, currentDayOfWeek]);

  const activeRoutineIds = useMemo(() => {
    return new Set(activeRoutines.map((r) => r.id));
  }, [activeRoutines]);

  // All active tasks today
  const activeTasksToday = useMemo(() => {
    return tasks.filter((t) => activeRoutineIds.has(t.routineId));
  }, [tasks, activeRoutineIds]);

  // Uncompleted tasks today
  const uncompletedTasks = useMemo(() => {
    return activeTasksToday.filter((t) => !isTaskCompleted(t.id, selectedDate));
  }, [activeTasksToday, isTaskCompleted, selectedDate]);

  // ================= AGORA ENGINE =================
  // Determines what the user should be doing RIGHT NOW
  const { currentAgoraTask, nextTask, currentAgoraRoutine, isOverdue } = useMemo(() => {
    if (uncompletedTasks.length === 0) {
      return {
        currentAgoraTask: null,
        nextTask: null,
        currentAgoraRoutine: null,
        isOverdue: false,
      };
    }

    const currentMinute = getCurrentMinutesToday();

    // 1. Check if any uncompleted task's time slot matches current time [start, start + duration]
    let matchedTask: RoutineTask | null = null;
    let matchedOverdue = false;

    // Sort tasks that have times
    const tasksWithTime = [...uncompletedTasks].filter((t) => !!t.time).sort((a, b) => {
      const aMin = parseTimeToMinutes(a.time) ?? 9999;
      const bMin = parseTimeToMinutes(b.time) ?? 9999;
      return aMin - bMin;
    });

    for (const t of tasksWithTime) {
      const startMin = parseTimeToMinutes(t.time)!;
      const duration = t.durationMinutes || 30;
      const endMin = startMin + duration;

      if (currentMinute >= startMin && currentMinute <= endMin) {
        matchedTask = t;
        matchedOverdue = false;
        break;
      }
    }

    // 2. If no strict current slot, check if there's an overdue uncompleted task
    if (!matchedTask) {
      const overdueTasks = tasksWithTime.filter((t) => isTaskOverdue(t.time, t.durationMinutes));
      if (overdueTasks.length > 0) {
        matchedTask = overdueTasks[0];
        matchedOverdue = true;
      }
    }

    // 3. If no overdue, pick the next upcoming task with time
    if (!matchedTask && tasksWithTime.length > 0) {
      matchedTask = tasksWithTime[0];
      matchedOverdue = false;
    }

    // 4. If no tasks have time, pick the first uncompleted task
    if (!matchedTask) {
      matchedTask = uncompletedTasks[0];
      matchedOverdue = false;
    }

    // Find next task after matchedTask
    const remainingAfter = uncompletedTasks.filter((t) => t.id !== matchedTask?.id);
    const next = remainingAfter.length > 0 ? remainingAfter[0] : null;

    const routine = matchedTask
      ? routines.find((r) => r.id === matchedTask.routineId) || null
      : null;

    return {
      currentAgoraTask: matchedTask,
      nextTask: next,
      currentAgoraRoutine: routine,
      isOverdue: matchedOverdue,
    };
  }, [uncompletedTasks, routines]);

  const motivational = getMotivationalMessage(dayProgress.percent);

  // User initials for clean vector avatar
  const userInitials = useMemo(() => {
    if (!user?.name) return 'MR';
    const parts = user.name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return user.name.slice(0, 2).toUpperCase();
  }, [user?.name]);

  if (isLoadingData) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 flex flex-col items-center justify-center space-y-4 animate-fade-in">
        <AppLogo size="lg" className="animate-pulse" />
        <p className="text-xs font-semibold text-slate-500">
          Carregando suas rotinas no Supabase...
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 md:py-8 space-y-6 animate-fade-in pb-24 md:pb-12">
      {/* ================= HEADER ================= */}
      <header className="space-y-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="md:hidden">
              <AppLogo size="sm" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {formatGreeting(user?.name?.split(' ')[0] || 'amigo')}
              </h1>
              <p className="text-xs sm:text-sm font-medium text-slate-500 flex items-center gap-1.5 capitalize mt-0.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                {formatCurrentDate(selectedDate)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <ThemeToggle variant="compact" />
            <div
              className="w-10 h-10 rounded-2xl bg-blue-600 text-white font-bold text-sm flex items-center justify-center shadow-sm select-none border border-blue-500"
              title={user?.name}
            >
              {userInitials}
            </div>
          </div>
        </div>
      </header>

      {/* ================= PROGRESS CARD ================= */}
      <section className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs relative overflow-hidden">
        <div className="flex items-center justify-between mb-3">
          <div>
            <span className="text-[11px] uppercase tracking-wider font-bold text-slate-400">
              Seu dia
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-3xl font-extrabold text-slate-900 font-mono tracking-tight">
                {dayProgress.percent}%
              </span>
              <span className="text-xs sm:text-sm font-semibold text-slate-600">
                concluído
              </span>
            </div>
          </div>

          <div className="text-right">
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold transition-all ${
                dayProgress.percent === 100
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/70'
                  : 'bg-blue-50 text-blue-700 border border-blue-200/70'
              }`}
            >
              {motivational.message}
            </span>
            <p className="text-[11px] text-slate-400 mt-1 font-medium font-mono">
              {dayProgress.completedTasks} de {dayProgress.totalTasks} tarefas concluídas
            </p>
          </div>
        </div>

        {/* Visual Progress Bar */}
        <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden p-0.5">
          <div
            className={`h-full rounded-full transition-all duration-500 ease-out ${
              dayProgress.percent === 100 ? 'bg-emerald-500' : 'bg-blue-600'
            }`}
            style={{ width: `${dayProgress.percent}%` }}
          />
        </div>

        {/* Milestone Message on 100% */}
        {dayProgress.percent === 100 && dayProgress.totalTasks > 0 && (
          <div className="mt-4 p-3.5 bg-emerald-50 border border-emerald-200/80 rounded-2xl flex items-center gap-3 text-emerald-900 text-xs font-medium animate-scale-up">
            <div className="w-7 h-7 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-slate-900">Dia concluído!</p>
              <p className="text-[11px] text-slate-600">
                Você cumpriu todas as rotinas programadas com excelência.
              </p>
            </div>
          </div>
        )}
      </section>

      {/* ================= SEÇÃO ESPECIAL: AGORA ================= */}
      {isViewingToday && currentAgoraTask && (
        <section className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-5 sm:p-6 text-white shadow-md relative overflow-hidden">
          {/* Subtle geometric background motif */}
          <div className="absolute top-0 right-0 -mr-8 -mt-8 w-36 h-36 bg-white/10 rounded-full blur-xl pointer-events-none" />

          <div className="relative z-10 space-y-4">
            {/* Header: Badge AGORA & Status */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[11px] font-extrabold tracking-wider uppercase border border-white/20">
                  AGORA
                </span>
                {currentAgoraRoutine && (
                  <span className="text-xs text-blue-100 font-medium flex items-center gap-1.5">
                    <RoutineIcon icon={currentAgoraRoutine.icon} className="w-3.5 h-3.5 text-blue-200" />
                    {currentAgoraRoutine.name}
                  </span>
                )}
              </div>

              {isOverdue ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-200 text-[11px] font-semibold border border-amber-300/30">
                  <AlertCircle className="w-3 h-3 text-amber-300" />
                  Atrasada • {currentAgoraTask.time}
                </span>
              ) : (
                currentAgoraTask.time && (
                  <span className="text-xs font-mono text-blue-100 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-blue-200" />
                    {formatTimeRange(currentAgoraTask.time, currentAgoraTask.durationMinutes)}
                  </span>
                )
              )}
            </div>

            {/* Task Info */}
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight leading-snug">
                {currentAgoraTask.name}
              </h2>
              {currentAgoraTask.notes && (
                <p className="text-xs text-blue-100/80 mt-1 line-clamp-1">
                  {currentAgoraTask.notes}
                </p>
              )}
            </div>

            {/* Action Row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
              <button
                onClick={() => {
                  if (currentAgoraRoutine) {
                    startTimer(currentAgoraTask, currentAgoraRoutine);
                  }
                }}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white text-blue-700 hover:bg-blue-50 active:bg-blue-100 font-bold text-xs uppercase tracking-wider py-3 px-6 rounded-2xl shadow-sm transition-all cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>COMEÇAR</span>
              </button>

              <button
                onClick={() => {
                  if (currentAgoraRoutine) {
                    toggleTask(
                      currentAgoraTask.id,
                      currentAgoraRoutine.id,
                      currentAgoraTask.isHabit,
                      selectedDate
                    );
                  }
                }}
                className="inline-flex items-center justify-center gap-1.5 text-xs text-blue-100 hover:text-white py-1 px-2 cursor-pointer font-medium"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Marcar como feita</span>
              </button>
            </div>

            {/* "Próximo" Preview */}
            {nextTask && (
              <div className="pt-3 border-t border-white/15 flex items-center justify-between text-xs text-blue-100">
                <span className="font-semibold uppercase text-[10px] tracking-wider text-blue-200">
                  Próximo:
                </span>
                <span className="truncate max-w-[220px] font-medium text-white">
                  {nextTask.name}
                  {nextTask.time && ` • ${nextTask.time}`}
                </span>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ================= TAREFAS AGRUPADAS POR ROTINA/PERÍODO ================= */}
      <section className="space-y-6">
        {activeRoutines.length === 0 ? (
          <div className="text-center py-12 px-4 bg-white rounded-3xl border border-dashed border-slate-200">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
              <Calendar className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800">
              Nenhuma rotina ativa para hoje
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
              Crie uma rotina para organizar a sua manhã, estudos, treinos ou noite.
            </p>
            <button
              onClick={onOpenCreateRoutine}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold py-2.5 px-5 rounded-xl shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Criar minha primeira rotina</span>
            </button>
          </div>
        ) : (
          activeRoutines.map((routine) => {
            const routineTasks = tasks.filter((t) => t.routineId === routine.id);
            const completedCount = routineTasks.filter((t) =>
              isTaskCompleted(t.id, selectedDate)
            ).length;
            const routinePercent =
              routineTasks.length === 0
                ? 0
                : Math.round((completedCount / routineTasks.length) * 100);

            return (
              <div
                key={routine.id}
                className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-4 hover:border-slate-300 transition-all"
              >
                {/* Routine Section Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-10 h-10 rounded-2xl bg-slate-50 border border-slate-200 text-slate-700 flex items-center justify-center shrink-0">
                      <RoutineIcon icon={routine.icon} className="w-5 h-5 text-blue-600" />
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight uppercase">
                          {routine.name}
                        </h2>
                        {routine.startTime && (
                          <span className="text-[11px] font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                            {routine.startTime}
                          </span>
                        )}
                      </div>
                      {routine.description && (
                        <p className="text-xs text-slate-500 mt-0.5">{routine.description}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full ${
                        routinePercent === 100
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {completedCount}/{routineTasks.length}
                    </span>
                    <button
                      onClick={() => onOpenTaskModal(undefined, routine.id)}
                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors cursor-pointer"
                      title="Adicionar tarefa a esta rotina"
                    >
                      <Plus className="w-4 h-4 stroke-[2.5]" />
                    </button>
                  </div>
                </div>

                {/* Tasks List */}
                {routineTasks.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-2 text-center">
                    Nenhuma tarefa nesta rotina ainda. Toque no '+' para adicionar.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {routineTasks.map((task) => {
                      const completed = isTaskCompleted(task.id, selectedDate);
                      const habitStats = task.isHabit ? getHabitStats(task.id) : null;
                      const overdue = !completed && isViewingToday && isTaskOverdue(task.time, task.durationMinutes);

                      return (
                        <div
                          key={task.id}
                          className={`group flex items-center justify-between p-3 sm:p-3.5 rounded-2xl border transition-all ${
                            completed
                              ? 'bg-slate-50/70 border-slate-200/60 text-slate-400'
                              : 'bg-white border-slate-200/90 text-slate-800 hover:border-blue-300 hover:shadow-xs'
                          }`}
                        >
                          {/* Left: Checkbox & Name */}
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <button
                              type="button"
                              onClick={() =>
                                toggleTask(task.id, routine.id, task.isHabit, selectedDate)
                              }
                              className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all cursor-pointer shrink-0 ${
                                completed
                                  ? 'bg-emerald-600 text-white border border-emerald-600 shadow-xs'
                                  : 'border-2 border-slate-300 hover:border-blue-600 bg-white'
                              }`}
                              aria-label={completed ? 'Desmarcar' : 'Concluir'}
                            >
                              {completed && <Check className="w-4 h-4 stroke-[3]" />}
                            </button>

                            <div className="min-w-0 flex-1">
                              <p
                                className={`text-sm font-semibold truncate leading-tight ${
                                  completed ? 'line-through text-slate-400' : 'text-slate-900'
                                }`}
                              >
                                {task.name}
                              </p>

                              {/* Task metadata pills */}
                              <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px]">
                                {task.time && (
                                  <span className="flex items-center gap-1 font-mono text-slate-500">
                                    <Clock className="w-3 h-3 text-slate-400" />
                                    {task.time}
                                  </span>
                                )}

                                {task.durationMinutes && (
                                  <span className="text-slate-400">
                                    {task.durationMinutes} min
                                  </span>
                                )}

                                {overdue && (
                                  <span className="inline-flex items-center gap-1 font-medium text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded-md">
                                    Atrasada
                                  </span>
                                )}

                                {task.isHabit && habitStats && (
                                  <span
                                    className={`inline-flex items-center gap-1 font-bold px-1.5 py-0.2 rounded-md ${
                                      habitStats.currentStreak > 0
                                        ? 'bg-amber-50 text-amber-800 border border-amber-200/60'
                                        : 'bg-slate-100 text-slate-500'
                                    }`}
                                  >
                                    <Flame className="w-3 h-3 text-amber-600 fill-amber-500" />
                                    {habitStats.currentStreak}{' '}
                                    {habitStats.currentStreak === 1 ? 'dia' : 'dias'}
                                  </span>
                                )}

                                {task.notes && (
                                  <span className="text-slate-400 truncate max-w-[140px] italic">
                                    • {task.notes}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Right: Quick Timer Action & Menu */}
                          <div className="flex items-center gap-1.5 pl-2 shrink-0">
                            {/* Start Timer */}
                            <button
                              onClick={() => startTimer(task, routine)}
                              className="p-2 rounded-xl text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                              title="Iniciar cronômetro de foco"
                            >
                              <Play className="w-4 h-4 fill-current" />
                            </button>

                            {/* Edit / Delete Options */}
                            <div className="relative">
                              <button
                                onClick={() =>
                                  setActiveTaskMenu(
                                    activeTaskMenu === task.id ? null : task.id
                                  )
                                }
                                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                              >
                                <MoreVertical className="w-4 h-4" />
                              </button>

                              {activeTaskMenu === task.id && (
                                <div className="absolute right-0 top-8 z-30 bg-white border border-slate-200 shadow-xl rounded-2xl py-1 w-32 animate-fade-in">
                                  <button
                                    onClick={() => {
                                      setActiveTaskMenu(null);
                                      onOpenTaskModal(task, routine.id);
                                    }}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer text-left"
                                  >
                                    <Edit2 className="w-3.5 h-3.5 text-slate-500" /> Editar
                                  </button>
                                  <button
                                    onClick={() => {
                                      setActiveTaskMenu(null);
                                      removeTask(task.id);
                                    }}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 cursor-pointer text-left"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" /> Excluir
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </section>
    </div>
  );
};
