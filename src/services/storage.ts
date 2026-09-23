import {
  User,
  UserSettings,
  Routine,
  RoutineTask,
  TaskCompletion,
  HabitCompletion,
  FocusSession,
  DayProgress,
} from '../types';
import { resolveIconId } from '../components/RoutineIcon';

const USERS_KEY = 'minha_rotina_users_v2';
const CURRENT_USER_KEY = 'minha_rotina_current_user_v2';
const SETTINGS_PREFIX = 'minha_rotina_settings_v2_';
const ROUTINES_PREFIX = 'minha_rotina_routines_v2_';
const TASKS_PREFIX = 'minha_rotina_tasks_v2_';
const COMPLETIONS_PREFIX = 'minha_rotina_task_comp_v2_';
const HABIT_COMPLETIONS_PREFIX = 'minha_rotina_habit_comp_v2_';
const FOCUS_SESSIONS_PREFIX = 'minha_rotina_focus_v2_';

// Helper to format Date to YYYY-MM-DD
export function getTodayDateString(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
}

// ---------------- USER MANAGEMENT ---------------- //

export function getUsers(): User[] {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    if (!raw) return [];
    const users: User[] = JSON.parse(raw);
    return users.map((u) => ({
      ...u,
      avatar: u.avatar && u.avatar.length <= 2 ? 'user' : u.avatar || 'user',
    }));
  } catch {
    return [];
  }
}

