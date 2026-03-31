import { useState, useEffect, useCallback } from 'react';
import { ActiveWorkout, Exercise, Workout, WorkoutSet, MuscleGroup, WorkoutTemplate, TemplateExercise, TemplateSet } from '../types';
import { EXERCISES } from '../data/exercises';

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
  getPrevPerformance: (exerciseId: string) => WorkoutSet[];
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

  const filtered = EXERCISES.filter(e => {
    const matchCat = cat === 'all' || e.category === cat;
    const matchSearch = e.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.8)' }}
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-lg flex flex-col"
        style={{
          maxHeight: '85vh',
          background: 'var(--card)',
          border: '1px solid var(--border)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
          <h3 className="forge-display text-2xl">ADD EXERCISE</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '1.1rem', padding: '0.25rem 0.5rem' }}>✕</button>
        </div>

        {/* Search */}
        <div className="px-4 pt-3 pb-2">
          <input
            className="forge-input"
            placeholder="Search exercises..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            autoFocus
          />
        </div>

        {/* Category chips */}
        <div className="flex gap-1.5 px-4 pb-3 overflow-x-auto">
          {CATS.map(c => (
            <button
              key={c.id}
              onClick={() => setCat(c.id)}
              style={{
                fontFamily: 'Barlow Condensed, sans-serif',
                fontWeight: 700,
                fontSize: '0.68rem',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                padding: '0.2rem 0.55rem',
                border: `1px solid ${cat === c.id ? 'var(--accent)' : 'var(--border)'}`,
                background: cat === c.id ? 'rgba(200,255,0,0.1)' : 'transparent',
                color: cat === c.id ? 'var(--accent)' : 'var(--dim)',
                cursor: 'pointer',
                flexShrink: 0,
                transition: 'all 0.1s',
              }}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="overflow-y-auto flex-1" style={{ borderTop: '1px solid var(--border)' }}>
          {filtered.length === 0 ? (
            <div className="p-8 text-center forge-label">No exercises found</div>
          ) : (
            filtered.map(ex => (
              <button
                key={ex.id}
                onClick={() => { onSelect(ex); onClose(); }}
                className="w-full flex items-center gap-3 px-4 py-3 text-left"
                style={{
                  background: 'transparent',
                  border: 'none',
                  borderBottom: '1px solid var(--border)',
                  cursor: 'pointer',
                  color: 'var(--text)',
                  minHeight: '52px',
                }}
              >
                <span className={`cat-badge cat-${ex.category} flex-shrink-0`}>{ex.category}</span>
                <div className="min-w-0">
                  <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '0.95rem' }}>
                    {ex.name}
                  </div>
                  <div className="forge-label mt-0.5 truncate">{ex.equipment}</div>
                </div>
              </button>
            ))
          )}
        </div>
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

function HistoryRow({ workout, onTemplate, onDelete }: {
  workout: Workout;
  onTemplate: (w: Workout) => void;
  onDelete: (id: string) => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const vol = workoutVolume(workout);

  if (confirming) {
    return (
      <div
        className="forge-card flex items-center justify-between gap-3 p-3 sm:p-4"
        style={{ borderLeft: '3px solid var(--danger)' }}
      >
        <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '0.9rem', color: 'var(--dim)' }}>
          Delete &ldquo;{workout.name}&rdquo;?
        </span>
        <div className="flex gap-2 flex-shrink-0">
          <button className="btn-ghost py-1.5 px-3" style={{ fontSize: '0.75rem' }} onClick={() => setConfirming(false)}>
            Cancel
          </button>
          <button className="btn-danger py-1.5 px-3" style={{ fontSize: '0.75rem' }} onClick={() => onDelete(workout.id)}>
            Delete
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="forge-card flex items-center gap-3 p-3 sm:p-4">
      {/* Main info */}
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
        onClick={() => onTemplate(workout)}
        title="Repeat this workout"
      >
        Repeat
      </button>

      {/* Delete */}
      <button
        onClick={() => setConfirming(true)}
        title="Delete workout"
        style={{
          background: 'none', border: 'none', color: 'var(--muted)',
          cursor: 'pointer', padding: '0.25rem 0.375rem', flexShrink: 0,
          display: 'flex', alignItems: 'center', transition: 'color 0.1s',
        }}
        onMouseEnter={e => (e.currentTarget.style.color = 'var(--danger)')}
        onMouseLeave={e => (e.currentTarget.style.color = 'var(--muted)')}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="square">
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6l-1 14H6L5 6" />
          <path d="M10 11v6M14 11v6" />
          <path d="M9 6V4h6v2" />
        </svg>
      </button>
    </div>
  );
}

// ── Template helpers ──────────────────────────────────────────────────────────

const daysSince = (iso: string) =>
  Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);

const fmtDaysSince = (days: number) => {
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 14) return `${days} days ago`;
  if (days < 60) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
};

