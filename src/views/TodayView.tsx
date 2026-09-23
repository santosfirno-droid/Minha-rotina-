import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRoutine } from '../context/RoutineContext';
import { RoutineTask, Routine } from '../types';
import {
  formatGreeting,
  formatCurrentDate,
  getMotivationalMessage,
  formatDurationHuman,
} from '../utils/date';
import {
  Check,
  Clock,
  Play,
  Flame,
  Plus,
  MoreVertical,
  Edit2,
  Trash2,
  Sparkles,
  Calendar,
  CheckCircle2,
  ChevronRight,
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
  } = useRoutine();

  const [activeTaskMenu, setActiveTaskMenu] = useState<string | null>(null);

  const isViewingToday = selectedDate === todayDate;
  const currentDayOfWeek = new Date(selectedDate + 'T12:00:00').getDay();

  // Filter routines active on this day of week
  const activeRoutines = routines.filter(
    (r) => r.isActive && r.daysOfWeek.includes(currentDayOfWeek)
  );

  const motivational = getMotivationalMessage(dayProgress.percent);

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 md:py-8 space-y-6 animate-fade-in pb-24 md:pb-12">
      {/* ================= HEADER ================= */}
      <header className="space-y-1">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {formatGreeting(user?.name?.split(' ')[0] || 'amigo')}
          </h1>
          <span className="text-2xl sm:text-3xl p-1.5 bg-blue-50 rounded-2xl border border-blue-100/80 shadow-xs">
            {user?.avatar || '✨'}
          </span>
        </div>
        <p className="text-xs sm:text-sm font-medium text-slate-500 flex items-center gap-1.5 capitalize">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          {formatCurrentDate(selectedDate)}
        </p>
      </header>

      {/* ================= PROGRESS CARD ================= */}
      <section className="bg-gradient-to-br from-white via-blue-50/40 to-indigo-50/50 rounded-3xl p-5 sm:p-6 border border-blue-100/90 shadow-sm relative overflow-hidden">
        {/* Subtle decorative background glow */}
        <div className="absolute top-0 right-0 w-36 h-36 bg-blue-400/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center justify-between mb-3 relative z-10">
          <div>
            <span className="text-xs uppercase tracking-wider font-bold text-slate-400">
              Seu dia
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono">
                {dayProgress.percent}%
              </span>
              <span className="text-xs sm:text-sm font-semibold text-slate-600">
                concluído
              </span>
            </div>
          </div>

          <div className="text-right">
            <span
              className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold transition-all shadow-xs ${
                dayProgress.percent === 100
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-blue-100 text-blue-800'
              }`}
            >
              {motivational.message}
            </span>
            <p className="text-[11px] text-slate-400 mt-1 font-medium">
              {dayProgress.completedTasks} de {dayProgress.totalTasks} tarefas feitas
            </p>
          </div>
        </div>

        {/* Visual Progress Bar */}
        <div className="w-full bg-slate-200/70 h-3.5 rounded-full overflow-hidden p-0.5 relative z-10">
          <div
            className={`h-full rounded-full transition-all duration-500 ease-out ${
              dayProgress.percent === 100
                ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                : 'bg-gradient-to-r from-blue-600 to-indigo-500'
            }`}
            style={{ width: `${dayProgress.percent}%` }}
          />
        </div>

        {/* Milestone Message on 100% */}
        {dayProgress.percent === 100 && dayProgress.totalTasks > 0 && (
          <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-300/60 rounded-2xl flex items-center gap-3 text-emerald-900 text-xs font-semibold animate-scale-up">
            <span className="text-xl">🎉</span>
            <div>
              <p className="font-bold">Parabéns! Todas as rotinas do dia foram concluídas.</p>
              <p className="text-[11px] text-emerald-700">Você manteve o ritmo e cumpriu seus compromissos com excelência.</p>
            </div>
          </div>
        )}
      </section>

      {/* ================= ROUTINES & TASKS ================= */}
      <section className="space-y-6">
        {activeRoutines.length === 0 ? (
          <div className="text-center py-12 px-4 bg-white rounded-3xl border border-dashed border-slate-200">
            <span className="text-4xl mb-3 block">🌱</span>
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
            const completedCount = routineTasks.filter((t) => isTaskCompleted(t.id, selectedDate)).length;
            const routinePercent = routineTasks.length === 0 ? 0 : Math.round((completedCount / routineTasks.length) * 100);

            return (
              <div
                key={routine.id}
                className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-4 hover:border-slate-300 transition-all"
              >
                {/* Routine Section Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl p-2 rounded-2xl bg-slate-100 flex items-center justify-center">
                      {routine.icon}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-base font-bold text-slate-900 tracking-tight">
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
                    <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full ${
                      routinePercent === 100
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-slate-100 text-slate-600'
                    }`}>
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
                              onClick={() => toggleTask(task.id, routine.id, task.isHabit, selectedDate)}
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

                                {task.isHabit && habitStats && (
                                  <span
                                    className={`inline-flex items-center gap-1 font-bold px-1.5 py-0.5 rounded-md ${
                                      habitStats.currentStreak > 0
                                        ? 'bg-amber-100 text-amber-800'
                                        : 'bg-slate-100 text-slate-500'
                                    }`}
                                  >
                                    <Flame className="w-3 h-3 text-amber-600 fill-amber-600" />
                                    {habitStats.currentStreak} {habitStats.currentStreak === 1 ? 'dia' : 'dias'}
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
                                  setActiveTaskMenu(activeTaskMenu === task.id ? null : task.id)
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
