import { useState, useMemo, useCallback, useEffect } from 'react';
import {
  Workout,
  ActiveWorkout,
  WorkoutSet,
  WorkoutExercise,
  Exercise,
  PersonalRecord,
  ExerciseProgress,
  WeeklyStats,
  WorkoutTemplate,
} from '../types';
import { SEED_TEMPLATES } from '../data/seedTemplates';
import { loadFromServer, saveToServer } from '../api';

const uid = () => Math.random().toString(36).slice(2, 11);

const load = <T>(key: string, fallback: T): T => {
  try {
    const s = localStorage.getItem(key);
    return s ? (JSON.parse(s) as T) : fallback;
  } catch {
    return fallback;
  }
};

const save = (key: string, value: unknown) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore storage errors
  }
};

// Write to localStorage and server in one call
const sync = (key: string, value: unknown) => {
  save(key, value);
  saveToServer(key, value);
};

const WORKOUTS_KEY  = 'forge_workouts';
const ACTIVE_KEY    = 'forge_active';
const TEMPLATES_KEY = 'forge_templates';

/** On first run, seed templates from the committed seed file. */
const initTemplates = (): WorkoutTemplate[] => {
  const stored = load<WorkoutTemplate[] | null>(TEMPLATES_KEY, null);
  if (stored !== null) return stored;
  save(TEMPLATES_KEY, SEED_TEMPLATES);
  return SEED_TEMPLATES;
};

