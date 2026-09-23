import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import confetti from 'canvas-confetti';
import {
  Routine,
  RoutineTask,
  TaskCompletion,
  HabitCompletion,
  FocusSession,
  DayProgress,
  ActiveTimer,
} from '../types';
import { useAuth } from './AuthContext';
import { soundService } from '../services/sound';
import {
  testSupabaseConnection,
  SupabaseConnectionResult,
} from '../services/supabase';
import {
  getTodayDateString,
  fetchDbRoutines,
  createDbRoutine,
  updateDbRoutine,
  deleteDbRoutine,
  reorderDbRoutines,
  fetchDbTasks,
  createDbTask,
  updateDbTask,
  deleteDbTask,
  reorderDbTasks,
  fetchDbCompletions,
  toggleDbTaskCompletion,
  fetchDbFocusSessions,
  recordDbFocusSession,
  insertStarterRoutinesForUser,
} from '../services/supabaseDb';

interface RoutineContextType {
  routines: Routine[];
  tasks: RoutineTask[];
  taskCompletions: TaskCompletion[];
  habitCompletions: HabitCompletion[];
  focusSessions: FocusSession[];
  todayDate: string;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  dayProgress: DayProgress;
  isLoadingData: boolean;
  refreshData: () => Promise<void>;
  // Supabase cloud sync
  supabaseStatus: SupabaseConnectionResult | null;
  isSyncing: boolean;
  lastSyncedAt: string | null;
  checkSupabase: () => Promise<void>;
  syncNow: (direction?: 'push' | 'pull') => Promise<{ success: boolean; message: string }>;
  // Routine actions
  addRoutine: (data: Omit<Routine, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'order'>) => Promise<Routine>;
  editRoutine: (routine: Routine) => Promise<void>;
  removeRoutine: (routineId: string) => Promise<void>;
  cloneRoutine: (routineId: string) => Promise<void>;
  toggleRoutineActive: (routineId: string) => Promise<void>;
  // Task actions
  addTask: (data: Omit<RoutineTask, 'id' | 'userId' | 'createdAt' | 'order'>) => Promise<RoutineTask>;
  editTask: (task: RoutineTask) => Promise<void>;
  removeTask: (taskId: string) => Promise<void>;
  reorderTasks: (routineId: string, newOrderedTasks: RoutineTask[]) => Promise<void>;
  // Completion
  toggleTask: (taskId: string, routineId: string, isHabit?: boolean, targetDate?: string) => Promise<void>;
  isTaskCompleted: (taskId: string, targetDate?: string) => boolean;
  getDayProgressForDate: (targetDate: string) => DayProgress;
  // Habit helper
  getHabitStats: (taskId: string) => { currentStreak: number; bestStreak: number; totalCompleted: number; historyDates: string[] };
  // Timer
  activeTimer: ActiveTimer | null;
  startTimer: (task: RoutineTask, routine: Routine, mode?: 'stopwatch' | 'countdown') => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  stopTimer: (completeTask?: boolean) => Promise<void>;
  minimizeTimer: () => void;
  showTimerModal: boolean;
  setShowTimerModal: (show: boolean) => void;
}

const RoutineContext = createContext<RoutineContextType | undefined>(undefined);

