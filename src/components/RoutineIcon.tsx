import React from 'react';
import {
  Sun,
  Moon,
  BookOpen,
  Dumbbell,
  Home,
  Coffee,
  Briefcase,
  Laptop,
  Heart,
  Sparkles,
  Target,
  Clock,
  Compass,
  Activity,
  Feather,
  CheckCircle2,
  Smile,
  Zap,
  Flame,
  type LucideIcon,
} from 'lucide-react';

export interface RoutineIconOption {
  id: string;
  name: string;
  icon: LucideIcon;
}

export const ROUTINE_ICONS: RoutineIconOption[] = [
  { id: 'sun', name: 'Manhã', icon: Sun },
  { id: 'book-open', name: 'Estudos', icon: BookOpen },
  { id: 'dumbbell', name: 'Treino', icon: Dumbbell },
  { id: 'home', name: 'Casa', icon: Home },
  { id: 'moon', name: 'Noite', icon: Moon },
  { id: 'coffee', name: 'Pausa', icon: Coffee },
  { id: 'briefcase', name: 'Trabalho', icon: Briefcase },
  { id: 'laptop', name: 'Foco Digital', icon: Laptop },
  { id: 'heart', name: 'Saúde', icon: Heart },
  { id: 'sparkles', name: 'Autocuidado', icon: Sparkles },
  { id: 'target', name: 'Metas', icon: Target },
  { id: 'clock', name: 'Rotina', icon: Clock },
  { id: 'activity', name: 'Atividade', icon: Activity },
  { id: 'zap', name: 'Energia', icon: Zap },
  { id: 'feather', name: 'Equilíbrio', icon: Feather },
  { id: 'check-circle-2', name: 'Geral', icon: CheckCircle2 },
];

const EMOJI_MAPPING: Record<string, string> = {
  '🌅': 'sun',
  '☀️': 'sun',
  '🌞': 'sun',
  '📚': 'book-open',
  '📖': 'book-open',
  '🏋️': 'dumbbell',
  '💪': 'dumbbell',
  '🏃': 'activity',
  '🌙': 'moon',
  '⭐': 'sparkles',
  '✨': 'sparkles',
  '🏠': 'home',
  '🏡': 'home',
  '☕': 'coffee',
  '💼': 'briefcase',
  '💻': 'laptop',
  '❤️': 'heart',
  '🎯': 'target',
  '⚡': 'zap',
  '🔥': 'zap',
};

export function resolveIconId(iconKeyOrEmoji?: string): string {
  if (!iconKeyOrEmoji) return 'check-circle-2';
  // Check if direct id
  const direct = ROUTINE_ICONS.find((i) => i.id === iconKeyOrEmoji);
  if (direct) return direct.id;

  // Check if mapped from emoji
  if (EMOJI_MAPPING[iconKeyOrEmoji]) {
    return EMOJI_MAPPING[iconKeyOrEmoji];
  }

  return 'clock';
}

interface RoutineIconProps {
  icon?: string;
  className?: string;
}

export const RoutineIcon: React.FC<RoutineIconProps> = ({ icon, className = 'w-5 h-5' }) => {
  const iconId = resolveIconId(icon);
  const found = ROUTINE_ICONS.find((i) => i.id === iconId) || ROUTINE_ICONS[0];
  const IconComponent = found.icon;

  return <IconComponent className={className} />;
};
