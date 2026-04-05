import { useState, useEffect, useRef } from 'react';
import { playChime } from '../utils/chime';

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

// ── Circular countdown ring ───────────────────────────────────────────────────

function Ring({ remaining, total, accent = true }: { remaining: number; total: number; accent?: boolean }) {
  const R = 76;
  const C = 2 * Math.PI * R;
  const pct = total > 0 ? remaining / total : 0;
  return (
    <svg width="192" height="192" style={{ transform: 'rotate(-90deg)', display: 'block' }}>
      <circle cx="96" cy="96" r={R} fill="none" stroke="var(--border)" strokeWidth="5" />
      <circle cx="96" cy="96" r={R} fill="none"
        stroke={accent ? 'var(--accent)' : 'rgba(200,255,0,0.35)'}
        strokeWidth="5"
        strokeDasharray={C}
        strokeDashoffset={C * (1 - pct)}
        style={{ transition: 'stroke-dashoffset 0.25s linear' }}
      />
    </svg>
  );
}

// ── Stepper input ─────────────────────────────────────────────────────────────

function Stepper({ label, value, onChange, min = 1, step = 1, format }: {
  label: string; value: number; onChange: (v: number) => void;
  min?: number; step?: number; format?: (v: number) => string;
}) {
  const display = format ? format(value) : String(value);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', flex: label ? 1 : undefined }}>
      {label && (
        <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '0.65rem', letterSpacing: '0.12em', color: 'var(--muted)', textTransform: 'uppercase' }}>
          {label}
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <button
          onClick={() => onChange(Math.max(min, value - step))}
          style={{ background: 'none', border: '1px solid var(--border)', color: 'var(--dim)', width: 28, height: 28, cursor: 'pointer', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >−</button>
        <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '1rem', fontWeight: 700, color: 'var(--text)', minWidth: '2.6rem', textAlign: 'center' }}>
          {display}
        </div>
        <button
          onClick={() => onChange(value + step)}
          style={{ background: 'none', border: '1px solid var(--border)', color: 'var(--dim)', width: 28, height: 28, cursor: 'pointer', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >+</button>
      </div>
    </div>
  );
}

// ── Simple timer ──────────────────────────────────────────────────────────────

const PRESETS = [30, 60, 90, 120, 180];

function SimpleTimer() {
  const [duration, setDuration]     = useState(60);
  const [state, setState]           = useState<'idle' | 'running' | 'done'>('idle');
  const [remaining, setRemaining]   = useState(60);
  const [startedAt, setStartedAt]   = useState<number | null>(null);
  const chimed                      = useRef(false);

  useEffect(() => {
    if (state !== 'running' || !startedAt) return;
    const id = setInterval(() => {
      const r = Math.max(0, duration - Math.floor((Date.now() - startedAt) / 1000));
      setRemaining(r);
      if (r === 0 && !chimed.current) {
        chimed.current = true;
        playChime();
        setState('done');
      }
    }, 250);
    return () => clearInterval(id);
  }, [state, startedAt, duration]);

  const start = () => {
    chimed.current = false;
    setRemaining(duration);
    setStartedAt(Date.now());
    setState('running');
  };

  const stop = () => {
    setState('idle');
    setRemaining(duration);
    setStartedAt(null);
  };

  const adjust = (delta: number) => {
    chimed.current = false;
    setDuration(d => Math.max(15, d + delta));
    if (state === 'done') setState('running');
  };

  const selectPreset = (s: number) => {
    setDuration(s);
    setRemaining(s);
    setState('idle');
    setStartedAt(null);
  };

  const done = state === 'done';

  const adjustBtn = (label: string, onClick: () => void) => (
    <button onClick={onClick} style={{
      background: 'none', border: 'none', color: 'var(--dim)', cursor: 'pointer',
      fontFamily: 'Space Mono, monospace', fontSize: '0.72rem', padding: '0.5rem 0.25rem',
      flexShrink: 0, width: '44px',
    }}
      onMouseEnter={e => (e.currentTarget.style.color = 'var(--text)')}
      onMouseLeave={e => (e.currentTarget.style.color = 'var(--dim)')}
    >{label}</button>
  );

  const onAdjust = (delta: number) => state === 'idle'
    ? selectPreset(Math.max(15, duration + delta))
    : adjust(delta);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem' }}>
      {/* Ring flanked by ±15s buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        {adjustBtn('−15s', () => onAdjust(-15))}
        <div style={{ position: 'relative' }}>
          <Ring remaining={remaining} total={duration} />
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.2rem' }}>
            <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '2.4rem', fontWeight: 700, color: done ? 'var(--accent)' : 'var(--text)', letterSpacing: '0.04em' }}>
              {fmt(remaining)}
            </div>
            {done && (
              <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '0.75rem', letterSpacing: '0.15em', color: 'var(--accent)' }}>
                DONE
              </div>
            )}
          </div>
        </div>
        {adjustBtn('+15s', () => onAdjust(15))}
      </div>

      {/* Presets — only when idle */}
      {state === 'idle' && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'center' }}>
          {PRESETS.map(s => (
            <button
              key={s}
              onClick={() => selectPreset(s)}
              style={{
                fontFamily: 'Space Mono, monospace', fontSize: '0.75rem', fontWeight: 700,
                padding: '0.4rem 0.75rem',
                background: duration === s ? 'rgba(200,255,0,0.12)' : 'transparent',
                border: `1px solid ${duration === s ? 'var(--accent)' : 'var(--border)'}`,
                color: duration === s ? 'var(--accent)' : 'var(--dim)',
                cursor: 'pointer',
              }}
            >
              {fmt(s)}
            </button>
          ))}
        </div>
      )}

      {/* Action button */}
      {state === 'idle' && (
        <button className="btn-accent w-full py-3" onClick={start} style={{ fontSize: '0.85rem', letterSpacing: '0.1em' }}>
          START
        </button>
      )}
      {state === 'running' && (
        <button className="btn-ghost w-full py-3" onClick={stop} style={{ fontSize: '0.85rem', letterSpacing: '0.1em' }}>
          STOP
        </button>
      )}
      {state === 'done' && (
        <button className="btn-accent w-full py-3" onClick={stop} style={{ fontSize: '0.85rem', letterSpacing: '0.1em' }}>
          RESTART
        </button>
      )}
    </div>
  );
}

