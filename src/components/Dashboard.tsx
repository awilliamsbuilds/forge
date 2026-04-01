import { useState, useMemo } from 'react';
import { Workout, View, WorkoutTemplate } from '../types';
import ImportModal from './ImportModal';

interface DashboardProps {
  workouts: Workout[];
  activeWorkout: { name: string } | null;
  templates: WorkoutTemplate[];
  onNavigate: (v: View) => void;
  onImport: (workouts: Workout[]) => number;
  startWorkout: (name: string) => void;
  startFromGoalTemplate: (template: WorkoutTemplate) => void;
}

// ── 28-day mini heatmap ───────────────────────────────────────────────────────

function MiniHeatmap({ workouts }: { workouts: Workout[] }) {
  const trainedDays = useMemo(() => {
    const s = new Set<string>();
    workouts.forEach(w => s.add(w.date.slice(0, 10)));
    return s;
  }, [workouts]);

  const CELL = 14;
  const GAP = 3;
  const STRIDE = CELL + GAP;
  const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const LABEL_H = 16;
  const SVG_W = 7 * STRIDE - GAP;
  const SVG_H = 4 * STRIDE - GAP + LABEL_H;

  // Build week-aligned grid: 4 rows × 7 cols, starting from Sunday 3 weeks before current week
  const { cells } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startOfCurrentWeek = new Date(today);
    startOfCurrentWeek.setDate(today.getDate() - today.getDay()); // Sunday
    const startDate = new Date(startOfCurrentWeek);
    startDate.setDate(startOfCurrentWeek.getDate() - 21); // 3 weeks back

    const cells: { row: number; col: number; date: string; trained: boolean; future: boolean }[] = [];
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 7; col++) {
        const d = new Date(startDate);
        d.setDate(startDate.getDate() + row * 7 + col);
        const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        cells.push({ row, col, date: dateStr, trained: trainedDays.has(dateStr), future: d > today });
      }
    }
    return { cells };
  }, [trainedDays]);

  return (
    <svg width={SVG_W} height={SVG_H} style={{ display: 'block' }}>
      {/* Day headers */}
      {DAY_LABELS.map((label, i) => (
        <text
          key={i}
          x={i * STRIDE + CELL / 2}
          y={LABEL_H - 4}
          textAnchor="middle"
          fontSize="8"
          fill="#444"
          fontFamily="Space Mono, monospace"
        >
          {label}
        </text>
      ))}
      {/* Cells */}
      {cells.map(c => {
        const x = c.col * STRIDE;
        const y = LABEL_H + c.row * STRIDE;
        return (
          <rect
            key={c.date}
            x={x} y={y}
            width={CELL} height={CELL}
            fill={c.future ? 'transparent' : c.trained ? 'rgba(200,255,0,0.75)' : '#1E1E1E'}
          />
        );
      })}
    </svg>
  );
}

// ── Template card ─────────────────────────────────────────────────────────────

const daysSince = (iso: string) => Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);

const fmtDays = (days: number | null) => {
  if (days === null) return 'Never';
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 14) return `${days}d ago`;
  if (days < 60) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
};

