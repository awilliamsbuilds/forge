import { useState, useEffect } from 'react';
import { View } from './types';
import { useWorkouts } from './hooks/useWorkouts';
import Navigation from './components/Navigation';
import Dashboard from './components/Dashboard';
import WorkoutLogger from './components/WorkoutLogger';
import ExerciseLibrary from './components/ExerciseLibrary';
import ProgressCharts from './components/ProgressCharts';
import PersonalRecords from './components/PersonalRecords';

const VIEWS: View[] = ['dashboard', 'log', 'library', 'progress', 'records'];

function hashToView(hash: string): View {
  const v = hash.replace('#', '') as View;
  return VIEWS.includes(v) ? v : 'dashboard';
}

export default function App() {
  const [view, setView] = useState<View>(() => hashToView(window.location.hash));
  const store = useWorkouts();

  useEffect(() => {
    const onPop = () => setView(hashToView(window.location.hash));
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const navigate = (v: View) => {
    window.location.hash = v;
    setView(v);
  };

  return (
    <div style={{ minHeight: '100vh' }}>
      <Navigation
        currentView={view}
        onNavigate={navigate}
        hasActiveWorkout={!!store.activeWorkout}
      />

      {/* Main content — desktop: offset for sidebar; mobile: offset for bottom nav */}
      <main className="lg:ml-[220px] min-h-screen pb-[64px] lg:pb-0">
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
