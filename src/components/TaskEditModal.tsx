import React, { useState } from 'react';
import { RoutineTask, Routine } from '../types';
import { useRoutine } from '../context/RoutineContext';
import { X, Clock, Flame, FileText } from 'lucide-react';

interface TaskEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskToEdit?: RoutineTask | null;
  defaultRoutineId?: string;
}

export const TaskEditModal: React.FC<TaskEditModalProps> = ({
  isOpen,
  onClose,
  taskToEdit,
  defaultRoutineId,
}) => {
  const { routines, addTask, editTask } = useRoutine();

  const [routineId, setRoutineId] = useState<string>(
    taskToEdit ? taskToEdit.routineId : defaultRoutineId || routines[0]?.id || ''
  );
  const [name, setName] = useState<string>(taskToEdit ? taskToEdit.name : '');
  const [time, setTime] = useState<string>(taskToEdit?.time || '');
  const [durationMinutes, setDurationMinutes] = useState<number | ''>(
    taskToEdit?.durationMinutes !== undefined ? taskToEdit.durationMinutes : 15
  );
  const [isHabit, setIsHabit] = useState<boolean>(taskToEdit ? taskToEdit.isHabit : false);
  const [notes, setNotes] = useState<string>(taskToEdit?.notes || '');
  const [error, setError] = useState<string>('');

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Informe o nome da tarefa.');
      return;
    }
    if (!routineId) {
      setError('Selecione uma rotina para esta tarefa.');
      return;
    }

    const durationVal = durationMinutes === '' ? undefined : Number(durationMinutes);
    setIsSubmitting(true);
    try {
      if (taskToEdit) {
        await editTask({
          ...taskToEdit,
          routineId,
          name: name.trim(),
          time: time || undefined,
          durationMinutes: durationVal,
          isHabit,
          notes: notes.trim() || undefined,
        });
      } else {
        await addTask({
          routineId,
          name: name.trim(),
          time: time || undefined,
          durationMinutes: durationVal,
          isHabit,
          notes: notes.trim() || undefined,
        });
      }

      onClose();
    } catch (err: any) {
      setError(err?.message || 'Erro ao salvar tarefa.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 md:p-7 shadow-2xl border border-slate-100">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {taskToEdit ? 'Editar Tarefa' : 'Nova Tarefa'}
            </h2>
            <p className="text-xs text-slate-500">
              Configure os detalhes, duração e se conta como hábito
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-3 p-2.5 bg-red-50 text-red-700 text-xs font-semibold rounded-xl border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Routine selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Rotina correspondente
            </label>
            <select
              value={routineId}
              onChange={(e) => setRoutineId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              {routines.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>

          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Nome da tarefa <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError('');
              }}
              placeholder="Ex: Arrumar cama, Estudar matemática, Treinar..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Time & Duration */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" /> Horário (opcional)
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Duração estimada
              </label>
              <div className="flex items-center">
                <input
                  type="number"
                  min="0"
                  max="480"
                  value={durationMinutes}
                  onChange={(e) =>
                    setDurationMinutes(e.target.value === '' ? '' : Number(e.target.value))
                  }
                  placeholder="Min"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-xs text-slate-400 -ml-8 font-medium pointer-events-none">
                  min
                </span>
              </div>
            </div>
          </div>

          {/* Is Habit */}
          <div className="p-3 bg-amber-50/60 rounded-2xl border border-amber-200/70 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600">
                <Flame className="w-4 h-4 fill-amber-500" />
              </div>
              <div>
                <p className="text-xs font-bold text-amber-900">Acompanhar como hábito</p>
                <p className="text-[11px] text-amber-700">
                  Calcula sequência diária (dias consecutivos)
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isHabit}
                onChange={(e) => setIsHabit(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-10 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
            </label>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-slate-400" /> Observações (opcional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Focar na resolução dos exercícios da lista..."
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium text-xs transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs hover:shadow transition-all cursor-pointer"
            >
              {taskToEdit ? 'Salvar' : 'Adicionar Tarefa'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
