import { useState, useEffect, useCallback, useMemo } from 'react';
import { ActiveWorkout, Exercise, Workout, WorkoutSet, MuscleGroup, WorkoutTemplate } from '../types';
import { EXERCISES } from '../data/exercises';
import { useCustomExercises } from '../hooks/useCustomExercises';

interface WorkoutLoggerProps {
  activeWorkout: ActiveWorkout | null;
  workouts: Workout[];
  templates: WorkoutTemplate[];
  startWorkout: (name: string) => void;
  startFromTemplate: (w: Workout) => void;
  startFromGoalTemplate: (t: WorkoutTemplate) => void;
  updateWorkoutName: (name: string) => void;
  finishWorkout: () => void;
  cancelWorkout: () => void;
  deleteWorkout: (id: string) => void;
  saveTemplate: (t: WorkoutTemplate) => void;
  deleteTemplate: (id: string) => void;
  addExercise: (e: Exercise) => void;
  removeExercise: (id: string) => void;
  addSet: (exerciseId: string) => void;
  updateSet: (exerciseId: string, setId: string, updates: Partial<WorkoutSet>) => void;
  removeSet: (exerciseId: string, setId: string) => void;
  onExit: () => void;
  getPrevPerformance: (exerciseId: string, exerciseName?: string) => WorkoutSet[];
}

// ── Number stepper ────────────────────────────────────────────────────────────

function Stepper({
  value, onChange, step = 1, min = 0, decimals = 0,
}: {
  value: number; onChange: (v: number) => void; step?: number; min?: number; decimals?: number;
}) {
  return (
    <div className="stepper">
      <button
        className="stepper-btn"
        onClick={() => onChange(Math.max(min, parseFloat((value - step).toFixed(decimals))))}
      >
        −
      </button>
      <input
        className="stepper-input"
        type="number"
        value={value}
        onChange={e => {
          const v = parseFloat(e.target.value);
          if (!isNaN(v)) onChange(Math.max(min, v));
        }}
      />
      <button
        className="stepper-btn"
        onClick={() => onChange(parseFloat((value + step).toFixed(decimals)))}
      >
        +
      </button>
    </div>
  );
}

// ── Exercise picker modal ─────────────────────────────────────────────────────

const CATS: { id: MuscleGroup | 'all'; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'chest', label: 'Chest' },
  { id: 'back', label: 'Back' },
  { id: 'shoulders', label: 'Shoulders' },
  { id: 'arms', label: 'Arms' },
  { id: 'legs', label: 'Legs' },
  { id: 'core', label: 'Core' },
  { id: 'cardio', label: 'Cardio' },
];