// ── Interval timer ────────────────────────────────────────────────────────────

interface IRef {
  phase: 'hold' | 'rest';
  rep: number;
  startedAt: number;
  chimed: boolean;
}

function IntervalTimer() {
  const [reps, setReps]         = useState(5);
  const [holdSecs, setHoldSecs] = useState(10);
  const [restSecs, setRestSecs] = useState(10);

  const [iState, setIState] = useState<'setup' | 'running' | 'done'>('setup');
  const [display, setDisplay] = useState({ phase: 'hold' as 'hold' | 'rest', rep: 1, remaining: 10 });

  const iRef = useRef<IRef>({ phase: 'hold', rep: 1, startedAt: Date.now(), chimed: false });

  useEffect(() => {
    if (iState !== 'running') return;
    const id = setInterval(() => {
      const { phase, rep, startedAt, chimed } = iRef.current;
      const dur = phase === 'hold' ? holdSecs : restSecs;
      const r   = Math.max(0, dur - Math.floor((Date.now() - startedAt) / 1000));
      setDisplay(d => ({ ...d, remaining: r }));

      if (r === 0 && !chimed) {
        iRef.current.chimed = true;
        playChime();

        if (phase === 'hold') {
          if (restSecs === 0) {
            // No rest — go straight to next hold
            if (rep < reps) {
              iRef.current = { phase: 'hold', rep: rep + 1, startedAt: Date.now(), chimed: false };
              setDisplay({ phase: 'hold', rep: rep + 1, remaining: holdSecs });
            } else {
              setIState('done');
            }
          } else {
            iRef.current = { phase: 'rest', rep, startedAt: Date.now(), chimed: false };
            setDisplay({ phase: 'rest', rep, remaining: restSecs });
          }
        } else {
          // Rest done
          if (rep < reps) {
            iRef.current = { phase: 'hold', rep: rep + 1, startedAt: Date.now(), chimed: false };
            setDisplay({ phase: 'hold', rep: rep + 1, remaining: holdSecs });
          } else {
            setIState('done');
          }
        }
      }
    }, 250);
    return () => clearInterval(id);
  }, [iState, holdSecs, restSecs, reps]);

  const start = () => {
    iRef.current = { phase: 'hold', rep: 1, startedAt: Date.now(), chimed: false };
    setDisplay({ phase: 'hold', rep: 1, remaining: holdSecs });
    setIState('running');
  };

  const skip = () => {
    const { phase, rep } = iRef.current;
    playChime();
    if (phase === 'hold') {
      if (restSecs === 0) {
        if (rep < reps) {
          iRef.current = { phase: 'hold', rep: rep + 1, startedAt: Date.now(), chimed: false };
          setDisplay({ phase: 'hold', rep: rep + 1, remaining: holdSecs });
        } else {
          setIState('done');
        }
      } else {
        iRef.current = { phase: 'rest', rep, startedAt: Date.now(), chimed: false };
        setDisplay({ phase: 'rest', rep, remaining: restSecs });
      }
    } else {
      if (rep < reps) {
        iRef.current = { phase: 'hold', rep: rep + 1, startedAt: Date.now(), chimed: false };
        setDisplay({ phase: 'hold', rep: rep + 1, remaining: holdSecs });
      } else {
        setIState('done');
      }
    }
  };

  const stop = () => {
    setIState('setup');
    setDisplay({ phase: 'hold', rep: 1, remaining: holdSecs });
  };

  const isHold = display.phase === 'hold';
  const phaseDur = isHold ? holdSecs : restSecs;

  if (iState === 'setup') {
    const rowStyle: React.CSSProperties = {
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0.6rem 0', borderBottom: '1px solid var(--border)',
    };
    const labelStyle: React.CSSProperties = {
      fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700,
      fontSize: '0.8rem', letterSpacing: '0.12em', color: 'var(--muted)', textTransform: 'uppercase',
    };
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div>
          <div style={rowStyle}>
            <span style={labelStyle}>Reps</span>
            <Stepper label="" value={reps} onChange={setReps} min={1} />
          </div>
          <div style={rowStyle}>
            <span style={labelStyle}>Hold</span>
            <Stepper label="" value={holdSecs} onChange={setHoldSecs} min={5} step={5} format={fmt} />
          </div>
          <div style={{ ...rowStyle, borderBottom: 'none' }}>
            <span style={labelStyle}>Rest</span>
            <Stepper label="" value={restSecs} onChange={setRestSecs} min={0} step={5} format={fmt} />
          </div>
        </div>
        <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '0.75rem', color: 'var(--dim)', textAlign: 'center' }}>
          {fmt(reps * (holdSecs + restSecs))} total
        </div>
        <button className="btn-accent w-full py-3" onClick={start} style={{ fontSize: '0.85rem', letterSpacing: '0.1em' }}>
          START
        </button>
      </div>
    );
  }

  if (iState === 'done') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem' }}>
        <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '3rem', color: 'var(--accent)', letterSpacing: '0.1em' }}>DONE</div>
        <div style={{ fontFamily: 'Barlow Condensed, sans-serif', color: 'var(--muted)', fontSize: '0.9rem' }}>
          {reps} reps completed
        </div>
        <button className="btn-accent w-full py-3" onClick={stop} style={{ fontSize: '0.85rem', letterSpacing: '0.1em' }}>
          RESET
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem' }}>
      {/* Phase label */}
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'baseline' }}>
        <span style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.75rem', color: isHold ? 'var(--accent)' : 'var(--dim)', letterSpacing: '0.08em' }}>
          {isHold ? 'HOLD' : 'REST'}
        </span>
        <span style={{ fontFamily: 'Space Mono, monospace', fontSize: '0.7rem', color: 'var(--muted)' }}>
          REP {display.rep}/{reps}
        </span>
      </div>

      {/* Ring */}
      <div style={{ position: 'relative' }}>
        <Ring remaining={display.remaining} total={phaseDur} accent={isHold} />
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '2.4rem', fontWeight: 700, color: 'var(--text)', letterSpacing: '0.04em' }}>
            {fmt(display.remaining)}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: '0.75rem', width: '100%' }}>
        <button className="btn-ghost flex-1 py-3" onClick={stop} style={{ fontSize: '0.8rem', letterSpacing: '0.1em' }}>
          STOP
        </button>
        <button className="btn-accent flex-1 py-3" onClick={skip} style={{ fontSize: '0.8rem', letterSpacing: '0.1em' }}>
          SKIP →
        </button>
      </div>
    </div>
  );
}

