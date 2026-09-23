import React from 'react';
import { useRoutine } from '../context/RoutineContext';
import { formatSecondsToTime, formatDurationHuman } from '../utils/date';
import {
  Play,
  Pause,
  CheckCircle,
  X,
  Minimize2,
  Clock,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

export const TimerModal: React.FC = () => {
  const {
    activeTimer,
    showTimerModal,
    setShowTimerModal,
    pauseTimer,
    resumeTimer,
    stopTimer,
    minimizeTimer,
  } = useRoutine();

  if (!showTimerModal || !activeTimer) return null;

  const isCountdown = activeTimer.mode === 'countdown';
  const displaySeconds = isCountdown ? activeTimer.secondsLeft : activeTimer.secondsElapsed;

  // Progress for countdown
  const progressPercent = isCountdown && activeTimer.targetSeconds > 0
    ? Math.min(100, Math.round(((activeTimer.targetSeconds - activeTimer.secondsLeft) / activeTimer.targetSeconds) * 100))
    : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 relative text-center">
        {/* Top Header Actions */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={minimizeTimer}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Minimizar (o timer continua rodando)"
          >
            <Minimize2 className="w-5 h-5" />
          </button>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold">
            <span className={`w-2 h-2 rounded-full ${activeTimer.isRunning ? 'bg-blue-600 animate-ping' : 'bg-amber-500'}`}></span>
            {isCountdown ? 'Contagem Regressiva' : 'Cronômetro Foco'}
          </div>
          <button
            onClick={() => stopTimer(false)}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Cancelar cronômetro"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Task Info */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-slate-900 mb-1 leading-snug">
            {activeTimer.taskName}
          </h2>
          <p className="text-xs text-slate-500">
            Mantenha o foco. Cada minuto dedicado conta para o seu progresso.
          </p>
        </div>

        {/* Timer Display Display */}
        <div className="relative my-6 flex items-center justify-center">
          <div className="w-56 h-56 rounded-full border-8 border-slate-100 flex flex-col items-center justify-center relative shadow-inner bg-gradient-to-b from-slate-50/50 to-white">
            {/* SVG Ring for Countdown */}
            {isCountdown && (
              <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="44"
                  className="text-blue-500 stroke-current"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={276.46}
                  strokeDashoffset={276.46 - (276.46 * progressPercent) / 100}
                  strokeLinecap="round"
                />
              </svg>
            )}

            <span className="font-mono text-4xl font-extrabold tracking-tight text-slate-900">
              {formatSecondsToTime(displaySeconds)}
            </span>

            {isCountdown ? (
              <span className="text-xs font-semibold text-slate-500 mt-1">
                {progressPercent}% completado
              </span>
            ) : (
              <span className="text-xs font-semibold text-slate-500 mt-1">
                Tempo acumulado
              </span>
            )}
          </div>
        </div>

        {/* Stats banner */}
        <div className="mb-6 py-2 px-4 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-around text-xs text-slate-600">
          <div>
            <span className="text-slate-400 block">Tempo dedicado</span>
            <span className="font-bold text-slate-800">{formatDurationHuman(activeTimer.secondsElapsed)}</span>
          </div>
          <div className="h-6 w-px bg-slate-200"></div>
          <div>
            <span className="text-slate-400 block">Status</span>
            <span className={`font-bold ${activeTimer.isRunning ? 'text-emerald-600' : 'text-amber-600'}`}>
              {activeTimer.isRunning ? 'Em andamento' : 'Pausado'}
            </span>
          </div>
        </div>

        {/* Primary Controls */}
        <div className="flex items-center gap-3 justify-center mb-3">
          {activeTimer.isRunning ? (
            <button
              onClick={pauseTimer}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 px-5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl transition-all cursor-pointer"
            >
              <Pause className="w-5 h-5" />
              <span>PAUSAR</span>
            </button>
          ) : (
            <button
              onClick={resumeTimer}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 px-5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-sm hover:shadow transition-all cursor-pointer"
            >
              <Play className="w-5 h-5 fill-current" />
              <span>CONTINUAR</span>
            </button>
          )}

          <button
            onClick={() => stopTimer(true)}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 px-5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold rounded-2xl shadow-sm hover:shadow transition-all cursor-pointer"
          >
            <CheckCircle className="w-5 h-5" />
            <span>FINALIZAR</span>
          </button>
        </div>

        <button
          onClick={minimizeTimer}
          className="text-xs text-slate-400 hover:text-slate-600 underline font-medium cursor-pointer"
        >
          Minimizar cronômetro e navegar no app
        </button>
      </div>
    </div>
  );
};

export const FloatingTimerPill: React.FC = () => {
  const { activeTimer, showTimerModal, setShowTimerModal, pauseTimer, resumeTimer } = useRoutine();

  if (!activeTimer || showTimerModal) return null;

  const displaySeconds = activeTimer.mode === 'countdown' ? activeTimer.secondsLeft : activeTimer.secondsElapsed;

  return (
    <div
      onClick={() => setShowTimerModal(true)}
      className="fixed bottom-20 md:bottom-6 right-4 md:right-8 z-40 flex items-center gap-3 bg-slate-900 text-white py-2.5 px-4 rounded-full shadow-xl border border-slate-700 cursor-pointer hover:scale-105 active:scale-95 transition-all"
    >
      <span className={`w-2.5 h-2.5 rounded-full ${activeTimer.isRunning ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
      <div className="flex flex-col text-left">
        <span className="text-[11px] text-slate-300 font-medium max-w-[130px] truncate">
          {activeTimer.taskName}
        </span>
        <span className="font-mono text-sm font-bold leading-none">
          {formatSecondsToTime(displaySeconds)}
        </span>
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation();
          if (activeTimer.isRunning) pauseTimer();
          else resumeTimer();
        }}
        className="ml-1 p-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
      >
        {activeTimer.isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
      </button>
    </div>
  );
};
