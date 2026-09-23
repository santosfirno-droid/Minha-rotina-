import React, { useState } from 'react';
import { useRoutine } from '../context/RoutineContext';
import { Routine, RoutineTask } from '../types';
import { WEEKDAYS_SHORT } from '../utils/date';
import { RoutineIcon } from '../components/RoutineIcon';
import {
  Plus,
  MoreVertical,
  Edit2,
  Copy,
  Trash2,
  Power,
  ChevronDown,
  ChevronUp,
  Clock,
  ArrowUp,
  ArrowDown,
  Flame,
  Layers,
} from 'lucide-react';

interface RoutinesViewProps {
  onOpenCreateRoutine: (routineToEdit?: Routine) => void;
  onOpenTaskModal: (taskToEdit?: RoutineTask, defaultRoutineId?: string) => void;
}

export const RoutinesView: React.FC<RoutinesViewProps> = ({
  onOpenCreateRoutine,
  onOpenTaskModal,
}) => {
  const {
    routines,
    tasks,
    removeRoutine,
    cloneRoutine,
    toggleRoutineActive,
    reorderTasks,
    removeTask,
    isTaskCompleted,
    selectedDate,
  } = useRoutine();

  const [expandedRoutineId, setExpandedRoutineId] = useState<string | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedRoutineId(expandedRoutineId === id ? null : id);
  };

  const handleMoveTask = (routineId: string, taskIndex: number, direction: 'up' | 'down') => {
    const routineTasks = tasks.filter((t) => t.routineId === routineId);
    const targetIndex = direction === 'up' ? taskIndex - 1 : taskIndex + 1;
    if (targetIndex < 0 || targetIndex >= routineTasks.length) return;

    const copy = [...routineTasks];
    const [moved] = copy.splice(taskIndex, 1);
    copy.splice(targetIndex, 0, moved);

    reorderTasks(routineId, copy);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 md:py-8 space-y-6 animate-fade-in pb-24 md:pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Minhas Rotinas
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Gerencie seus blocos, ative ou reorganize cada momento do seu dia
          </p>
        </div>
        <button
          onClick={() => onOpenCreateRoutine()}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-xs py-2.5 px-4 rounded-xl shadow-xs transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Criar Rotina</span>
        </button>
      </div>

      {/* Routines Grid */}
      {routines.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-slate-200">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
            <Layers className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">Nenhuma rotina cadastrada</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
            Crie rotinas para guiar seu dia a dia e acompanhar sua evolução.
          </p>
          <button
            onClick={() => onOpenCreateRoutine()}
            className="inline-flex items-center gap-2 bg-blue-600 text-white text-xs font-semibold py-2.5 px-5 rounded-xl cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Criar primeira rotina</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {routines.map((routine) => {
            const routineTasks = tasks.filter((t) => t.routineId === routine.id);
            const completedCount = routineTasks.filter((t) =>
              isTaskCompleted(t.id, selectedDate)
            ).length;
            const isExpanded = expandedRoutineId === routine.id;

            return (
              <div
                key={routine.id}
                className={`bg-white rounded-3xl border transition-all ${
                  routine.isActive
                    ? 'border-slate-200/90 shadow-xs hover:border-slate-300'
                    : 'border-slate-200/60 opacity-60 bg-slate-50/50'
                }`}
              >
                {/* Routine Top Card */}
                <div className="p-5 sm:p-6">
                  <div className="flex items-start justify-between gap-4">
                    {/* Icon & Title */}
                    <div className="flex items-start gap-3.5 flex-1 min-w-0">
                      <span className="w-11 h-11 rounded-2xl bg-slate-50 border border-slate-200 text-blue-600 flex items-center justify-center shrink-0">
                        <RoutineIcon icon={routine.icon} className="w-6 h-6 text-blue-600" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h2 className="text-base font-bold text-slate-900 leading-snug truncate uppercase">
                            {routine.name}
                          </h2>
                          {!routine.isActive && (
                            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-slate-200 text-slate-600">
                              Desativada
                            </span>
                          )}
                        </div>

                        {routine.description && (
                          <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                            {routine.description}
                          </p>
                        )}

                        {/* Active Days Badges */}
                        <div className="flex flex-wrap items-center gap-1 mt-2.5">
                          {WEEKDAYS_SHORT.map((dayName, idx) => {
                            const isScheduled = routine.daysOfWeek.includes(idx);
                            return (
                              <span
                                key={dayName}
                                className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                                  isScheduled
                                    ? 'bg-blue-50 text-blue-700 border border-blue-200/60'
                                    : 'text-slate-300'
                                }`}
                              >
                                {dayName}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Quick Routine Actions Menu */}
                    <div className="flex items-center gap-1.5 shrink-0 relative">
                      {/* Active toggle button */}
                      <button
                        onClick={() => toggleRoutineActive(routine.id)}
                        className={`p-2 rounded-xl transition-colors cursor-pointer ${
                          routine.isActive
                            ? 'text-emerald-600 hover:bg-emerald-50'
                            : 'text-slate-400 hover:bg-slate-100'
                        }`}
                        title={routine.isActive ? 'Desativar rotina' : 'Ativar rotina'}
                      >
                        <Power className="w-4 h-4" />
                      </button>

                      {/* Dropdown Menu Trigger */}
                      <div className="relative">
                        <button
                          onClick={() =>
                            setActiveMenuId(activeMenuId === routine.id ? null : routine.id)
                          }
                          className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        {activeMenuId === routine.id && (
                          <div className="absolute right-0 top-9 z-30 bg-white border border-slate-200 shadow-xl rounded-2xl py-1.5 w-40 animate-fade-in text-xs font-medium">
                            <button
                              onClick={() => {
                                setActiveMenuId(null);
                                onOpenCreateRoutine(routine);
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-slate-700 hover:bg-slate-50 cursor-pointer text-left"
                            >
                              <Edit2 className="w-3.5 h-3.5 text-slate-500" /> Editar
                            </button>
                            <button
                              onClick={() => {
                                setActiveMenuId(null);
                                cloneRoutine(routine.id);
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-slate-700 hover:bg-slate-50 cursor-pointer text-left"
                            >
                              <Copy className="w-3.5 h-3.5 text-slate-500" /> Duplicar
                            </button>
                            <button
                              onClick={() => {
                                setActiveMenuId(null);
                                onOpenTaskModal(undefined, routine.id);
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-blue-600 hover:bg-blue-50 cursor-pointer text-left font-semibold"
                            >
                              <Plus className="w-3.5 h-3.5" /> Adicionar tarefa
                            </button>
                            <div className="h-px bg-slate-100 my-1" />
                            <button
                              onClick={() => {
                                setActiveMenuId(null);
                                if (
                                  confirm(
                                    `Deseja excluir a rotina "${routine.name}" e todas as suas tarefas?`
                                  )
                                ) {
                                  removeRoutine(routine.id);
                                }
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 cursor-pointer text-left"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Excluir
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Summary Bar */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-800">
                        {routineTasks.length}{' '}
                        {routineTasks.length === 1 ? 'tarefa' : 'tarefas'}
                      </span>
                      {routine.startTime && (
                        <>
                          <span>•</span>
                          <span className="font-mono text-slate-500">
                            Início {routine.startTime}
                          </span>
                        </>
                      )}
                    </div>

                    <button
                      onClick={() => toggleExpand(routine.id)}
                      className="flex items-center gap-1 font-semibold text-blue-600 hover:text-blue-700 cursor-pointer"
                    >
                      <span>
                        {isExpanded ? 'Ocultar tarefas' : 'Ver e reordenar tarefas'}
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Expanded Tasks List with Reordering */}
                {isExpanded && (
                  <div className="px-5 pb-5 pt-1 border-t border-slate-100 bg-slate-50/50 rounded-b-3xl space-y-2">
                    <div className="flex items-center justify-between py-2">
                      <span className="text-xs font-bold text-slate-700">
                        Tarefas da rotina
                      </span>
                      <button
                        onClick={() => onOpenTaskModal(undefined, routine.id)}
                        className="text-xs text-blue-600 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" /> Nova tarefa
                      </button>
                    </div>

                    {routineTasks.length === 0 ? (
                      <p className="text-xs text-slate-400 italic py-3 text-center">
                        Nenhuma tarefa nesta rotina.
                      </p>
                    ) : (
                      routineTasks.map((task, index) => (
                        <div
                          key={task.id}
                          className="flex items-center justify-between p-3 bg-white rounded-2xl border border-slate-200/80 shadow-xs text-xs"
                        >
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <span className="font-mono text-[11px] text-slate-400 w-4">
                              {index + 1}.
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="font-semibold text-slate-800 truncate">
                                {task.name}
                              </p>
                              <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                                {task.time && <span>{task.time}</span>}
                                {task.durationMinutes && <span>{task.durationMinutes} min</span>}
                                {task.isHabit && (
                                  <span className="text-amber-600 font-bold flex items-center gap-0.5">
                                    <Flame className="w-3 h-3 fill-amber-500 text-amber-500" />{' '}
                                    Hábito
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Reorder and Edit Actions */}
                          <div className="flex items-center gap-1">
                            <button
                              disabled={index === 0}
                              onClick={() => handleMoveTask(routine.id, index, 'up')}
                              className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 disabled:hover:text-slate-400 rounded cursor-pointer"
                              title="Subir ordem"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              disabled={index === routineTasks.length - 1}
                              onClick={() => handleMoveTask(routine.id, index, 'down')}
                              className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 disabled:hover:text-slate-400 rounded cursor-pointer"
                              title="Descer ordem"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => onOpenTaskModal(task, routine.id)}
                              className="p-1 text-slate-400 hover:text-blue-600 rounded cursor-pointer"
                              title="Editar tarefa"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => removeTask(task.id)}
                              className="p-1 text-slate-400 hover:text-red-600 rounded cursor-pointer"
                              title="Excluir tarefa"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
