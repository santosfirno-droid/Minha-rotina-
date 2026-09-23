import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Sun, Moon } from 'lucide-react';

interface ThemeToggleProps {
  variant?: 'icon' | 'compact' | 'pill' | 'switch';
  className?: string;
  showLabel?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  variant = 'icon',
  className = '',
  showLabel = false,
}) => {
  const { settings, toggleTheme } = useAuth();
  const isDark = settings.theme === 'dark';

  if (variant === 'pill') {
    return (
      <button
        type="button"
        onClick={() => toggleTheme()}
        aria-label={isDark ? 'Ativar modo claro' : 'Ativar modo escuro'}
        title={isDark ? 'Mudar para modo claro' : 'Mudar para modo escuro'}
        className={`flex items-center justify-between gap-3 w-full p-2.5 rounded-2xl border transition-all cursor-pointer select-none ${
          isDark
            ? 'bg-slate-800/90 border-slate-700/80 text-slate-100 hover:bg-slate-800 hover:border-slate-600 shadow-xs'
            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
        } ${className}`}
      >
        <div className="flex items-center gap-2.5">
          <div
            className={`w-7 h-7 rounded-xl flex items-center justify-center transition-all ${
              isDark
                ? 'bg-amber-500/20 text-amber-400'
                : 'bg-blue-100 text-blue-600'
            }`}
          >
            {isDark ? (
              <Sun className="w-4 h-4 transition-transform rotate-0 duration-300" />
            ) : (
              <Moon className="w-4 h-4 transition-transform rotate-0 duration-300" />
            )}
          </div>
          <span className="text-xs font-semibold">
            {isDark ? 'Modo Escuro' : 'Modo Claro'}
          </span>
        </div>

        {/* Switch track indicator */}
        <div
          className={`w-10 h-5.5 rounded-full transition-colors relative flex items-center px-0.5 ${
            isDark ? 'bg-blue-600' : 'bg-slate-300'
          }`}
        >
          <div
            className={`w-4.5 h-4.5 rounded-full bg-white shadow-xs transition-transform duration-200 flex items-center justify-center ${
              isDark ? 'translate-x-4.5' : 'translate-x-0'
            }`}
          >
            {isDark ? (
              <Moon className="w-2.5 h-2.5 text-blue-700" />
            ) : (
              <Sun className="w-2.5 h-2.5 text-amber-500" />
            )}
          </div>
        </div>
      </button>
    );
  }

  if (variant === 'switch') {
    return (
      <button
        type="button"
        role="switch"
        aria-checked={isDark}
        onClick={() => toggleTheme()}
        title={isDark ? 'Mudar para modo claro' : 'Mudar para modo escuro'}
        className={`w-12 h-7 rounded-full transition-colors relative flex items-center px-1 cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-blue-500/40 ${
          isDark ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'
        } ${className}`}
      >
        <div
          className={`w-5 h-5 rounded-full bg-white shadow-xs transition-transform duration-200 flex items-center justify-center ${
            isDark ? 'translate-x-5' : 'translate-x-0'
          }`}
        >
          {isDark ? (
            <Moon className="w-3 h-3 text-blue-600" />
          ) : (
            <Sun className="w-3 h-3 text-amber-500" />
          )}
        </div>
      </button>
    );
  }

  // Default: 'icon' / 'compact'
  const isCompact = variant === 'compact';
  return (
    <button
      type="button"
      onClick={() => toggleTheme()}
      aria-label={isDark ? 'Ativar modo claro' : 'Ativar modo escuro'}
      title={isDark ? 'Mudar para modo claro' : 'Mudar para modo escuro'}
      className={`group relative flex items-center justify-center rounded-2xl transition-all cursor-pointer select-none active:scale-95 border ${
        isCompact ? 'w-8 h-8' : 'w-10 h-10'
      } ${
        isDark
          ? 'bg-slate-800/90 border-slate-700/80 text-amber-400 hover:bg-slate-800 hover:border-amber-400/40 hover:text-amber-300 shadow-sm'
          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 shadow-xs'
      } ${className}`}
    >
      <div className="relative flex items-center justify-center">
        {isDark ? (
          <Sun className="w-4.5 h-4.5 transition-transform duration-300 group-hover:rotate-45" />
        ) : (
          <Moon className="w-4.5 h-4.5 transition-transform duration-300 group-hover:-rotate-12" />
        )}
      </div>

      {showLabel && (
        <span className="ml-2 text-xs font-semibold text-slate-700 dark:text-slate-200">
          {isDark ? 'Escuro' : 'Claro'}
        </span>
      )}
    </button>
  );
};
export default ThemeToggle;