function TemplateCard({ template, lastDate, onStart }: {
  template: WorkoutTemplate;
  lastDate: string | null;
  onStart: (t: WorkoutTemplate) => void;
}) {
  const days = lastDate ? daysSince(lastDate) : null;
  const urgentColor = days === null || days > 5 ? 'var(--accent)' : days > 2 ? 'var(--dim)' : 'var(--muted)';
  const previewExercises = template.exercises.slice(0, 3);
  const overflow = template.exercises.length - 3;

  return (
    <button
      onClick={() => onStart(template)}
      disabled={template.exercises.length === 0}
      className="w-full text-left forge-card p-4 flex flex-col gap-2"
      style={{
        borderLeft: `3px solid ${urgentColor}`,
        cursor: template.exercises.length ? 'pointer' : 'default',
        transition: 'border-color 0.15s',
        minHeight: '110px',
      }}
    >
      {/* Name + days */}
      <div className="flex items-start justify-between gap-2">
        <span className="forge-display text-xl leading-tight">{template.name.toUpperCase()}</span>
        <span
          className="forge-label flex-shrink-0 mt-0.5"
          style={{ color: urgentColor, fontFamily: 'Space Mono, monospace', fontSize: '0.65rem' }}
        >
          {fmtDays(days)}
        </span>
      </div>

      {/* Exercise list */}
      {template.exercises.length === 0 ? (
        <span className="forge-label" style={{ color: 'var(--border)' }}>No exercises set</span>
      ) : (
        <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: '0.78rem', color: 'var(--muted)', lineHeight: 1.4 }}>
          {previewExercises.map(ex => (
            <div key={ex.id} className="truncate">{ex.exerciseName}</div>
          ))}
          {overflow > 0 && (
            <div style={{ color: 'var(--dim)' }}>+{overflow} more</div>
          )}
        </div>
      )}
    </button>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function Dashboard({
  workouts, activeWorkout, templates, onNavigate, onImport, startWorkout, startFromGoalTemplate,
}: DashboardProps) {
  const [showImport, setShowImport] = useState(false);

  const templateLastDates = useMemo(() => {
    const map = new Map<string, string>();
    templates.forEach(t => {
      const match = workouts.find(w => w.name === t.name);
      if (match) map.set(t.id, match.date);
    });
    return map;
  }, [templates, workouts]);

  // Sort templates: most overdue first (never done → days since ↓), most recently done last
  const sortedTemplates = useMemo(() =>
    [...templates].sort((a, b) => {
      const da = templateLastDates.has(a.id) ? daysSince(templateLastDates.get(a.id)!) : Infinity;
      const db = templateLastDates.has(b.id) ? daysSince(templateLastDates.get(b.id)!) : Infinity;
      return db - da;
    }),
    [templates, templateLastDates]
  );

  const handleStartEmpty = () => {
    startWorkout('');
    onNavigate('log');
  };

  const handleStartTemplate = (t: WorkoutTemplate) => {
    startFromGoalTemplate(t);
    onNavigate('log');
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 animate-fade-up">
      {/* Header row */}
      <div className="flex items-start justify-between gap-4 mb-5">
        <div>
          <div className="forge-label mb-1">Ready to train?</div>
          <h1 className="forge-display text-4xl sm:text-5xl lg:text-6xl">START WORKOUT</h1>
        </div>
        <div className="flex-shrink-0 mt-1">
          <MiniHeatmap workouts={workouts} />
        </div>
      </div>

      {/* Active workout banner */}
      {activeWorkout && (
        <button
          onClick={() => onNavigate('log')}
          className="w-full mb-5 flex items-center gap-3 p-4 text-left"
          style={{
            background: 'rgba(200,255,0,0.06)',
            border: '1px solid rgba(200,255,0,0.3)',
            borderLeft: '3px solid var(--accent)',
            cursor: 'pointer',
          }}
        >
          <span className="w-2 h-2 rounded-full animate-blink flex-shrink-0" style={{ background: 'var(--accent)' }} />
          <div className="flex-1 min-w-0">
            <div className="forge-label" style={{ color: 'var(--accent)' }}>Active Workout</div>
            <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '1rem' }}>
              {activeWorkout.name}
            </div>
          </div>
          <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: '0.75rem', letterSpacing: '0.1em', color: 'var(--accent)', flexShrink: 0 }}>
            RESUME →
          </span>
        </button>
      )}

      {/* Start empty */}
      <button className="btn-accent w-full py-4 mb-6 text-base" onClick={handleStartEmpty}>
        + Start an Empty Workout
      </button>

      {/* Templates */}
      {sortedTemplates.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="forge-display text-2xl">TEMPLATES</h2>
            <button
              className="forge-label"
              onClick={() => onNavigate('log')}
              style={{ color: 'var(--dim)', cursor: 'pointer', background: 'none', border: 'none', letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'Barlow Condensed, sans-serif', fontSize: '0.72rem' }}
            >
              Edit →
            </button>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            {sortedTemplates.map(t => (
              <TemplateCard
                key={t.id}
                template={t}
                lastDate={templateLastDates.get(t.id) ?? null}
                onStart={handleStartTemplate}
              />
            ))}
          </div>
        </div>
      )}

      {/* Import (secondary action) */}
      <div className="flex items-center justify-between pt-4" style={{ borderTop: '1px solid var(--border)' }}>
        <span className="forge-label" style={{ color: 'var(--muted)' }}>
          {workouts.length > 0 ? `${workouts.length} sessions logged` : 'No workouts yet'}
        </span>
        <button className="btn-ghost px-4 py-2 text-sm" onClick={() => setShowImport(true)}>
          Import from Strong
        </button>
      </div>

      {showImport && (
        <ImportModal onClose={() => setShowImport(false)} onImport={onImport} />
      )}
    </div>
  );
}
