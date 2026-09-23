import React, { useState } from 'react';
import { Routine, RoutineTask } from '../types';
import { useRoutine } from '../context/RoutineContext';
import { X, Plus, Trash2, Clock, Calendar, Sparkles } from 'lucide-react';
import { WEEKDAYS_SHORT } from '../utils/date';

const POPULAR_ICONS = [
  '🌅', '🌙', '📚', '🏋️', '🏠', '💼', '🧘', '💧', 
  '☕', '😴', '🎯', '🎨', '🥑', '⚡', '🚀', '🧠',
  '💻', '🏃', '🧹', '📝', '🥗', '🚶', '🎸', '🌱'
];

interface CreateRoutineModalProps {
  isOpen: boolean;
  onClose: () => void;
  routineToEdit?: Routine | null;
}

interface TempTask {
  name: string;
  time: string;
  durationMinutes: number;
  isHabit: boolean;
  notes: string;
}

export const CreateRoutineModal: React.FC<CreateRoutineModalProps> = ({
  isOpen,
  onClose,
  routineToEdit,
}) => {
  const { addRoutine, editRoutine, addTask, tasks } = useRoutine();

  const [name, setName] = useState(routineToEdit ? routineToEdit.name : '');
  const [icon, setIcon] = useState(routineToEdit ? routineToEdit.icon : '🌅');
  const [description, setDescription] = useState(routineToEdit ? routineToEdit.description || '' : '');
  const [startTime, setStartTime] = useState(routineToEdit ? routineToEdit.startTime || '' : '07:00');
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>(
    routineToEdit ? routineToEdit.daysOfWeek : [0, 1, 2, 3, 4, 5, 6]
  );

  // New tasks to add alongside routine creation if creating new
  const [initialTasks, setInitialTasks] = useState<TempTask[]>([
    { name: '', time: '', durationMinutes: 15, isHabit: false, notes: '' },
  ]);

  const [showIconPicker, setShowIconPicker] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const toggleDay = (dayIndex: number) => {
    if (daysOfWeek.includes(dayIndex)) {
      if (daysOfWeek.length > 1) {
        setDaysOfWeek(daysOfWeek.filter((d) => d !== dayIndex));
      }
    } else {
      setDaysOfWeek([...daysOfWeek, dayIndex].sort());
    }
  };

  const handleAddTaskRow = () => {
    setInitialTasks([...initialTasks, { name: '', time: '', durationMinutes: 15, isHabit: false, notes: '' }]);
  };

  const handleUpdateTaskRow = (index: number, field: keyof TempTask, value: any) => {
    const updated = [...initialTasks];
    updated[index] = { ...updated[index], [field]: value };
    setInitialTasks(updated);
  };

  const handleRemoveTaskRow = (index: number) => {
    if (initialTasks.length > 1) {
      setInitialTasks(initialTasks.filter((_, i) => i !== index));
    } else {
      setInitialTasks([{ name: '', time: '', durationMinutes: 15, isHabit: false, notes: '' }]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Por favor, informe o nome da rotina.');
      return;
    }

    if (routineToEdit) {
      editRoutine({
        ...routineToEdit,
        name: name.trim(),
        icon,
        description: description.trim() || undefined,
        startTime: startTime || undefined,
        daysOfWeek,
      });
    } else {
      const newRoutine = addRoutine({
        name: name.trim(),
        icon,
        description: description.trim() || undefined,
        startTime: startTime || undefined,
        daysOfWeek,
        isActive: true,
      });

      // Add non-empty initial tasks
      initialTasks.forEach((t) => {
        if (t.name.trim()) {
          addTask({
            routineId: newRoutine.id,
            name: t.name.trim(),
            time: t.time || undefined,
            durationMinutes: Number(t.durationMinutes) || undefined,
            isHabit: t.isHabit,
            notes: t.notes.trim() || undefined,
          });
        }
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 md:p-8 shadow-2xl border border-slate-100 max-h-[92vh] flex flex-col my-auto animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {routineToEdit ? 'Editar Rotina' : 'Criar Nova Rotina'}
            </h2>
            <p className="text-xs text-slate-500">
              Defina o período, dias de repetição e os hábitos da sua rotina
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
          <div className="mt-4 p-3 bg-red-50 text-red-700 text-xs font-semibold rounded-xl border border-red-200">
            {error}
          </div>
        )}

        {/* Scrollable Form Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto py-4 space-y-5 pr-1">
          {/* Routine Name and Icon */}
          <div className="flex gap-3">
            <div className="relative">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Ícone</label>
              <button
                type="button"
                onClick={() => setShowIconPicker(!showIconPicker)}
                className="w-12 h-12 rounded-2xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-2xl border border-slate-200 cursor-pointer transition-colors"
                title="Escolher ícone"
              >
                {icon}
              </button>

              {showIconPicker && (
                <div className="absolute top-16 left-0 z-20 bg-white border border-slate-200 shadow-xl rounded-2xl p-3 grid grid-cols-6 gap-2 w-64">
                  {POPULAR_ICONS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => {
                        setIcon(emoji);
                        setShowIconPicker(false);
                      }}
                      className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-lg cursor-pointer"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex-1">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Nome da rotina <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setError('');
                }}
                placeholder="Ex: Rotina da manhã, Treino, Estudos..."
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium text-slate-800"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Descrição opcional
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Foco e clareza mental para iniciar o dia"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-slate-700"
            />
          </div>

          {/* Start Time & Presets */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              Horário de início sugerido
            </label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-mono text-slate-800"
            />
          </div>

          {/* Days of week */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              Dias da semana ativos
            </label>
            <div className="grid grid-cols-7 gap-1.5">
              {WEEKDAYS_SHORT.map((dayName, idx) => {
                const isSelected = daysOfWeek.includes(idx);
                return (
                  <button
                    key={dayName}
                    type="button"
                    onClick={() => toggleDay(idx)}
                    className={`py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                    }`}
                  >
                    {dayName}
                  </button>
                );
              })}
            </div>
            <div className="flex gap-2 mt-2">
              <button
                type="button"
                onClick={() => setDaysOfWeek([0, 1, 2, 3, 4, 5, 6])}
                className="text-[11px] text-blue-600 hover:underline font-medium cursor-pointer"
              >
                Todos os dias
              </button>
              <span className="text-slate-300">•</span>
              <button
                type="button"
                onClick={() => setDaysOfWeek([1, 2, 3, 4, 5])}
                className="text-[11px] text-blue-600 hover:underline font-medium cursor-pointer"
              >
                Dias úteis (Seg-Sex)
              </button>
              <span className="text-slate-300">•</span>
              <button
                type="button"
                onClick={() => setDaysOfWeek([0, 6])}
                className="text-[11px] text-blue-600 hover:underline font-medium cursor-pointer"
              >
                Fim de semana
              </button>
            </div>
          </div>

          {/* Initial tasks builder (only when creating) */}
          {!routineToEdit && (
            <div className="pt-3 border-t border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-800">
                  Tarefas iniciais desta rotina
                </label>
                <button
                  type="button"
                  onClick={handleAddTaskRow}
                  className="flex items-center gap-1 text-xs text-blue-600 font-semibold hover:text-blue-700 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Adicionar tarefa
                </button>
              </div>

              <div className="space-y-2.5">
                {initialTasks.map((task, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2"
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={task.name}
                        onChange={(e) => handleUpdateTaskRow(idx, 'name', e.target.value)}
                        placeholder="Ex: Arrumar cama, Beber água, Estudar..."
                        className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveTaskRow(idx)}
                        className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-white transition-colors cursor-pointer"
                        title="Remover"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
                      <div className="flex items-center gap-1">
                        <span className="text-[11px] text-slate-400">Horário:</span>
                        <input
                          type="time"
                          value={task.time}
                          onChange={(e) => handleUpdateTaskRow(idx, 'time', e.target.value)}
                          className="px-2 py-0.5 rounded border border-slate-200 bg-white text-xs font-mono"
                        />
                      </div>

                      <div className="flex items-center gap-1">
                        <span className="text-[11px] text-slate-400">Duração:</span>
                        <input
                          type="number"
                          min="1"
                          max="240"
                          value={task.durationMinutes}
                          onChange={(e) => handleUpdateTaskRow(idx, 'durationMinutes', e.target.value)}
                          className="w-14 px-2 py-0.5 rounded border border-slate-200 bg-white text-xs font-mono text-center"
                        />
                        <span className="text-[11px] text-slate-400">min</span>
                      </div>

                      <label className="flex items-center gap-1.5 ml-auto cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={task.isHabit}
                          onChange={(e) => handleUpdateTaskRow(idx, 'isHabit', e.target.checked)}
                          className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-xs font-medium text-slate-700">🔥 É hábito?</span>
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="pt-4 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium text-sm transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-sm hover:shadow transition-all cursor-pointer"
            >
              {routineToEdit ? 'Salvar Alterações' : 'Criar Rotina'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