// ── Modal ─────────────────────────────────────────────────────────────────────

export default function WorkoutTimerModal({ onClose }: { onClose: () => void }) {
  const [mode, setMode] = useState<'simple' | 'interval'>('simple');

  const tabStyle = (active: boolean): React.CSSProperties => ({
    flex: 1,
    padding: '0.5rem',
    background: active ? 'rgba(200,255,0,0.1)' : 'transparent',
    border: 'none',
    borderBottom: `2px solid ${active ? 'var(--accent)' : 'transparent'}`,
    color: active ? 'var(--accent)' : 'var(--muted)',
    fontFamily: 'Barlow Condensed, sans-serif',
    fontWeight: 700,
    fontSize: '0.8rem',
    letterSpacing: '0.12em',
    cursor: 'pointer',
    textTransform: 'uppercase',
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.82)' }}
      onClick={onClose}
    >
      <div
        style={{ background: 'var(--card)', border: '1px solid var(--border)', width: 'min(400px, 100vw)', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)' }}>
          <h2 className="forge-display text-2xl">WORKOUT TIMER</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '1.1rem', lineHeight: 1 }}>✕</button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)' }}>
          <button style={tabStyle(mode === 'simple')}   onClick={() => setMode('simple')}>Simple</button>
          <button style={tabStyle(mode === 'interval')} onClick={() => setMode('interval')}>Interval</button>
        </div>

        {/* Content */}
        <div style={{ padding: '1.5rem 1.25rem', overflowY: 'auto' }}>
          {mode === 'simple'   ? <SimpleTimer />   : <IntervalTimer />}
        </div>
      </div>
    </div>
  );
}