export const useWorkouts = () => {
  const [workouts, setWorkoutsRaw] = useState<Workout[]>(() =>
    load<Workout[]>(WORKOUTS_KEY, [])
  );
  const [activeWorkout, setActiveRaw] = useState<ActiveWorkout | null>(() =>
    load<ActiveWorkout | null>(ACTIVE_KEY, null)
  );
  const [templates, setTemplatesRaw] = useState<WorkoutTemplate[]>(initTemplates);

  const setWorkouts = useCallback((w: Workout[]) => {
    setWorkoutsRaw(w);
    sync(WORKOUTS_KEY, w);
  }, []);

  const setActive = useCallback((aw: ActiveWorkout | null) => {
    setActiveRaw(aw);
    if (aw) {
      sync(ACTIVE_KEY, aw);
    } else {
      localStorage.removeItem(ACTIVE_KEY);
      saveToServer(ACTIVE_KEY, null);
    }
  }, []);

  // ── Server hydration (runs once on mount) ────────────────────────────────
  useEffect(() => {
    console.log('[FORGE] Starting server hydration…');
    Promise.all([
      loadFromServer<Workout[]>(WORKOUTS_KEY),
      loadFromServer<WorkoutTemplate[]>(TEMPLATES_KEY),
      loadFromServer<ActiveWorkout | null>(ACTIVE_KEY),
    ]).then(([w, t, a]) => {
      console.log('[FORGE] Server hydration result:', {
        workouts: w.found ? `${(w.value as Workout[])?.length ?? 0} items` : 'not found',
        templates: t.found ? `${(t.value as WorkoutTemplate[])?.length ?? 0} items` : 'not found',
        active: a.found ? (a.value ? 'active' : 'null') : 'not found',
      });
      if (w.found && w.value) {
        save(WORKOUTS_KEY, w.value);
        setWorkoutsRaw(w.value);
      } else {
        const local = load<Workout[]>(WORKOUTS_KEY, []);
        if (local.length > 0) {
          console.log('[FORGE] Pushing local workouts to server:', local.length);
          saveToServer(WORKOUTS_KEY, local);
        }
      }
      if (t.found && t.value) {
        save(TEMPLATES_KEY, t.value);
        setTemplatesRaw(t.value);
      } else {
        const local = load<WorkoutTemplate[]>(TEMPLATES_KEY, []);
        if (local.length > 0) {
          console.log('[FORGE] Pushing local templates to server:', local.length);
          saveToServer(TEMPLATES_KEY, local);
        }
      }
      if (a.found) {
        if (a.value) {
          save(ACTIVE_KEY, a.value);
          setActiveRaw(a.value);
        } else {
          localStorage.removeItem(ACTIVE_KEY);
          setActiveRaw(null);
        }
      }
    }).catch(err => {
      console.error('[FORGE] Server hydration failed:', err);
    });
  }, []);

  // ── Workout lifecycle ──────────────────────────────────────────────────────

  const startWorkout = useCallback(
    (name: string) => {
      setActive({
        id: uid(),
        date: new Date().toISOString(),
        name: name.trim() || 'Workout',
        exercises: [],
        startTime: Date.now(),
      });
    },
    [setActive]
  );

  const startFromTemplate = useCallback(
    (template: Workout) => {
      setActive({
        id: uid(),
        date: new Date().toISOString(),
        name: template.name,
        exercises: template.exercises.map(ex => ({
          ...ex,
          id: uid(),
          sets: ex.sets.map(s => ({ ...s, id: uid(), completed: false, restSeconds: s.restSeconds ?? 90 })),
        })),
        startTime: Date.now(),
      });
    },
    [setActive]
  );

  const startFromGoalTemplate = useCallback(
    (template: WorkoutTemplate) => {
      setActive({
        id: uid(),
        date: new Date().toISOString(),
        name: template.name,
        exercises: template.exercises.map(ex => ({
          id: uid(),
          exerciseId: ex.exerciseId,
          exerciseName: ex.exerciseName,
          category: ex.category,
          sets: ex.sets.map(s => ({ id: uid(), weight: s.weight, reps: s.reps, completed: false, restSeconds: s.restSeconds ?? 90 })),
        })),
        startTime: Date.now(),
      });
    },
    [setActive]
  );

  const updateWorkoutName = useCallback(
    (name: string) => {
      if (!activeWorkout) return;
      setActive({ ...activeWorkout, name });
    },
    [activeWorkout, setActive]
  );

  const finishWorkout = useCallback(() => {
    setActiveRaw(current => {
      if (!current) return null;
      const duration = Math.max(1, Math.round((Date.now() - current.startTime) / 60000));
      const completed: Workout = {
        id: current.id,
        date: current.date,
        name: current.name,
        exercises: current.exercises,
        duration,
        notes: current.notes,
      };
      setWorkoutsRaw(prev => {
        const next = [completed, ...prev];
        sync(WORKOUTS_KEY, next);
        return next;
      });
      localStorage.removeItem(ACTIVE_KEY);
      saveToServer(ACTIVE_KEY, null);
      return null;
    });
  }, []);

  const cancelWorkout = useCallback(() => setActive(null), [setActive]);

  const deleteWorkout = useCallback(
    (id: string) => setWorkouts(workouts.filter(w => w.id !== id)),
    [workouts, setWorkouts]
  );

  // ── Exercise management ───────────────────────────────────────────────────

  const addExercise = useCallback(
    (exercise: Exercise) => {
      if (!activeWorkout) return;
      const newEx: WorkoutExercise = {
        id: uid(),
        exerciseId: exercise.id,
        exerciseName: exercise.name,
        category: exercise.category,
        sets: [{ id: uid(), reps: 8, weight: 0, completed: false, restSeconds: 90 }],
      };
      setActive({ ...activeWorkout, exercises: [...activeWorkout.exercises, newEx] });
    },
    [activeWorkout, setActive]
  );

  const removeExercise = useCallback(
    (exerciseId: string) => {
      if (!activeWorkout) return;
      setActive({
        ...activeWorkout,
        exercises: activeWorkout.exercises.filter(e => e.id !== exerciseId),
      });
    },
    [activeWorkout, setActive]
  );

  // ── Set management ────────────────────────────────────────────────────────

  const addSet = useCallback(
    (exerciseId: string) => {
      if (!activeWorkout) return;
      setActive({
        ...activeWorkout,
        exercises: activeWorkout.exercises.map(ex => {
          if (ex.id !== exerciseId) return ex;
          const last = ex.sets[ex.sets.length - 1];
          return {
            ...ex,
            sets: [
              ...ex.sets,
              {
                id: uid(),
                reps: last?.reps ?? 8,
                weight: last?.weight ?? 0,
                completed: false,
                restSeconds: last?.restSeconds ?? 90,
              },
            ],
          };
        }),
      });
    },
    [activeWorkout, setActive]
  );

  const updateSet = useCallback(
    (exerciseId: string, setId: string, updates: Partial<WorkoutSet>) => {
      if (!activeWorkout) return;
      setActive({
        ...activeWorkout,
        exercises: activeWorkout.exercises.map(ex => {
          if (ex.id !== exerciseId) return ex;
          return {
            ...ex,
            sets: ex.sets.map(s => (s.id === setId ? { ...s, ...updates } : s)),
          };
        }),
      });
    },
    [activeWorkout, setActive]
  );

  const removeSet = useCallback(
    (exerciseId: string, setId: string) => {
      if (!activeWorkout) return;
      setActive({
        ...activeWorkout,
        exercises: activeWorkout.exercises
          .map(ex => {
            if (ex.id !== exerciseId) return ex;
            return { ...ex, sets: ex.sets.filter(s => s.id !== setId) };
          })
          .filter(ex => ex.sets.length > 0),
      });
    },
    [activeWorkout, setActive]
  );

  // ── Computed: Personal Records ────────────────────────────────────────────

  const personalRecords = useMemo((): PersonalRecord[] => {
    const map = new Map<string, PersonalRecord>();
    workouts.forEach(workout => {
      workout.exercises.forEach(ex => {
        ex.sets.forEach(set => {
          if (set.weight <= 0 || set.reps <= 0) return;
          // Epley formula: w * (1 + r/30)
          const e1rm = Math.round(set.weight * (1 + set.reps / 30));
          const existing = map.get(ex.exerciseId);
          if (!existing || e1rm > existing.estimatedOneRepMax) {
            map.set(ex.exerciseId, {
              exerciseId: ex.exerciseId,
              exerciseName: ex.exerciseName,
              category: ex.category,
              maxWeight: set.weight,
              repsAtMax: set.reps,
              date: workout.date,
              estimatedOneRepMax: e1rm,
            });
          }
        });
      });
    });
    return Array.from(map.values()).sort((a, b) =>
      a.exerciseName.localeCompare(b.exerciseName)
    );
  }, [workouts]);

  // ── Computed: Weekly stats ────────────────────────────────────────────────

  const weeklyStats = useMemo((): WeeklyStats => {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setHours(0, 0, 0, 0);
    startOfWeek.setDate(now.getDate() - now.getDay());

    const thisWeek = workouts.filter(w => new Date(w.date) >= startOfWeek);
    const volumeThisWeek = thisWeek.reduce(
      (acc, w) =>
        acc +
        w.exercises.reduce(
          (ea, ex) =>
            ea + ex.sets.reduce((sa, s) => sa + s.weight * s.reps, 0),
          0
        ),
      0
    );

    // Streak: consecutive days with at least one workout
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const days = new Set(
      workouts.map(w => {
        const d = new Date(w.date);
        d.setHours(0, 0, 0, 0);
        return d.getTime();
      })
    );
    let streak = 0;
    for (let i = 0; i < 365; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      if (days.has(d.getTime())) {
        streak++;
      } else if (i > 0) {
        break;
      }
    }

    return {
      workoutsThisWeek: thisWeek.length,
      volumeThisWeek: Math.round(volumeThisWeek),
      streak,
    };
  }, [workouts]);

  // ── Exercise progress ────────────────────────────────────────────────────

  const getExerciseProgress = useCallback(
    (exerciseId: string): ExerciseProgress[] =>
      workouts
        .filter(w => w.exercises.some(e => e.exerciseId === exerciseId))
        .map(w => {
          const ex = w.exercises.find(e => e.exerciseId === exerciseId)!;
          return {
            date: w.date,
            maxWeight: Math.max(0, ...ex.sets.map(s => s.weight)),
            totalVolume: ex.sets.reduce((a, s) => a + s.weight * s.reps, 0),
            totalSets: ex.sets.length,
          };
        })
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    [workouts]
  );

  // Previous performance for an exercise (most recent workout)
  const getPrevPerformance = useCallback(
    (exerciseId: string, exerciseName?: string): WorkoutSet[] => {
      const norm = (n: string) =>
        n.replace(/\s*\(.*?\)\s*/g, '').trim().toLowerCase();
      const matches = (e: WorkoutExercise) =>
        e.exerciseId === exerciseId ||
        (exerciseName != null && norm(e.exerciseName) === norm(exerciseName));
      const last = workouts.find(w => w.exercises.some(matches));
      return last?.exercises.find(matches)?.sets ?? [];
    },
    [workouts]
  );

  // All exercise IDs that have been logged at least once
  const loggedExerciseIds = useMemo((): Set<string> => {
    const ids = new Set<string>();
    workouts.forEach(w => w.exercises.forEach(e => ids.add(e.exerciseId)));
    return ids;
  }, [workouts]);

  // ── Templates CRUD ────────────────────────────────────────────────────────

  const saveTemplate = useCallback((t: WorkoutTemplate) => {
    setTemplatesRaw(prev => {
      const exists = prev.some(x => x.id === t.id);
      const next = exists ? prev.map(x => x.id === t.id ? t : x) : [...prev, t];
      sync(TEMPLATES_KEY, next);
      return next;
    });
  }, []);

  const deleteTemplate = useCallback((id: string) => {
    setTemplatesRaw(prev => {
      const next = prev.filter(t => t.id !== id);
      sync(TEMPLATES_KEY, next);
      return next;
    });
  }, []);

  // ── Import from Strong ────────────────────────────────────────────────────

  /** Merges imported workouts, skipping any that share the same calendar date
   *  AND workout name as an existing entry. Returns the count actually added. */
  const importWorkouts = useCallback(
    (imported: Workout[]): number => {
      // Build a set of existing keys: "YYYY-MM-DD||WorkoutName"
      // Use the full datetime + name as the key. Strong always records the
      // exact start time, so re-importing the same workout produces the same
      // key and gets skipped. Manually-logged workouts have different
      // timestamps and won't be falsely blocked.
      const existingKeys = new Set(workouts.map(w => `${w.date}||${w.name}`));
      const novel = imported.filter(w => !existingKeys.has(`${w.date}||${w.name}`));
      if (novel.length === 0) return 0;
      const merged = [...novel, ...workouts].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      setWorkouts(merged); // setWorkouts calls sync internally
      return novel.length;
    },
    [workouts, setWorkouts]
  );

  return {
    workouts,
    activeWorkout,
    startWorkout,
    startFromTemplate,
    updateWorkoutName,
    finishWorkout,
    cancelWorkout,
    deleteWorkout,
    addExercise,
    removeExercise,
    addSet,
    updateSet,
    removeSet,
    personalRecords,
    weeklyStats,
    getExerciseProgress,
    getPrevPerformance,
    loggedExerciseIds,
    importWorkouts,
    templates,
    saveTemplate,
    deleteTemplate,
    startFromGoalTemplate,
  };
};
