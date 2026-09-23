import React, { useState } from 'react';
import { useRoutine } from '../context/RoutineContext';
import { useAuth } from '../context/AuthContext';
import { getDayProgress } from '../services/storage';
import {
  WEEKDAYS_SHORT,
  MONTHS_FULL,
  formatCurrentDate,
  formatDurationHuman,
} from '../utils/date';
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Clock,
  Flame,
  Calendar as CalendarIcon,
  Check,
} from 'lucide-react';

export const CalendarView: React.FC = () => {
  const { user } = useAuth();
  const {
    routines,
    tasks,
    todayDate,
    selectedDate,
    setSelectedDate,
    isTaskCompleted,
    getHabitStats,
    toggleTask,
  } = useRoutine();

  const [currentMonthDate, setCurrentMonthDate] = useState<Date>(() => {
    return new Date();
  });

  if (!user) return null;

  const year = currentMonthDate.getFullYear();
  const month = currentMonthDate.getMonth();

  const handlePrevMonth = () => {
    setCurrentMonthDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonthDate(new Date(year, month + 1, 1));
  };

  const handleGoToday = () => {
    setCurrentMonthDate(new Date());
    setSelectedDate(todayDate);
  };

  // Calendar matrix calculation
  const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0 = Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Selected date details
  const selectedDayOfWeek = new Date(selectedDate + 'T12:00:00').getDay();
  const selectedProgress = getDayProgress(user.id, selectedDate);
  const selectedRoutines = routines.filter(
    (r) => r.isActive && r.daysOfWeek.includes(selectedDayOfWeek)
  );
  const activeRoutineIds = new Set(selectedRoutines.map((r) => r.id));
  const selectedTasks = tasks.filter((t) => activeRoutineIds.has(t.routineId));

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 md:py-8 space-y-6 animate-fade-in pb-24 md:pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Calendário Mensal
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Visualize o histórico de cumprimento e toque em qualquer dia para ver detalhes
          </p>
        </div>

        <button
          onClick={handleGoToday}
          className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
        >
          Hoje
        </button>
      </div>

      {/* Calendar Card */}
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
            {MONTHS_FULL[month]} {year}
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
          {/* Empty cells before 1st day */}
          {Array.from({ length: firstDayOfWeek }).map((_, i) => (
            <div key={`empty-${i}`} className="h-12 sm:h-14 rounded-2xl" />
          ))}

          {/* Month days */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const dayNum = i + 1;
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
            const isToday = dateStr === todayDate;
            const isSelected = dateStr === selectedDate;
            const progress = getDayProgress(user.id, dateStr);

            // Completion badge styling
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

                {/* Status Dot / Indicator */}
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

      {/* Selected Day Breakdown */}
      <section className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900 capitalize">
              {formatCurrentDate(selectedDate)}
            </h2>
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
            Nenhuma rotina programada para este dia da semana.
          </p>
        ) : (
          <div className="space-y-4">
            {selectedRoutines.map((routine) => {
              const routineTasks = tasks.filter((t) => t.routineId === routine.id);

              return (
                <div key={routine.id} className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                    <span>{routine.icon}</span>
                    <span>{routine.name}</span>
                  </div>

                  <div className="space-y-1.5 pl-2">
                    {routineTasks.map((task) => {
                      const completed = isTaskCompleted(task.id, selectedDate);
                      return (
                        <div
                          key={task.id}
                          onClick={() => toggleTask(task.id, routine.id, task.isHabit, selectedDate)}
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
  );
};
