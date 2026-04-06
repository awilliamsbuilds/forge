import { useState, useMemo, useRef, useEffect } from 'react';
import { Workout, MuscleGroup, ExerciseProgress } from '../types';
import LineChart from './ui/LineChart';

interface ProgressProps {
  workouts: Workout[];
  loggedExerciseIds: Set<string>;
  getExerciseProgress: (exerciseId: string) => ExerciseProgress[];
}

type Range = '30d' | '90d' | 'all';
type ExerciseTab = 'all' | MuscleGroup;

const TAB_CATEGORIES: Record<ExerciseTab, MuscleGroup[]> = {
  all:       ['chest', 'back', 'shoulders', 'arms', 'legs', 'core', 'cardio'],
  chest:     ['chest'],
  back:      ['back'],
  shoulders: ['shoulders'],
  arms:      ['arms'],
  legs:      ['legs'],
  core:      ['core'],
  cardio:    ['cardio'],
};

interface SessionData {
  date: string;
  e1rm: number;
  maxWeight: number;
  totalVolume: number;
  totalSets: number;
  topSetWeight: number;
  topSetReps: number;
}

// Compute per-session estimated 1RM using Epley: w * (1 + reps/30)
function computeE1RMSessions(exerciseId: string, workouts: Workout[]): SessionData[] {
  return workouts
    .filter(w => w.exercises.some(e => e.exerciseId === exerciseId))
    .map(w => {
      const ex = w.exercises.find(e => e.exerciseId === exerciseId)!;
      let bestE1rm = 0;
      let topSetWeight = 0;
      let topSetReps = 0;
      ex.sets.forEach(s => {
        if (s.weight > 0 && s.reps > 0) {
          const e = s.weight * (1 + s.reps / 30);
          if (e > bestE1rm) { bestE1rm = e; topSetWeight = s.weight; topSetReps = s.reps; }
        }
      });
      return {
        date: w.date,
        e1rm: Math.round(bestE1rm),
        maxWeight: Math.max(0, ...ex.sets.map(s => s.weight)),
        totalVolume: ex.sets.reduce((a, s) => a + s.weight * s.reps, 0),
        totalSets: ex.sets.length,
        topSetWeight,
        topSetReps,
      };
    })
    .sort((a, b) => a.date.localeCompare(b.date));
}

// % change in peak e1RM last 30d vs prior 30d
function computeTrend(sessions: SessionData[]): number | null {
  const now = Date.now();
  const cut1 = now - 30 * 86400000;
  const cut2 = now - 60 * 86400000;
  const recent = sessions.filter(s => new Date(s.date).getTime() >= cut1);
  const prior  = sessions.filter(s => { const t = new Date(s.date).getTime(); return t >= cut2 && t < cut1; });
  if (!recent.length || !prior.length) return null;
  const recentMax = Math.max(...recent.map(s => s.e1rm));
  const priorMax  = Math.max(...prior.map(s => s.e1rm));
  if (priorMax === 0) return null;
  return ((recentMax - priorMax) / priorMax) * 100;
}

function filterByRange<T extends { date: string }>(data: T[], range: Range): T[] {
  if (range === 'all') return data;
  const cutoff = Date.now() - (range === '30d' ? 30 : 90) * 86400000;
  return data.filter(d => new Date(d.date).getTime() >= cutoff);
}

function localDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// ── Consistency Heatmap ───────────────────────────────────────────────────────

