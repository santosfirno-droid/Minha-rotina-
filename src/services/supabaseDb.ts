import { supabase } from './supabase';
import {
  Routine,
  RoutineTask,
  TaskCompletion,
  FocusSession,
  UserSettings,
} from '../types';

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}

// Helper to format Date to YYYY-MM-DD
export function getTodayDateString(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// ---------------- USER SETTINGS ---------------- //

export async function fetchUserSettings(userId: string): Promise<UserSettings> {
  const defaultSettings: UserSettings = {
    userId,
    theme: 'light',
    startOfWeek: 1,
    timeFormat: '24h',
    soundEnabled: true,
    notificationsEnabled: false,
    celebrationEnabled: true,
  };

  try {
    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.warn('Error fetching user_settings:', error.message);
      return defaultSettings;
    }

    if (!data) {
      // Create initial settings row
      await supabase.from('user_settings').insert({
        user_id: userId,
        theme: defaultSettings.theme,
        start_of_week: defaultSettings.startOfWeek,
        time_format: defaultSettings.timeFormat,
        sound_enabled: defaultSettings.soundEnabled,
        notifications_enabled: defaultSettings.notificationsEnabled,
        celebration_enabled: defaultSettings.celebrationEnabled,
      });
      return defaultSettings;
    }

    return {
      userId: data.user_id,
      theme: (data.theme as 'light' | 'dark' | 'system') || 'light',
      startOfWeek: data.start_of_week ?? 1,
      timeFormat: (data.time_format as '24h' | '12h') || '24h',
      soundEnabled: data.sound_enabled ?? true,
      notificationsEnabled: data.notifications_enabled ?? false,
      celebrationEnabled: data.celebration_enabled ?? true,
    };
  } catch (err) {
    console.error('Failed to fetch settings from Supabase:', err);
    return defaultSettings;
  }
}

export async function updateDbUserSettings(
  userId: string,
  settings: Partial<UserSettings>
): Promise<void> {
  try {
    const payload: Record<string, any> = {
      user_id: userId,
      updated_at: new Date().toISOString(),
    };
    if (settings.theme !== undefined) payload.theme = settings.theme;
    if (settings.startOfWeek !== undefined) payload.start_of_week = settings.startOfWeek;
    if (settings.timeFormat !== undefined) payload.time_format = settings.timeFormat;
    if (settings.soundEnabled !== undefined) payload.sound_enabled = settings.soundEnabled;
    if (settings.notificationsEnabled !== undefined) payload.notifications_enabled = settings.notificationsEnabled;
    if (settings.celebrationEnabled !== undefined) payload.celebration_enabled = settings.celebrationEnabled;

    const { error } = await supabase.from('user_settings').upsert(payload);
    if (error) console.error('Error updating user_settings in Supabase:', error.message);
  } catch (err) {
    console.error('Exception updating user_settings:', err);
  }
}

// ---------------- ROUTINES ---------------- //

export async function fetchDbRoutines(userId: string): Promise<Routine[]> {
  try {
    const { data, error } = await supabase
      .from('routines')
      .select('*')
      .eq('user_id', userId)
      .order('order_num', { ascending: true });

    if (error) {
      console.error('Error fetching routines:', error.message);
      return [];
    }

    return (data || []).map((row) => ({
      id: row.id,
      userId: row.user_id,
      name: row.name,
      icon: row.icon || 'sun',
      description: row.description || '',
      startTime: row.start_time || '',
      daysOfWeek: Array.isArray(row.days_of_week) ? row.days_of_week : [0, 1, 2, 3, 4, 5, 6],
      isActive: row.is_active ?? true,
      order: row.order_num ?? 0,
      createdAt: row.created_at || new Date().toISOString(),
      updatedAt: row.updated_at || new Date().toISOString(),
    }));
  } catch (err) {
    console.error('Exception fetching routines:', err);
    return [];
  }
}

export async function createDbRoutine(
  userId: string,
  routineData: Omit<Routine, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'order'>,
  orderIndex: number
): Promise<Routine> {
  const now = new Date().toISOString();
  const id = generateId();

  const newRoutine: Routine = {
    ...routineData,
    id,
    userId,
    order: orderIndex,
    createdAt: now,
    updatedAt: now,
  };

  const { error } = await supabase.from('routines').insert({
    id: newRoutine.id,
    user_id: userId,
    name: newRoutine.name,
    icon: newRoutine.icon || 'sun',
    description: newRoutine.description || null,
    start_time: newRoutine.startTime || null,
    days_of_week: newRoutine.daysOfWeek,
    is_active: newRoutine.isActive,
    order_num: newRoutine.order,
    created_at: newRoutine.createdAt,
    updated_at: newRoutine.updatedAt,
  });

  if (error) {
    console.error('Error inserting routine to Supabase:', error.message);
    throw new Error(error.message);
  }

  return newRoutine;
}

