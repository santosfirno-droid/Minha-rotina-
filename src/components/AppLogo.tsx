import React, { useState } from 'react';

interface AppLogoProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  withText?: boolean;
  textClassName?: string;
  subtitleClassName?: string;
  onClick?: () => void;
}

const sizeMap = {
  xs: 'w-7 h-7 rounded-xl',
  sm: 'w-8 h-8 rounded-xl',
  md: 'w-10 h-10 rounded-2xl',
  lg: 'w-14 h-14 rounded-2xl',
  xl: 'w-20 h-20 rounded-3xl',
};

export const AppLogo: React.FC<AppLogoProps> = ({
  className = '',
  size = 'md',
  withText = false,
  textClassName = '',
  subtitleClassName = '',
  onClick,
}) => {
  const [imgError, setImgError] = useState(false);
  const sizeClasses = sizeMap[size] || 'w-10 h-10 rounded-2xl';

  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-3 select-none ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      <div
        className={`${sizeClasses} overflow-hidden shadow-sm shrink-0 flex items-center justify-center bg-slate-950 border border-slate-900/60 transition-transform`}
      >
        {!imgError ? (
          <img
            src="/logo.png"
            alt="Minha Rotina Aí"
            className="w-full h-full object-cover select-none"
            onError={() => setImgError(true)}
            referrerPolicy="no-referrer"
          />
        ) : (
          <svg viewBox="0 0 512 512" fill="none" className="w-full h-full p-1.5">
            <defs>
              <linearGradient id="logo-arc-grad-comp" x1="80" y1="360" x2="400" y2="120" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#0080FF" />
                <stop offset="45%" stopColor="#00D2FF" />
                <stop offset="100%" stopColor="#00F5A0" />
              </linearGradient>
              <linearGradient id="logo-arrow-grad-comp" x1="340" y1="280" x2="400" y2="170" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#00D2FF" />
                <stop offset="100%" stopColor="#00F5A0" />
              </linearGradient>
            </defs>
            <path
              d="M 260 348 C 170 348 112 284 112 208 C 112 126 178 76 264 76 C 330 76 384 112 400 166"
              stroke="url(#logo-arc-grad-comp)"
              strokeWidth="38"
              strokeLinecap="round"
            />
            <path
              d="M 224 388 C 286 388 348 356 380 300 C 400 264 408 228 408 214"
              stroke="url(#logo-arc-grad-comp)"
              strokeWidth="38"
              strokeLinecap="round"
            />
            <path
              d="M 366 230 L 418 178 L 470 230"
              stroke="url(#logo-arrow-grad-comp)"
              strokeWidth="38"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <line
              x1="264"
              y1="148"
              x2="264"
              y2="198"
              stroke="url(#logo-arc-grad-comp)"
              strokeWidth="30"
              strokeLinecap="round"
            />
            <path
              d="M 200 236 L 256 292 L 328 220"
              stroke="url(#logo-arc-grad-comp)"
              strokeWidth="32"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </div>

      {withText && (
        <div className="min-w-0">
          <h1
            className={`font-extrabold text-base tracking-tight text-slate-900 leading-tight ${textClassName}`}
          >
            Minha Rotina Aí
          </h1>
          <p
            className={`text-[11px] text-slate-500 font-medium truncate ${subtitleClassName}`}
          >
            Organize seu dia. Viva no seu ritmo.
          </p>
        </div>
      )}
    </div>
  );
};
export default AppLogo;