function ExercisePicker({ onSelect, onClose }: { onSelect: (e: Exercise) => void; onClose: () => void }) {
  const [search, setSearch] = useState('');
  const [cat, setCat] = useState<MuscleGroup | 'all'>('all');
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCat, setNewCat] = useState<MuscleGroup>('chest');
  const [newEquip, setNewEquip] = useState('');
  const { customs, createExercise } = useCustomExercises();

  const allExercises = useMemo(() => [...EXERCISES, ...customs], [customs]);

  const filtered = allExercises.filter(e => {
    const matchCat = cat === 'all' || e.category === cat;
    const matchSearch = e.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const openCreate = () => {
    setNewName(search);
    setNewCat(cat === 'all' ? 'chest' : cat);
    setNewEquip('');
    setCreating(true);
  };

  const handleCreate = () => {
    const name = newName.trim();
    if (!name) return;
    const ex = createExercise(name, newCat, newEquip);
    onSelect(ex);
    onClose();
  };

  const chipStyle = (active: boolean) => ({
    fontFamily: 'Barlow Condensed, sans-serif',
    fontWeight: 700,
    fontSize: '0.68rem',
    letterSpacing: '0.1em',
    textTransform: 'uppercase' as const,
    padding: '0.2rem 0.55rem',
    border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
    background: active ? 'rgba(200,255,0,0.1)' : 'transparent',
    color: active ? 'var(--accent)' : 'var(--dim)',
    cursor: 'pointer',
    flexShrink: 0,
  });

  return (
    <div
      className="fixed inset-0 z-[60]"
      style={{ background: 'rgba(0,0,0,0.85)' }}
      onClick={onClose}
    >
      <div
        style={{
          position: 'fixed', zIndex: 61,
          top: '10vh', left: '50%', transform: 'translateX(-50%)',
          width: 'min(520px, 100vw)', height: 'calc(90vh - 64px)',
          background: 'var(--card)', border: '1px solid var(--border)',
          display: 'flex', flexDirection: 'column',
        }}
        onClick={e => e.stopPropagation()}
      >
        {creating ? (
          /* ── Create custom exercise form ── */
          <>
            <div className="flex items-center justify-between px-4 py-3 flex-shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
              <h3 className="forge-display text-2xl">CREATE EXERCISE</h3>
              <button onClick={() => setCreating(false)} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '1.1rem', padding: '0.25rem 0.5rem' }}>✕</button>
            </div>
            <div className="flex flex-col gap-4 p-4 flex-1 overflow-y-auto">
              <div>
                <div className="forge-label mb-1.5">Exercise Name *</div>
                <input
                  className="forge-input"
                  placeholder="e.g. Cable Lateral Raise"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  autoFocus
                  onKeyDown={e => { if (e.key === 'Enter') handleCreate(); }}
                />
              </div>
              <div>
                <div className="forge-label mb-1.5">Category *</div>
                <div className="flex flex-wrap gap-1.5">
                  {CATS.filter(c => c.id !== 'all').map(c => (
                    <button key={c.id} onClick={() => setNewCat(c.id as MuscleGroup)} style={chipStyle(newCat === c.id)}>
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="forge-label mb-1.5">Equipment <span style={{ color: 'var(--muted)', fontWeight: 400 }}>(optional)</span></div>
                <input
                  className="forge-input"
                  placeholder="e.g. Cable Machine, Rope"
                  value={newEquip}
                  onChange={e => setNewEquip(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleCreate(); }}
                />
              </div>
            </div>
            <div className="p-4 flex gap-3 flex-shrink-0" style={{ borderTop: '1px solid var(--border)' }}>
              <button className="btn-ghost flex-1 py-3" onClick={() => setCreating(false)}>Cancel</button>
              <button
                className="btn-accent flex-1 py-3"
                onClick={handleCreate}
                disabled={!newName.trim()}
              >
                Add to Workout
              </button>
            </div>
          </>
        ) : (
          /* ── Exercise list ── */
          <>
            <div className="flex items-center justify-between px-4 py-3 flex-shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
              <div>
                <h3 className="forge-display text-2xl">ADD EXERCISE</h3>
                <div className="forge-label" style={{ color: 'var(--muted)' }}>{filtered.length} exercises</div>
              </div>
              <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '1.1rem', padding: '0.25rem 0.5rem' }}>✕</button>
            </div>

            <div className="px-4 pt-3 pb-2 flex-shrink-0">
              <input
                className="forge-input"
                placeholder="Search exercises..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                autoFocus
              />
            </div>

            <div className="flex gap-1.5 px-4 pb-3 overflow-x-auto flex-shrink-0">
              {CATS.map(c => (
                <button key={c.id} onClick={() => setCat(c.id)} style={chipStyle(cat === c.id)}>
                  {c.label}
                </button>
              ))}
            </div>

            <div className="overflow-y-auto flex-1" style={{ borderTop: '1px solid var(--border)' }}>
              {filtered.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="forge-label mb-3">No exercises found</div>
                  <button className="btn-accent px-5 py-2" onClick={openCreate}>
                    + Create &ldquo;{search || 'Custom'}&rdquo;
                  </button>
                </div>
              ) : (
                filtered.map(ex => (
                  <button
                    key={ex.id}
                    onClick={() => { onSelect(ex); onClose(); }}
                    className="w-full flex items-center gap-3 px-4 text-left"
                    style={{
                      background: 'transparent',
                      border: 'none',
                      borderBottom: '1px solid var(--border)',
                      cursor: 'pointer',
                      color: 'var(--text)',
                      minHeight: '44px',
                      paddingTop: '0.5rem',
                      paddingBottom: '0.5rem',
                    }}
                  >
                    <span className={`cat-badge cat-${ex.category} flex-shrink-0`}>{ex.category}</span>
                    <div className="min-w-0">
                      <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '0.95rem' }}>
                        {ex.name}
                      </div>
                      <div className="forge-label truncate" style={{ marginTop: '0.1rem' }}>{ex.equipment}</div>
                    </div>
                  </button>
                ))
              )}
            </div>

            {/* Footer: create custom */}
            <div className="flex-shrink-0 px-4 py-3" style={{ borderTop: '1px solid var(--border)' }}>
              <button
                className="btn-ghost w-full py-2.5"
                style={{ fontSize: '0.75rem' }}
                onClick={openCreate}
              >
                + Create Custom Exercise
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const uid = () => Math.random().toString(36).slice(2, 11);

// ── Helpers ───────────────────────────────────────────────────────────────────

const workoutVolume = (w: Workout) =>
  w.exercises.reduce((acc, ex) => acc + ex.sets.reduce((sa, s) => sa + s.weight * s.reps, 0), 0);

const fmtVol = (v: number) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v.toLocaleString());