export const RoutineProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, settings } = useAuth();
  const todayDate = useMemo(() => getTodayDateString(), []);
  const [selectedDate, setSelectedDate] = useState<string>(todayDate);

  const [routines, setRoutines] = useState<Routine[]>([]);
  const [tasks, setTasks] = useState<RoutineTask[]>([]);
  const [taskCompletions, setTaskCompletions] = useState<TaskCompletion[]>([]);
  const [focusSessions, setFocusSessions] = useState<FocusSession[]>([]);
  const [isLoadingData, setIsLoadingData] = useState<boolean>(true);

  // Timer state
  const [activeTimer, setActiveTimer] = useState<ActiveTimer | null>(null);
  const [showTimerModal, setShowTimerModal] = useState<boolean>(false);

  // Supabase state
  const [supabaseStatus, setSupabaseStatus] = useState<SupabaseConnectionResult | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);

  // Sound service config
  useEffect(() => {
    soundService.setEnabled(settings.soundEnabled);
  }, [settings.soundEnabled]);

  // Check Supabase connection
  const checkSupabase = useCallback(async () => {
    try {
      const res = await testSupabaseConnection();
      setSupabaseStatus(res);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    checkSupabase();
  }, [checkSupabase]);

  // Load all user data from Supabase
  const loadUserData = useCallback(async () => {
    if (!user) {
      setRoutines([]);
      setTasks([]);
      setTaskCompletions([]);
      setFocusSessions([]);
      setIsLoadingData(false);
      return;
    }

    setIsLoadingData(true);
    try {
      const [fetchedRoutines, fetchedTasks, fetchedCompletions, fetchedSessions] =
        await Promise.all([
          fetchDbRoutines(user.id),
          fetchDbTasks(user.id),
          fetchDbCompletions(user.id),
          fetchDbFocusSessions(user.id),
        ]);

      // If user has 0 routines, automatically seed starter routines in Supabase
      if (fetchedRoutines.length === 0) {
        try {
          await insertStarterRoutinesForUser(user.id, 'tudo');
          const [seededRoutines, seededTasks] = await Promise.all([
            fetchDbRoutines(user.id),
            fetchDbTasks(user.id),
          ]);
          setRoutines(seededRoutines);
          setTasks(seededTasks);
        } catch (seedErr) {
          console.warn('Error seeding starter routines:', seedErr);
          setRoutines(fetchedRoutines);
          setTasks(fetchedTasks);
        }
      } else {
        setRoutines(fetchedRoutines);
        setTasks(fetchedTasks);
      }

      setTaskCompletions(fetchedCompletions);
      setFocusSessions(fetchedSessions);

      const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setLastSyncedAt(nowStr);
    } catch (err) {
      console.error('Error loading data from Supabase:', err);
    } finally {
      setIsLoadingData(false);
    }
  }, [user]);

  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  // Restore Active Timer from LocalStorage if page was refreshed
  useEffect(() => {
    if (!user) {
      setActiveTimer(null);
      return;
    }

    try {
      const savedTimerRaw = localStorage.getItem(`minha_rotina_timer_${user.id}`);
      if (savedTimerRaw) {
        const saved = JSON.parse(savedTimerRaw);
        if (saved && saved.taskId) {
          const now = Date.now();
          const elapsedDelta = saved.isRunning && saved.savedAt
            ? Math.floor((now - saved.savedAt) / 1000)
            : 0;

          const updatedElapsed = saved.secondsElapsed + elapsedDelta;
          let updatedLeft = saved.secondsLeft;
          if (saved.mode === 'countdown') {
            updatedLeft = Math.max(0, saved.secondsLeft - elapsedDelta);
          }

          setActiveTimer({
            ...saved,
            secondsElapsed: updatedElapsed,
            secondsLeft: updatedLeft,
          });
        }
      }
    } catch (e) {
      console.warn('Failed to restore active timer:', e);
    }
  }, [user]);

  // Persist Active Timer on changes
  useEffect(() => {
    if (!user) return;
    if (activeTimer) {
      localStorage.setItem(
        `minha_rotina_timer_${user.id}`,
        JSON.stringify({ ...activeTimer, savedAt: Date.now() })
      );
    } else {
      localStorage.removeItem(`minha_rotina_timer_${user.id}`);
    }
  }, [activeTimer, user]);

  // Manual sync function
  const syncNow = async (_direction: 'push' | 'pull' = 'pull') => {
    if (!user) return { success: false, message: 'Usuário não conectado.' };
    setIsSyncing(true);
    try {
      await loadUserData();
      const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setLastSyncedAt(nowStr);
      return { success: true, message: 'Dados sincronizados com o Supabase com sucesso!' };
    } catch (err: any) {
      return { success: false, message: err?.message || 'Erro durante sincronização.' };
    } finally {
      setIsSyncing(false);
    }
  };

  // Calculate day progress for any specific date
  const getDayProgressForDate = useCallback(
    (targetDate: string): DayProgress => {
      const d = new Date(targetDate + 'T12:00:00');
      const dayOfWeek = d.getDay();

      const activeRoutines = routines.filter(
        (r) => r.isActive && r.daysOfWeek.includes(dayOfWeek)
      );
      const activeRoutineIds = new Set(activeRoutines.map((r) => r.id));

      const dailyTasks = tasks.filter((t) => activeRoutineIds.has(t.routineId));
      const dailyCompletions = taskCompletions.filter(
        (c) => c.date === targetDate && activeRoutineIds.has(c.routineId)
      );

      const totalTasks = dailyTasks.length;
      const completedTasks = dailyCompletions.length;
      const percent = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

      const dailyFocus = focusSessions.filter((s) => s.date === targetDate);
      const focusedSeconds = dailyFocus.reduce((acc, s) => acc + s.durationSeconds, 0);

      return {
        date: targetDate,
        totalTasks,
        completedTasks,
        percent,
        focusedSeconds,
      };
    },
    [routines, tasks, taskCompletions, focusSessions]
  );

  const dayProgress = useMemo(() => {
    return getDayProgressForDate(selectedDate);
  }, [getDayProgressForDate, selectedDate]);

  // Routine Handlers
  const addRoutine = async (
    data: Omit<Routine, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'order'>
  ): Promise<Routine> => {
    if (!user) throw new Error('Usuário não autenticado');
    const created = await createDbRoutine(user.id, data, routines.length);
    setRoutines((prev) => [...prev, created]);
    return created;
  };

  const editRoutine = async (routine: Routine): Promise<void> => {
    if (!user) return;
    setRoutines((prev) => prev.map((r) => (r.id === routine.id ? routine : r)));
    await updateDbRoutine(user.id, routine);
  };

  const removeRoutine = async (routineId: string): Promise<void> => {
    if (!user) return;
    setRoutines((prev) => prev.filter((r) => r.id !== routineId));
    setTasks((prev) => prev.filter((t) => t.routineId !== routineId));
    setTaskCompletions((prev) => prev.filter((c) => c.routineId !== routineId));
    await deleteDbRoutine(user.id, routineId);
  };

  const cloneRoutine = async (routineId: string): Promise<void> => {
    if (!user) return;
    const original = routines.find((r) => r.id === routineId);
    if (!original) return;

    const cloned = await createDbRoutine(
      user.id,
      {
        name: `${original.name} (Cópia)`,
        icon: original.icon,
        description: original.description,
        startTime: original.startTime,
        daysOfWeek: [...original.daysOfWeek],
        isActive: original.isActive,
      },
      routines.length
    );

    setRoutines((prev) => [...prev, cloned]);

    // Clone all tasks in that routine
    const routineTasks = tasks.filter((t) => t.routineId === routineId);
    for (let i = 0; i < routineTasks.length; i++) {
      const origTask = routineTasks[i];
      const clonedTask = await createDbTask(
        user.id,
        {
          routineId: cloned.id,
          name: origTask.name,
          time: origTask.time,
          durationMinutes: origTask.durationMinutes,
          isHabit: origTask.isHabit,
          notes: origTask.notes,
        },
        i
      );
      setTasks((prev) => [...prev, clonedTask]);
    }
  };

  const toggleRoutineActive = async (routineId: string): Promise<void> => {
    if (!user) return;
    const routine = routines.find((r) => r.id === routineId);
    if (!routine) return;
    const updated = { ...routine, isActive: !routine.isActive };
    await editRoutine(updated);
  };

  // Task Handlers
  const addTask = async (
    data: Omit<RoutineTask, 'id' | 'userId' | 'createdAt' | 'order'>
  ): Promise<RoutineTask> => {
    if (!user) throw new Error('Usuário não autenticado');
    const routineTasks = tasks.filter((t) => t.routineId === data.routineId);
    const created = await createDbTask(user.id, data, routineTasks.length);
    setTasks((prev) => [...prev, created]);
    return created;
  };

  const editTask = async (task: RoutineTask): Promise<void> => {
    if (!user) return;
    setTasks((prev) => prev.map((t) => (t.id === task.id ? task : t)));
    await updateDbTask(user.id, task);
  };

  const removeTask = async (taskId: string): Promise<void> => {
    if (!user) return;
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    setTaskCompletions((prev) => prev.filter((c) => c.taskId !== taskId));
    await deleteDbTask(user.id, taskId);
  };

  const reorderTasks = async (routineId: string, newOrderedTasks: RoutineTask[]): Promise<void> => {
    if (!user) return;
    const otherTasks = tasks.filter((t) => t.routineId !== routineId);
    const reordered = newOrderedTasks.map((t, idx) => ({ ...t, order: idx }));
    setTasks([...otherTasks, ...reordered]);
    await reorderDbTasks(user.id, reordered);
  };

  // Completion check & toggle
  const isTaskCompleted = useCallback(
    (taskId: string, targetDate: string = selectedDate) => {
      return taskCompletions.some((c) => c.taskId === taskId && c.date === targetDate);
    },
    [taskCompletions, selectedDate]
  );

  const toggleTask = async (
    taskId: string,
    routineId: string,
    _isHabit: boolean = false,
    targetDate: string = selectedDate
  ): Promise<void> => {
    if (!user) return;

    const prevProgress = getDayProgressForDate(targetDate);
    const alreadyCompleted = isTaskCompleted(taskId, targetDate);

    // Optimistic state update
    if (alreadyCompleted) {
      setTaskCompletions((prev) =>
        prev.filter((c) => !(c.taskId === taskId && c.date === targetDate))
      );
    } else {
      const tempCompletion: TaskCompletion = {
        id: 'comp_' + Date.now(),
        taskId,
        routineId,
        userId: user.id,
        date: targetDate,
        completedAt: new Date().toISOString(),
        focusedSeconds: 0,
      };
      setTaskCompletions((prev) => [...prev, tempCompletion]);
    }

    // Persist to Supabase
    try {
      const res = await toggleDbTaskCompletion(
        user.id,
        taskId,
        routineId,
        targetDate,
        alreadyCompleted
      );

      if (!alreadyCompleted && res.completion) {
        // Replace temp id with real id if generated
        setTaskCompletions((prev) =>
          prev.map((c) =>
            c.taskId === taskId && c.date === targetDate ? res.completion! : c
          )
        );
      }
    } catch (err) {
      console.error('Error toggling completion in Supabase:', err);
    }

    if (!alreadyCompleted) {
      soundService.playTaskComplete();

      // Check if this action completed 100% of the day
      const activeRoutines = routines.filter((r) => {
        const d = new Date(targetDate + 'T12:00:00');
        return r.isActive && r.daysOfWeek.includes(d.getDay());
      });
      const activeRoutineIds = new Set(activeRoutines.map((r) => r.id));
      const dailyTasks = tasks.filter((t) => activeRoutineIds.has(t.routineId));
      const totalCount = dailyTasks.length;

      // Previous completed count + 1
      const newCompletedCount =
        taskCompletions.filter(
          (c) => c.date === targetDate && activeRoutineIds.has(c.routineId)
        ).length + 1;

      const newPercent = totalCount === 0 ? 0 : Math.round((newCompletedCount / totalCount) * 100);

      if (newPercent === 100 && prevProgress.percent < 100) {
        soundService.playCelebration();
        if (settings.celebrationEnabled) {
          try {
            confetti({
              particleCount: 80,
              spread: 70,
              origin: { y: 0.65 },
              colors: ['#2563eb', '#3b82f6', '#10b981', '#f59e0b', '#ec4899'],
            });
          } catch {
            // ignore
          }
        }
      }
    }
  };

  // Habit Streak calculation directly from real Supabase task_completions
  const getHabitStats = useCallback(
    (taskId: string) => {
      const relevantCompletions = taskCompletions.filter((c) => c.taskId === taskId);
      const uniqueDates = Array.from(new Set(relevantCompletions.map((c) => c.date))).sort();

      const totalCompleted = uniqueDates.length;
      if (totalCompleted === 0) {
        return { currentStreak: 0, bestStreak: 0, totalCompleted: 0, historyDates: [] };
      }

      const task = tasks.find((t) => t.id === taskId);
      const routine = routines.find((r) => r.id === task?.routineId);
      const targetDaysOfWeek = routine?.daysOfWeek;

      let currentStreak = 0;
      let checkDate = new Date();
      const todayStr = getTodayDateString(checkDate);

      const todayCompleted = uniqueDates.includes(todayStr);
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
    },
    [taskCompletions, tasks, routines]
  );

  // ---------------- TIMER IMPLEMENTATION ---------------- //

  useEffect(() => {
    if (!activeTimer || !activeTimer.isRunning) return;

    const interval = setInterval(() => {
      setActiveTimer((prev) => {
        if (!prev || !prev.isRunning) return prev;

        const newElapsed = prev.secondsElapsed + 1;

        if (prev.mode === 'countdown') {
          const newLeft = Math.max(0, prev.secondsLeft - 1);
          if (newLeft === 0) {
            soundService.playTimerDone();
            return {
              ...prev,
              secondsElapsed: newElapsed,
              secondsLeft: 0,
              isRunning: false,
            };
          }
          return {
            ...prev,
            secondsElapsed: newElapsed,
            secondsLeft: newLeft,
          };
        }

        return {
          ...prev,
          secondsElapsed: newElapsed,
        };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [activeTimer?.isRunning]);

  const startTimer = (
    task: RoutineTask,
    routine: Routine,
    mode: 'stopwatch' | 'countdown' = 'countdown'
  ) => {
    const duration = task.durationMinutes || 25;
    const targetSeconds = duration * 60;

    setActiveTimer({
      taskId: task.id,
      taskName: task.name,
      routineId: routine.id,
      durationMinutes: duration,
      mode,
      targetSeconds,
      secondsLeft: targetSeconds,
      secondsElapsed: 0,
      isRunning: true,
      startedAt: Date.now(),
    });
    setShowTimerModal(true);
    soundService.playTimerStart();
  };

  const pauseTimer = () => {
    if (!activeTimer) return;
    setActiveTimer((prev) => (prev ? { ...prev, isRunning: false } : null));
  };

  const resumeTimer = () => {
    if (!activeTimer) return;
    setActiveTimer((prev) => (prev ? { ...prev, isRunning: true } : null));
    soundService.playTimerStart();
  };

  const stopTimer = async (completeTask: boolean = true): Promise<void> => {
    if (!activeTimer || !user) return;
    const elapsed = activeTimer.secondsElapsed;

    // Record focus session to Supabase if ran for more than 5 seconds
    if (elapsed >= 5) {
      try {
        const savedSession = await recordDbFocusSession(user.id, {
          taskId: activeTimer.taskId,
          taskName: activeTimer.taskName,
          routineId: activeTimer.routineId,
          durationSeconds: elapsed,
          date: todayDate,
        });
        setFocusSessions((prev) => [savedSession, ...prev]);
      } catch (err) {
        console.error('Error saving focus session:', err);
      }
    }

    // Complete task if requested
    if (completeTask && !isTaskCompleted(activeTimer.taskId, todayDate)) {
      await toggleTask(activeTimer.taskId, activeTimer.routineId, false, todayDate);
    }

    setActiveTimer(null);
    setShowTimerModal(false);
    localStorage.removeItem(`minha_rotina_timer_${user.id}`);
  };

  const minimizeTimer = () => {
    setShowTimerModal(false);
  };

  // Convert completions to habitCompletions view compatibility
  const habitCompletions: HabitCompletion[] = useMemo(() => {
    return taskCompletions.map((c) => ({
      id: c.id,
      taskId: c.taskId,
      routineId: c.routineId,
      userId: c.userId,
      date: c.date,
      completedAt: c.completedAt,
    }));
  }, [taskCompletions]);

  return (
    <RoutineContext.Provider
      value={{
        routines,
        tasks,
        taskCompletions,
        habitCompletions,
        focusSessions,
        todayDate,
        selectedDate,
        setSelectedDate,
        dayProgress,
        isLoadingData,
        refreshData: loadUserData,
        supabaseStatus,
        isSyncing,
        lastSyncedAt,
        checkSupabase,
        syncNow,
        addRoutine,
        editRoutine,
        removeRoutine,
        cloneRoutine,
        toggleRoutineActive,
        addTask,
        editTask,
        removeTask,
        reorderTasks,
        toggleTask,
        isTaskCompleted,
        getDayProgressForDate,
        getHabitStats,
        activeTimer,
        startTimer,
        pauseTimer,
        resumeTimer,
        stopTimer,
        minimizeTimer,
        showTimerModal,
        setShowTimerModal,
      }}
    >
      {children}
    </RoutineContext.Provider>
  );
};

export const useRoutine = () => {
  const ctx = useContext(RoutineContext);
  if (!ctx) {
    throw new Error('useRoutine must be used within a RoutineProvider');
  }
  return ctx;
};
