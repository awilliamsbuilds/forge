import { useState, useRef, DragEvent } from 'react';
import { Workout } from '../types';
import { parseStrongCSV, StrongImportPreview } from '../utils/importStrong';

type Phase = 'drop' | 'parsing' | 'preview' | 'done' | 'error';

interface ImportModalProps {
  onClose: () => void;
  onImport: (workouts: Workout[]) => number; // returns # actually added
}

export default function ImportModal({ onClose, onImport }: ImportModalProps) {
  const [phase, setPhase]       = useState<Phase>('drop');
  const [preview, setPreview]   = useState<StrongImportPreview | null>(null);
  const [addedCount, setAdded]  = useState(0);
  const [error, setError]       = useState('');
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const processFile = (file: File) => {
    if (!file.name.endsWith('.csv')) {
      setError('Please select a .csv file.');
      setPhase('error');
      return;
    }
    setPhase('parsing');
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const result = parseStrongCSV(e.target?.result as string);
        if (result.workouts.length === 0) {
          setError('No workouts found. Make sure this is a Strong export CSV.');
          setPhase('error');
          return;
        }
        setPreview(result);
        setPhase('preview');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to parse file.');
        setPhase('error');
      }
    };
    reader.onerror = () => {
      setError('Failed to read file.');
      setPhase('error');
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleImport = () => {
    if (!preview) return;
    const count = onImport(preview.workouts);
    setAdded(count);
    setPhase('done');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.85)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-lg flex flex-col animate-fade-up"
        style={{ background: 'var(--card)', border: '1px solid var(--border)', maxHeight: '90vh', overflowY: 'auto' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <div>
            <div className="forge-label mb-0.5">Strong App</div>
            <h2 className="forge-display text-2xl">IMPORT WORKOUTS</h2>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '1.1rem', padding: '0.25rem 0.5rem' }}
          >
            ✕
          </button>
        </div>

        <div className="p-5">

          {/* ── Drop zone ── */}
          {phase === 'drop' && (
            <div
              onDrop={handleDrop}
              onDragOver={e => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onClick={() => fileRef.current?.click()}
              style={{
                border: `2px dashed ${dragging ? 'var(--accent)' : 'var(--border)'}`,
                background: dragging ? 'rgba(200,255,0,0.04)' : 'transparent',
                cursor: 'pointer',
                transition: 'all 0.15s',
                padding: '3rem 2rem',
                textAlign: 'center',
              }}
            >
              <div className="forge-display text-3xl mb-2" style={{ color: dragging ? 'var(--accent)' : 'var(--muted)' }}>
                DROP CSV HERE
              </div>
              <p style={{ color: 'var(--muted)', fontFamily: 'Barlow', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
                or click to select file
              </p>
              <div className="btn-ghost inline-flex" style={{ pointerEvents: 'none' }}>
                Choose File
              </div>
              <input ref={fileRef} type="file" accept=".csv" onChange={handleFileInput} style={{ display: 'none' }} />
            </div>
          )}

          {/* ── Parsing ── */}
          {phase === 'parsing' && (
            <div style={{ padding: '3rem', textAlign: 'center' }}>
              <div className="forge-display text-3xl animate-blink" style={{ color: 'var(--accent)' }}>
                PARSING…
              </div>
            </div>
          )}

          {/* ── Preview ── */}
          {phase === 'preview' && preview && (
            <div>
              {/* Summary stats */}
              <div className="grid grid-cols-3 gap-3 mb-5">
                {[
                  { label: 'Workouts',  value: preview.workouts.length },
                  { label: 'Total Sets', value: preview.totalSets.toLocaleString() },
                  { label: 'Date Range', value: null },
                ].map((s, i) => (
                  <div key={i} className="forge-card p-3">
                    <div className="forge-label mb-1">{s.label}</div>
                    {s.value !== null ? (
                      <div className="forge-stat text-xl" style={{ color: 'var(--accent)' }}>{s.value}</div>
                    ) : (
                      <div>
                        <div className="forge-stat" style={{ fontSize: '0.75rem', lineHeight: 1.4 }}>{preview.dateRange.from}</div>
                        <div className="forge-label">→ {preview.dateRange.to}</div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Workout breakdown */}
              <div className="forge-label mb-2">Top Workout Types</div>
              <div className="flex flex-col gap-1 mb-5">
                {preview.workoutNameCounts.map(({ name, count }) => {
                  const max = preview.workoutNameCounts[0].count;
                  const pct = (count / max) * 100;
                  return (
                    <div key={name} className="flex items-center gap-3">
                      <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '0.85rem', width: '140px', flexShrink: 0 }}>
                        {name}
                      </div>
                      <div style={{ flex: 1, height: '4px', background: 'var(--border)', position: 'relative' }}>
                        <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${pct}%`, background: 'var(--accent)' }} />
                      </div>
                      <div className="forge-stat" style={{ fontSize: '0.8rem', color: 'var(--dim)', width: '2.5rem', textAlign: 'right', flexShrink: 0 }}>
                        {count}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div
                className="forge-label p-3 mb-5"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
              >
                Existing workouts on the same date won't be duplicated.
                All imported sets are marked as completed.
              </div>

              <div className="flex gap-3">
                <button className="btn-ghost flex-1 py-3" onClick={() => { setPhase('drop'); setPreview(null); }}>
                  ← Back
                </button>
                <button className="btn-accent flex-1 py-3" onClick={handleImport}>
                  Import {preview.workouts.length} Workouts
                </button>
              </div>
            </div>
          )}

          {/* ── Done ── */}
          {phase === 'done' && (
            <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
              <div className="forge-display text-5xl mb-2" style={{ color: 'var(--accent)' }}>
                {addedCount}
              </div>
              <div className="forge-label mb-1" style={{ color: 'var(--accent)' }}>
                {addedCount === 1 ? 'WORKOUT IMPORTED' : 'WORKOUTS IMPORTED'}
              </div>
              {preview && addedCount < preview.workouts.length && (
                <p style={{ color: 'var(--muted)', fontFamily: 'Barlow', fontSize: '0.875rem', marginTop: '0.5rem' }}>
                  {preview.workouts.length - addedCount} skipped (already existed)
                </p>
              )}
              <button className="btn-accent mt-6 px-10 py-3" onClick={onClose}>
                Done
              </button>
            </div>
          )}

          {/* ── Error ── */}
          {phase === 'error' && (
            <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
              <div className="forge-display text-3xl mb-3" style={{ color: 'var(--danger)' }}>
                IMPORT FAILED
              </div>
              <p style={{ color: 'var(--muted)', fontFamily: 'Barlow', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                {error}
              </p>
              <button className="btn-ghost px-8 py-2.5" onClick={() => { setPhase('drop'); setError(''); }}>
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