function ConsistencyHeatmap({ workouts }: { workouts: Workout[] }) {
  const [hovered, setHovered] = useState<string | null>(null);

  const trainedDays = useMemo(() => {
    const s = new Set<string>();
    workouts.forEach(w => s.add(w.date.slice(0, 10)));
    return s;
  }, [workouts]);

  const dayWorkoutNames = useMemo(() => {
    const m = new Map<string, string[]>();
    workouts.forEach(w => {
      const day = w.date.slice(0, 10);
      const arr = m.get(day) ?? [];
      if (!arr.includes(w.name)) arr.push(w.name);
      m.set(day, arr);
    });
    return m;
  }, [workouts]);

  const CELL = 10;
  const STRIDE = 12;
  const WEEKS = 52;
  const LABEL_H = 14;
  const SVG_W = WEEKS * STRIDE - 2;
  const SVG_H = 7 * STRIDE - 2 + LABEL_H + 4;

  const { cells, monthLabels } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - today.getDay() - (WEEKS - 1) * 7);

    const cells: { col: number; row: number; date: string; trained: boolean; future: boolean }[] = [];
    const monthLabels: { x: number; label: string }[] = [];
    let lastMonth = -1;

    for (let col = 0; col < WEEKS; col++) {
      for (let row = 0; row < 7; row++) {
        const d = new Date(startDate);
        d.setDate(startDate.getDate() + col * 7 + row);
        const dateStr = localDateStr(d);
        const future = d > today;
        cells.push({ col, row, date: dateStr, trained: trainedDays.has(dateStr), future });
        if (row === 0 && d.getMonth() !== lastMonth) {
          monthLabels.push({ x: col * STRIDE, label: d.toLocaleDateString('en-US', { month: 'short' }) });
          lastMonth = d.getMonth();
        }
      }
    }
    return { cells, monthLabels };
  }, [trainedDays]);

  const hoveredNames = hovered ? dayWorkoutNames.get(hovered) : null;
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollLeft = scrollRef.current.scrollWidth; }, []);

  return (
    <div className="forge-card p-4 sm:p-5 mb-5">
      <div className="forge-label mb-3">52-Week Consistency</div>
      <div ref={scrollRef} style={{ overflowX: 'auto' }}>
        <svg width={SVG_W} height={SVG_H} style={{ display: 'block' }}>
          {monthLabels.map((m, i) => (
            <text key={i} x={m.x} y={LABEL_H - 2} fontSize="8" fill="#4A4A4A" fontFamily="Space Mono, monospace">
              {m.label}
            </text>
          ))}
          {cells.map(c => {
            if (c.future) return null;
            const x = c.col * STRIDE;
            const y = LABEL_H + 4 + c.row * STRIDE;
            const isHov = hovered === c.date;
            return (
              <rect
                key={c.date}
                x={x} y={y} width={CELL} height={CELL}
                fill={c.trained ? (isHov ? '#C8FF00' : 'rgba(200,255,0,0.65)') : '#1C1C1C'}
                onMouseEnter={() => setHovered(c.date)}
                onMouseLeave={() => setHovered(null)}
                style={{ cursor: c.trained ? 'pointer' : 'default' }}
              />
            );
          })}
        </svg>
      </div>
      {hovered && hoveredNames && hoveredNames.length > 0 && (
        <div className="mt-2 forge-label" style={{ color: 'var(--accent)' }}>
          {new Date(hovered + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
          {' — '}
          {hoveredNames.join(', ')}
        </div>
      )}
      <div className="flex items-center gap-4 mt-3">
        {[
          { color: 'rgba(200,255,0,0.65)', label: 'Trained' },
          { color: '#1C1C1C', label: 'Rest', border: '1px solid #2A2A2A' },
        ].map(item => (
          <div key={item.label} className="flex items-center gap-1.5">
            <div style={{ width: 10, height: 10, background: item.color, border: item.border }} />
            <span className="forge-label">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Weekly volume bar chart + 4-week rolling average ─────────────────────────

function WeeklyVolumeChart({ workouts, range }: { workouts: Workout[]; range: Range }) {
  const [hovered, setHovered] = useState<number | null>(null);

  const { bars, rollingAvg } = useMemo(() => {
    const cutoff = range === 'all' ? 0 : Date.now() - (range === '30d' ? 30 : 90) * 86400000;
    const map = new Map<string, number>();
    workouts
      .filter(w => new Date(w.date).getTime() >= cutoff)
      .forEach(w => {
        const d = new Date(w.date);
        d.setDate(d.getDate() - d.getDay());
        const key = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const vol = w.exercises.reduce((a, ex) => a + ex.sets.reduce((b, s) => b + s.weight * s.reps, 0), 0);
        map.set(key, (map.get(key) ?? 0) + vol);
      });

    const allBars = Array.from(map.entries())
      .map(([label, value]) => ({ label, value: Math.round(value) }))
      .reverse(); // workouts stored newest-first; reverse so oldest→newest (left→right)
    const limit = range === '30d' ? 6 : range === '90d' ? 13 : 26;
    const bars = allBars.slice(-limit);

    const WINDOW = 4;
    const rollingAvg = bars.map((_, i) => {
      const start = Math.max(0, i - WINDOW + 1);
      const sl = bars.slice(start, i + 1);
      return sl.reduce((a, d) => a + d.value, 0) / sl.length;
    });

    return { bars, rollingAvg };
  }, [workouts, range]);

  if (bars.length === 0) {
    return (
      <div className="flex items-center justify-center h-44" style={{ border: '1px dashed var(--border)' }}>
        <span className="forge-label">No data for selected range</span>
      </div>
    );
  }

  const VBW = 400;
  const VBH = 180;
  const BOTTOM = 155;
  const max = Math.max(...bars.map(d => d.value), 1);

  const avgPath = rollingAvg.map((v, i) => {
    const segW = VBW / bars.length;
    const x = (i * segW + segW / 2).toFixed(1);
    const y = (BOTTOM - (v / max) * 140).toFixed(1);
    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');

  return (
    <div style={{ height: 180 }} className="w-full">
      <svg viewBox={`0 0 ${VBW} ${VBH}`} preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
        {bars.map((d, i) => {
          const barH = (d.value / max) * 140;
          const segW = VBW / bars.length;
          const pad = Math.min(4, segW * 0.15);
          const x = i * segW + pad;
          const w = segW - pad * 2;
          const y = BOTTOM - barH;
          const isH = hovered === i;
          const labelStride = bars.length > 24 ? 4 : bars.length > 12 ? 2 : 1;
          const showLabel = i % labelStride === 0;
          return (
            <g key={i} onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)}>
              <rect x={x} y={y} width={w} height={barH}
                fill={isH ? '#C8FF00' : 'rgba(200,255,0,0.3)'}
                style={{ transition: 'fill 0.1s' }}
              />
              {showLabel && (
              <text x={x + w / 2} y={VBH - 5} textAnchor="middle" fontSize="9" fill="#4A4A4A" fontFamily="Space Mono, monospace">
                {d.label}
              </text>
              )}
              {isH && d.value > 0 && (
                <text x={x + w / 2} y={y - 5} textAnchor="middle" fontSize="10" fill="#C8FF00"
                  fontFamily="Space Mono, monospace" fontWeight="700">
                  {d.value >= 1000 ? `${(d.value / 1000).toFixed(1)}k` : d.value.toString()}
                </text>
              )}
            </g>
          );
        })}
        {rollingAvg.length >= 2 && (
          <path d={avgPath} fill="none" stroke="#4D9EFF" strokeWidth="1.5" strokeLinejoin="round" />
        )}
        <line x1="0" y1={BOTTOM} x2={VBW} y2={BOTTOM} stroke="#252525" strokeWidth="1" />
      </svg>
    </div>
  );
}

// ── Range buttons ─────────────────────────────────────────────────────────────

function RangeButtons({ range, setRange }: { range: Range; setRange: (r: Range) => void }) {
  return (
    <div className="flex gap-1">
      {(['30d', '90d', 'all'] as Range[]).map(r => (
        <button key={r} onClick={() => setRange(r)} style={{
          fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700,
          fontSize: '0.68rem', letterSpacing: '0.1em', textTransform: 'uppercase',
          padding: '0.25rem 0.55rem',
          border: `1px solid ${range === r ? 'var(--accent)' : 'var(--border)'}`,
          background: range === r ? 'rgba(200,255,0,0.1)' : 'transparent',
          color: range === r ? 'var(--accent)' : 'var(--muted)',
          cursor: 'pointer',
        }}>
          {r === 'all' ? '6mo' : r}
        </button>
      ))}
    </div>
  );
}

// ── Trend badge ───────────────────────────────────────────────────────────────

function TrendBadge({ value }: { value: number | null }) {
  if (value === null) return <span style={{ color: 'var(--border)', fontSize: '0.7rem', fontFamily: 'Space Mono, monospace' }}>—</span>;
  const color = value > 1 ? 'var(--success)' : value < -2 ? 'var(--danger)' : 'var(--muted)';
  return (
    <span style={{ fontFamily: 'Space Mono, monospace', fontSize: '0.7rem', color, fontWeight: 700 }}>
      {value > 0 ? '+' : ''}{value.toFixed(1)}%
    </span>
  );
}

// ── Exercise detail: e1RM chart + last 5 sessions table ───────────────────────

function ExerciseDetail({ exerciseId, workouts, range }: {
  exerciseId: string;
  workouts: Workout[];
  range: Range;
}) {
  const allSessions = useMemo(() => computeE1RMSessions(exerciseId, workouts), [exerciseId, workouts]);
  const sessions = useMemo(() => filterByRange(allSessions, range), [allSessions, range]);
  const trend = useMemo(() => computeTrend(allSessions), [allSessions]);
  const allTimeBest = Math.max(0, ...allSessions.map(s => s.e1rm));
  const totalWeight = useMemo(() => {
    const raw = workouts.reduce((sum, w) => {
      const ex = w.exercises.find(e => e.exerciseId === exerciseId);
      return sum + (ex ? ex.sets.reduce((a, s) => a + s.weight * s.reps, 0) : 0);
    }, 0);
    return raw >= 1_000_000 ? `${(raw / 1_000_000).toFixed(1)}M` : raw >= 1_000 ? `${(raw / 1_000).toFixed(1)}K` : raw.toString();
  }, [workouts, exerciseId]);
  const lastFive = allSessions.slice(-5).reverse();
  const e1rmData = sessions.map(s => ({ x: s.date, y: s.e1rm }));

  if (allSessions.length === 0) {
    return (
      <div className="flex items-center justify-center h-24" style={{ border: '1px dashed var(--border)' }}>
        <span className="forge-label">No data yet</span>
      </div>
    );
  }

  return (
    <div>
      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-3 mb-4 pb-4" style={{ borderBottom: '1px solid var(--border)' }}>
        <div>
          <div className="forge-label mb-1">Est. 1RM Peak</div>
          <div className="forge-stat text-lg sm:text-xl">{allTimeBest > 0 ? `${allTimeBest} lbs` : '—'}</div>
        </div>
        <div>
          <div className="forge-label mb-1">Total Lifted</div>
          <div className="forge-stat text-lg sm:text-xl">{totalWeight}</div>
        </div>
        <div>
          <div className="forge-label mb-1">30d Trend</div>
          <div className="forge-stat text-lg sm:text-xl"><TrendBadge value={trend} /></div>
        </div>
      </div>

      {/* E1RM chart */}
      {sessions.length > 0 ? (
        <>
          <div className="forge-label mb-2">Estimated 1RM Over Time</div>
          <LineChart
            data={e1rmData}
            color="#C8FF00"
            formatY={v => `${v} lbs`}
            label="e1rm"
            height={200}
          />
        </>
      ) : (
        <div className="forge-label text-center py-6">No data in selected range</div>
      )}

      {/* Last 5 sessions table */}
      {lastFive.length > 0 && (
        <div className="mt-5">
          <div className="forge-label mb-2" style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Last {lastFive.length} Sessions</span>
            <span style={{ color: 'var(--dim)' }}>{allSessions.length} total</span>
          </div>
          <table className="forge-table w-full">
            <thead>
              <tr>
                <th>Date</th>
                <th>Sets</th>
                <th>Top Set</th>
                <th>Est. 1RM</th>
              </tr>
            </thead>
            <tbody>
              {lastFive.map((s, i) => (
                <tr key={i}>
                  <td style={{ color: 'var(--dim)', fontFamily: 'Space Mono, monospace', fontSize: '0.72rem', whiteSpace: 'nowrap' }}>
                    {new Date(s.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </td>
                  <td style={{ color: 'var(--muted)', fontFamily: 'Space Mono, monospace', fontSize: '0.72rem', whiteSpace: 'nowrap' }}>
                    {s.totalSets}
                  </td>
                  <td style={{ fontFamily: 'Space Mono, monospace', fontSize: '0.72rem', color: 'var(--text)', whiteSpace: 'nowrap' }}>
                    {s.topSetWeight > 0 ? `${s.topSetWeight} × ${s.topSetReps}` : '—'}
                  </td>
                  <td style={{ fontFamily: 'Space Mono, monospace', fontSize: '0.72rem', color: 'var(--accent)', fontWeight: 700, whiteSpace: 'nowrap' }}>
                    {s.e1rm > 0 ? `${s.e1rm} lbs` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function ProgressCharts({ workouts }: ProgressProps) {
  const [selectedId, setSelectedId] = useState<string>('');
  const [range, setRange] = useState<Range>('all');
  const [tab, setTab] = useState<ExerciseTab>('all');

  // Derive all logged exercises from workouts (captures everything, including Strong imports)
  const allLoggedExercises = useMemo(() => {
    const map = new Map<string, { id: string; name: string; category: MuscleGroup; lastDate: string }>();
    workouts.forEach(w => {
      w.exercises.forEach(ex => {
        const existing = map.get(ex.exerciseId);
        if (!existing || w.date > existing.lastDate) {
          map.set(ex.exerciseId, { id: ex.exerciseId, name: ex.exerciseName, category: ex.category, lastDate: w.date });
        }
      });
    });
    return Array.from(map.values()).sort((a, b) => b.lastDate.localeCompare(a.lastDate));
  }, [workouts]);

  const tabExercises = useMemo(
    () => tab === 'all' ? allLoggedExercises : allLoggedExercises.filter(e => TAB_CATEGORIES[tab].includes(e.category)),
    [allLoggedExercises, tab]
  );

  // Precompute trends for all visible exercises
  const trends = useMemo(() => {
    const m = new Map<string, number | null>();
    tabExercises.forEach(ex => {
      m.set(ex.id, computeTrend(computeE1RMSessions(ex.id, workouts)));
    });
    return m;
  }, [tabExercises, workouts]);

  // Summary stats
  const { totalSessions, totalWeight, avgPerWeek } = useMemo(() => {
    const totalSessions = workouts.length;
    const rawWeight = workouts.reduce((sum, w) =>
      sum + w.exercises.reduce((a, ex) => a + ex.sets.reduce((b, s) => b + s.weight * s.reps, 0), 0), 0);
    const totalWeight = rawWeight >= 1_000_000
      ? `${(rawWeight / 1_000_000).toFixed(1)}M`
      : rawWeight >= 1_000
      ? `${(rawWeight / 1_000).toFixed(0)}K`
      : rawWeight.toString();
    if (totalSessions === 0) return { totalSessions: 0, totalWeight: '0', avgPerWeek: 0 };
    const oldest = workouts[workouts.length - 1]?.date;
    const weeks = Math.max(1, (Date.now() - new Date(oldest).getTime()) / (7 * 86400000));
    return { totalSessions, totalWeight, avgPerWeek: +(totalSessions / weeks).toFixed(1) };
  }, [workouts]);

  if (workouts.length === 0) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 animate-fade-up">
        <div className="mb-6">
          <div className="forge-label mb-1">Track Your Gains</div>
          <h1 className="forge-display text-4xl sm:text-5xl lg:text-6xl">PROGRESS</h1>
        </div>
        <div className="p-14 text-center" style={{ border: '1px dashed var(--border)' }}>
          <div className="forge-display text-3xl mb-3" style={{ color: 'var(--border)' }}>NO DATA YET</div>
          <p style={{ color: 'var(--muted)', fontFamily: 'Barlow', fontSize: '0.9rem' }}>
            Complete workouts to see your progress over time.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 animate-fade-up">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3 mb-5">
        <div>
          <div className="forge-label mb-1">Track Your Gains</div>
          <h1 className="forge-display text-4xl sm:text-5xl lg:text-6xl">PROGRESS</h1>
        </div>
        <RangeButtons range={range} setRange={setRange} />
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { label: 'Total Sessions', value: totalSessions.toLocaleString() },
          { label: 'Total Weight', value: totalWeight },
          { label: 'Avg / Week', value: avgPerWeek.toString() },
        ].map(s => (
          <div key={s.label} className="forge-card p-3 sm:p-4">
            <div className="forge-label mb-1">{s.label}</div>
            <div className="forge-stat text-xl sm:text-2xl">{s.value}</div>
          </div>
        ))}
      </div>

      {/* 52-week consistency heatmap */}
      <ConsistencyHeatmap workouts={workouts} />

      {/* Weekly volume + rolling average */}
      <div className="forge-card p-4 sm:p-5 mb-5">
        <div className="flex items-start justify-between gap-3 mb-4 flex-wrap">
          <div>
            <div className="forge-label mb-0.5">Weekly Volume</div>
            <h2 className="forge-display text-xl sm:text-2xl">TOTAL LOAD PER WEEK</h2>
          </div>
          <div className="flex items-center gap-1.5">
            <div style={{ width: 20, height: 2, background: '#4D9EFF' }} />
            <span className="forge-label">4w avg</span>
          </div>
        </div>
        <WeeklyVolumeChart workouts={workouts} range={range} />
      </div>

      {/* Exercise progress */}
      {allLoggedExercises.length > 0 && (
        <div className="forge-card p-4 sm:p-5">
          <div className="mb-4">
            <div className="forge-label mb-0.5">Exercise Progress</div>
            <h2 className="forge-display text-xl sm:text-2xl">STRENGTH OVER TIME</h2>
          </div>

          {/* Category tabs */}
          <div className="flex gap-1 mb-4 flex-wrap">
            {(['all', 'chest', 'back', 'shoulders', 'arms', 'legs', 'core', 'cardio'] as ExerciseTab[]).map(t => (
              <button
                key={t}
                onClick={() => { setTab(t); setSelectedId(''); }}
                style={{
                  fontFamily: 'Bebas Neue, sans-serif',
                  fontSize: '0.9rem',
                  letterSpacing: '0.08em',
                  padding: '0.2rem 0.75rem',
                  border: `1px solid ${tab === t ? 'var(--accent)' : 'var(--border)'}`,
                  background: tab === t ? 'rgba(200,255,0,0.1)' : 'transparent',
                  color: tab === t ? 'var(--accent)' : 'var(--dim)',
                  cursor: 'pointer',
                  textTransform: 'uppercase',
                }}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>

          {/* Exercise list */}
          {tabExercises.length === 0 ? (
            <div className="py-8 text-center forge-label">No {tab} exercises logged yet</div>
          ) : (
            <div>
              {tabExercises.map(ex => {
                const isOpen = selectedId === ex.id;
                const trend = trends.get(ex.id) ?? null;
                const lastDate = new Date(ex.lastDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                return (
                  <div key={ex.id}>
                    <button
                      className="w-full text-left flex items-center justify-between gap-3 px-3 py-3"
                      onClick={() => setSelectedId(isOpen ? '' : ex.id)}
                      style={{
                        background: isOpen ? 'rgba(200,255,0,0.04)' : 'transparent',
                        borderLeft: `2px solid ${isOpen ? 'var(--accent)' : 'transparent'}`,
                        borderBottom: '1px solid var(--border)',
                        cursor: 'pointer',
                      }}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className={`cat-${ex.category}`}
                          style={{ fontSize: '0.5rem', padding: '0.1rem 0.3rem', flexShrink: 0, letterSpacing: '0.06em' }}
                        >
                          {ex.category}
                        </span>
                        <span style={{
                          fontFamily: 'Barlow Condensed, sans-serif',
                          fontWeight: 600,
                          fontSize: '0.9rem',
                          color: isOpen ? 'var(--accent)' : 'var(--text)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}>
                          {ex.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <TrendBadge value={trend} />
                        <span className="forge-label" style={{ fontSize: '0.62rem' }}>{lastDate}</span>
                        <span style={{ color: 'var(--border)', fontSize: '0.65rem' }}>{isOpen ? '▲' : '▼'}</span>
                      </div>
                    </button>

                    {isOpen && (
                      <div className="p-4" style={{ background: 'rgba(0,0,0,0.25)', borderBottom: '1px solid var(--border)' }}>
                        <ExerciseDetail exerciseId={ex.id} workouts={workouts} range={range} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
