import { useState } from 'react';
import { View } from './types';
import { useWorkouts } from './hooks/useWorkouts';
import Navigation from './components/Navigation';
import Dashboard from './components/Dashboard';
import WorkoutLogger from './components/WorkoutLogger';
import ExerciseLibrary from './components/ExerciseLibrary';
import ProgressCharts from './components/ProgressCharts';
import PersonalRecords from './components/PersonalRecords';

export default function App() {
  const [view, setView] = useState<View>('dashboard');
  const [navOpen, setNavOpen] = useState(false);

  const store = useWorkouts();

  const navigate = (v: View) => {
    setView(v);
    setNavOpen(false);
  };

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* Mobile top bar */}
      <header
        className="lg:hidden fixed top-0 left-0 right-0 z-30 flex items-center gap-3 px-4"
        style={{
          height: '52px',
          background: 'var(--surface)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <button
          onClick={() => setNavOpen(true)}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--dim)',
            cursor: 'pointer',
            padding: '0.25rem',
            display: 'flex',
            alignItems: 'center',
          }}
          aria-label="Open menu"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        <span className="forge-display text-2xl" style={{ color: 'var(--accent)', letterSpacing: '0.08em' }}>
          FORGE
        </span>
        {store.activeWorkout && (
          <span
            className="ml-auto w-2 h-2 rounded-full animate-blink"
            style={{ background: 'var(--accent)' }}
          />
        )}
      </header>

      {/* Backdrop overlay (mobile only) */}
      {navOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40"
          style={{ background: 'rgba(0,0,0,0.7)' }}
          onClick={() => setNavOpen(false)}
        />
      )}

      <Navigation
        currentView={view}
        onNavigate={navigate}
        hasActiveWorkout={!!store.activeWorkout}
        isOpen={navOpen}
        onClose={() => setNavOpen(false)}
      />

      {/* Main content */}
      <main className="lg:ml-[220px] min-h-screen pt-[52px] lg:pt-0">
        {view === 'dashboard' && (
          <Dashboard
            workouts={store.workouts}
            activeWorkout={store.activeWorkout}
            templates={store.templates}
            onNavigate={navigate}
            onImport={store.importWorkouts}
            startWorkout={store.startWorkout}
            startFromGoalTemplate={store.startFromGoalTemplate}
            saveTemplate={store.saveTemplate}
            deleteTemplate={store.deleteTemplate}
          />
        )}
        {view === 'log' && (
          <WorkoutLogger
            activeWorkout={store.activeWorkout}
            workouts={store.workouts}
            templates={store.templates}
            startWorkout={store.startWorkout}
            startFromTemplate={store.startFromTemplate}
            startFromGoalTemplate={store.startFromGoalTemplate}
            updateWorkoutName={store.updateWorkoutName}
            finishWorkout={store.finishWorkout}
            cancelWorkout={store.cancelWorkout}
            deleteWorkout={store.deleteWorkout}
            saveTemplate={store.saveTemplate}
            deleteTemplate={store.deleteTemplate}
            addExercise={store.addExercise}
            removeExercise={store.removeExercise}
            addSet={store.addSet}
            updateSet={store.updateSet}
            removeSet={store.removeSet}
            getPrevPerformance={store.getPrevPerformance}
          />
        )}
        {view === 'library' && <ExerciseLibrary />}
        {view === 'progress' && (
          <ProgressCharts
            workouts={store.workouts}
            loggedExerciseIds={store.loggedExerciseIds}
            getExerciseProgress={store.getExerciseProgress}
          />
        )}
        {view === 'records' && (
          <PersonalRecords personalRecords={store.personalRecords} />
        )}
      </main>
    </div>
  );
}
