import { useState, useEffect } from 'react';
import { View } from './types';
import { useWorkouts } from './hooks/useWorkouts';
import Navigation from './components/Navigation';
import Dashboard from './components/Dashboard';
import WorkoutLogger from './components/WorkoutLogger';
import ExerciseLibrary from './components/ExerciseLibrary';
import ProgressCharts from './components/ProgressCharts';
import PersonalRecords from './components/PersonalRecords';
import Changelog from './components/Changelog';

const VIEWS: View[] = ['dashboard', 'log', 'library', 'progress', 'records'];

function hashToView(hash: string): View {
  const v = hash.replace('#', '') as View;
  return VIEWS.includes(v) ? v : 'dashboard';
}

export default function App() {
  const [view, setView] = useState<View>(() => hashToView(window.location.hash));
  const [showingWorkout, setShowingWorkout] = useState(false);
  const store = useWorkouts();

  useEffect(() => {
    const onPop = () => setView(hashToView(window.location.hash));
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  // Raw navigate — never touches showingWorkout
  const goTo = (v: View) => {
    window.location.hash = v;
    setView(v);
  };

  // Tab navigation — clears the workout overlay
  const navigate = (v: View) => {
    setShowingWorkout(false);
    goTo(v);
  };

  const resumeWorkout = () => {
    setShowingWorkout(true);
    goTo('log');
  };

  return (
    <div style={{ minHeight: '100vh' }}>
      <Navigation
        currentView={view}
        onNavigate={navigate}
        hasActiveWorkout={!!store.activeWorkout}
        onResumeWorkout={resumeWorkout}
      />

      {/* Main content — desktop: offset for sidebar; mobile: offset for bottom nav */}
      <main className="lg:ml-[220px] min-h-screen pb-[72px] lg:pb-0">
        {showingWorkout && store.activeWorkout ? (
          <WorkoutLogger
            activeWorkout={store.activeWorkout}
            workouts={store.workouts}
            templates={store.templates}
            startWorkout={store.startWorkout}
            startFromTemplate={store.startFromTemplate}
            startFromGoalTemplate={store.startFromGoalTemplate}
            updateWorkoutName={store.updateWorkoutName}
            finishWorkout={() => { store.finishWorkout(); setShowingWorkout(false); goTo('dashboard'); }}
            cancelWorkout={() => { store.cancelWorkout(); setShowingWorkout(false); goTo('dashboard'); }}
            deleteWorkout={store.deleteWorkout}
            saveTemplate={store.saveTemplate}
            deleteTemplate={store.deleteTemplate}
            addExercise={store.addExercise}
            removeExercise={store.removeExercise}
            addSet={store.addSet}
            updateSet={store.updateSet}
            removeSet={store.removeSet}
            onExit={() => { setShowingWorkout(false); goTo('dashboard'); }}
            getPrevPerformance={store.getPrevPerformance}
          />
        ) : (
          <>
            {view === 'dashboard' && (
              <Dashboard
                workouts={store.workouts}
                activeWorkout={store.activeWorkout}
                templates={store.templates}
                onNavigate={navigate}
                onImport={store.importWorkouts}
                startWorkout={(name) => { store.startWorkout(name); setShowingWorkout(true); goTo('log'); }}
                startFromGoalTemplate={(t) => { store.startFromGoalTemplate(t); setShowingWorkout(true); goTo('log'); }}
                onResume={resumeWorkout}
                saveTemplate={store.saveTemplate}
                deleteTemplate={store.deleteTemplate}
              />
            )}
            {view === 'log' && (
              <WorkoutLogger
                activeWorkout={null}
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
                onExit={() => navigate('dashboard')}
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
            {view === 'changelog' && (
              <Changelog onNavigate={navigate} />
            )}
          </>
        )}
      </main>
    </div>
  );
}