export async function updateDbRoutine(userId: string, routine: Routine): Promise<void> {
  const now = new Date().toISOString();
  const { error } = await supabase
    .from('routines')
    .update({
      name: routine.name,
      icon: routine.icon,
      description: routine.description || null,
      start_time: routine.startTime || null,
      days_of_week: routine.daysOfWeek,
      is_active: routine.isActive,
      order_num: routine.order,
      updated_at: now,
    })
    .eq('id', routine.id)
    .eq('user_id', userId);

  if (error) {
    console.error('Error updating routine in Supabase:', error.message);
    throw new Error(error.message);
  }
}

export async function deleteDbRoutine(userId: string, routineId: string): Promise<void> {
  // Cascading deletes tasks and completions
  const { error } = await supabase
    .from('routines')
    .delete()
    .eq('id', routineId)
    .eq('user_id', userId);

  if (error) {
    console.error('Error deleting routine from Supabase:', error.message);
    throw new Error(error.message);
  }
}

export async function reorderDbRoutines(userId: string, orderedRoutines: Routine[]): Promise<void> {
  const updates = orderedRoutines.map((r, idx) => ({
    id: r.id,
    user_id: userId,
    name: r.name,
    icon: r.icon,
    description: r.description || null,
    start_time: r.startTime || null,
    days_of_week: r.daysOfWeek,
    is_active: r.isActive,
    order_num: idx,
    updated_at: new Date().toISOString(),
  }));

  const { error } = await supabase.from('routines').upsert(updates);
  if (error) console.error('Error reordering routines in Supabase:', error.message);
}

// ---------------- TASKS ---------------- //

export async function fetchDbTasks(userId: string): Promise<RoutineTask[]> {
  try {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .order('order_num', { ascending: true });

    if (error) {
      console.error('Error fetching tasks:', error.message);
      return [];
    }

    return (data || []).map((row) => ({
      id: row.id,
      routineId: row.routine_id,
      userId: row.user_id,
      name: row.name,
      time: row.time || '',
      durationMinutes: row.duration_minutes ?? undefined,
      isHabit: !!row.is_habit,
      notes: row.notes || '',
      order: row.order_num ?? 0,
      createdAt: row.created_at || new Date().toISOString(),
    }));
  } catch (err) {
    console.error('Exception fetching tasks:', err);
    return [];
  }
}

export async function createDbTask(
  userId: string,
  taskData: Omit<RoutineTask, 'id' | 'userId' | 'createdAt' | 'order'>,
  orderIndex: number
): Promise<RoutineTask> {
  const id = generateId();
  const now = new Date().toISOString();

  const newTask: RoutineTask = {
    ...taskData,
    id,
    userId,
    order: orderIndex,
    createdAt: now,
  };

  const { error } = await supabase.from('tasks').insert({
    id: newTask.id,
    routine_id: newTask.routineId,
    user_id: userId,
    name: newTask.name,
    time: newTask.time || null,
    duration_minutes: newTask.durationMinutes ?? null,
    is_habit: newTask.isHabit,
    notes: newTask.notes || null,
    order_num: newTask.order,
    created_at: newTask.createdAt,
  });

  if (error) {
    console.error('Error inserting task to Supabase:', error.message);
    throw new Error(error.message);
  }

  return newTask;
}

export async function updateDbTask(userId: string, task: RoutineTask): Promise<void> {
  const { error } = await supabase
    .from('tasks')
    .update({
      name: task.name,
      time: task.time || null,
      duration_minutes: task.durationMinutes ?? null,
      is_habit: task.isHabit,
      notes: task.notes || null,
      order_num: task.order,
    })
    .eq('id', task.id)
    .eq('user_id', userId);

  if (error) {
    console.error('Error updating task in Supabase:', error.message);
    throw new Error(error.message);
  }
}

