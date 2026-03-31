import { useState } from 'react';
import { MuscleGroup } from '../types';
import { EXERCISES } from '../data/exercises';

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

export default function ExerciseLibrary() {
  const [cat, setCat] = useState<MuscleGroup | 'all'>('all');
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = EXERCISES.filter(e => {
    const matchCat = cat === 'all' || e.category === cat;
    const matchSearch =
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.primaryMuscles.some(m => m.toLowerCase().includes(search.toLowerCase()));
    return matchCat && matchSearch;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 animate-fade-up">
      {/* Header */}
      <div className="mb-6">
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
                  {EXERCISES.filter(e => e.category === c.id).length}
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
          <div className="forge-display text-3xl mb-2" style={{ color: 'var(--border)' }}>
            NO RESULTS
          </div>
          <p style={{ color: 'var(--muted)', fontFamily: 'Barlow', fontSize: '0.9rem' }}>
            Try a different search or category.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {filtered.map((ex, i) => {
            const isOpen = expanded === ex.id;
            return (
              <div
                key={ex.id}
                className="forge-card animate-fade-up"
                style={{ animationDelay: `${i * 20}ms` }}
              >
                <button
                  onClick={() => setExpanded(isOpen ? null : ex.id)}
                  className="w-full flex items-start gap-3 p-4 text-left"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text)' }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`cat-badge cat-${ex.category}`}>{ex.category}</span>
                    </div>
                    <div
                      style={{
                        fontFamily: 'Barlow Condensed, sans-serif',
                        fontWeight: 700,
                        fontSize: '1rem',
                        letterSpacing: '0.04em',
                      }}
                    >
                      {ex.name}
                    </div>
                    <div className="forge-label mt-1" style={{ color: 'var(--muted)' }}>
                      {ex.equipment}
                    </div>
                  </div>
                  <span
                    style={{
                      color: 'var(--muted)',
                      fontSize: '0.75rem',
                      marginTop: '2px',
                      transition: 'transform 0.2s',
                      transform: isOpen ? 'rotate(180deg)' : 'none',
                      flexShrink: 0,
                    }}
                  >
                    ▾
                  </span>
                </button>

                {isOpen && (
                  <div
                    style={{ borderTop: '1px solid var(--border)', padding: '1rem' }}
                    className="animate-fade-up"
                  >
                    <p style={{ color: 'var(--dim)', fontSize: '0.85rem', lineHeight: 1.6, marginBottom: '0.75rem' }}>
                      {ex.description}
                    </p>
                    <div className="forge-label mb-2">Primary Muscles</div>
                    <div className="flex flex-wrap gap-1">
                      {ex.primaryMuscles.map(m => (
                        <span
                          key={m}
                          style={{
                            fontFamily: 'Space Mono, monospace',
                            fontSize: '0.65rem',
                            padding: '0.2rem 0.5rem',
                            background: 'var(--surface)',
                            border: '1px solid var(--border)',
                            color: 'var(--dim)',
                          }}
                        >
                          {m}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
