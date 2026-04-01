import { useState, useMemo } from 'react';
import { Workout, View, WorkoutTemplate } from '../types';
import ImportModal from './ImportModal';
import TemplateEditor, { newTemplate } from './TemplateEditor';

interface DashboardProps {
  workouts: Workout[];
  activeWorkout: { name: string } | null;
  templates: WorkoutTemplate[];
  onNavigate: (v: View) => void;
  onImport: (workouts: Workout[]) => number;
  startWorkout: (name: string) => void;
  startFromGoalTemplate: (template: WorkoutTemplate) => void;
  saveTemplate: (t: WorkoutTemplate) => void;
  deleteTemplate: (id: string) => void;
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
  const SVG_H = 3 * STRIDE - GAP + LABEL_H;

  const cells = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startOfCurrentWeek = new Date(today);
    startOfCurrentWeek.setDate(today.getDate() - today.getDay());
    const startDate = new Date(startOfCurrentWeek);
    startDate.setDate(startOfCurrentWeek.getDate() - 14);

    return Array.from({ length: 21 }, (_, i) => {
      const row = Math.floor(i / 7);
      const col = i % 7;
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      return { row, col, date: dateStr, trained: trainedDays.has(dateStr), future: d > today };
    });
  }, [trainedDays]);

  return (
    <svg width={SVG_W} height={SVG_H} style={{ display: 'block' }}>
      {DAY_LABELS.map((label, i) => (
        <text key={i} x={i * STRIDE + CELL / 2} y={LABEL_H - 4} textAnchor="middle"
          fontSize="8" fill="#444" fontFamily="Space Mono, monospace">{label}</text>
      ))}
      {cells.map(c => (
        <rect key={c.date} x={c.col * STRIDE} y={LABEL_H + c.row * STRIDE}
          width={CELL} height={CELL}
          fill={c.future ? 'transparent' : c.trained ? 'rgba(200,255,0,0.75)' : '#1E1E1E'}
        />
      ))}
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

function TemplateCard({ template, lastDate, onStart, onEdit, onDelete }: {
  template: WorkoutTemplate;
  lastDate: string | null;
  onStart: (t: WorkoutTemplate) => void;
  onEdit: (t: WorkoutTemplate) => void;
  onDelete: (id: string) => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const days = lastDate ? daysSince(lastDate) : null;
  const urgentColor = days === null || days > 5 ? 'var(--accent)' : days > 2 ? 'var(--dim)' : 'var(--muted)';
  const previewExercises = template.exercises.slice(0, 3);
  const overflow = template.exercises.length - 3;

  if (confirming) {
    return (
      <div className="forge-card p-4 flex flex-col gap-3" style={{ borderLeft: '3px solid var(--danger)', minHeight: '110px' }}>
        <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '0.9rem', color: 'var(--dim)' }}>
          Delete &ldquo;{template.name}&rdquo;?
        </span>
        <div className="flex gap-2">
          <button className="btn-ghost py-1.5 px-3 flex-1" style={{ fontSize: '0.75rem' }} onClick={() => setConfirming(false)}>Cancel</button>
          <button className="btn-danger py-1.5 px-3 flex-1" style={{ fontSize: '0.75rem' }} onClick={() => onDelete(template.id)}>Delete</button>
        </div>
      </div>
    );
  }

  return (
    <div className="forge-card flex flex-col" style={{ borderLeft: `3px solid ${urgentColor}`, minHeight: '110px' }}>
      {/* Clickable start area */}
      <button
        onClick={() => onStart(template)}
        disabled={template.exercises.length === 0}
        className="flex-1 text-left p-4 flex flex-col gap-2"
        style={{ background: 'none', border: 'none', cursor: template.exercises.length ? 'pointer' : 'default' }}
      >
        <div className="flex items-start justify-between gap-2">
          <span className="forge-display text-xl leading-tight">{template.name.toUpperCase()}</span>
          <span className="forge-label flex-shrink-0 mt-0.5"
            style={{ color: urgentColor, fontFamily: 'Space Mono, monospace', fontSize: '0.65rem' }}>
            {fmtDays(days)}
          </span>
        </div>
        {template.exercises.length === 0 ? (
          <span className="forge-label" style={{ color: 'var(--border)' }}>No exercises set</span>
        ) : (
          <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: '0.78rem', color: 'var(--muted)', lineHeight: 1.4 }}>
            {previewExercises.map(ex => <div key={ex.id} className="truncate">{ex.exerciseName}</div>)}
            {overflow > 0 && <div style={{ color: 'var(--dim)' }}>+{overflow} more</div>}
          </div>
        )}
      </button>

      {/* Edit / Delete row */}
      <div className="flex border-t" style={{ borderColor: 'var(--border)' }}>
        <button
          onClick={() => onEdit(template)}
          className="flex-1 py-2 flex items-center justify-center gap-1.5"
          style={{ background: 'none', border: 'none', borderRight: '1px solid var(--border)', color: 'var(--muted)', cursor: 'pointer', fontSize: '0.7rem', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.08em' }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--text)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--muted)')}
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
          EDIT
        </button>
        <button
          onClick={() => setConfirming(true)}
          className="flex-1 py-2 flex items-center justify-center gap-1.5"
          style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '0.7rem', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.08em' }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--danger)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--muted)')}
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square">
            <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" />
            <path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" />
          </svg>
          DELETE
        </button>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function Dashboard({
  workouts, activeWorkout, templates, onNavigate, onImport,
  startWorkout, startFromGoalTemplate, saveTemplate, deleteTemplate,
}: DashboardProps) {
  const [showImport, setShowImport] = useState(false);
  const [editing, setEditing] = useState<WorkoutTemplate | null>(null);

  const templateLastDates = useMemo(() => {
    const map = new Map<string, string>();
    templates.forEach(t => {
      const match = workouts.find(w => w.name === t.name);
      if (match) map.set(t.id, match.date);
    });
    return map;
  }, [templates, workouts]);

  const sortedTemplates = useMemo(() =>
    [...templates].sort((a, b) => {
      const da = templateLastDates.has(a.id) ? daysSince(templateLastDates.get(a.id)!) : Infinity;
      const db = templateLastDates.has(b.id) ? daysSince(templateLastDates.get(b.id)!) : Infinity;
      return db - da;
    }),
    [templates, templateLastDates]
  );

  const handleStartTemplate = (t: WorkoutTemplate) => {
    startFromGoalTemplate(t);
    onNavigate('dashboard');
  };

  // Show editor when creating/editing a template
  if (editing) {
    return (
      <TemplateEditor
        initial={editing}
        onSave={t => { saveTemplate(t); setEditing(null); }}
        onCancel={() => setEditing(null)}
      />
    );
  }

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
        <button onClick={() => onNavigate('dashboard')} className="w-full mb-5 flex items-center gap-3 p-4 text-left"
          style={{ background: 'rgba(200,255,0,0.06)', border: '1px solid rgba(200,255,0,0.3)', borderLeft: '3px solid var(--accent)', cursor: 'pointer' }}>
          <span className="w-2 h-2 rounded-full animate-blink flex-shrink-0" style={{ background: 'var(--accent)' }} />
          <div className="flex-1 min-w-0">
            <div className="forge-label" style={{ color: 'var(--accent)' }}>Active Workout</div>
            <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '1rem' }}>{activeWorkout.name}</div>
          </div>
          <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: '0.75rem', letterSpacing: '0.1em', color: 'var(--accent)', flexShrink: 0 }}>RESUME →</span>
        </button>
      )}

      {/* Start empty */}
      <button className="btn-accent w-full py-4 mb-6 text-base" onClick={() => { startWorkout(''); onNavigate('dashboard'); }}>
        + Start an Empty Workout
      </button>

      {/* Templates */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="forge-display text-2xl">TEMPLATES</h2>
          <button
            onClick={() => setEditing(newTemplate())}
            className="btn-ghost py-1.5 px-3"
            style={{ fontSize: '0.72rem' }}
          >
            + New
          </button>
        </div>

        {sortedTemplates.length === 0 ? (
          <div className="p-10 text-center" style={{ border: '1px dashed var(--border)' }}>
            <div className="forge-display text-2xl mb-2" style={{ color: 'var(--border)' }}>NO TEMPLATES</div>
            <p style={{ color: 'var(--muted)', fontFamily: 'Barlow, sans-serif', fontSize: '0.85rem', marginBottom: '1rem' }}>
              Create a template to pre-load exercises and goal weights.
            </p>
            <button className="btn-accent px-6 py-2" onClick={() => setEditing(newTemplate())}>Create Template</button>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            {sortedTemplates.map(t => (
              <TemplateCard
                key={t.id}
                template={t}
                lastDate={templateLastDates.get(t.id) ?? null}
                onStart={handleStartTemplate}
                onEdit={t => setEditing(t)}
                onDelete={deleteTemplate}
              />
            ))}
          </div>
        )}
      </div>

      {/* Import */}
      <div className="flex items-center justify-between pt-4" style={{ borderTop: '1px solid var(--border)' }}>
        <span className="forge-label" style={{ color: 'var(--muted)' }}>
          {workouts.length > 0 ? `${workouts.length} sessions logged` : 'No workouts yet'}
        </span>
        <button className="btn-ghost px-4 py-2 text-sm" onClick={() => setShowImport(true)}>
          Import from Strong
        </button>
      </div>

      {showImport && <ImportModal onClose={() => setShowImport(false)} onImport={onImport} />}
    </div>
  );
}
