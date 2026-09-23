import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { RoutineProvider, useRoutine } from './context/RoutineContext';
import { ActiveTab, Routine, RoutineTask } from './types';

// Components
import { Navigation } from './components/Navigation';
import { TimerModal, FloatingTimerPill } from './components/TimerModal';
import { CreateRoutineModal } from './components/CreateRoutineModal';
import { TaskEditModal } from './components/TaskEditModal';
import { AuthModal } from './components/AuthModal';
import { OnboardingModal } from './components/OnboardingModal';
import { AppLogo } from './components/AppLogo';

// Views
import { TodayView } from './views/TodayView';
import { RoutinesView } from './views/RoutinesView';
import { ProgressView } from './views/ProgressView';
import { CalendarView } from './views/CalendarView';
import { ProfileView } from './views/ProfileView';

const MainAppContent: React.FC = () => {
  const { user, isLoading } = useAuth();
  const { routines } = useRoutine();

  const [activeTab, setActiveTab] = useState<ActiveTab>('hoje');

  // Routine Modal state
  const [isRoutineModalOpen, setIsRoutineModalOpen] = useState(false);
  const [routineToEdit, setRoutineToEdit] = useState<Routine | null>(null);

  // Task Modal state
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<RoutineTask | null>(null);
  const [defaultRoutineId, setDefaultRoutineId] = useState<string | undefined>(undefined);

  // Onboarding state: show if user is new and has 0 routines
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Trigger modal handlers
  const handleOpenCreateRoutine = (routine?: Routine) => {
    setRoutineToEdit(routine || null);
    setIsRoutineModalOpen(true);
  };

  const handleOpenTaskModal = (task?: RoutineTask, routineId?: string) => {
    setTaskToEdit(task || null);
    setDefaultRoutineId(routineId);
    setIsTaskModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4 animate-fade-in text-center">
          <AppLogo size="xl" className="shadow-2xl shadow-blue-500/20 animate-pulse" />
          <div>
            <h2 className="text-base font-extrabold text-white tracking-tight">
              Minha Rotina Aí
            </h2>
            <p className="text-xs font-semibold text-slate-400 mt-1">Carregando...</p>
          </div>
        </div>
      </div>
    );
  }

  // Not logged in: Show Auth Screen
  if (!user) {
    return <AuthModal />;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col md:flex-row text-slate-800 dark:text-slate-100 transition-colors">
      {/* Navigation: Desktop Sidebar & Mobile Bottom Bar */}
      <Navigation
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenCreateModal={() => handleOpenCreateRoutine()}
      />

      {/* Main View Area */}
      <main className="flex-1 min-h-screen overflow-y-auto">
        {activeTab === 'hoje' && (
          <TodayView
            onOpenCreateRoutine={() => handleOpenCreateRoutine()}
            onOpenTaskModal={handleOpenTaskModal}
          />
        )}

        {activeTab === 'rotinas' && (
          <RoutinesView
            onOpenCreateRoutine={handleOpenCreateRoutine}
            onOpenTaskModal={handleOpenTaskModal}
          />
        )}

        {activeTab === 'progresso' && (
          <ProgressView onNavigateToCalendar={() => setActiveTab('calendario')} />
        )}

        {activeTab === 'calendario' && <CalendarView />}

        {activeTab === 'perfil' && <ProfileView />}
      </main>

      {/* Modals & Floating Overlays */}
      <CreateRoutineModal
        isOpen={isRoutineModalOpen}
        onClose={() => setIsRoutineModalOpen(false)}
        routineToEdit={routineToEdit}
      />

      <TaskEditModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        taskToEdit={taskToEdit}
        defaultRoutineId={defaultRoutineId}
      />

      <TimerModal />
      <FloatingTimerPill />

      <OnboardingModal
        isOpen={showOnboarding}
        onClose={() => setShowOnboarding(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <RoutineProvider>
        <MainAppContent />
      </RoutineProvider>
    </AuthProvider>
  );
}