export async function deleteDbTask(userId: string, taskId: string): Promise<void> {
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', taskId)
    .eq('user_id', userId);

  if (error) {
    console.error('Error deleting task in Supabase:', error.message);
    throw new Error(error.message);
  }

  // Also clean task completions
  await supabase
    .from('task_completions')
    .delete()
    .eq('task_id', taskId)
    .eq('user_id', userId);
}

export async function reorderDbTasks(userId: string, orderedTasks: RoutineTask[]): Promise<void> {
  const updates = orderedTasks.map((t, idx) => ({
    id: t.id,
    routine_id: t.routineId,
    user_id: userId,
    name: t.name,
    time: t.time || null,
    duration_minutes: t.durationMinutes ?? null,
    is_habit: t.isHabit,
    notes: t.notes || null,
    order_num: idx,
    created_at: t.createdAt,
  }));

  const { error } = await supabase.from('tasks').upsert(updates);
  if (error) console.error('Error reordering tasks in Supabase:', error.message);
}

// ---------------- TASK COMPLETIONS ---------------- //

export async function fetchDbCompletions(userId: string): Promise<TaskCompletion[]> {
  try {
    const { data, error } = await supabase
      .from('task_completions')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching completions from Supabase:', error.message);
      return [];
    }

    return (data || []).map((row) => ({
      id: row.id,
      taskId: row.task_id,
      routineId: row.routine_id,
      userId: row.user_id,
      date: row.date,
      completedAt: row.completed_at || new Date().toISOString(),
      focusedSeconds: row.focused_seconds ?? 0,
    }));
  } catch (err) {
    console.error('Exception fetching completions:', err);
    return [];
  }
}

export async function toggleDbTaskCompletion(
  userId: string,
  taskId: string,
  routineId: string,
  date: string,
  isCurrentlyCompleted: boolean,
  existingCompletionId?: string
): Promise<{ completed: boolean; completion?: TaskCompletion }> {
  if (isCurrentlyCompleted) {
    // Unmark completion
    const { error } = await supabase
      .from('task_completions')
      .delete()
      .match({
        task_id: taskId,
        date: date,
        user_id: userId,
      });

    if (error) console.error('Error deleting completion in Supabase:', error.message);
    return { completed: false };
  } else {
    // Mark as completed
    const newCompletion: TaskCompletion = {
      id: existingCompletionId || generateId(),
      taskId,
      routineId,
      userId,
      date,
      completedAt: new Date().toISOString(),
      focusedSeconds: 0,
    };

    const { error } = await supabase.from('task_completions').insert({
      id: newCompletion.id,
      task_id: newCompletion.taskId,
      routine_id: newCompletion.routineId,
      user_id: userId,
      date: newCompletion.date,
      completed_at: newCompletion.completedAt,
      focused_seconds: 0,
    });

    if (error) console.error('Error inserting completion in Supabase:', error.message);
    return { completed: true, completion: newCompletion };
  }
}

// ---------------- FOCUS SESSIONS ---------------- //

export async function fetchDbFocusSessions(userId: string): Promise<FocusSession[]> {
  try {
    const { data, error } = await supabase
      .from('focus_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching focus_sessions:', error.message);
      return [];
    }

    return (data || []).map((row) => ({
      id: row.id,
      taskId: row.task_id,
      taskName: row.task_name,
      routineId: row.routine_id,
      userId: row.user_id,
      durationSeconds: row.duration_seconds,
      date: row.date,
      createdAt: row.created_at || new Date().toISOString(),
    }));
  } catch (err) {
    console.error('Exception fetching focus sessions:', err);
    return [];
  }
}

export async function recordDbFocusSession(
  userId: string,
  session: Omit<FocusSession, 'id' | 'createdAt' | 'userId'>
): Promise<FocusSession> {
  const id = generateId();
  const now = new Date().toISOString();

  const newSession: FocusSession = {
    ...session,
    id,
    userId,
    createdAt: now,
  };

  const { error } = await supabase.from('focus_sessions').insert({
    id: newSession.id,
    task_id: newSession.taskId,
    task_name: newSession.taskName,
    routine_id: newSession.routineId,
    user_id: userId,
    duration_seconds: newSession.durationSeconds,
    date: newSession.date,
    created_at: newSession.createdAt,
  });

  if (error) console.error('Error inserting focus session in Supabase:', error.message);
  return newSession;
}

// ---------------- STARTER ROUTINE TEMPLATES ---------------- //

