import { useState } from 'react';
import { Workout, WeeklyStats, View } from '../types';
import ImportModal from './ImportModal';

interface DashboardProps {
  workouts: Workout[];
  weeklyStats: WeeklyStats;
  activeWorkout: { name: string } | null;
  onNavigate: (v: View) => void;
  onImport: (workouts: Workout[]) => number;
}

const formatDate = (iso: string) => {
  const d = new Date(iso);
  const now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  if (diff < 7) return `${diff}d ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const formatVolume = (v: number) => {
  if (v >= 1000) return `${(v / 1000).toFixed(1)}k`;
  return v.toLocaleString();
};

const getTotalVolume = (w: Workout) =>
  w.exercises.reduce(
    (acc, ex) => acc + ex.sets.reduce((sa, s) => sa + s.weight * s.reps, 0),
    0
  );

const getTopExercise = (w: Workout) => {
  if (w.exercises.length === 0) return null;
  return w.exercises.reduce((best, ex) => {
    const vol = ex.sets.reduce((a, s) => a + s.weight * s.reps, 0);
    const bestVol = best.sets.reduce((a, s) => a + s.weight * s.reps, 0);
    return vol > bestVol ? ex : best;
  });
};

export default function Dashboard({ workouts, weeklyStats, activeWorkout, onNavigate, onImport }: DashboardProps) {
  const [showImport, setShowImport] = useState(false);
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  });

  const recent = workouts.slice(0, 6);
  const totalWorkouts = workouts.length;
  const totalVolume = workouts.reduce((acc, w) => acc + getTotalVolume(w), 0);
  const avgDuration = totalWorkouts > 0
    ? Math.round(workouts.reduce((a, w) => a + w.duration, 0) / totalWorkouts)
    : 0;

  return (
    <div className="p-4 sm:p-6 lg:p-8 animate-fade-up">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-3">
        <div>
          <div className="forge-label mb-1">{today}</div>
          <h1 className="forge-display text-4xl sm:text-5xl lg:text-6xl" style={{ color: 'var(--text)' }}>
            DASHBOARD
          </h1>
        </div>
        <div className="flex gap-2 flex-shrink-0 mt-1">
          <button className="btn-ghost px-3 py-2.5 text-sm" onClick={() => setShowImport(true)}>
            Import
          </button>
          <button
            className="btn-accent px-4 py-2.5 text-sm"
            onClick={() => onNavigate('log')}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Log
          </button>
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

      {/* Stats grid — 2 cols on mobile, 4 on desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'This Week',      value: weeklyStats.workoutsThisWeek, unit: 'sessions' },
          { label: 'Weekly Volume',  value: formatVolume(weeklyStats.volumeThisWeek), unit: 'lbs' },
          { label: 'Streak',         value: weeklyStats.streak, unit: 'days', accent: weeklyStats.streak >= 3 },
          { label: 'Total Sessions', value: totalWorkouts, unit: 'workouts' },
        ].map(stat => (
          <div
            key={stat.label}
            className="forge-card p-4"
            style={'accent' in stat && stat.accent ? { borderLeft: '3px solid var(--accent)' } : {}}
          >
            <div className="forge-label mb-2">{stat.label}</div>
            <div
              className="forge-stat text-2xl sm:text-3xl"
              style={{ color: 'accent' in stat && stat.accent ? 'var(--accent)' : 'var(--text)' }}
            >
              {stat.value}
            </div>
            <div className="forge-label mt-1" style={{ color: 'var(--muted)' }}>{stat.unit}</div>
          </div>
        ))}
      </div>

      {/* All-time summary — scrollable row on mobile */}
      {totalWorkouts > 0 && (
        <div
          className="mb-6 p-4 sm:p-5 flex gap-5 overflow-x-auto"
          style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
        >
          {[
            { label: 'All-Time Volume', value: `${(totalVolume / 1000).toFixed(0)}K`, unit: 'lbs', big: true },
            { label: 'Avg Session',     value: formatVolume(Math.round(totalVolume / totalWorkouts)), unit: 'lbs' },
            { label: 'Avg Duration',    value: avgDuration.toString(), unit: 'min' },
          ].map((s, i) => (
            <div key={s.label} className="flex items-center gap-5 flex-shrink-0">
              {i > 0 && <div style={{ width: '1px', height: '50px', background: 'var(--border)', flexShrink: 0 }} />}
              <div>
                <div className="forge-label mb-1">{s.label}</div>
                <div
                  className={s.big ? 'forge-display text-4xl' : 'forge-stat text-xl'}
                  style={{ color: s.big ? 'var(--accent)' : 'var(--text)' }}
                >
                  {s.value}
                </div>
                <div className="forge-label" style={{ color: 'var(--muted)' }}>{s.unit}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Recent workouts */}
      <div>
        <h2 className="forge-display text-2xl mb-4">RECENT WORKOUTS</h2>

        {recent.length === 0 ? (
          <div className="p-10 sm:p-14 text-center" style={{ border: '1px dashed var(--border)' }}>
            <div className="forge-display text-3xl sm:text-4xl mb-2" style={{ color: 'var(--border)' }}>
              NO WORKOUTS YET
            </div>
            <p style={{ color: 'var(--muted)', fontFamily: 'Barlow, sans-serif', fontSize: '0.9rem' }}>
              Log your first workout to start tracking.
            </p>
            <div className="flex gap-3 justify-center mt-5">
              <button className="btn-ghost px-6 py-3" onClick={() => setShowImport(true)}>
                Import from Strong
              </button>
              <button className="btn-accent px-8 py-3" onClick={() => onNavigate('log')}>
                Start Now
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {recent.map((workout, i) => {
              const vol = getTotalVolume(workout);
              const top = getTopExercise(workout);
              return (
                <div
                  key={workout.id}
                  className="forge-card p-3 sm:p-4 flex items-center gap-3 sm:gap-4 animate-fade-up"
                  style={{ animationDelay: `${i * 40}ms` }}
                >
                  <div
                    className="forge-display text-xl sm:text-2xl w-10 sm:w-14 text-right flex-shrink-0"
                    style={{ color: 'var(--border)' }}
                  >
                    {String(i + 1).padStart(2, '0')}
                  </div>
                  <div style={{ width: '1px', height: '36px', background: 'var(--border)', flexShrink: 0 }} />
                  <div className="flex-1 min-w-0">
                    <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '0.95rem', letterSpacing: '0.04em' }}>
                      {workout.name}
                    </div>
                    <div className="forge-label mt-0.5 truncate">
                      {formatDate(workout.date)} · {workout.duration}min · {workout.exercises.length} ex
                      {top ? ` · ${top.exerciseName}` : ''}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="forge-stat text-base sm:text-lg">{formatVolume(vol)}</div>
                    <div className="forge-label">lbs</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showImport && (
        <ImportModal
          onClose={() => setShowImport(false)}
          onImport={onImport}
        />
      )}
    </div>
  );
}