const fmtDate = (iso: string) => {
  const d = new Date(iso);
  const now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  if (diff < 7) return `${diff}d ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined });
};

// ── Workout history row ───────────────────────────────────────────────────────

function HistoryRow({ workout, onSelect, onTemplate, onDelete }: {
  workout: Workout;
  onSelect: (w: Workout) => void;
  onTemplate: (w: Workout) => void;
  onDelete: (id: string) => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const vol = workoutVolume(workout);

  if (confirming) {
    return (
      <div className="forge-card flex items-center justify-between gap-3 p-3 sm:p-4" style={{ borderLeft: '3px solid var(--danger)' }}>
        <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '0.9rem', color: 'var(--dim)' }}>
          Delete &ldquo;{workout.name}&rdquo;?
        </span>
        <div className="flex gap-2 flex-shrink-0">
          <button className="btn-ghost py-1.5 px-3" style={{ fontSize: '0.75rem' }} onClick={() => setConfirming(false)}>Cancel</button>
          <button className="btn-danger py-1.5 px-3" style={{ fontSize: '0.75rem' }} onClick={() => onDelete(workout.id)}>Delete</button>
        </div>
      </div>
    );
  }

  return (
    <div className="forge-card flex items-center gap-3 p-3 sm:p-4" style={{ cursor: 'pointer' }} onClick={() => onSelect(workout)}>
      {/* Main info — clickable */}
      <div className="flex-1 min-w-0">
        <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '0.95rem', letterSpacing: '0.03em' }}>
          {workout.name}
        </div>
        <div className="forge-label mt-0.5">
          {fmtDate(workout.date)}
          {' · '}{workout.duration}min
          {' · '}{workout.exercises.length} exercise{workout.exercises.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Volume */}
      {vol > 0 && (
        <div className="text-right flex-shrink-0 hidden sm:block">
          <div className="forge-stat text-sm">{fmtVol(vol)}</div>
          <div className="forge-label">lbs</div>
        </div>
      )}

      {/* Repeat */}
      <button
        className="btn-ghost py-1.5 px-3 flex-shrink-0"
        style={{ fontSize: '0.72rem' }}
        onClick={e => { e.stopPropagation(); onTemplate(workout); }}
        title="Repeat this workout"
      >
        Repeat
      </button>

      {/* Delete */}
      <button
        onClick={e => { e.stopPropagation(); setConfirming(true); }}
        title="Delete workout"
        style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', padding: '0.25rem 0.375rem', flexShrink: 0, display: 'flex', alignItems: 'center', transition: 'color 0.1s' }}
        onMouseEnter={e => (e.currentTarget.style.color = 'var(--danger)')}
        onMouseLeave={e => (e.currentTarget.style.color = 'var(--muted)')}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="square">
          <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" />
          <path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" />
        </svg>
      </button>
    </div>
  );
}

// ── PR detection ─────────────────────────────────────────────────────────────

type PRType = '1rm' | 'weight' | 'vol';

function computePRs(workout: Workout, allWorkouts: Workout[]): Map<string, PRType[]> {
  const sets = new Map<string, PRType[]>();
  const priorWorkouts = allWorkouts.filter(w => w.date < workout.date);

  for (const ex of workout.exercises) {
    let bestPrior1RM = 0;
    let bestPriorWeight = 0;
    let bestPriorVol = 0;

    for (const prior of priorWorkouts) {
      for (const priorEx of prior.exercises) {
        if (priorEx.exerciseId !== ex.exerciseId) continue;
        for (const s of priorEx.sets) {
          if (s.weight > 0) {
            bestPriorWeight = Math.max(bestPriorWeight, s.weight);
            bestPriorVol = Math.max(bestPriorVol, s.weight * s.reps);
            if (s.reps > 0) bestPrior1RM = Math.max(bestPrior1RM, s.weight * (1 + s.reps / 30));
          }
        }
      }
    }

    let best1RMId: string | null = null; let best1RM = 0;
    let bestWeightId: string | null = null; let bestWeight = 0;
    let bestVolId: string | null = null; let bestVol = 0;

    for (const s of ex.sets) {
      if (s.weight > 0) {
        if (s.weight > bestWeight) { bestWeight = s.weight; bestWeightId = s.id; }
        const sv = s.weight * s.reps;
        if (sv > bestVol) { bestVol = sv; bestVolId = s.id; }
        if (s.reps > 0) {
          const e1rm = s.weight * (1 + s.reps / 30);
          if (e1rm > best1RM) { best1RM = e1rm; best1RMId = s.id; }
        }
      }
    }

    const addPR = (id: string, type: PRType) => sets.set(id, [...(sets.get(id) ?? []), type]);
    if (best1RMId && best1RM > bestPrior1RM) addPR(best1RMId, '1rm');
    if (bestWeightId && bestWeight > bestPriorWeight) addPR(bestWeightId, 'weight');
    if (bestVolId && bestVol > bestPriorVol) addPR(bestVolId, 'vol');
  }

  return sets;
}

const PR_LABELS: Record<PRType | 'vol', string> = { '1rm': '1RM', weight: 'WEIGHT', vol: 'VOL' };

function PRBadge({ type }: { type: PRType | 'vol' }) {
  return (
    <span style={{
      fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700,
      fontSize: '0.6rem', letterSpacing: '0.1em', color: '#0a0a0a',
      background: 'var(--accent)', padding: '0.1rem 0.35rem', flexShrink: 0,
    }}>
      {PR_LABELS[type]}
    </span>
  );
}

// ── Workout detail view ───────────────────────────────────────────────────────

function WorkoutDetail({ workout, allWorkouts, onBack, onRepeat, onDelete }: {
  workout: Workout;
  allWorkouts: Workout[];
  onBack: () => void;
  onRepeat: (w: Workout) => void;
  onDelete: (id: string) => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const vol = workoutVolume(workout);
  const date = new Date(workout.date);
  const dateStr = date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  const timeStr = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  const prSets = computePRs(workout, allWorkouts);
  const totalPRs = [...prSets.values()].reduce((n, types) => n + types.length, 0);

  return (
    <div className="p-4 sm:p-6 lg:p-8 animate-fade-up" style={{ maxWidth: '720px' }}>
      {/* Back */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 mb-5 forge-label"
        style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', padding: 0, letterSpacing: '0.08em' }}
        onMouseEnter={e => (e.currentTarget.style.color = 'var(--text)')}
        onMouseLeave={e => (e.currentTarget.style.color = 'var(--muted)')}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        HISTORY
      </button>

      {/* Header */}
      <div className="mb-5 pb-4" style={{ borderBottom: '1px solid var(--border)' }}>
        <h1 className="forge-display text-4xl sm:text-5xl mb-2">{workout.name.toUpperCase()}</h1>
        <div className="forge-label" style={{ color: 'var(--dim)' }}>{dateStr} · {timeStr}</div>

        {/* Stats row */}
        <div className="flex gap-5 mt-4 flex-wrap">
          {[
            { label: 'Duration',  value: `${workout.duration}`,               unit: 'min'   },
            { label: 'Volume',    value: fmtVol(vol),                          unit: 'lbs'   },
            { label: 'Exercises', value: workout.exercises.length.toString(),  unit: 'total' },
            ...(totalPRs > 0 ? [{ label: 'PRs', value: totalPRs.toString(), unit: totalPRs !== 1 ? 'records' : 'record' }] : []),
          ].map(s => (
            <div key={s.label}>
              <div className="forge-label mb-0.5" style={s.label === 'PRs' ? { color: 'var(--accent)' } : undefined}>{s.label}</div>
              <span className="forge-stat text-xl" style={s.label === 'PRs' ? { color: 'var(--accent)' } : undefined}>{s.value}</span>
              <span className="forge-label ml-1">{s.unit}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Exercises */}
      <div className="flex flex-col gap-4 mb-6">
        {workout.exercises.map(ex => {
          const hasAnyPR = ex.sets.some(s => prSets.has(s.id));
          return (
            <div key={ex.id} className="forge-card" style={hasAnyPR ? { borderLeft: '3px solid var(--accent)' } : undefined}>
              {/* Exercise header */}
              <div className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
                <span className={`cat-badge cat-${ex.category} flex-shrink-0`}>{ex.category}</span>
                <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '1rem' }}>
                  {ex.exerciseName}
                </span>
              </div>

              {/* Sets */}
              <div className="overflow-x-auto">
                <table className="forge-table" style={{ minWidth: '300px' }}>
                  <thead>
                    <tr>
                      <th style={{ width: '2rem' }}>#</th>
                      <th>Weight</th>
                      <th>Reps</th>
                      <th>Est. 1RM</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ex.sets.map((s, i) => {
                      const e1rm = s.weight > 0 && s.reps > 0
                        ? Math.round(s.weight * (1 + s.reps / 30))
                        : null;
                      const setPRTypes = prSets.get(s.id) ?? [];
                      const isWeightPR = setPRTypes.includes('weight');
                      const is1RMPR = setPRTypes.includes('1rm');
                      const isVolPR = setPRTypes.includes('vol');
                      const rowHighlight = setPRTypes.length > 0;
                      return (
                        <tr key={s.id} style={rowHighlight ? { background: 'rgba(200,255,0,0.05)' } : undefined}>
                          <td><span className="forge-stat text-sm" style={{ color: 'var(--muted)' }}>{i + 1}</span></td>
                          <td style={{ fontFamily: 'Space Mono, monospace', fontSize: '0.8rem' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                              {s.weight > 0 ? `${s.weight} lbs` : '—'}
                              {isWeightPR && <PRBadge type="weight" />}
                              {isVolPR && <PRBadge type="vol" />}
                            </span>
                          </td>
                          <td style={{ fontFamily: 'Space Mono, monospace', fontSize: '0.8rem' }}>
                            {s.reps}
                          </td>
                          <td style={{ fontFamily: 'Space Mono, monospace', fontSize: '0.8rem', color: e1rm ? 'var(--accent)' : 'var(--border)' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                              {e1rm ? `${e1rm} lbs` : '—'}
                              {is1RMPR && <PRBadge type="1rm" />}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>

      {/* Actions */}
      {confirming ? (
        <div className="flex items-center justify-between gap-3 p-4 forge-card" style={{ borderLeft: '3px solid var(--danger)' }}>
          <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '0.9rem', color: 'var(--dim)' }}>
            Delete this workout?
          </span>
          <div className="flex gap-2">
            <button className="btn-ghost py-2 px-4" style={{ fontSize: '0.75rem' }} onClick={() => setConfirming(false)}>Cancel</button>
            <button className="btn-danger py-2 px-4" style={{ fontSize: '0.75rem' }} onClick={() => { onDelete(workout.id); onBack(); }}>Delete</button>
          </div>
        </div>
      ) : (
        <div className="flex gap-3">
          <button className="btn-accent flex-1 py-3" onClick={() => onRepeat(workout)}>Repeat Workout</button>
          <button className="btn-danger py-3 px-5" onClick={() => setConfirming(true)}>Delete</button>
        </div>
      )}
    </div>
  );
}

// ── Calendar view ────────────────────────────────────────────────────────────

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function CalendarView({ workouts, onSelect, year, month, setYear, setMonth }: {
  workouts: Workout[];
  onSelect: (w: Workout) => void;
  year: number;
  month: number;
  setYear: React.Dispatch<React.SetStateAction<number>>;
  setMonth: React.Dispatch<React.SetStateAction<number>>;
}) {
  const today = new Date();
  const [dayWorkouts, setDayWorkouts] = useState<Workout[] | null>(null);

  // Build a map of dateStr -> Workout[]
  const byDay = useMemo(() => {
    const m = new Map<string, Workout[]>();
    for (const w of workouts) {
      const key = w.date.slice(0, 10);
      if (!m.has(key)) m.set(key, []);
      m.get(key)!.push(w);
    }
    return m;
  }, [workouts]);

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); };

  // Grid cells: pad start of month to correct day-of-week
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  // Pad to full weeks
  while (cells.length % 7 !== 0) cells.push(null);

  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const handleDayClick = (day: number) => {
    const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const ws = byDay.get(key);
    if (!ws || ws.length === 0) return;
    if (ws.length === 1) { onSelect(ws[0]); return; }
    setDayWorkouts(ws);
  };

  return (
    <div>
      {/* Month nav */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={prevMonth} style={{ background: 'none', border: 'none', color: 'var(--dim)', cursor: 'pointer', padding: '0.25rem 0.5rem', fontSize: '1.1rem' }}>‹</button>
        <span className="forge-display text-2xl">{MONTH_NAMES[month].toUpperCase()} {year}</span>
        <button
          onClick={nextMonth}
          disabled={year === today.getFullYear() && month === today.getMonth()}
          style={{ background: 'none', border: 'none', color: (year === today.getFullYear() && month === today.getMonth()) ? 'var(--border)' : 'var(--dim)', cursor: 'pointer', padding: '0.25rem 0.5rem', fontSize: '1.1rem' }}
        >›</button>
      </div>

      {/* Day labels */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: '0.35rem' }}>
        {DAY_LABELS.map(d => (
          <div key={d} style={{ textAlign: 'center', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '0.6rem', letterSpacing: '0.1em', color: 'var(--muted)', paddingBottom: '0.25rem' }}>
            {d}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '3px' }}>
        {cells.map((day, i) => {
          if (!day) return <div key={`empty-${i}`} />;
          const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const ws = byDay.get(key) ?? [];
          const hasWorkout = ws.length > 0;
          const isToday = key === todayStr;
          const isFuture = key > todayStr;

          return (
            <button
              key={key}
              onClick={() => hasWorkout && handleDayClick(day)}
              style={{
                aspectRatio: '1',
                background: hasWorkout ? 'rgba(200,255,0,0.12)' : 'var(--card)',
                border: isToday ? '1px solid var(--accent)' : '1px solid var(--border)',
                color: isFuture ? 'var(--border)' : hasWorkout ? 'var(--accent)' : 'var(--dim)',
                cursor: hasWorkout ? 'pointer' : 'default',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '2px',
                padding: '0.15rem',
                transition: 'background 0.1s',
                position: 'relative',
              }}
              onMouseEnter={e => { if (hasWorkout) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(200,255,0,0.22)'; }}
              onMouseLeave={e => { if (hasWorkout) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(200,255,0,0.12)'; }}
            >
              <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 'clamp(0.6rem, 2vw, 0.8rem)', fontWeight: 700, lineHeight: 1 }}>
                {day}
              </span>
              {ws.length > 1 && (
                <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: '0.5rem', letterSpacing: '0.05em', color: 'var(--accent)', lineHeight: 1 }}>
                  ×{ws.length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Multi-workout day picker */}
      {dayWorkouts && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.7)' }} onClick={() => setDayWorkouts(null)}>
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', width: 'min(320px, 90vw)', maxHeight: '60vh', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
              <span className="forge-display text-xl">SELECT WORKOUT</span>
              <button onClick={() => setDayWorkouts(null)} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '1rem' }}>✕</button>
            </div>
            <div className="overflow-y-auto">
              {dayWorkouts.map(w => (
                <button key={w.id} onClick={() => { setDayWorkouts(null); onSelect(w); }}
                  className="w-full text-left px-4 py-3"
                  style={{ background: 'none', border: 'none', borderBottom: '1px solid var(--border)', color: 'var(--text)', cursor: 'pointer' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                >
                  <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '0.95rem' }}>{w.name}</div>
                  <div className="forge-label mt-0.5">{w.duration}min · {w.exercises.length} exercises</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Log screen (no active workout): history ──────────────────────────────────

function StartScreen({ workouts, onTemplate, onDelete }: {
  workouts: Workout[];
  onTemplate: (w: Workout) => void;
  onDelete: (id: string) => void;
}) {
  const [selected, setSelected] = useState<Workout | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const today = new Date();
  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());

  if (selected) {
    // Check the workout still exists (might have been deleted)
    const live = workouts.find(w => w.id === selected.id);
    return (
      <WorkoutDetail
        workout={live ?? selected}
        allWorkouts={workouts}
        onBack={() => setSelected(null)}
        onRepeat={w => { onTemplate(w); setSelected(null); }}
        onDelete={id => { onDelete(id); setSelected(null); }}
      />
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 animate-fade-up">
      {/* Header */}
      <div className="flex items-end justify-between gap-4 mb-6">
        <div>
          <div className="forge-label mb-1">Your training log</div>
          <h1 className="forge-display text-4xl sm:text-5xl lg:text-6xl">HISTORY</h1>
        </div>
        {workouts.length > 0 && (
          <div className="flex flex-shrink-0 mb-1" style={{ border: '1px solid var(--border)' }}>
            {(['list', 'calendar'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                style={{
                  background: viewMode === mode ? 'var(--accent)' : 'transparent',
                  border: 'none',
                  color: viewMode === mode ? '#080808' : 'var(--dim)',
                  fontFamily: 'Barlow Condensed, sans-serif',
                  fontWeight: 700,
                  fontSize: '0.7rem',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  padding: '0.4rem 0.75rem',
                  cursor: 'pointer',
                  transition: 'background 0.12s, color 0.12s',
                }}
              >
                {mode === 'list' ? (
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square">
                    <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
                    <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
                  </svg>
                ) : (
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square">
                    <rect x="3" y="4" width="18" height="18" rx="0"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {workouts.length === 0 ? (
        <div className="p-10 text-center" style={{ border: '1px dashed var(--border)' }}>
          <div className="forge-display text-3xl mb-2" style={{ color: 'var(--border)' }}>NO HISTORY YET</div>
          <p style={{ color: 'var(--muted)', fontFamily: 'Barlow, sans-serif', fontSize: '0.9rem' }}>
            Start a workout from the Dashboard.
          </p>
        </div>
      ) : viewMode === 'calendar' ? (
        <CalendarView workouts={workouts} onSelect={setSelected} year={calYear} month={calMonth} setYear={setCalYear} setMonth={setCalMonth} />
      ) : (
        <>
          <div className="mb-4">
            <span className="forge-label">{workouts.length} sessions</span>
          </div>
          <div className="flex flex-col gap-2">
            {workouts.map(w => (
              <HistoryRow
                key={w.id}
                workout={w}
                onSelect={setSelected}
                onTemplate={onTemplate}
                onDelete={onDelete}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ── Elapsed timer ─────────────────────────────────────────────────────────────

function Timer({ startTime }: { startTime: number }) {
  const [elapsed, setElapsed] = useState(Math.floor((Date.now() - startTime) / 1000));

  useEffect(() => {
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - startTime) / 1000)), 1000);
    return () => clearInterval(id);
  }, [startTime]);

  const h = Math.floor(elapsed / 3600);
  const m = Math.floor((elapsed % 3600) / 60);
  const s = elapsed % 60;
  const fmt = h > 0
    ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    : `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;

  return (
    <span className="forge-stat" style={{ color: 'var(--accent)', fontVariantNumeric: 'tabular-nums', fontSize: '1.25rem' }}>
      {fmt}
    </span>
  );
}

