import { Workout, WorkoutExercise, WorkoutSet, MuscleGroup } from '../types';

const uid = () => Math.random().toString(36).slice(2, 11);

// ── CSV parsing ───────────────────────────────────────────────────────────────

/** Handles quoted fields that may contain commas. */
const parseLine = (line: string): string[] => {
  const result: string[] = [];
  let inQuote = false;
  let current = '';
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuote = !inQuote;
    } else if (ch === ',' && !inQuote) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
};

/** "1h 5m" → 65, "57m" → 57, "1h" → 60 */
const parseDuration = (s: string): number => {
  let minutes = 0;
  const h = s.match(/(\d+)h/);
  const m = s.match(/(\d+)m/);
  if (h) minutes += parseInt(h[1]) * 60;
  if (m) minutes += parseInt(m[1]);
  return minutes || 60;
};

// ── Exercise category inference ───────────────────────────────────────────────

const inferCategory = (name: string): MuscleGroup => {
  const n = name.toLowerCase();

  // Check legs first to catch "leg press", "leg curl" before generic press/curl patterns
  if (/leg press|leg extension|leg curl|squat|lunge|step.?up|bulgarian|split squat|hack squat|hip thrust|hip abduct|hip adduct|glute|calf raise|rdl|romanian|stiff.?leg/.test(n)) return 'legs';

  // Cardio
  if (/run|treadmill|bike|cycl|elliptic|stair|jump rope|rowing machine|cardio|walk/.test(n)) return 'cardio';

  // Back (before generic "row" which could be cardio rowing)
  if (/pull.?up|chin.?up|lat pull|seated row|cable row|t.?bar|bent.?over|pendlay|kroc|inverted row|back extension|hyperextension|good morning|deadlift/.test(n)) return 'back';

  // Shoulders
  if (/shoulder press|military press|overhead press|ohp|lateral raise|front raise|face pull|upright row|shrug|rear delt|arnold/.test(n)) return 'shoulders';

  // Arms
  if (/curl|tricep|pushdown|skull|preacher|ez.?bar|close.?grip|diamond|dip/.test(n)) return 'arms';

  // Core
  if (/plank|crunch|ab |core|russian twist|leg raise|rollout|sit.?up|oblique|hanging knee/.test(n)) return 'core';

  // Chest (press, bench, fly, push-up remaining after above)
  if (/bench|chest|fly|flye|pec|push.?up|incline press|decline press|cable cross/.test(n)) return 'chest';

  // Fallback: shoulder press / chest press that weren't caught above
  if (/press/.test(n)) return 'chest';
  if (/row/.test(n)) return 'back';

  return 'chest';
};

/** Normalise exercise name to a stable ID (e.g. "Bench Press (Barbell)" → "bench-press-barbell") */
const toExerciseId = (name: string): string =>
  name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// ── Public API ────────────────────────────────────────────────────────────────

export interface StrongImportPreview {
  workouts: Workout[];
  totalSets: number;
  dateRange: { from: string; to: string };
  workoutNameCounts: { name: string; count: number }[];
}

export const parseStrongCSV = (csvText: string): StrongImportPreview => {
  const lines = csvText.split('\n').filter(l => l.trim().length > 0);
  if (lines.length < 2) throw new Error('File appears empty or invalid.');

  const header = parseLine(lines[0]);
  const idx = (col: string) => {
    const i = header.indexOf(col);
    if (i === -1) throw new Error(`Missing expected column: "${col}". Is this a Strong export?`);
    return i;
  };

  const DATE_I    = idx('Date');
  const NAME_I    = idx('Workout Name');
  const DUR_I     = idx('Duration');
  const EX_I      = idx('Exercise Name');
  const WEIGHT_I  = idx('Weight');
  const REPS_I    = idx('Reps');
  // Set Order column is present but we don't need its index for logic

  // Group rows → workouts keyed by "date||workoutName"
  type WipWorkout = {
    date: string;
    name: string;
    duration: number;
    exercises: Map<string, { exerciseName: string; sets: WorkoutSet[] }>;
  };
  const wipMap = new Map<string, WipWorkout>();

  for (let i = 1; i < lines.length; i++) {
    const cols = parseLine(lines[i]);
    if (cols.length < 7) continue;

    const rawDate    = cols[DATE_I];
    const workoutName = cols[NAME_I];
    const durationStr = cols[DUR_I];
    const exerciseName = cols[EX_I];
    const weight = parseFloat(cols[WEIGHT_I]) || 0;
    const reps   = Math.round(parseFloat(cols[REPS_I]) || 0);

    if (!rawDate || !workoutName || !exerciseName) continue;

    // Key on the datetime string so two workouts with the same name on the same
    // day (unlikely but possible) stay separate if they started at different times.
    const key = `${rawDate}||${workoutName}`;

    if (!wipMap.has(key)) {
      wipMap.set(key, {
        date: new Date(rawDate).toISOString(),
        name: workoutName,
        duration: parseDuration(durationStr),
        exercises: new Map(),
      });
    }

    const wip = wipMap.get(key)!;
    if (!wip.exercises.has(exerciseName)) {
      wip.exercises.set(exerciseName, { exerciseName, sets: [] });
    }

    // Skip rows with no meaningful data (e.g. bodyweight cardio with 0 weight+reps+seconds)
    if (weight === 0 && reps === 0) continue;

    wip.exercises.get(exerciseName)!.sets.push({
      id: uid(),
      weight,
      reps: reps || 1,
      completed: true,
    });
  }

  // Convert to Workout[]
  const workouts: Workout[] = [];
  for (const wip of wipMap.values()) {
    const exercises: WorkoutExercise[] = [];
    for (const ex of wip.exercises.values()) {
      if (ex.sets.length === 0) continue; // skip exercises with no usable sets
      exercises.push({
        id: uid(),
        exerciseId: toExerciseId(ex.exerciseName),
        exerciseName: ex.exerciseName,
        category: inferCategory(ex.exerciseName),
        sets: ex.sets,
      });
    }
    if (exercises.length === 0) continue;
    workouts.push({
      id: uid(),
      date: wip.date,
      name: wip.name,
      exercises,
      duration: wip.duration,
    });
  }

  // Newest first
  workouts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const dates = workouts.map(w => new Date(w.date).getTime());
  const fmtDate = (ms: number) =>
    new Date(ms).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const totalSets = workouts.reduce(
    (acc, w) => acc + w.exercises.reduce((ea, ex) => ea + ex.sets.length, 0),
    0
  );

  // Tally workout names for the preview
  const nameCounts = new Map<string, number>();
  workouts.forEach(w => nameCounts.set(w.name, (nameCounts.get(w.name) ?? 0) + 1));
  const workoutNameCounts = Array.from(nameCounts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  return {
    workouts,
    totalSets,
    dateRange: {
      from: fmtDate(Math.min(...dates)),
      to:   fmtDate(Math.max(...dates)),
    },
    workoutNameCounts,
  };
};
