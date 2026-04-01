import { useState } from 'react';
import { Exercise, MuscleGroup, WorkoutTemplate, TemplateExercise, TemplateSet } from '../types';
import { EXERCISES } from '../data/exercises';

const uid = () => Math.random().toString(36).slice(2, 11);

export const newTemplate = (): WorkoutTemplate => ({
  id: uid(),
  name: 'New Template',
  exercises: [],
});

// ── Number stepper ────────────────────────────────────────────────────────────

function Stepper({ value, onChange, step = 1, min = 0, decimals = 0 }: {
  value: number; onChange: (v: number) => void; step?: number; min?: number; decimals?: number;
}) {
  return (
    <div className="stepper">
      <button className="stepper-btn" onClick={() => onChange(Math.max(min, parseFloat((value - step).toFixed(decimals))))}>−</button>
      <input
        className="stepper-input"
        type="number"
        value={value}
        onChange={e => { const v = parseFloat(e.target.value); if (!isNaN(v)) onChange(Math.max(min, v)); }}
      />
      <button className="stepper-btn" onClick={() => onChange(parseFloat((value + step).toFixed(decimals)))}>+</button>
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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" style={{ background: 'rgba(0,0,0,0.8)' }} onClick={onClose}>
      <div className="w-full sm:max-w-lg flex flex-col" style={{ maxHeight: '85vh', background: 'var(--card)', border: '1px solid var(--border)' }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
          <h3 className="forge-display text-2xl">ADD EXERCISE</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '1.1rem', padding: '0.25rem 0.5rem' }}>✕</button>
        </div>
        <div className="px-4 pt-3 pb-2">
          <input className="forge-input" placeholder="Search exercises..." value={search} onChange={e => setSearch(e.target.value)} autoFocus />
        </div>
        <div className="flex gap-1.5 px-4 pb-3 overflow-x-auto">
          {CATS.map(c => (
            <button key={c.id} onClick={() => setCat(c.id)} style={{
              fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '0.68rem',
              letterSpacing: '0.1em', textTransform: 'uppercase', padding: '0.2rem 0.55rem',
              border: `1px solid ${cat === c.id ? 'var(--accent)' : 'var(--border)'}`,
              background: cat === c.id ? 'rgba(200,255,0,0.1)' : 'transparent',
              color: cat === c.id ? 'var(--accent)' : 'var(--dim)', cursor: 'pointer', flexShrink: 0,
            }}>{c.label}</button>
          ))}
        </div>
        <div className="overflow-y-auto flex-1" style={{ borderTop: '1px solid var(--border)' }}>
          {filtered.length === 0 ? (
            <div className="p-8 text-center forge-label">No exercises found</div>
          ) : filtered.map(ex => (
            <button key={ex.id} onClick={() => { onSelect(ex); onClose(); }}
              className="w-full flex items-center gap-3 px-4 py-3 text-left"
              style={{ background: 'transparent', border: 'none', borderBottom: '1px solid var(--border)', cursor: 'pointer', color: 'var(--text)', minHeight: '52px' }}
            >
              <span className={`cat-badge cat-${ex.category} flex-shrink-0`}>{ex.category}</span>
              <div className="min-w-0">
                <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '0.95rem' }}>{ex.name}</div>
                <div className="forge-label mt-0.5 truncate">{ex.equipment}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Template editor ───────────────────────────────────────────────────────────

export default function TemplateEditor({ initial, onSave, onCancel }: {
  initial: WorkoutTemplate;
  onSave: (t: WorkoutTemplate) => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState<WorkoutTemplate>(() => JSON.parse(JSON.stringify(initial)));
  const [showPicker, setShowPicker] = useState(false);

  const updateName = (name: string) => setDraft(d => ({ ...d, name }));

  const addExercise = (ex: Exercise) => {
    const newEx: TemplateExercise = {
      id: uid(), exerciseId: ex.id, exerciseName: ex.name, category: ex.category,
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
          <div className="forge-label mb-1">{initial.exercises.length === 0 && initial.name === 'New Template' ? 'New Template' : 'Editing Template'}</div>
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
              <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`cat-badge cat-${ex.category} flex-shrink-0`}>{ex.category}</span>
                  <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '1rem' }}>{ex.exerciseName}</span>
                </div>
                <button onClick={() => removeExercise(ex.id)} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', padding: '0.25rem 0.5rem', flexShrink: 0 }}>✕</button>
              </div>
              <div className="overflow-x-auto">
                <table className="forge-table" style={{ minWidth: '340px' }}>
                  <colgroup>
                    <col style={{ width: '2.25rem' }} /><col /><col /><col style={{ width: '2rem' }} />
                  </colgroup>
                  <thead>
                    <tr><th>#</th><th>Goal Weight (lbs)</th><th>Goal Reps</th><th></th></tr>
                  </thead>
                  <tbody>
                    {ex.sets.map((s, idx) => (
                      <tr key={s.id}>
                        <td><span className="forge-stat text-sm" style={{ color: 'var(--muted)' }}>{idx + 1}</span></td>
                        <td><Stepper value={s.weight} onChange={v => updateSet(ex.id, s.id, { weight: v })} step={2.5} min={0} decimals={1} /></td>
                        <td><Stepper value={s.reps} onChange={v => updateSet(ex.id, s.id, { reps: v })} step={1} min={1} /></td>
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
                <button className="btn-ghost w-full py-2" style={{ fontSize: '0.75rem' }} onClick={() => addSet(ex.id)}>+ Add Set</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {draft.exercises.length > 0 && (
        <button className="btn-ghost w-full py-3" onClick={() => setShowPicker(true)}>+ Add Exercise</button>
      )}

      {showPicker && <ExercisePicker onSelect={ex => { addExercise(ex); setShowPicker(false); }} onClose={() => setShowPicker(false)} />}
    </div>
  );
}
