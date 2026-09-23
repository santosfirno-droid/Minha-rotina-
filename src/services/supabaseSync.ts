import { supabase } from './supabase';
import {
  Routine,
  RoutineTask,
  TaskCompletion,
  FocusSession,
  UserSettings,
} from '../types';
import {
  getRoutines,
  getTasks,
  getTaskCompletions,
  getFocusSessions,
  getUserSettings,
  saveRoutines,
  saveTasks,
  saveTaskCompletions,
  saveFocusSessions,
  saveUserSettings,
} from './storage';

/**
 * Pushes all local data for a user to Supabase
 */
export async function pushAllToSupabase(userId: string): Promise<{ success: boolean; message: string }> {
  try {
    // 1. Settings
    const settings = getUserSettings(userId);
    await supabase.from('user_settings').upsert({
      user_id: settings.userId,
      theme: settings.theme,
      start_of_week: settings.startOfWeek,
      time_format: settings.timeFormat,
      sound_enabled: settings.soundEnabled,
      notifications_enabled: settings.notificationsEnabled,
      celebration_enabled: settings.celebrationEnabled,
      updated_at: new Date().toISOString(),
    });

    // 2. Routines
    const routines = getRoutines(userId);
    if (routines.length > 0) {
      const routineRows = routines.map((r) => ({
        id: r.id,
        user_id: r.userId,
        name: r.name,
        icon: r.icon,
        description: r.description || null,
        start_time: r.startTime || null,
        days_of_week: r.daysOfWeek,
        is_active: r.isActive,
        order_num: r.order,
        created_at: r.createdAt,
        updated_at: r.updatedAt,
      }));
      const { error: rError } = await supabase.from('routines').upsert(routineRows);
      if (rError) throw rError;
    }

    // 3. Tasks
    const tasks = getTasks(userId);
    if (tasks.length > 0) {
      const taskRows = tasks.map((t) => ({
        id: t.id,
        routine_id: t.routineId,
        user_id: t.userId,
        name: t.name,
        time: t.time || null,
        duration_minutes: t.durationMinutes || null,
        is_habit: t.isHabit,
        notes: t.notes || null,
        order_num: t.order,
        created_at: t.createdAt,
      }));
      const { error: tError } = await supabase.from('tasks').upsert(taskRows);
      if (tError) throw tError;
    }

    // 4. Completions
    const completions = getTaskCompletions(userId);
    if (completions.length > 0) {
      const compRows = completions.map((c) => ({
        id: c.id,
        task_id: c.taskId,
        routine_id: c.routineId,
        user_id: c.userId,
        date: c.date,
        completed_at: c.completedAt,
        focused_seconds: c.focusedSeconds || 0,
      }));
      const { error: cError } = await supabase.from('task_completions').upsert(compRows);
      if (cError) throw cError;
    }

    // 5. Focus sessions
    const sessions = getFocusSessions(userId);
    if (sessions.length > 0) {
      const sessionRows = sessions.map((s) => ({
        id: s.id,
        task_id: s.taskId,
        task_name: s.taskName,
        routine_id: s.routineId,
        user_id: s.userId,
        duration_seconds: s.durationSeconds,
        date: s.date,
        created_at: s.createdAt,
      }));
      const { error: sError } = await supabase.from('focus_sessions').upsert(sessionRows);
      if (sError) throw sError;
    }

    return { success: true, message: 'Dados sincronizados com o Supabase com sucesso!' };
  } catch (err: any) {
    console.error('Erro ao enviar dados para o Supabase:', err);
    return { success: false, message: err?.message || 'Falha ao sincronizar com o Supabase' };
  }
}

/**
 * Pulls all data from Supabase for a user and merges/updates local storage
 */
