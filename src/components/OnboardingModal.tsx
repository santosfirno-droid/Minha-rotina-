import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRoutine } from '../context/RoutineContext';
import { insertStarterRoutinesForUser } from '../services/supabaseDb';
import { AppLogo } from './AppLogo';
import {
  Sparkles,
  Check,
  ArrowRight,
  BookOpen,
  Briefcase,
  Dumbbell,
  Home,
  Sprout,
  Compass,
  Loader2,
  type LucideIcon,
} from 'lucide-react';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface OnboardingOption {
  id: string;
  title: string;
  icon: LucideIcon;
  desc: string;
}

const ONBOARDING_OPTIONS: OnboardingOption[] = [
  {
    id: 'estudos',
    title: 'Estudos',
    icon: BookOpen,
    desc: 'Blocos de estudo focado, revisões de matérias e exercícios',
  },
  {
    id: 'trabalho',
    title: 'Trabalho & Foco',
    icon: Briefcase,
    desc: 'Prioridades do dia, pausas produtivas e organização profissional',
  },
  {
    id: 'treino',
    title: 'Saúde e Treino',
    icon: Dumbbell,
    desc: 'Exercícios físicos diários, hidratação constante e autocuidado',
  },
  {
    id: 'casa',
    title: 'Casa e Vida Pessoal',
    icon: Home,
    desc: 'Organização do lar, cuidados pessoais e preparação para o dia seguinte',
  },
  {
    id: 'habitos',
    title: 'Hábitos e Disciplina',
    icon: Sprout,
    desc: 'Sequências diárias de hábitos saudáveis, leitura e constância',
  },
  {
    id: 'tudo',
    title: 'Rotina Completa',
    icon: Sparkles,
    desc: 'Equilíbrio ideal entre manhã ativa, tarefas de foco, treino e noite',
  },
];

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const { refreshData } = useRoutine();
  const [selectedCategory, setSelectedCategory] = useState('tudo');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !user) return null;

  const handleFinish = async () => {
    setIsSubmitting(true);
    try {
      await insertStarterRoutinesForUser(user.id, selectedCategory);
      await refreshData();
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 md:p-8 shadow-2xl border border-slate-100">
        <div className="text-center mb-6 flex flex-col items-center">
          <AppLogo size="lg" className="mb-3" />
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Vamos organizar sua rotina?
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Qual é seu principal foco com o Minha Rotina Aí?
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-6">
          {ONBOARDING_OPTIONS.map((opt) => {
            const isSelected = selectedCategory === opt.id;
            const Icon = opt.icon;
            return (
              <div
                key={opt.id}
                onClick={() => setSelectedCategory(opt.id)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'border-blue-600 bg-blue-50/70 shadow-xs'
                    : 'border-slate-200/80 bg-white hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                      isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  {isSelected && (
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </span>
                  )}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">{opt.title}</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{opt.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        <p className="text-center text-xs text-slate-400 mb-6">
          Criaremos blocos iniciais para você começar agora mesmo. Você poderá editar tudo a qualquer momento.
        </p>

        <button
          onClick={handleFinish}
          disabled={isSubmitting}
          className="w-full py-3.5 px-6 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-60"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Preparando rotinas...</span>
            </>
          ) : (
            <>
              <span>Começar agora</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};
