import { useState, useMemo } from 'react';
import { PersonalRecord, MuscleGroup } from '../types';

interface RecordsProps {
  personalRecords: PersonalRecord[];
}

type SortKey = 'name' | 'weight' | 'e1rm' | 'date';

const CATS: { id: MuscleGroup | 'all'; label: string }[] = [
  { id: 'all',       label: 'All' },
  { id: 'chest',     label: 'Chest' },
  { id: 'back',      label: 'Back' },
  { id: 'shoulders', label: 'Shoulders' },
  { id: 'arms',      label: 'Arms' },
  { id: 'legs',      label: 'Legs' },
  { id: 'core',      label: 'Core' },
  { id: 'cardio',    label: 'Cardio' },
];

const isRecent = (date: string) =>
  Date.now() - new Date(date).getTime() < 14 * 86400000;

export default function PersonalRecords({ personalRecords }: RecordsProps) {
  const [cat, setCat] = useState<MuscleGroup | 'all'>('all');
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortAsc, setSortAsc] = useState(true);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(a => !a);
    else { setSortKey(key); setSortAsc(key === 'name'); }
  };

  const sorted = useMemo(() => {
    const filtered = cat === 'all' ? personalRecords : personalRecords.filter(r => r.category === cat);
    return [...filtered].sort((a, b) => {
      let diff = 0;
      switch (sortKey) {
        case 'name':   diff = a.exerciseName.localeCompare(b.exerciseName); break;
        case 'weight': diff = a.maxWeight - b.maxWeight; break;
        case 'e1rm':   diff = a.estimatedOneRepMax - b.estimatedOneRepMax; break;
        case 'date':   diff = new Date(a.date).getTime() - new Date(b.date).getTime(); break;
      }
      return sortAsc ? diff : -diff;
    });
  }, [personalRecords, cat, sortKey, sortAsc]);

  const SortIcon = ({ k }: { k: SortKey }) =>
    sortKey === k
      ? <span style={{ color: 'var(--accent)', marginLeft: '0.2rem' }}>{sortAsc ? '↑' : '↓'}</span>
      : <span style={{ color: 'var(--border)', marginLeft: '0.2rem' }}>↕</span>;

  const SortTh = ({ label, k }: { label: string; k: SortKey }) => (
    <th>
      <button
        onClick={() => handleSort(k)}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'inherit', fontFamily: 'inherit', fontSize: 'inherit',
          letterSpacing: 'inherit', textTransform: 'inherit', fontWeight: 'inherit',
          padding: 0, whiteSpace: 'nowrap',
        }}
      >
        {label} <SortIcon k={k} />
      </button>
    </th>
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 animate-fade-up">
      <div className="mb-6">
        <div className="forge-label mb-1">Your Best Lifts</div>
        <h1 className="forge-display text-4xl sm:text-5xl lg:text-6xl">PERSONAL RECORDS</h1>
      </div>

      {personalRecords.length === 0 ? (
        <div className="p-14 text-center" style={{ border: '1px dashed var(--border)' }}>
          <div className="forge-display text-3xl mb-3" style={{ color: 'var(--border)' }}>NO RECORDS YET</div>
          <p style={{ color: 'var(--muted)', fontFamily: 'Barlow', fontSize: '0.9rem' }}>
            Log workouts with weights to track your personal records.
          </p>
        </div>
      ) : (
        <>
          {/* Summary stats */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-5">
            {[
              { label: 'Tracked',     value: personalRecords.length.toString() },
              { label: 'Heaviest',    value: `${Math.max(...personalRecords.map(r => r.maxWeight))} lbs` },
              { label: 'Highest 1RM', value: `${Math.max(...personalRecords.map(r => r.estimatedOneRepMax))} lbs` },
            ].map(s => (
              <div key={s.label} className="forge-card p-3 sm:p-4">
                <div className="forge-label mb-1">{s.label}</div>
                <div className="forge-stat text-lg sm:text-2xl">{s.value}</div>
              </div>
            ))}
          </div>

          {/* Category filter */}
          <div className="flex flex-wrap gap-1.5 mb-4">
            {CATS.map(c => {
              const active = cat === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => setCat(c.id)}
                  style={{
                    fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700,
                    fontSize: '0.68rem', letterSpacing: '0.1em', textTransform: 'uppercase',
                    padding: '0.25rem 0.6rem',
                    border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
                    background: active ? 'rgba(200,255,0,0.1)' : 'transparent',
                    color: active ? 'var(--accent)' : 'var(--dim)',
                    cursor: 'pointer', transition: 'all 0.1s',
                  }}
                >
                  {c.label}
                </button>
              );
            })}
          </div>

          <div className="forge-label mb-3">{sorted.length} record{sorted.length !== 1 ? 's' : ''}</div>

          {/* Table — scrollable on mobile */}
          <div className="forge-card overflow-x-auto">
            <table className="forge-table" style={{ minWidth: '560px' }}>
              <thead>
                <tr>
                  <SortTh label="Exercise" k="name" />
                  <th>Cat</th>
                  <SortTh label="Max Weight" k="weight" />
                  <th>Reps</th>
                  <SortTh label="Est. 1RM" k="e1rm" />
                  <SortTh label="Date" k="date" />
                </tr>
              </thead>
              <tbody>
                {sorted.map((rec, i) => (
                  <tr key={rec.exerciseId} className="animate-fade-up" style={{ animationDelay: `${i * 20}ms` }}>
                    <td>
                      <div className="flex items-center gap-2">
                        <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '0.95rem' }}>
                          {rec.exerciseName}
                        </span>
                        {isRecent(rec.date) && (
                          <span style={{
                            fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700,
                            fontSize: '0.58rem', letterSpacing: '0.1em',
                            padding: '0.1rem 0.3rem',
                            background: 'rgba(200,255,0,0.12)',
                            border: '1px solid rgba(200,255,0,0.3)',
                            color: 'var(--accent)',
                            flexShrink: 0,
                          }}>
                            NEW
                          </span>
                        )}
                      </div>
                    </td>
                    <td><span className={`cat-badge cat-${rec.category}`}>{rec.category}</span></td>
                    <td>
                      <span className="forge-stat text-base">{rec.maxWeight}</span>
                      <span className="forge-label ml-1">lbs</span>
                    </td>
                    <td>
                      <span className="forge-stat" style={{ fontSize: '0.9rem', color: 'var(--dim)' }}>{rec.repsAtMax}</span>
                    </td>
                    <td>
                      <span className="forge-stat text-base" style={{ color: 'var(--accent)' }}>{rec.estimatedOneRepMax}</span>
                      <span className="forge-label ml-1">lbs</span>
                    </td>
                    <td>
                      <span className="forge-label" style={{ color: 'var(--dim)' }}>
                        {new Date(rec.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-3 p-3 forge-label" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            Est. 1RM via Epley formula: weight × (1 + reps/30).
            <span style={{ color: 'var(--accent)' }}> NEW</span> = set within the last 14 days.
          </div>
        </>
      )}
    </div>
  );
}
