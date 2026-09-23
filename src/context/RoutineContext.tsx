import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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
import {
  getRoutines,
  saveRoutines,
  createRoutine as apiCreateRoutine,
  updateRoutine as apiUpdateRoutine,
  deleteRoutine as apiDeleteRoutine,
  duplicateRoutine as apiDuplicateRoutine,
  getTasks,
  saveTasks,
  createTask as apiCreateTask,
  updateTask as apiUpdateTask,
  deleteTask as apiDeleteTask,
  getTaskCompletions,
  getHabitCompletions,
  toggleTaskCompletion,
  getFocusSessions,
  recordFocusSession,
  getTodayDateString,
  getDayProgress,
  calculateHabitStreak,
} from '../services/storage';
import { soundService } from '../services/sound';

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
  refreshData: () => void;
  // Routine actions
  addRoutine: (data: Omit<Routine, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'order'>) => Routine;
  editRoutine: (routine: Routine) => void;
  removeRoutine: (routineId: string) => void;
  cloneRoutine: (routineId: string) => void;
  toggleRoutineActive: (routineId: string) => void;
  // Task actions
  addTask: (data: Omit<RoutineTask, 'id' | 'userId' | 'createdAt' | 'order'>) => RoutineTask;
  editTask: (task: RoutineTask) => void;
  removeTask: (taskId: string) => void;
  reorderTasks: (routineId: string, newOrderedTasks: RoutineTask[]) => void;
  // Completion
  toggleTask: (taskId: string, routineId: string, isHabit?: boolean, targetDate?: string) => void;
  isTaskCompleted: (taskId: string, targetDate?: string) => boolean;
  // Habit helper
  getHabitStats: (taskId: string) => { currentStreak: number; bestStreak: number; totalCompleted: number; historyDates: string[] };
  // Timer
  activeTimer: ActiveTimer | null;
  startTimer: (task: RoutineTask, routine: Routine, mode?: 'stopwatch' | 'countdown') => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  stopTimer: (completeTask?: boolean) => void;
  minimizeTimer: () => void;
  showTimerModal: boolean;
  setShowTimerModal: (show: boolean) => void;
}

const RoutineContext = createContext<RoutineContextType | undefined>(undefined);