// ── Rest timer ────────────────────────────────────────────────────────────────

interface ActiveTimer {
  exerciseId: string;
  setId: string;
  durationSeconds: number;
  startedAt: number;
}

const fmtRest = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

// Inline rest row — appears after every set in the table
function RestRow({ colSpan, restSeconds, active, startedAt, onAdjust, onSkip }: {
  colSpan: number;
  restSeconds: number;
  active: boolean;
  startedAt?: number;
  onAdjust: (delta: number) => void;
  onSkip: () => void;
}) {
  const [remaining, setRemaining] = useState(() =>
    active && startedAt
      ? Math.max(0, restSeconds - Math.floor((Date.now() - startedAt) / 1000))
      : restSeconds
  );

  useEffect(() => {
    if (!active || !startedAt) { setRemaining(restSeconds); return; }
    const id = setInterval(() => {
      setRemaining(Math.max(0, restSeconds - Math.floor((Date.now() - startedAt) / 1000)));
    }, 250);
    return () => clearInterval(id);
  }, [active, startedAt, restSeconds]);

  const btnStyle: React.CSSProperties = {
    background: 'none', border: 'none', cursor: 'pointer',
    fontFamily: 'Space Mono, monospace', fontSize: '0.65rem',
    padding: '0 0.4rem', lineHeight: 1, flexShrink: 0,
  };

  if (!active) {
    return (
      <tr>
        <td colSpan={colSpan} style={{ padding: '1px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', padding: '0 0.5rem', gap: '0.25rem' }}>
            <button onClick={() => onAdjust(-15)} style={{ ...btnStyle, color: 'var(--muted)' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--dim)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--muted)')}>−</button>
            <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
            <span style={{ fontFamily: 'Space Mono, monospace', fontSize: '0.62rem', color: 'var(--dim)', letterSpacing: '0.05em', flexShrink: 0 }}>
              {fmtRest(restSeconds)}
            </span>
            <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
            <button onClick={() => onAdjust(15)} style={{ ...btnStyle, color: 'var(--muted)' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--dim)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--muted)')}>+</button>
          </div>
        </td>
      </tr>
    );
  }

  const pct = restSeconds > 0 ? remaining / restSeconds : 0;
  const done = remaining === 0;

  return (
    <tr>
      <td colSpan={colSpan} style={{ padding: '2px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
          <button onClick={() => onAdjust(-15)}
            style={{ ...btnStyle, color: done ? 'var(--muted)' : 'rgba(200,255,0,0.5)', padding: '0 0.5rem', height: '28px' }}
            onMouseEnter={e => (e.currentTarget.style.color = done ? 'var(--dim)' : 'var(--accent)')}
            onMouseLeave={e => (e.currentTarget.style.color = done ? 'var(--muted)' : 'rgba(200,255,0,0.5)')}>−</button>
          <div onClick={onSkip} style={{ flex: 1, position: 'relative', height: '28px', background: 'rgba(0,0,0,0.3)', overflow: 'hidden', cursor: 'pointer' }}>
            <div style={{
              position: 'absolute', left: 0, top: 0, bottom: 0,
              width: `${pct * 100}%`,
              background: done ? 'var(--success)' : 'var(--accent)',
              transition: 'width 0.25s linear, background 0.3s',
            }} />
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'Space Mono, monospace', fontSize: '0.72rem', fontWeight: 700,
              color: done ? '#0a0a0a' : pct > 0.35 ? '#0a0a0a' : 'var(--text)',
              letterSpacing: '0.05em', transition: 'color 0.2s',
            }}>
              {fmtRest(remaining)}
            </div>
          </div>
          <button onClick={() => onAdjust(15)}
            style={{ ...btnStyle, color: done ? 'var(--muted)' : 'rgba(200,255,0,0.5)', padding: '0 0.5rem', height: '28px' }}
            onMouseEnter={e => (e.currentTarget.style.color = done ? 'var(--dim)' : 'var(--accent)')}
            onMouseLeave={e => (e.currentTarget.style.color = done ? 'var(--muted)' : 'rgba(200,255,0,0.5)')}>+</button>
        </div>
      </td>
    </tr>
  );
}

