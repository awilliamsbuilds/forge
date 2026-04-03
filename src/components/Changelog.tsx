import { View } from '../types';

interface ChangelogProps {
  onNavigate: (v: View) => void;
}

interface Entry {
  date: string;
  title: string;
  items: string[];
}

const ENTRIES: Entry[] = [
  {
    date: 'Apr 2, 2026',
    title: 'Exercise Library & Custom Exercises',
    items: [
      'Added 38 exercises from imported Strong workout history',
      'Custom exercise creation from the Exercise Library, workout picker, and template picker',
      'Custom exercises persist across sessions and show a CUSTOM badge in the library',
      'Calendar view added to History — click any highlighted day to open that workout',
      'Calendar remembers which month you were viewing when returning from a workout',
    ],
  },
  {
    date: 'Apr 2, 2026',
    title: 'Workout Navigation Fix',
    items: [
      'Tapping History while a workout is active now shows history — not the active workout',
      'Resume banner and center + button correctly return to the active workout',
      'Finish and Discard now navigate back to the dashboard',
      'Template editor inputs updated to match the active workout style (native inputs, no steppers)',
    ],
  },
  {
    date: 'Apr 2, 2026',
    title: 'Mobile Workout Improvements',
    items: [
      'Replaced +/− steppers with native number inputs — triggers numeric keyboard on iOS',
      'Weight → Reps → complete set flow supported with the Next/Done keyboard keys',
      'Set row no longer requires horizontal scrolling on iPhone',
      'Checkbox moved to the far right of the set row, before the delete button',
      'Finish and Discard buttons moved to the bottom, full width, with a spacer between them',
      'Header simplified to workout name + Exit only',
    ],
  },
  {
    date: 'Apr 1, 2026',
    title: 'Rest Timers',
    items: [
      'Per-set rest timer starts automatically when a set is completed',
      'Inline countdown bar appears between sets with time remaining',
      'Rest duration adjustable per set (±15s buttons), default 90s',
      'Skip button dismisses the timer early',
      'Rest duration is stored on the set and carried into templates',
    ],
  },
  {
    date: 'Apr 1, 2026',
    title: 'Previous Performance & Contrast',
    items: [
      'Prev column now matches Strong-imported exercises even when names include variants like (Cable) or (Machine)',
      'Previous performance text made larger and more readable',
      'Gray text contrast improved across the entire app',
    ],
  },
  {
    date: 'Mar 31, 2026',
    title: 'Personal Records',
    items: [
      'PR detection on all three metrics: estimated 1RM, max weight, and max single-set volume',
      'PR badges shown on individual sets in workout detail view',
      'PR count displayed in the workout summary stats row',
      'Personal Records page shows all-time bests per exercise',
    ],
  },
  {
    date: 'Mar 31, 2026',
    title: 'Navigation & Layout',
    items: [
      'Mobile bottom tab bar replaces the slide-in drawer',
      'Center + button shows active workout indicator when a session is in progress',
      'Hash-based routing — views are bookmarkable and back/forward works',
      'Exercise library renamed to Exercises with a barbell icon',
    ],
  },
  {
    date: 'Mar 31, 2026',
    title: 'Dashboard & Templates',
    items: [
      'Dashboard redesigned as the Start Workout hub',
      'Workout templates with goal weights and reps per exercise',
      'Template cards show last trained date and exercise preview',
      'Active workout banner with blinking indicator and Resume link',
      '3-week mini heatmap showing training frequency',
    ],
  },
  {
    date: 'Mar 31, 2026',
    title: 'History',
    items: [
      'Workout detail view with full exercise and set breakdown',
      'Repeat Workout button pre-fills a new session from any past workout',
      'Import from Strong — paste CSV export to load your entire training history',
      'Deduplication on re-import based on date + workout name',
    ],
  },
  {
    date: 'Mar 31, 2026',
    title: 'Initial Release',
    items: [
      'FORGE — a local-first fitness tracker built for serious lifters',
      'Workout logging with exercises, sets, reps, and weight',
      'Exercise library with 38 built-in exercises across 7 muscle groups',
      'Progress charts showing max weight and volume over time per exercise',
      'All data stored locally in the browser — no account required',
    ],
  },
];

export default function Changelog({ onNavigate }: ChangelogProps) {
  return (
    <div className="p-4 sm:p-6 lg:p-8 animate-fade-up" style={{ maxWidth: '680px' }}>
      <button
        onClick={() => onNavigate('dashboard')}
        className="flex items-center gap-2 mb-6 forge-label"
        style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', padding: 0, letterSpacing: '0.08em' }}
        onMouseEnter={e => (e.currentTarget.style.color = 'var(--text)')}
        onMouseLeave={e => (e.currentTarget.style.color = 'var(--muted)')}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        DASHBOARD
      </button>

      <div className="forge-label mb-1">What's new</div>
      <h1 className="forge-display text-4xl sm:text-5xl lg:text-6xl mb-8">CHANGELOG</h1>

      <div className="flex flex-col gap-8">
        {ENTRIES.map((entry, i) => (
          <div key={i} className="flex gap-5">
            {/* Timeline spine */}
            <div className="flex flex-col items-center flex-shrink-0" style={{ width: '1.5rem' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: i === 0 ? 'var(--accent)' : 'var(--border)', border: i === 0 ? '2px solid var(--accent)' : '2px solid var(--border)', flexShrink: 0 }} />
              {i < ENTRIES.length - 1 && (
                <div style={{ width: '1px', flex: 1, background: 'var(--border)', marginTop: '6px' }} />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 pb-2">
              <div className="forge-label mb-1" style={{ color: 'var(--muted)' }}>{entry.date}</div>
              <div
                style={{
                  fontFamily: 'Barlow Condensed, sans-serif',
                  fontWeight: 700,
                  fontSize: '1.1rem',
                  letterSpacing: '0.04em',
                  color: i === 0 ? 'var(--accent)' : 'var(--text)',
                  marginBottom: '0.6rem',
                }}
              >
                {entry.title}
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                {entry.items.map((item, j) => (
                  <li key={j} className="flex items-start gap-2">
                    <span style={{ color: 'var(--border)', flexShrink: 0, marginTop: '0.4em', fontSize: '0.6rem' }}>◆</span>
                    <span style={{ fontFamily: 'Barlow, sans-serif', fontSize: '0.875rem', color: 'var(--dim)', lineHeight: 1.5 }}>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
