import { useState, useMemo } from 'react';
import { MuscleGroup } from '../types';
import { EXERCISES } from '../data/exercises';
import { useCustomExercises } from '../hooks/useCustomExercises';

const CATS: { id: MuscleGroup | 'all'; label: string; color: string }[] = [
  { id: 'all',       label: 'All',       color: '#F0F0F0' },
  { id: 'chest',     label: 'Chest',     color: '#FF7043' },
  { id: 'back',      label: 'Back',      color: '#4D9EFF' },
  { id: 'shoulders', label: 'Shoulders', color: '#AB47BC' },
  { id: 'arms',      label: 'Arms',      color: '#26C6DA' },
  { id: 'legs',      label: 'Legs',      color: '#00D97E' },
  { id: 'core',      label: 'Core',      color: '#FFCA28' },
  { id: 'cardio',    label: 'Cardio',    color: '#EF5350' },
];

const MUSCLE_CATS: { id: MuscleGroup; label: string }[] = CATS.filter(c => c.id !== 'all') as { id: MuscleGroup; label: string; color: string }[];

export default function ExerciseLibrary() {
  const [cat, setCat] = useState<MuscleGroup | 'all'>('all');
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCat, setNewCat] = useState<MuscleGroup>('chest');
  const [newEquip, setNewEquip] = useState('');
  const { customs, createExercise } = useCustomExercises();

  const allExercises = useMemo(() => [...EXERCISES, ...customs], [customs]);

  const filtered = allExercises.filter(e => {
    const matchCat = cat === 'all' || e.category === cat;
    const matchSearch =
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.primaryMuscles.some(m => m.toLowerCase().includes(search.toLowerCase()));
    return matchCat && matchSearch;
  });

  const handleCreate = () => {
    const name = newName.trim();
    if (!name) return;
    createExercise(name, newCat, newEquip);
    setCreating(false);
    setNewName('');
    setNewEquip('');
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 animate-fade-up">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <div className="forge-label mb-1">Browse & Learn</div>
          <h1 className="forge-display text-4xl sm:text-5xl lg:text-6xl mb-4">EXERCISE LIBRARY</h1>
          <input
            className="forge-input"
            placeholder="Search exercises or muscles..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ maxWidth: '400px' }}
          />
        </div>
        <button
          className="btn-accent flex-shrink-0 py-2 px-4 mt-8"
          style={{ fontSize: '0.75rem' }}
          onClick={() => { setNewName(search); setNewCat('chest'); setNewEquip(''); setCreating(true); }}
        >
          + Create
        </button>
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        {CATS.map(c => {
          const active = cat === c.id;
          return (
            <button
              key={c.id}
              onClick={() => setCat(c.id)}
              style={{
                fontFamily: 'Barlow Condensed, sans-serif',
                fontWeight: 700,
                fontSize: '0.75rem',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                padding: '0.4rem 0.875rem',
                border: `1px solid ${active ? c.color : 'var(--border)'}`,
                background: active ? `${c.color}18` : 'transparent',
                color: active ? c.color : 'var(--dim)',
                cursor: 'pointer',
                transition: 'all 0.12s',
              }}
            >
              {c.label}
              {c.id !== 'all' && (
                <span style={{ marginLeft: '0.4rem', opacity: 0.6, fontSize: '0.65rem' }}>
                  {allExercises.filter(e => e.category === c.id).length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Count */}
      <div className="forge-label mb-4">
        {filtered.length} exercise{filtered.length !== 1 ? 's' : ''}
        {search && ` matching "${search}"`}
      </div>

      {/* Exercise grid */}
      {filtered.length === 0 ? (
        <div className="p-12 text-center" style={{ border: '1px dashed var(--border)' }}>
          <div className="forge-display text-3xl mb-2" style={{ color: 'var(--border)' }}>NO RESULTS</div>
          <p style={{ color: 'var(--muted)', fontFamily: 'Barlow', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
            Try a different search or category.
          </p>
          <button className="btn-accent px-5 py-2" onClick={() => { setNewName(search); setNewCat('chest'); setNewEquip(''); setCreating(true); }}>
            + Create &ldquo;{search || 'Custom'}&rdquo;
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {filtered.map((ex, i) => {
            const isOpen = expanded === ex.id;
            const isCustom = customs.some(c => c.id === ex.id);
            return (
              <div key={ex.id} className="forge-card animate-fade-up" style={{ animationDelay: `${i * 20}ms` }}>
                <button
                  onClick={() => setExpanded(isOpen ? null : ex.id)}
                  className="w-full flex items-start gap-3 p-4 text-left"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text)' }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`cat-badge cat-${ex.category}`}>{ex.category}</span>
                      {isCustom && (
                        <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '0.55rem', letterSpacing: '0.1em', color: 'var(--accent)', border: '1px solid var(--accent)', padding: '0.1rem 0.3rem' }}>CUSTOM</span>
                      )}
                    </div>
                    <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '1rem', letterSpacing: '0.04em' }}>
                      {ex.name}
                    </div>
                    <div className="forge-label mt-1" style={{ color: 'var(--muted)' }}>{ex.equipment}</div>
                  </div>
                  <span style={{ color: 'var(--muted)', fontSize: '0.75rem', marginTop: '2px', transition: 'transform 0.2s', transform: isOpen ? 'rotate(180deg)' : 'none', flexShrink: 0 }}>▾</span>
                </button>

                {isOpen && (
                  <div style={{ borderTop: '1px solid var(--border)', padding: '1rem' }} className="animate-fade-up">
                    <p style={{ color: 'var(--dim)', fontSize: '0.85rem', lineHeight: 1.6, marginBottom: '0.75rem' }}>{ex.description}</p>
                    {ex.primaryMuscles.length > 0 && (
                      <>
                        <div className="forge-label mb-2">Primary Muscles</div>
                        <div className="flex flex-wrap gap-1">
                          {ex.primaryMuscles.map(m => (
                            <span key={m} style={{ fontFamily: 'Space Mono, monospace', fontSize: '0.65rem', padding: '0.2rem 0.5rem', background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--dim)' }}>
                              {m}
                            </span>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Create custom exercise modal */}
      {creating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.8)' }} onClick={() => setCreating(false)}>
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', width: 'min(480px, 95vw)', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
              <h2 className="forge-display text-2xl">CREATE EXERCISE</h2>
              <button onClick={() => setCreating(false)} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '1.1rem' }}>✕</button>
            </div>
            <div className="flex flex-col gap-4 p-5">
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
                  {MUSCLE_CATS.map(c => (
                    <button
                      key={c.id}
                      onClick={() => setNewCat(c.id)}
                      style={{
                        fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '0.68rem',
                        letterSpacing: '0.1em', textTransform: 'uppercase', padding: '0.25rem 0.6rem',
                        border: `1px solid ${newCat === c.id ? 'var(--accent)' : 'var(--border)'}`,
                        background: newCat === c.id ? 'rgba(200,255,0,0.1)' : 'transparent',
                        color: newCat === c.id ? 'var(--accent)' : 'var(--dim)', cursor: 'pointer',
                      }}
                    >
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
            <div className="flex gap-3 px-5 pb-5">
              <button className="btn-ghost flex-1 py-3" onClick={() => setCreating(false)}>Cancel</button>
              <button className="btn-accent flex-1 py-3" onClick={handleCreate} disabled={!newName.trim()}>Save Exercise</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