export async function pullAllFromSupabase(userId: string): Promise<{ success: boolean; message: string; count?: number }> {
  try {
    // 1. Routines
    const { data: dbRoutines, error: rError } = await supabase
      .from('routines')
      .select('*')
      .eq('user_id', userId)
      .order('order_num', { ascending: true });

    if (rError) throw rError;

    // 2. Tasks
    const { data: dbTasks, error: tError } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .order('order_num', { ascending: true });

    if (tError) throw tError;

    // 3. Completions
    const { data: dbCompletions, error: cError } = await supabase
      .from('task_completions')
      .select('*')
      .eq('user_id', userId);

    if (cError) throw cError;

    // 4. Focus Sessions
    const { data: dbSessions, error: sError } = await supabase
      .from('focus_sessions')
      .select('*')
      .eq('user_id', userId);

    if (sError) throw sError;

    // 5. Settings
    const { data: dbSettings } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    // If Supabase has data, update local storage
    if (dbRoutines && dbRoutines.length > 0) {
      const parsedRoutines: Routine[] = dbRoutines.map((r: any) => ({
        id: r.id,
        userId: r.user_id,
        name: r.name,
        icon: r.icon,
        description: r.description || undefined,
        startTime: r.start_time || undefined,
        daysOfWeek: Array.isArray(r.days_of_week) ? r.days_of_week : [0, 1, 2, 3, 4, 5, 6],
        isActive: r.is_active,
        order: r.order_num,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      }));
      saveRoutines(userId, parsedRoutines);
    }

    if (dbTasks && dbTasks.length > 0) {
      const parsedTasks: RoutineTask[] = dbTasks.map((t: any) => ({
        id: t.id,
        routineId: t.routine_id,
        userId: t.user_id,
        name: t.name,
        time: t.time || undefined,
        durationMinutes: t.duration_minutes || undefined,
        isHabit: t.is_habit,
        notes: t.notes || undefined,
        order: t.order_num,
        createdAt: t.created_at,
      }));
      saveTasks(userId, parsedTasks);
    }

    if (dbCompletions && dbCompletions.length > 0) {
      const parsedCompletions: TaskCompletion[] = dbCompletions.map((c: any) => ({
        id: c.id,
        taskId: c.task_id,
        routineId: c.routine_id,
        userId: c.user_id,
        date: c.date,
        completedAt: c.completed_at,
        focusedSeconds: c.focused_seconds,
      }));
      saveTaskCompletions(userId, parsedCompletions);
    }

    if (dbSessions && dbSessions.length > 0) {
      const parsedSessions: FocusSession[] = dbSessions.map((s: any) => ({
        id: s.id,
        taskId: s.task_id,
        taskName: s.task_name,
        routineId: s.routine_id,
        userId: s.user_id,
        durationSeconds: s.duration_seconds,
        date: s.date,
        createdAt: s.created_at,
      }));
      saveFocusSessions(userId, parsedSessions);
    }

    if (dbSettings) {
      saveUserSettings({
        userId,
        theme: dbSettings.theme || 'light',
        startOfWeek: dbSettings.start_of_week ?? 1,
        timeFormat: dbSettings.time_format || '24h',
        soundEnabled: dbSettings.sound_enabled ?? true,
        notificationsEnabled: dbSettings.notifications_enabled ?? false,
        celebrationEnabled: dbSettings.celebration_enabled ?? true,
      });
    }

    return {
      success: true,
      message: 'Dados baixados do Supabase e sincronizados com sucesso!',
      count: (dbRoutines?.length || 0) + (dbTasks?.length || 0),
    };
  } catch (err: any) {
    console.error('Erro ao baixar dados do Supabase:', err);
    return { success: false, message: err?.message || 'Falha ao sincronizar' };
  }
}

// ---------------- GRANULAR ASYNC SYNC CALLS ---------------- //

export async function syncUpsertRoutine(routine: Routine): Promise<void> {
  try {
    await supabase.from('routines').upsert({
      id: routine.id,
      user_id: routine.userId,
      name: routine.name,
      icon: routine.icon,
      description: routine.description || null,
      start_time: routine.startTime || null,
      days_of_week: routine.daysOfWeek,
      is_active: routine.isActive,
      order_num: routine.order,
      created_at: routine.createdAt,
      updated_at: routine.updatedAt,
    });
  } catch (err) {
    // Non-blocking background sync
    console.warn('Sync routine to Supabase skipped:', err);
  }
}

export async function syncDeleteRoutine(routineId: string): Promise<void> {
  try {
    await supabase.from('routines').delete().eq('id', routineId);
  } catch (err) {
    console.warn('Sync delete routine skipped:', err);
  }
}

export async function syncUpsertTask(task: RoutineTask): Promise<void> {
  try {
    await supabase.from('tasks').upsert({
      id: task.id,
      routine_id: task.routineId,
      user_id: task.userId,
      name: task.name,
      time: task.time || null,
      duration_minutes: task.durationMinutes || null,
      is_habit: task.isHabit,
      notes: task.notes || null,
      order_num: task.order,
      created_at: task.createdAt,
    });
  } catch (err) {
    console.warn('Sync task to Supabase skipped:', err);
  }
}

export async function syncDeleteTask(taskId: string): Promise<void> {
  try {
    await supabase.from('tasks').delete().eq('id', taskId);
  } catch (err) {
    console.warn('Sync delete task skipped:', err);
  }
}

export async function syncUpsertCompletion(completion: TaskCompletion): Promise<void> {
  try {
    await supabase.from('task_completions').upsert({
      id: completion.id,
      task_id: completion.taskId,
      routine_id: completion.routineId,
      user_id: completion.userId,
      date: completion.date,
      completed_at: completion.completedAt,
      focused_seconds: completion.focusedSeconds || 0,
    });
  } catch (err) {
    console.warn('Sync completion to Supabase skipped:', err);
  }
}

export async function syncDeleteCompletion(taskId: string, date: string): Promise<void> {
  try {
    await supabase.from('task_completions').delete().match({ task_id: taskId, date });
  } catch (err) {
    console.warn('Sync delete completion skipped:', err);
  }
}

export async function syncInsertFocusSession(session: FocusSession): Promise<void> {
  try {
    await supabase.from('focus_sessions').upsert({
      id: session.id,
      task_id: session.taskId,
      task_name: session.taskName,
      routine_id: session.routineId,
      user_id: session.userId,
      duration_seconds: session.durationSeconds,
      date: session.date,
      created_at: session.createdAt,
    });
  } catch (err) {
    console.warn('Sync focus session to Supabase skipped:', err);
  }
}