export function saveUsers(users: User[]): void {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function getCurrentUser(): User | null {
  try {
    const raw = localStorage.getItem(CURRENT_USER_KEY);
    if (!raw) return null;
    const u: User = JSON.parse(raw);
    return {
      ...u,
      avatar: u.avatar && u.avatar.length <= 2 ? 'user' : u.avatar || 'user',
    };
  } catch {
    return null;
  }
}

export function setCurrentUser(user: User | null): void {
  if (user) {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(CURRENT_USER_KEY);
  }
}

// ---------------- USER SETTINGS ---------------- //

export function getUserSettings(userId: string): UserSettings {
  const defaultSettings: UserSettings = {
    userId,
    theme: 'light',
    startOfWeek: 1, // Monday
    timeFormat: '24h',
    soundEnabled: true,
    notificationsEnabled: false,
    celebrationEnabled: true,
  };
  try {
    const raw = localStorage.getItem(`${SETTINGS_PREFIX}${userId}`);
    return raw ? { ...defaultSettings, ...JSON.parse(raw) } : defaultSettings;
  } catch {
    return defaultSettings;
  }
}

export function saveUserSettings(settings: UserSettings): void {
  localStorage.setItem(`${SETTINGS_PREFIX}${settings.userId}`, JSON.stringify(settings));
}

// ---------------- ROUTINES ---------------- //

export function getRoutines(userId: string): Routine[] {
  try {
    const raw = localStorage.getItem(`${ROUTINES_PREFIX}${userId}`);
    if (!raw) return [];
    const parsed: Routine[] = JSON.parse(raw);
    // Sanitize icons so no emojis linger
    return parsed
      .map((r) => ({
        ...r,
        icon: resolveIconId(r.icon),
      }))
      .sort((a, b) => a.order - b.order);
  } catch {
    return [];
  }
}

export function saveRoutines(userId: string, routines: Routine[]): void {
  localStorage.setItem(`${ROUTINES_PREFIX}${userId}`, JSON.stringify(routines));
}

export function createRoutine(
  userId: string,
  routineData: Omit<Routine, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'order'>
): Routine {
  const current = getRoutines(userId);
  const now = new Date().toISOString();
  const newRoutine: Routine = {
    ...routineData,
    icon: resolveIconId(routineData.icon),
    id: generateId(),
    userId,
    order: current.length,
    createdAt: now,
    updatedAt: now,
  };
  const updated = [...current, newRoutine];
  saveRoutines(userId, updated);
  return newRoutine;
}

export function updateRoutine(userId: string, routine: Routine): void {
  const current = getRoutines(userId);
  const updated = current.map((r) =>
    r.id === routine.id
      ? { ...routine, icon: resolveIconId(routine.icon), updatedAt: new Date().toISOString() }
      : r
  );
  saveRoutines(userId, updated);
}

export function deleteRoutine(userId: string, routineId: string): void {
  const routines = getRoutines(userId).filter((r) => r.id !== routineId);
  saveRoutines(userId, routines);

  // Also remove all associated tasks
  const tasks = getTasks(userId).filter((t) => t.routineId !== routineId);
  saveTasks(userId, tasks);

  // Clean completions
  const completions = getTaskCompletions(userId).filter((c) => c.routineId !== routineId);
  saveTaskCompletions(userId, completions);
}

export function duplicateRoutine(userId: string, routineId: string): Routine | null {
  const routines = getRoutines(userId);
  const found = routines.find((r) => r.id === routineId);
  if (!found) return null;

  const now = new Date().toISOString();
  const newRoutine: Routine = {
    ...found,
    id: generateId(),
    name: `${found.name} (Cópia)`,
    order: routines.length,
    createdAt: now,
    updatedAt: now,
  };
  saveRoutines(userId, [...routines, newRoutine]);

  // Duplicate tasks
  const allTasks = getTasks(userId);
  const routineTasks = allTasks.filter((t) => t.routineId === routineId);
  const newTasks: RoutineTask[] = routineTasks.map((t) => ({
    ...t,
    id: generateId(),
    routineId: newRoutine.id,
    createdAt: now,
  }));
  saveTasks(userId, [...allTasks, ...newTasks]);

  return newRoutine;
}

// ---------------- TASKS ---------------- //

export function getTasks(userId: string): RoutineTask[] {
  try {
    const raw = localStorage.getItem(`${TASKS_PREFIX}${userId}`);
    if (!raw) return [];
    const parsed: RoutineTask[] = JSON.parse(raw);
    return parsed.sort((a, b) => a.order - b.order);
  } catch {
    return [];
  }
}

export function saveTasks(userId: string, tasks: RoutineTask[]): void {
  localStorage.setItem(`${TASKS_PREFIX}${userId}`, JSON.stringify(tasks));
}

export function createTask(
  userId: string,
  taskData: Omit<RoutineTask, 'id' | 'userId' | 'createdAt' | 'order'>
): RoutineTask {
  const current = getTasks(userId);
  const routineTasks = current.filter((t) => t.routineId === taskData.routineId);
  const newTask: RoutineTask = {
    ...taskData,
    id: generateId(),
    userId,
    order: routineTasks.length,
    createdAt: new Date().toISOString(),
  };
  saveTasks(userId, [...current, newTask]);
  return newTask;
}

export function updateTask(userId: string, task: RoutineTask): void {
  const current = getTasks(userId);
  const updated = current.map((t) => (t.id === task.id ? task : t));
  saveTasks(userId, updated);
}

export function deleteTask(userId: string, taskId: string): void {
  const current = getTasks(userId);
  saveTasks(userId, current.filter((t) => t.id !== taskId));

  // Remove completions
  const completions = getTaskCompletions(userId).filter((c) => c.taskId !== taskId);
  saveTaskCompletions(userId, completions);
  const habitCompletions = getHabitCompletions(userId).filter((h) => h.taskId !== taskId);
  saveHabitCompletions(userId, habitCompletions);
}

// ---------------- COMPLETIONS & HABITS ---------------- //

export function getTaskCompletions(userId: string): TaskCompletion[] {
  try {
    const raw = localStorage.getItem(`${COMPLETIONS_PREFIX}${userId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveTaskCompletions(userId: string, completions: TaskCompletion[]): void {
  localStorage.setItem(`${COMPLETIONS_PREFIX}${userId}`, JSON.stringify(completions));
}

export function getHabitCompletions(userId: string): HabitCompletion[] {
  try {
    const raw = localStorage.getItem(`${HABIT_COMPLETIONS_PREFIX}${userId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveHabitCompletions(userId: string, completions: HabitCompletion[]): void {
  localStorage.setItem(`${HABIT_COMPLETIONS_PREFIX}${userId}`, JSON.stringify(completions));
}

export function toggleTaskCompletion(
  userId: string,
  taskId: string,
  routineId: string,
  date: string = getTodayDateString(),
  isHabit: boolean = false
): { completed: boolean; completion?: TaskCompletion } {
  const completions = getTaskCompletions(userId);
  const existingIndex = completions.findIndex((c) => c.taskId === taskId && c.date === date);

  if (existingIndex >= 0) {
    // Uncheck
    const updated = completions.filter((_, idx) => idx !== existingIndex);
    saveTaskCompletions(userId, updated);

    if (isHabit) {
      const habits = getHabitCompletions(userId).filter(
        (h) => !(h.taskId === taskId && h.date === date)
      );
      saveHabitCompletions(userId, habits);
    }
    return { completed: false };
  } else {
    // Check
    const newCompletion: TaskCompletion = {
      id: generateId(),
      taskId,
      routineId,
      userId,
      date,
      completedAt: new Date().toISOString(),
    };
    saveTaskCompletions(userId, [...completions, newCompletion]);

    if (isHabit) {
      const habits = getHabitCompletions(userId);
      const newHabitCompletion: HabitCompletion = {
        id: generateId(),
        taskId,
        routineId,
        userId,
        date,
        completedAt: new Date().toISOString(),
      };
      saveHabitCompletions(userId, [...habits, newHabitCompletion]);
    }
    return { completed: true, completion: newCompletion };
  }
}

// ---------------- FOCUS SESSIONS ---------------- //

export function getFocusSessions(userId: string): FocusSession[] {
  try {
    const raw = localStorage.getItem(`${FOCUS_SESSIONS_PREFIX}${userId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveFocusSessions(userId: string, sessions: FocusSession[]): void {
  localStorage.setItem(`${FOCUS_SESSIONS_PREFIX}${userId}`, JSON.stringify(sessions));
}

export function recordFocusSession(session: Omit<FocusSession, 'id' | 'createdAt'>): FocusSession {
  const current = getFocusSessions(session.userId);
  const newSession: FocusSession = {
    ...session,
    id: generateId(),
    createdAt: new Date().toISOString(),
  };
  localStorage.setItem(
    `${FOCUS_SESSIONS_PREFIX}${session.userId}`,
    JSON.stringify([...current, newSession])
  );
  return newSession;
}

// ---------------- STREAK CALCULATOR ---------------- //

/**
 * Calculates current streak and total completed days for a habit without wiping historical data
 */
export function calculateHabitStreak(
  userId: string,
  taskId: string,
  targetDaysOfWeek?: number[]
): { currentStreak: number; bestStreak: number; totalCompleted: number; historyDates: string[] } {
  const allHabitCompletions = getHabitCompletions(userId)
    .filter((h) => h.taskId === taskId)
    .map((h) => h.date);

  const uniqueDates = Array.from(new Set(allHabitCompletions)).sort();
  const totalCompleted = uniqueDates.length;

  if (totalCompleted === 0) {
    return { currentStreak: 0, bestStreak: 0, totalCompleted: 0, historyDates: [] };
  }

  const today = getTodayDateString();
  const todayDate = new Date(today + 'T00:00:00');

  let currentStreak = 0;
  let checkDate = new Date(todayDate);

  const todayCompleted = uniqueDates.includes(today);
  if (!todayCompleted) {
    checkDate.setDate(checkDate.getDate() - 1);
  }

  while (true) {
    const dateStr = getTodayDateString(checkDate);
    const dayOfWeek = checkDate.getDay();
    const isApplicable = !targetDaysOfWeek || targetDaysOfWeek.includes(dayOfWeek);

    if (uniqueDates.includes(dateStr)) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else if (!isApplicable) {
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  // Calculate best streak
  let bestStreak = currentStreak;
  let tempStreak = 0;
  for (let i = 0; i < uniqueDates.length; i++) {
    if (i === 0) {
      tempStreak = 1;
    } else {
      const prev = new Date(uniqueDates[i - 1] + 'T00:00:00');
      const curr = new Date(uniqueDates[i] + 'T00:00:00');
      const diffDays = Math.round((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        tempStreak++;
      } else {
        tempStreak = 1;
      }
    }
    if (tempStreak > bestStreak) {
      bestStreak = tempStreak;
    }
  }

  return {
    currentStreak,
    bestStreak,
    totalCompleted,
    historyDates: uniqueDates,
  };
}

// ---------------- DAY & PROGRESS HELPERS ---------------- //

export function getDayProgress(userId: string, date: string = getTodayDateString()): DayProgress {
  const d = new Date(date + 'T00:00:00');
  const dayOfWeek = d.getDay();

  const routines = getRoutines(userId).filter(
    (r) => r.isActive && r.daysOfWeek.includes(dayOfWeek)
  );
  const activeRoutineIds = new Set(routines.map((r) => r.id));

  const allTasks = getTasks(userId).filter((t) => activeRoutineIds.has(t.routineId));
  const completions = getTaskCompletions(userId).filter(
    (c) => c.date === date && activeRoutineIds.has(c.routineId)
  );

  const totalTasks = allTasks.length;
  const completedTasks = completions.length;
  const percent = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

  const focusSessions = getFocusSessions(userId).filter((s) => s.date === date);
  const focusedSeconds = focusSessions.reduce((acc, s) => acc + s.durationSeconds, 0);

  return {
    date,
    totalTasks,
    completedTasks,
    percent,
    focusedSeconds,
  };
}

// ---------------- STARTER ONBOARDING TEMPLATES ---------------- //

export function initializeStarterData(userId: string, category: string = 'tudo'): void {
  const allDays = [0, 1, 2, 3, 4, 5, 6];
  const weekdays = [1, 2, 3, 4, 5];

  if (category === 'estudos') {
    const rStudies = createRoutine(userId, {
      name: 'Estudos & Foco',
      icon: 'book-open',
      description: 'Blocos de estudo, teoria e exercícios',
      startTime: '14:00',
      daysOfWeek: weekdays,
      isActive: true,
    });
    createTask(userId, {
      routineId: rStudies.id,
      name: 'Estudar matemática',
      time: '14:00',
      durationMinutes: 45,
      isHabit: false,
      notes: 'Resolução de exercícios e teoria',
    });
    createTask(userId, {
      routineId: rStudies.id,
      name: 'Fazer atividade',
      time: '15:00',
      durationMinutes: 40,
      isHabit: false,
      notes: 'Fixação de conteúdo',
    });
    createTask(userId, {
      routineId: rStudies.id,
      name: 'Revisão e anotações',
      time: '16:00',
      durationMinutes: 30,
      isHabit: true,
      notes: 'Leitura e resumo',
    });
    return;
  }

  if (category === 'treino') {
    const rWorkout = createRoutine(userId, {
      name: 'Treino & Saúde',
      icon: 'dumbbell',
      description: 'Condicionamento físico e energia diária',
      startTime: '07:00',
      daysOfWeek: weekdays,
      isActive: true,
    });
    createTask(userId, {
      routineId: rWorkout.id,
      name: 'Beber água e alongar',
      time: '07:00',
      durationMinutes: 10,
      isHabit: true,
    });
    createTask(userId, {
      routineId: rWorkout.id,
      name: 'Treinar',
      time: '07:30',
      durationMinutes: 50,
      isHabit: true,
      notes: 'Movimento e consistência',
    });
    return;
  }

  // Default: 'tudo' - Complete day organization
  // 1. Rotina da manhã
  const r1 = createRoutine(userId, {
    name: 'Rotina da Manhã',
    icon: 'sun',
    description: 'Começar o dia com clareza e ritmo saudável',
    startTime: '07:00',
    daysOfWeek: allDays,
    isActive: true,
  });
  createTask(userId, {
    routineId: r1.id,
    name: 'Arrumar a cama',
    time: '07:05',
    durationMinutes: 5,
    isHabit: true,
    notes: 'Primeira vitória do dia',
  });
  createTask(userId, {
    routineId: r1.id,
    name: 'Escovar os dentes',
    time: '07:15',
    durationMinutes: 10,
    isHabit: false,
  });
  createTask(userId, {
    routineId: r1.id,
    name: 'Café da manhã',
    time: '07:30',
    durationMinutes: 20,
    isHabit: false,
  });

  // 2. Estudos
  const r2 = createRoutine(userId, {
    name: 'Estudos',
    icon: 'book-open',
    description: 'Blocos de foco e desenvolvimento',
    startTime: '14:00',
    daysOfWeek: weekdays,
    isActive: true,
  });
  createTask(userId, {
    routineId: r2.id,
    name: 'Estudar matemática',
    time: '14:00',
    durationMinutes: 45,
    isHabit: false,
    notes: 'Resolução de listas e teoria',
  });
  createTask(userId, {
    routineId: r2.id,
    name: 'Fazer atividade',
    time: '15:00',
    durationMinutes: 40,
    isHabit: false,
    notes: 'Exercícios práticos e fixação',
  });

  // 3. Treino
  const r3 = createRoutine(userId, {
    name: 'Treino',
    icon: 'dumbbell',
    description: 'Atividade física para saúde e energia',
    startTime: '17:30',
    daysOfWeek: weekdays,
    isActive: true,
  });
  createTask(userId, {
    routineId: r3.id,
    name: 'Treinar',
    time: '17:30',
    durationMinutes: 50,
    isHabit: true,
    notes: 'Movimento e constância',
  });

  // 4. Casa
  const r4 = createRoutine(userId, {
    name: 'Casa',
    icon: 'home',
    description: 'Organização do espaço pessoal',
    startTime: '19:00',
    daysOfWeek: allDays,
    isActive: true,
  });
  createTask(userId, {
    routineId: r4.id,
    name: 'Organizar quarto',
    time: '19:00',
    durationMinutes: 15,
    isHabit: true,
  });

  // 5. Rotina da noite
  const r5 = createRoutine(userId, {
    name: 'Rotina da Noite',
    icon: 'moon',
    description: 'Desacelerar e preparar o dia seguinte',
    startTime: '21:30',
    daysOfWeek: allDays,
    isActive: true,
  });
  createTask(userId, {
    routineId: r5.id,
    name: 'Preparar coisas para amanhã',
    time: '21:30',
    durationMinutes: 15,
    isHabit: false,
    notes: 'Roupas e mochila alinhadas',
  });
  createTask(userId, {
    routineId: r5.id,
    name: 'Desconectar e relaxar',
    time: '22:00',
    durationMinutes: 20,
    isHabit: true,
    notes: 'Leitura leve sem telas',
  });
}
