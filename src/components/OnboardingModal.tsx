import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRoutine } from '../context/RoutineContext';
import { initializeStarterData } from '../services/storage';
import { Sparkles, Check, ArrowRight } from 'lucide-react';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ONBOARDING_OPTIONS = [
  {
    id: 'estudos',
    title: 'Estudos',
    icon: '📚',
    desc: 'Organizar blocos de estudo, revisões de matérias e exercícios',
  },
  {
    id: 'trabalho',
    title: 'Trabalho & Produtividade',
    icon: '💼',
    desc: 'Foco em tarefas prioritárias, pausas produtivas e organização',
  },
  {
    id: 'treino',
    title: 'Saúde e treino',
    icon: '🏋️',
    desc: 'Atividades físicas diárias, hidratação constante e boa alimentação',
  },
  {
    id: 'casa',
    title: 'Casa e rotina pessoal',
    icon: '🏠',
    desc: 'Organização do lar, cuidados pessoais e preparação do dia seguinte',
  },
  {
    id: 'habitos',
    title: 'Hábitos e disciplina',
    icon: '🌱',
    desc: 'Construir sequências sólidas de leitura, água e bem-estar',
  },
  {
    id: 'tudo',
    title: 'Um pouco de tudo',
    icon: '✨',
    desc: 'Equilíbrio completo entre manhã produtiva, estudos, treino e noite',
  },
];

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const { refreshData } = useRoutine();
  const [selectedCategory, setSelectedCategory] = useState('tudo');

  if (!isOpen || !user) return null;

  const handleFinish = () => {
    initializeStarterData(user.id, selectedCategory);
    refreshData();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 md:p-8 shadow-2xl border border-slate-100">
        <div className="text-center mb-6">
          <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-2xl text-white shadow-md shadow-blue-500/20">
            🌱
          </div>
          <h2 className="text-2xl font-bold text-slate-900">
            Vamos organizar sua rotina?
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Como você quer usar o Minha Rotina no seu dia a dia?
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-6">
          {ONBOARDING_OPTIONS.map((opt) => {
            const isSelected = selectedCategory === opt.id;
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
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-2xl">{opt.icon}</span>
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
          Criaremos sugestões práticas iniciais. Você poderá editar, excluir ou criar tudo do seu jeito.
        </p>

        <button
          onClick={handleFinish}
          className="w-full py-3.5 px-6 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <span>Começar agora</span>
          <ArrowRight className="w-4 h-4 stroke-[2.5]" />
        </button>
      </div>
    </div>
  );
};