export async function insertStarterRoutinesForUser(userId: string, category: string = 'tudo'): Promise<void> {
  const allDays = [0, 1, 2, 3, 4, 5, 6];
  const weekdays = [1, 2, 3, 4, 5];

  if (category === 'estudos') {
    const rStudies = await createDbRoutine(
      userId,
      {
        name: 'Estudos & Foco',
        icon: 'book-open',
        description: 'Blocos de estudo, teoria e exercícios',
        startTime: '14:00',
        daysOfWeek: weekdays,
        isActive: true,
      },
      0
    );
    await createDbTask(userId, { routineId: rStudies.id, name: 'Estudar conteúdo do dia', time: '14:00', durationMinutes: 45, isHabit: false, notes: 'Foco total sem distrações' }, 0);
    await createDbTask(userId, { routineId: rStudies.id, name: 'Fazer exercícios práticos', time: '15:00', durationMinutes: 40, isHabit: false, notes: 'Fixação' }, 1);
    await createDbTask(userId, { routineId: rStudies.id, name: 'Revisão e anotações', time: '16:00', durationMinutes: 30, isHabit: true, notes: 'Resumo diário' }, 2);
    return;
  }

  if (category === 'trabalho') {
    const rWork = await createDbRoutine(
      userId,
      {
        name: 'Jornada Produtiva',
        icon: 'briefcase',
        description: 'Tarefas profissionais de alta prioridade',
        startTime: '09:00',
        daysOfWeek: weekdays,
        isActive: true,
      },
      0
    );
    await createDbTask(userId, { routineId: rWork.id, name: 'Planejar as prioridades do dia', time: '09:00', durationMinutes: 15, isHabit: true, notes: 'Definir as 3 metas' }, 0);
    await createDbTask(userId, { routineId: rWork.id, name: 'Bloco de trabalho focado (Deep Work)', time: '09:30', durationMinutes: 60, isHabit: false, notes: 'Sem interrupções' }, 1);
    await createDbTask(userId, { routineId: rWork.id, name: 'Organizar caixa de entrada e mensagens', time: '11:00', durationMinutes: 30, isHabit: false, notes: 'Respostas importantes' }, 2);
    return;
  }

  // Default 'tudo' / saúde
  const rMorning = await createDbRoutine(
    userId,
    {
      name: 'Rotina Matinal',
      icon: 'sun',
      description: 'Começar o dia com energia e clareza',
      startTime: '07:00',
      daysOfWeek: allDays,
      isActive: true,
    },
    0
  );
  await createDbTask(userId, { routineId: rMorning.id, name: 'Beber 500ml de água', time: '07:00', durationMinutes: 5, isHabit: true, notes: 'Hidratação ao acordar' }, 0);
  await createDbTask(userId, { routineId: rMorning.id, name: 'Alongamento / Exercício leve', time: '07:15', durationMinutes: 15, isHabit: true, notes: 'Ativar o corpo' }, 1);
  await createDbTask(userId, { routineId: rMorning.id, name: 'Café da manhã saudável', time: '07:35', durationMinutes: 20, isHabit: false, notes: 'Nutrição matinal' }, 2);

  const rFocus = await createDbRoutine(
    userId,
    {
      name: 'Foco & Produtividade',
      icon: 'target',
      description: 'Metas e tarefas do dia a dia',
      startTime: '09:00',
      daysOfWeek: weekdays,
      isActive: true,
    },
    1
  );
  await createDbTask(userId, { routineId: rFocus.id, name: 'Tarefa principal do dia', time: '09:00', durationMinutes: 45, isHabit: false, notes: 'Prioridade número 1' }, 0);
  await createDbTask(userId, { routineId: rFocus.id, name: 'Revisão e organização rápida', time: '11:30', durationMinutes: 20, isHabit: true, notes: 'Manter a ordem' }, 1);

  const rEvening = await createDbRoutine(
    userId,
    {
      name: 'Desconexão Noturna',
      icon: 'moon',
      description: 'Desacelerar e preparar uma boa noite de sono',
      startTime: '21:30',
      daysOfWeek: allDays,
      isActive: true,
    },
    2
  );
  await createDbTask(userId, { routineId: rEvening.id, name: 'Planejar o dia seguinte', time: '21:30', durationMinutes: 10, isHabit: true, notes: 'Organização antecipada' }, 0);
  await createDbTask(userId, { routineId: rEvening.id, name: 'Leitura relaxante', time: '21:50', durationMinutes: 20, isHabit: true, notes: 'Longe de telas azuis' }, 1);
}
