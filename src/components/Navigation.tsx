import { View } from '../types';

interface NavProps {
  currentView: View;
  onNavigate: (v: View) => void;
  hasActiveWorkout: boolean;
  isOpen: boolean;
  onClose: () => void;
}

const NAV_ITEMS: { view: View; label: string; icon: JSX.Element }[] = [
  {
    view: 'dashboard',
    label: 'Dashboard',
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
    label: 'Library',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="square">
        <path d="M4 19V5a2 2 0 0 1 2-2h13" /><path d="M19 19H6a2 2 0 0 0 0 4h13V3" />
        <line x1="9" y1="7" x2="15" y2="7" /><line x1="9" y1="11" x2="12" y2="11" />
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

export default function Navigation({ currentView, onNavigate, hasActiveWorkout, isOpen, onClose }: NavProps) {
  return (
    <aside
      className={[
        'fixed top-0 left-0 h-full z-50 flex flex-col',
        'transition-transform duration-[250ms] ease-in-out',
        // Mobile: slide in/out. Desktop: always visible.
        isOpen ? 'translate-x-0' : '-translate-x-full',
        'lg:translate-x-0',
      ].join(' ')}
      style={{
        width: '220px',
        background: 'var(--surface)',
        borderRight: '1px solid var(--border)',
      }}
    >
      {/* Logo + close button */}
      <div
        className="px-6 pt-7 pb-6 flex items-start justify-between"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <div>
          <div className="forge-display text-4xl" style={{ color: 'var(--accent)', letterSpacing: '0.08em' }}>
            FORGE
          </div>
          <div className="forge-label mt-1" style={{ color: 'var(--muted)' }}>
            Performance Tracker
          </div>
        </div>
        {/* Close button — only visible/useful on mobile */}
        <button
          onClick={onClose}
          className="lg:hidden mt-1"
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--muted)',
            cursor: 'pointer',
            fontSize: '1.1rem',
            padding: '0.25rem',
          }}
          aria-label="Close menu"
        >
          ✕
        </button>
      </div>

      {/* Nav items */}
      <nav className="flex-1 py-4 overflow-y-auto">
        {NAV_ITEMS.map(item => {
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
              {item.view === 'log' && hasActiveWorkout && (
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
  );
}