// ── Active workout view ───────────────────────────────────────────────────────

function ActiveWorkoutView({
  active, onFinish, onCancel, onExit, onNameChange,
  onAddExercise, onRemoveExercise, onAddSet, onUpdateSet, onRemoveSet, getPrevPerformance,
}: {
  active: ActiveWorkout;
  onFinish: () => void;
  onCancel: () => void;
  onExit: () => void;
  onNameChange: (n: string) => void;
  onAddExercise: (e: Exercise) => void;
  onRemoveExercise: (id: string) => void;
  onAddSet: (id: string) => void;
  onUpdateSet: (exId: string, setId: string, u: Partial<WorkoutSet>) => void;
  onRemoveSet: (exId: string, setId: string) => void;
  getPrevPerformance: (exerciseId: string, exerciseName?: string) => WorkoutSet[];
}) {
  const [showPicker, setShowPicker] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [activeTimer, setActiveTimer] = useState<ActiveTimer | null>(null);

  const completedSets = active.exercises.reduce((acc, ex) => acc + ex.sets.filter(s => s.completed).length, 0);
  const totalSets = active.exercises.reduce((acc, ex) => acc + ex.sets.length, 0);

  return (
    <div className="p-4 sm:p-6 lg:p-8 animate-fade-up" style={{ maxWidth: '720px' }}>
      {/* Workout header */}
      <div className="mb-5 pb-4" style={{ borderBottom: '1px solid var(--border)' }}>
        {/* Name row */}
        <div className="flex items-center justify-between gap-3 mb-2">
          {editingName ? (
            <input
              className="forge-input flex-1"
              value={active.name}
              onChange={e => onNameChange(e.target.value)}
              onBlur={() => setEditingName(false)}
              onKeyDown={e => e.key === 'Enter' && setEditingName(false)}
              autoFocus
              style={{ fontSize: '1.5rem', fontFamily: 'Bebas Neue, sans-serif', padding: '0.25rem 0.5rem' }}
            />
          ) : (
            <button
              onClick={() => setEditingName(true)}
              className="forge-display text-3xl sm:text-4xl text-left flex-1"
              style={{ background: 'none', border: 'none', color: 'var(--text)', cursor: 'text', lineHeight: 1.1 }}
            >
              {active.name}
            </button>
          )}
          <button className="btn-ghost py-2 px-3 flex-shrink-0" onClick={onExit} style={{ fontSize: '0.75rem' }}>
            ← Exit
          </button>
        </div>
        {/* Meta row */}
        <div className="flex items-center gap-3">
          <Timer startTime={active.startTime} />
          <span style={{ color: 'var(--border)' }}>·</span>
          <span className="forge-label">{completedSets}/{totalSets} sets done</span>
        </div>
      </div>

      {/* Empty state */}
      {active.exercises.length === 0 ? (
        <div className="p-10 text-center mb-4" style={{ border: '1px dashed var(--border)' }}>
          <div className="forge-label">No exercises added yet</div>
        </div>
      ) : (
        <div className="flex flex-col gap-4 mb-4">
          {active.exercises.map(ex => {
            const prevSets = getPrevPerformance(ex.exerciseId, ex.exerciseName);
            const allDone = ex.sets.length > 0 && ex.sets.every(s => s.completed);
            return (
              <div
                key={ex.id}
                className="forge-card"
                style={allDone ? { borderLeft: '3px solid var(--success)' } : {}}
              >
                {/* Exercise header */}
                <div
                  className="flex items-center justify-between px-4 py-3"
                  style={{ borderBottom: '1px solid var(--border)' }}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`cat-badge cat-${ex.category} flex-shrink-0`}>{ex.category}</span>
                    <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '1rem', letterSpacing: '0.04em' }}>
                      {ex.exerciseName}
                    </span>
                  </div>
                  <button
                    onClick={() => onRemoveExercise(ex.id)}
                    style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', padding: '0.25rem 0.5rem', flexShrink: 0 }}
                  >
                    ✕
                  </button>
                </div>

                {/* Sets */}
                <table className="forge-table" style={{ width: '100%' }}>
                  <colgroup>
                    <col style={{ width: '1.75rem' }} />
                    <col />
                    <col style={{ width: '5.5rem' }} />
                    <col style={{ width: '4.5rem' }} />
                    <col style={{ width: '2.25rem' }} />
                    <col style={{ width: '1.5rem' }} />
                  </colgroup>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Prev</th>
                      <th style={{ textAlign: 'center' }}>Weight</th>
                      <th style={{ textAlign: 'center' }}>Reps</th>
                      <th style={{ textAlign: 'center' }}>✓</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {ex.sets.map((set, idx) => {
                      const prev = prevSets[idx];
                      const timerActive = activeTimer?.exerciseId === ex.id && activeTimer?.setId === set.id;
                      const completeSet = () => {
                        onUpdateSet(ex.id, set.id, { completed: true });
                        setActiveTimer({ exerciseId: ex.id, setId: set.id, durationSeconds: set.restSeconds ?? 90, startedAt: Date.now() });
                        const nextSet = ex.sets[idx + 1];
                        if (nextSet) {
                          setTimeout(() => document.getElementById(`w-${ex.id}-${nextSet.id}`)?.focus(), 50);
                        }
                      };
                      const inputBase: React.CSSProperties = {
                        width: '100%', background: 'var(--surface)', border: '1px solid var(--border)',
                        color: 'var(--text)', fontFamily: 'Space Mono, monospace', fontSize: '0.9rem',
                        textAlign: 'center', padding: '0.35rem 0.25rem', outline: 'none',
                      };
                      return (
                        <>
                        <tr
                          key={set.id}
                          style={{ background: set.completed ? 'rgba(0,217,126,0.05)' : undefined }}
                        >
                          <td>
                            <span className="forge-stat text-sm" style={{ color: 'var(--muted)' }}>{idx + 1}</span>
                          </td>
                          <td>
                            <span style={{ fontFamily: 'Space Mono, monospace', fontSize: '0.78rem', color: 'var(--dim)' }}>
                              {prev ? `${prev.weight}×${prev.reps}` : '—'}
                            </span>
                          </td>
                          <td>
                            <input
                              id={`w-${ex.id}-${set.id}`}
                              type="number"
                              inputMode="decimal"
                              enterKeyHint="next"
                              value={set.weight || ''}
                              placeholder="0"
                              style={inputBase}
                              onChange={e => onUpdateSet(ex.id, set.id, { weight: parseFloat(e.target.value) || 0 })}
                              onFocus={e => { e.target.select(); e.target.style.borderColor = 'var(--accent)'; e.target.style.background = 'rgba(200,255,0,0.05)'; }}
                              onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.background = 'var(--surface)'; }}
                              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); document.getElementById(`r-${ex.id}-${set.id}`)?.focus(); } }}
                            />
                          </td>
                          <td>
                            <input
                              id={`r-${ex.id}-${set.id}`}
                              type="number"
                              inputMode="numeric"
                              enterKeyHint="done"
                              value={set.reps || ''}
                              placeholder="0"
                              style={inputBase}
                              onChange={e => onUpdateSet(ex.id, set.id, { reps: parseInt(e.target.value) || 0 })}
                              onFocus={e => { e.target.select(); e.target.style.borderColor = 'var(--accent)'; e.target.style.background = 'rgba(200,255,0,0.05)'; }}
                              onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.background = 'var(--surface)'; }}
                              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); completeSet(); } }}
                            />
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <input
                              type="checkbox"
                              className="forge-checkbox"
                              checked={set.completed}
                              onChange={e => {
                                onUpdateSet(ex.id, set.id, { completed: e.target.checked });
                                if (e.target.checked) {
                                  setActiveTimer({ exerciseId: ex.id, setId: set.id, durationSeconds: set.restSeconds ?? 90, startedAt: Date.now() });
                                } else if (timerActive) {
                                  setActiveTimer(null);
                                }
                              }}
                            />
                          </td>
                          <td>
                            {ex.sets.length > 1 && (
                              <button
                                onClick={() => onRemoveSet(ex.id, set.id)}
                                style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '0.75rem' }}
                              >
                                ✕
                              </button>
                            )}
                          </td>
                        </tr>
                        <RestRow
                          key={`rest-${set.id}`}
                          colSpan={6}
                          restSeconds={set.restSeconds ?? 90}
                          active={timerActive}
                          startedAt={timerActive ? activeTimer!.startedAt : undefined}
                          onAdjust={delta => onUpdateSet(ex.id, set.id, { restSeconds: Math.max(15, (set.restSeconds ?? 90) + delta) })}
                          onSkip={() => setActiveTimer(null)}
                        />
                        </>
                      );
                    })}
                  </tbody>
                </table>

                <div className="px-4 py-3">
                  <button className="btn-ghost w-full py-2.5" onClick={() => onAddSet(ex.id)} style={{ fontSize: '0.75rem' }}>
                    + Add Set
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <button className="btn-ghost w-full py-3" onClick={() => setShowPicker(true)}
        style={{ fontSize: '0.85rem' }}>
        + ADD EXERCISE
      </button>

      <div style={{ height: '2rem' }} />

      <button
        className="btn-accent w-full py-3 mb-3"
        onClick={onFinish}
        disabled={active.exercises.length === 0}
        style={{ fontSize: '0.85rem' }}
      >
        FINISH WORKOUT
      </button>
      <button className="w-full py-3 mb-4" onClick={onCancel}
        style={{ background: 'none', border: '1px solid var(--danger)', color: 'var(--danger)', cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '0.85rem', letterSpacing: '0.1em' }}>
        DISCARD WORKOUT
      </button>

      {showPicker && (
        <ExercisePicker onSelect={onAddExercise} onClose={() => setShowPicker(false)} />
      )}
    </div>
  );
}

