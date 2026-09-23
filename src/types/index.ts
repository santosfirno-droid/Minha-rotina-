export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  securityQuestion?: string;
  securityAnswer?: string;
  createdAt: string;
}

export interface UserSettings {
  userId: string;
  theme: 'light' | 'dark' | 'system';
  startOfWeek: 0 | 1; // 0: Sunday, 1: Monday
  timeFormat: '24h' | '12h';
  soundEnabled: boolean;
  notificationsEnabled: boolean;
  celebrationEnabled: boolean;
}

export interface RoutineTask {
  id: string;
  routineId: string;
  userId: string;
  name: string;
  time?: string; // HH:mm e.g. "07:30"
  durationMinutes?: number; // e.g. 15
  isHabit: boolean;
  notes?: string;
  order: number;
  createdAt: string;
}

export interface Routine {
  id: string;
  userId: string;
  name: string;
  icon: string; // emoji or icon key e.g. "🌅"
  description?: string;
  startTime?: string; // e.g. "07:00"
  daysOfWeek: number[]; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  isActive: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface TaskCompletion {
  id: string;
  taskId: string;
  routineId: string;
  userId: string;
  date: string; // YYYY-MM-DD
  completedAt: string; // ISO timestamp
  focusedSeconds?: number;
}

export interface HabitCompletion {
  id: string;
  taskId: string;
  routineId: string;
  userId: string;
  date: string; // YYYY-MM-DD
  completedAt: string;
}

export interface FocusSession {
  id: string;
  taskId: string;
  taskName: string;
  routineId: string;
  userId: string;
  durationSeconds: number;
  date: string; // YYYY-MM-DD
  createdAt: string;
}

export interface DayProgress {
  date: string; // YYYY-MM-DD
  totalTasks: number;
  completedTasks: number;
  percent: number;
  focusedSeconds: number;
}

export type ActiveTab = 'hoje' | 'rotinas' | 'progresso' | 'calendario' | 'perfil';

export interface ActiveTimer {
  taskId: string;
  taskName: string;
  routineId: string;
  durationMinutes?: number;
  mode: 'stopwatch' | 'countdown';
  targetSeconds: number;
  secondsLeft: number;
  secondsElapsed: number;
  isRunning: boolean;
  startedAt?: number;
}