const urgencyColor = (days: number | null) =>
  days === null || days > 7 ? 'var(--accent)' : days > 3 ? 'var(--dim)' : 'var(--muted)';

// ── Template editor ───────────────────────────────────────────────────────────

function TemplateEditor({ initial, onSave, onCancel }: {
  initial: WorkoutTemplate;
  onSave: (t: WorkoutTemplate) => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState<WorkoutTemplate>(() =>
    JSON.parse(JSON.stringify(initial)) // deep clone
  );
  const [showPicker, setShowPicker] = useState(false);

  const updateName = (name: string) => setDraft(d => ({ ...d, name }));

  const addExerciseToDraft = (ex: Exercise) => {
    const newEx: TemplateExercise = {
      id: uid(),
      exerciseId: ex.id,
      exerciseName: ex.name,
      category: ex.category,
      sets: [{ id: uid(), weight: 0, reps: 8 }],
    };
    setDraft(d => ({ ...d, exercises: [...d.exercises, newEx] }));
  };

  const removeExercise = (exId: string) =>
    setDraft(d => ({ ...d, exercises: d.exercises.filter(e => e.id !== exId) }));

  const addSet = (exId: string) =>
    setDraft(d => ({
      ...d,
      exercises: d.exercises.map(e => {
        if (e.id !== exId) return e;
        const last = e.sets[e.sets.length - 1];
        return { ...e, sets: [...e.sets, { id: uid(), weight: last?.weight ?? 0, reps: last?.reps ?? 8 }] };
      }),
    }));

  const removeSet = (exId: string, setId: string) =>
    setDraft(d => ({
      ...d,
      exercises: d.exercises.map(e => {
        if (e.id !== exId) return e;
        return { ...e, sets: e.sets.filter(s => s.id !== setId) };
      }).filter(e => e.sets.length > 0),
    }));

  const updateSet = (exId: string, setId: string, updates: Partial<TemplateSet>) =>
    setDraft(d => ({
      ...d,
      exercises: d.exercises.map(e => {
        if (e.id !== exId) return e;
        return { ...e, sets: e.sets.map(s => s.id === setId ? { ...s, ...updates } : s) };
      }),
    }));

  return (
    <div className="p-4 sm:p-6 lg:p-8 animate-fade-up" style={{ maxWidth: '680px' }}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-6 pb-4" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="flex-1 min-w-0">
          <div className="forge-label mb-1">Editing Template</div>
          <input
            className="forge-input forge-display"
            value={draft.name}
            onChange={e => updateName(e.target.value)}
            style={{ fontSize: '1.75rem', padding: '0.25rem 0.5rem', width: '100%', fontFamily: 'Bebas Neue, sans-serif' }}
          />
        </div>
        <div className="flex gap-2 flex-shrink-0 mt-6">
          <button className="btn-ghost py-2 px-3" style={{ fontSize: '0.75rem' }} onClick={onCancel}>Cancel</button>
          <button className="btn-accent py-2 px-4" onClick={() => onSave(draft)}>Save</button>
        </div>
      </div>

      {/* Goal note */}
      <div className="forge-label mb-4 p-3" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        Set your goal weight and reps for each exercise. These pre-fill your workout when you start from this template.
      </div>

      {/* Exercises */}
      {draft.exercises.length === 0 ? (
        <div className="p-10 text-center mb-4" style={{ border: '1px dashed var(--border)' }}>
          <div className="forge-label mb-3">No exercises yet</div>
          <button className="btn-accent" onClick={() => setShowPicker(true)}>Add Exercise</button>
        </div>
      ) : (
        <div className="flex flex-col gap-4 mb-4">
          {draft.exercises.map(ex => (
            <div key={ex.id} className="forge-card">
              {/* Exercise header */}
              <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`cat-badge cat-${ex.category} flex-shrink-0`}>{ex.category}</span>
                  <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '1rem' }}>
                    {ex.exerciseName}
                  </span>
                </div>
                <button onClick={() => removeExercise(ex.id)} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', padding: '0.25rem 0.5rem', flexShrink: 0 }}>✕</button>
              </div>

              {/* Sets */}
              <div className="overflow-x-auto">
                <table className="forge-table" style={{ minWidth: '340px' }}>
                  <colgroup>
                    <col style={{ width: '2.25rem' }} />
                    <col /><col />
                    <col style={{ width: '2rem' }} />
                  </colgroup>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Goal Weight (lbs)</th>
                      <th>Goal Reps</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {ex.sets.map((s, idx) => (
                      <tr key={s.id}>
                        <td><span className="forge-stat text-sm" style={{ color: 'var(--muted)' }}>{idx + 1}</span></td>
                        <td>
                          <Stepper value={s.weight} onChange={v => updateSet(ex.id, s.id, { weight: v })} step={2.5} min={0} decimals={1} />
                        </td>
                        <td>
                          <Stepper value={s.reps} onChange={v => updateSet(ex.id, s.id, { reps: v })} step={1} min={1} />
                        </td>
                        <td>
                          {ex.sets.length > 1 && (
                            <button onClick={() => removeSet(ex.id, s.id)} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '0.75rem' }}>✕</button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-4 py-3">
                <button className="btn-ghost w-full py-2" style={{ fontSize: '0.75rem' }} onClick={() => addSet(ex.id)}>
                  + Add Set
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {draft.exercises.length > 0 && (
        <button className="btn-ghost w-full py-3" onClick={() => setShowPicker(true)}>+ Add Exercise</button>
      )}

      {showPicker && <ExercisePicker onSelect={ex => { addExerciseToDraft(ex); setShowPicker(false); }} onClose={() => setShowPicker(false)} />}
    </div>
  );
}

// ── Templates section ─────────────────────────────────────────────────────────

function TemplatesSection({ templates, workouts, onStart, onEdit, onDelete }: {
  templates: WorkoutTemplate[];
  workouts: Workout[];
  onStart: (t: WorkoutTemplate) => void;
  onEdit: (t: WorkoutTemplate) => void;
  onDelete: (id: string) => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  // Attach last-done date from history to each template, then sort most overdue first
  const sorted = [...templates]
    .map(t => {
      const last = workouts.find(w => w.name === t.name);
      const days = last ? daysSince(last.date) : null;
      return { t, days };
    })
    .sort((a, b) => {
      const da = a.days ?? Infinity;
      const db = b.days ?? Infinity;
      return db - da;
    });

  return (
    <div className="mb-8">
      <div style={{ borderTop: '1px solid var(--border)', marginBottom: '1.5rem' }} />
      <h2 className="forge-display text-2xl mb-3">TEMPLATES</h2>
      <div className="flex flex-col gap-2">
        {sorted.map(({ t, days }) => {
          const isConfirming = confirmDelete === t.id;

          if (isConfirming) {
            return (
              <div key={t.id} className="forge-card flex items-center justify-between gap-3 p-3 sm:p-4" style={{ borderLeft: '3px solid var(--danger)' }}>
                <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '0.9rem', color: 'var(--dim)' }}>
                  Delete &ldquo;{t.name}&rdquo;?
                </span>
                <div className="flex gap-2 flex-shrink-0">
                  <button className="btn-ghost py-1.5 px-3" style={{ fontSize: '0.75rem' }} onClick={() => setConfirmDelete(null)}>Cancel</button>
                  <button className="btn-danger py-1.5 px-3" style={{ fontSize: '0.75rem' }} onClick={() => { onDelete(t.id); setConfirmDelete(null); }}>Delete</button>
                </div>
              </div>
            );
          }

          return (
            <div key={t.id} className="forge-card flex items-center gap-3 p-3 sm:p-4">
              {/* Start button — main action */}
              <button
                onClick={() => onStart(t)}
                disabled={t.exercises.length === 0}
                className="flex-1 flex items-center justify-between gap-3 min-w-0 text-left"
                style={{ background: 'none', border: 'none', cursor: t.exercises.length ? 'pointer' : 'default', color: 'var(--text)', padding: 0 }}
              >
                <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 800, fontSize: '1.05rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                  {t.name}
                </span>
                <span className="forge-stat flex-shrink-0" style={{ fontSize: '0.8rem', color: urgencyColor(days) }}>
                  {days !== null ? fmtDaysSince(days) : 'Never done'}
                </span>
              </button>

              {/* Edit */}
              <button
                onClick={() => onEdit(t)}
                title="Edit template"
                style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', padding: '0.25rem 0.375rem', flexShrink: 0, transition: 'color 0.1s', display: 'flex', alignItems: 'center' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--text)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--muted)')}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="square">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              </button>

              {/* Delete */}
              <button
                onClick={() => setConfirmDelete(t.id)}
                title="Delete template"
                style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', padding: '0.25rem 0.375rem', flexShrink: 0, transition: 'color 0.1s', display: 'flex', alignItems: 'center' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--danger)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--muted)')}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="square">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" />
                </svg>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Start screen ──────────────────────────────────────────────────────────────

function StartScreen({ workouts, templates, onStart, onTemplate, onDelete, onStartGoalTemplate, onSaveTemplate, onDeleteTemplate }: {
  workouts: Workout[];
  templates: WorkoutTemplate[];
  onStart: (name: string) => void;
  onTemplate: (w: Workout) => void;
  onDelete: (id: string) => void;
  onStartGoalTemplate: (t: WorkoutTemplate) => void;
  onSaveTemplate: (t: WorkoutTemplate) => void;
  onDeleteTemplate: (id: string) => void;
}) {
  const [name, setName] = useState('');
  const [editing, setEditing] = useState<WorkoutTemplate | null>(null);

  if (editing) {
    return (
      <TemplateEditor
        initial={editing}
        onSave={t => { onSaveTemplate(t); setEditing(null); }}
        onCancel={() => setEditing(null)}
      />
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 animate-fade-up">
      {/* New workout form */}
      <div className="mb-8" style={{ maxWidth: '480px' }}>
        <div className="forge-label mb-1">Ready to train?</div>
        <h1 className="forge-display text-4xl sm:text-5xl lg:text-6xl mb-5">NEW WORKOUT</h1>
        <div className="mb-1.5 forge-label">Workout Name</div>
        <input
          className="forge-input mb-3"
          placeholder="e.g. Push Day, Leg Day..."
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && onStart(name)}
          style={{ fontSize: '1rem', padding: '0.75rem 1rem' }}
        />
        <button className="btn-accent w-full py-4" onClick={() => onStart(name)}>
          Start Workout
        </button>
      </div>

      {/* Templates */}
      <TemplatesSection
        templates={templates}
        workouts={workouts}
        onStart={onStartGoalTemplate}
        onEdit={setEditing}
        onDelete={onDeleteTemplate}
      />

      {/* Full history */}
      {workouts.length > 0 && (
        <>
          <div style={{ borderTop: '1px solid var(--border)', marginBottom: '1.5rem' }} />
          <div className="flex items-center justify-between mb-4">
            <h2 className="forge-display text-2xl">WORKOUT HISTORY</h2>
            <span className="forge-label">{workouts.length} sessions</span>
          </div>
          <div className="flex flex-col gap-2">
            {workouts.map(w => (
              <HistoryRow
                key={w.id}
                workout={w}
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

// ── Active workout view ───────────────────────────────────────────────────────

function ActiveWorkoutView({
  active, onFinish, onCancel, onNameChange,
  onAddExercise, onRemoveExercise, onAddSet, onUpdateSet, onRemoveSet, getPrevPerformance,
}: {
  active: ActiveWorkout;
  onFinish: () => void;
  onCancel: () => void;
  onNameChange: (n: string) => void;
  onAddExercise: (e: Exercise) => void;
  onRemoveExercise: (id: string) => void;
  onAddSet: (id: string) => void;
  onUpdateSet: (exId: string, setId: string, u: Partial<WorkoutSet>) => void;
  onRemoveSet: (exId: string, setId: string) => void;
  getPrevPerformance: (exerciseId: string) => WorkoutSet[];
}) {
  const [showPicker, setShowPicker] = useState(false);
  const [editingName, setEditingName] = useState(false);

  const completedSets = active.exercises.reduce((acc, ex) => acc + ex.sets.filter(s => s.completed).length, 0);
  const totalSets = active.exercises.reduce((acc, ex) => acc + ex.sets.length, 0);

  return (
    <div className="p-4 sm:p-6 lg:p-8 animate-fade-up" style={{ maxWidth: '720px' }}>
      {/* Workout header */}
      <div className="mb-5 pb-4" style={{ borderBottom: '1px solid var(--border)' }}>
        {/* Name row */}
        <div className="flex items-start justify-between gap-3 mb-2">
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
          <div className="flex gap-2 flex-shrink-0 mt-1">
            <button className="btn-ghost py-2 px-3" onClick={onCancel} style={{ fontSize: '0.75rem' }}>
              Discard
            </button>
            <button
              className="btn-accent py-2 px-4"
              onClick={onFinish}
              disabled={active.exercises.length === 0}
            >
              Finish
            </button>
          </div>
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
          <div className="forge-label mb-3">No exercises added yet</div>
          <button className="btn-accent" onClick={() => setShowPicker(true)}>Add First Exercise</button>
        </div>
      ) : (
        <div className="flex flex-col gap-4 mb-4">
          {active.exercises.map(ex => {
            const prevSets = getPrevPerformance(ex.exerciseId);
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

                {/* Sets — horizontally scrollable on small screens */}
                <div className="overflow-x-auto">
                  <table className="forge-table" style={{ minWidth: '420px' }}>
                    <colgroup>
                      <col style={{ width: '2.25rem' }} />
                      <col style={{ width: '5rem' }} />
                      <col />
                      <col />
                      <col style={{ width: '2.5rem' }} />
                      <col style={{ width: '2rem' }} />
                    </colgroup>
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Prev</th>
                        <th>Weight (lbs)</th>
                        <th>Reps</th>
                        <th style={{ textAlign: 'center' }}>✓</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {ex.sets.map((set, idx) => {
                        const prev = prevSets[idx];
                        return (
                          <tr
                            key={set.id}
                            style={{ background: set.completed ? 'rgba(0,217,126,0.05)' : undefined }}
                          >
                            <td>
                              <span className="forge-stat text-sm" style={{ color: 'var(--muted)' }}>{idx + 1}</span>
                            </td>
                            <td>
                              <span className="forge-label" style={{ color: 'var(--muted)' }}>
                                {prev ? `${prev.weight}×${prev.reps}` : '—'}
                              </span>
                            </td>
                            <td>
                              <Stepper
                                value={set.weight}
                                onChange={v => onUpdateSet(ex.id, set.id, { weight: v })}
                                step={2.5}
                                min={0}
                                decimals={1}
                              />
                            </td>
                            <td>
                              <Stepper
                                value={set.reps}
                                onChange={v => onUpdateSet(ex.id, set.id, { reps: v })}
                                step={1}
                                min={1}
                              />
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <input
                                type="checkbox"
                                className="forge-checkbox"
                                checked={set.completed}
                                onChange={e => onUpdateSet(ex.id, set.id, { completed: e.target.checked })}
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
                        );
                      })}
                    </tbody>
                  </table>
                </div>

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

      {active.exercises.length > 0 && (
        <button className="btn-ghost w-full py-3 mb-4" onClick={() => setShowPicker(true)}>
          + Add Exercise
        </button>
      )}

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
  addExercise, removeExercise, addSet, updateSet, removeSet, getPrevPerformance,
}: WorkoutLoggerProps) {
  const handleFinish = useCallback(() => {
    if (activeWorkout && activeWorkout.exercises.length === 0) return;
    finishWorkout();
  }, [activeWorkout, finishWorkout]);

  if (!activeWorkout) {
    return (
      <StartScreen
        workouts={workouts}
        templates={templates}
        onStart={startWorkout}
        onTemplate={startFromTemplate}
        onDelete={deleteWorkout}
        onStartGoalTemplate={startFromGoalTemplate}
        onSaveTemplate={saveTemplate}
        onDeleteTemplate={deleteTemplate}
      />
    );
  }

  return (
    <ActiveWorkoutView
      active={activeWorkout}
      onFinish={handleFinish}
      onCancel={cancelWorkout}
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