// ── Root export ───────────────────────────────────────────────────────────────

export default function WorkoutLogger({
  activeWorkout, workouts, templates, startWorkout, startFromTemplate, startFromGoalTemplate,
  updateWorkoutName, finishWorkout, cancelWorkout, deleteWorkout,
  saveTemplate, deleteTemplate,
  addExercise, removeExercise, addSet, updateSet, removeSet, onExit, getPrevPerformance,
}: WorkoutLoggerProps) {
  const handleFinish = useCallback(() => {
    if (activeWorkout && activeWorkout.exercises.length === 0) return;
    finishWorkout();
  }, [activeWorkout, finishWorkout]);

  if (!activeWorkout) {
    return (
      <StartScreen
        workouts={workouts}
        onTemplate={startFromTemplate}
        onDelete={deleteWorkout}
      />
    );
  }

  return (
    <ActiveWorkoutView
      active={activeWorkout}
      onFinish={handleFinish}
      onCancel={cancelWorkout}
      onExit={onExit}
      onNameChange={updateWorkoutName}
      onAddExercise={addExercise}
      onRemoveExercise={removeExercise}
      onAddSet={addSet}
      onUpdateSet={updateSet}
      onRemoveSet={removeSet}
      getPrevPerformance={getPrevPerformance}
    />
  );
}
