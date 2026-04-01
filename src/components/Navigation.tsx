import { View } from '../types';

interface NavProps {
  currentView: View;
  onNavigate: (v: View) => void;
  hasActiveWorkout: boolean;
}

// ── Desktop sidebar items (all 5 views) ───────────────────────────────────────

const SIDEBAR_ITEMS: { view: View; label: string; icon: JSX.Element }[] = [
  {
    view: 'dashboard',
    label: 'Workout',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="square">
        <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
      </svg>
    ),
  },
  {
    view: 'log',
    label: 'History',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="square">
        <circle cx="12" cy="12" r="9" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="12" x2="15" y2="15" />
      </svg>
    ),
  },
  {
    view: 'library',
    label: 'Exercises',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="square">
        <line x1="6" y1="12" x2="18" y2="12" />
        <line x1="2" y1="9" x2="2" y2="15" /><line x1="6" y1="7" x2="6" y2="17" />
        <line x1="18" y1="7" x2="18" y2="17" /><line x1="22" y1="9" x2="22" y2="15" />
      </svg>
    ),
  },
  {
    view: 'progress',
    label: 'Progress',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="square">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
  },
  {
    view: 'records',
    label: 'Records',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="square">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    ),
  },
];

// ── Mobile bottom nav items (flanking the center START button) ─────────────────
// Left: History, Library   Right: Progress, Records

const BOTTOM_LEFT: (typeof SIDEBAR_ITEMS[number])[] = SIDEBAR_ITEMS.filter(i => i.view === 'log' || i.view === 'library');
const BOTTOM_RIGHT: (typeof SIDEBAR_ITEMS[number])[] = SIDEBAR_ITEMS.filter(i => i.view === 'progress' || i.view === 'records');

export default function Navigation({ currentView, onNavigate, hasActiveWorkout }: NavProps) {
  return (
    <>
      {/* ── Desktop sidebar ──────────────────────────────────────────────────── */}
      <aside
        className="hidden lg:flex fixed top-0 left-0 h-full z-50 flex-col"
        style={{
          width: '220px',
          background: 'var(--surface)',
          borderRight: '1px solid var(--border)',
        }}
      >
        {/* Logo */}
        <div className="px-6 pt-7 pb-6" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="forge-display text-4xl" style={{ color: 'var(--accent)', letterSpacing: '0.08em' }}>
            FORGE
          </div>
          <div className="forge-label mt-1" style={{ color: 'var(--muted)' }}>
            Performance Tracker
          </div>
        </div>

        {/* Nav items */}
        <nav className="flex-1 py-4 overflow-y-auto">
          {SIDEBAR_ITEMS.map(item => {
            const active = currentView === item.view;
            return (
              <button
                key={item.view}
                onClick={() => onNavigate(item.view)}
                className="w-full flex items-center gap-3 px-6 py-3 text-left transition-all"
                style={{
                  color: active ? 'var(--accent)' : 'var(--dim)',
                  background: active ? 'rgba(200,255,0,0.06)' : 'transparent',
                  borderLeft: active ? '3px solid var(--accent)' : '3px solid transparent',
                  borderTop: 'none',
                  borderRight: 'none',
                  borderBottom: 'none',
                  fontFamily: 'Barlow Condensed, sans-serif',
                  fontWeight: 700,
                  fontSize: '0.875rem',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                }}
              >
                <span style={{ color: active ? 'var(--accent)' : 'var(--muted)', flexShrink: 0 }}>
                  {item.icon}
                </span>
                {item.label}
                {item.view === 'dashboard' && hasActiveWorkout && (
                  <span
                    className="ml-auto w-2 h-2 rounded-full animate-blink"
                    style={{ background: 'var(--accent)', flexShrink: 0 }}
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-6 py-4" style={{ borderTop: '1px solid var(--border)' }}>
          <div className="forge-label" style={{ color: 'var(--muted)' }}>
            Data stored locally
          </div>
        </div>
      </aside>

      {/* ── Mobile bottom nav ────────────────────────────────────────────────── */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-50 flex items-center"
        style={{
          height: '64px',
          background: 'var(--surface)',
          borderTop: '1px solid var(--border)',
        }}
      >
        {/* Left items */}
        {BOTTOM_LEFT.map(item => {
          const active = currentView === item.view;
          return (
            <button
              key={item.view}
              onClick={() => onNavigate(item.view)}
              className="flex-1 flex flex-col items-center justify-center gap-1 h-full relative"
              style={{
                background: 'none',
                border: 'none',
                color: active ? 'var(--accent)' : 'var(--muted)',
                cursor: 'pointer',
              }}
            >
              {item.icon}
              <span style={{
                fontFamily: 'Barlow Condensed, sans-serif',
                fontWeight: 700,
                fontSize: '0.6rem',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
              }}>
                {item.label}
              </span>
            </button>
          );
        })}

        {/* Center START button */}
        <div className="flex-shrink-0 flex items-center justify-center" style={{ width: '72px' }}>
          <button
            onClick={() => onNavigate('dashboard')}
            aria-label="Start workout"
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '50%',
              background: currentView === 'dashboard' ? 'var(--accent)' : 'rgba(200,255,0,0.12)',
              border: `2px solid ${currentView === 'dashboard' ? 'var(--accent)' : 'rgba(200,255,0,0.4)'}`,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: currentView === 'dashboard' ? '#0a0a0a' : 'var(--accent)',
              transition: 'background 0.15s, border-color 0.15s',
              position: 'relative',
            }}
          >
            {hasActiveWorkout && (
              <span
                className="absolute animate-blink"
                style={{ top: '2px', right: '2px', width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent)', border: '1.5px solid var(--surface)' }}
              />
            )}
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
        </div>

        {/* Right items */}
        {BOTTOM_RIGHT.map(item => {
          const active = currentView === item.view;
          return (
            <button
              key={item.view}
              onClick={() => onNavigate(item.view)}
              className="flex-1 flex flex-col items-center justify-center gap-1 h-full"
              style={{
                background: 'none',
                border: 'none',
                color: active ? 'var(--accent)' : 'var(--muted)',
                cursor: 'pointer',
              }}
            >
              {item.icon}
              <span style={{
                fontFamily: 'Barlow Condensed, sans-serif',
                fontWeight: 700,
                fontSize: '0.6rem',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
              }}>
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </>
  );
}