export const RoutineProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, settings } = useAuth();
  const todayDate = getTodayDateString();
  const [selectedDate, setSelectedDate] = useState<string>(todayDate);

  const [routines, setRoutines] = useState<Routine[]>([]);
  const [tasks, setTasks] = useState<RoutineTask[]>([]);
  const [taskCompletions, setTaskCompletions] = useState<TaskCompletion[]>([]);
  const [habitCompletions, setHabitCompletions] = useState<HabitCompletion[]>([]);
  const [focusSessions, setFocusSessions] = useState<FocusSession[]>([]);

  // Timer state
  const [activeTimer, setActiveTimer] = useState<ActiveTimer | null>(null);
  const [showTimerModal, setShowTimerModal] = useState<boolean>(false);

  // Sound service config
  useEffect(() => {
    soundService.setEnabled(settings.soundEnabled);
  }, [settings.soundEnabled]);

  const refreshData = useCallback(() => {
    if (!user) {
      setRoutines([]);
      setTasks([]);
      setTaskCompletions([]);
      setHabitCompletions([]);
      setFocusSessions([]);
      return;
    }
    const r = getRoutines(user.id);
    const t = getTasks(user.id);
    const tc = getTaskCompletions(user.id);
    const hc = getHabitCompletions(user.id);
    const fs = getFocusSessions(user.id);

    setRoutines(r);
    setTasks(t);
    setTaskCompletions(tc);
    setHabitCompletions(hc);
    setFocusSessions(fs);
  }, [user]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Current day progress
  const dayProgress = user ? getDayProgress(user.id, selectedDate) : {
    date: selectedDate,
    totalTasks: 0,
    completedTasks: 0,
    percent: 0,
    focusedSeconds: 0,
  };

  // Routine Handlers
  const addRoutine = (data: Omit<Routine, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'order'>) => {
    if (!user) throw new Error('Usuário não autenticado');
    const created = apiCreateRoutine(user.id, data);
    refreshData();
    return created;
  };

  const editRoutine = (routine: Routine) => {
    if (!user) return;
    apiUpdateRoutine(user.id, routine);
    refreshData();
  };

  const removeRoutine = (routineId: string) => {
    if (!user) return;
    apiDeleteRoutine(user.id, routineId);
    refreshData();
  };

  const cloneRoutine = (routineId: string) => {
    if (!user) return;
    apiDuplicateRoutine(user.id, routineId);
    refreshData();
  };

  const toggleRoutineActive = (routineId: string) => {
    if (!user) return;
    const routine = routines.find((r) => r.id === routineId);
    if (!routine) return;
    editRoutine({ ...routine, isActive: !routine.isActive });
  };

  // Task Handlers
  const addTask = (data: Omit<RoutineTask, 'id' | 'userId' | 'createdAt' | 'order'>) => {
    if (!user) throw new Error('Usuário não autenticado');
    const created = apiCreateTask(user.id, data);
    refreshData();
    return created;
  };

  const editTask = (task: RoutineTask) => {
    if (!user) return;
    apiUpdateTask(user.id, task);
    refreshData();
  };

  const removeTask = (taskId: string) => {
    if (!user) return;
    apiDeleteTask(user.id, taskId);
    refreshData();
  };

  const reorderTasks = (routineId: string, newOrderedTasks: RoutineTask[]) => {
    if (!user) return;
    const currentTasks = getTasks(user.id);
    const otherTasks = currentTasks.filter((t) => t.routineId !== routineId);

    const reorderedWithOrder = newOrderedTasks.map((t, idx) => ({
      ...t,
      order: idx,
    }));

    saveTasks(user.id, [...otherTasks, ...reorderedWithOrder]);
    refreshData();
  };

  // Completion check & toggle
  const isTaskCompleted = (taskId: string, targetDate: string = selectedDate) => {
    return taskCompletions.some((c) => c.taskId === taskId && c.date === targetDate);
  };

  const toggleTask = (
    taskId: string,
    routineId: string,
    isHabit: boolean = false,
    targetDate: string = selectedDate
  ) => {
    if (!user) return;
    const prevProgress = getDayProgress(user.id, targetDate);
    const result = toggleTaskCompletion(user.id, taskId, routineId, targetDate, isHabit);
    refreshData();

    if (result.completed) {
      soundService.playTaskComplete();

      // Check if this action completed the day
      const newProgress = getDayProgress(user.id, targetDate);
      if (newProgress.percent === 100 && prevProgress.percent < 100) {
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

  const getHabitStats = (taskId: string) => {
    if (!user) return { currentStreak: 0, bestStreak: 0, totalCompleted: 0, historyDates: [] };
    const task = tasks.find((t) => t.id === taskId);
    const routine = routines.find((r) => r.id === task?.routineId);
    return calculateHabitStreak(user.id, taskId, routine?.daysOfWeek);
  };

  // ---------------- TIMER IMPLEMENTATION ---------------- //

  // Interval ticker
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
            // Automatically stop timer when finished
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
        } else {
          return {
            ...prev,
            secondsElapsed: newElapsed,
          };
        }
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [activeTimer]);

  const startTimer = (
    task: RoutineTask,
    routine: Routine,
    preferredMode?: 'stopwatch' | 'countdown'
  ) => {
    const hasDuration = !!task.durationMinutes && task.durationMinutes > 0;
    const mode = preferredMode || (hasDuration ? 'countdown' : 'stopwatch');
    const targetSeconds = (task.durationMinutes || 25) * 60;

    setActiveTimer({
      taskId: task.id,
      taskName: task.name,
      routineId: routine.id,
      durationMinutes: task.durationMinutes,
      mode,
      targetSeconds,
      secondsLeft: targetSeconds,
      secondsElapsed: 0,
      isRunning: true,
      startedAt: Date.now(),
    });

    setShowTimerModal(true);
  };

  const pauseTimer = () => {
    setActiveTimer((prev) => (prev ? { ...prev, isRunning: false } : null));
  };

  const resumeTimer = () => {
    setActiveTimer((prev) => (prev ? { ...prev, isRunning: true } : null));
  };

  const minimizeTimer = () => {
    setShowTimerModal(false);
  };

  const stopTimer = (completeTask: boolean = true) => {
    if (!activeTimer || !user) {
      setActiveTimer(null);
      setShowTimerModal(false);
      return;
    }

    const elapsed = activeTimer.secondsElapsed;
    if (elapsed > 10) {
      // Record session
      recordFocusSession({
        userId: user.id,
        taskId: activeTimer.taskId,
        taskName: activeTimer.taskName,
        routineId: activeTimer.routineId,
        durationSeconds: elapsed,
        date: todayDate,
      });
    }

    if (completeTask) {
      const task = tasks.find((t) => t.id === activeTimer.taskId);
      if (task && !isTaskCompleted(task.id, todayDate)) {
        toggleTask(task.id, activeTimer.routineId, task.isHabit, todayDate);
      }
    }

    setActiveTimer(null);
    setShowTimerModal(false);
    refreshData();
  };

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
        refreshData,
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
