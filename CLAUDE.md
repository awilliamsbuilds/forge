# FORGE — Claude Code Guide

## Commands

```bash
npm run dev      # dev server at localhost:5173
npm run build    # tsc + vite build (run this to catch type errors)
npm run preview  # preview the production build
```

Always run `npm run build` after changes to catch TypeScript errors before calling something done.

## Architecture

**Single hook, all state.** `src/hooks/useWorkouts.ts` is the only state store. It manages workouts, the active workout, and templates — all persisted to `localStorage`. Components read from it and call its functions; they hold no persistent state themselves.

**No router.** Navigation is a `view` string in `App.tsx` (`useState<View>`). Adding a new page means adding a value to the `View` union type, a nav item in `Navigation.tsx`, and a render branch in `App.tsx`.

**No external chart or UI libraries.** Charts are hand-written SVG in `src/components/ui/LineChart.tsx`. Don't add charting libraries.

## Key files

| File | Role |
|------|------|
| `src/hooks/useWorkouts.ts` | All state: workouts, active workout, templates. CRUD + computed values (PRs, weekly stats, exercise progress). |
| `src/hooks/useCustomExercises.ts` | Custom exercise CRUD. Reads/writes `forge_custom_exercises` in localStorage. |
| `src/types/index.ts` | Single source of truth for all types. Edit here first when changing data shapes. |
| `src/utils/importStrong.ts` | Strong CSV parser. Converts rows → `Workout[]`. Handles quoted fields, duration parsing (`"1h 5m"` → 65), and exercise category inference from name keywords. |
| `src/data/exercises.ts` | Static exercise library (76 exercises). `EXERCISE_MAP` for O(1) lookup by ID. |
| `src/components/WorkoutLogger.tsx` | Largest component. Contains: `StartScreen` (list+calendar history), `ActiveWorkoutView`, `ExercisePicker`, `Timer`. |
| `src/components/TemplateEditor.tsx` | Create/edit workout templates with goal weights and reps. |
| `src/components/Changelog.tsx` | In-app release notes, timeline layout. Linked from dashboard as "What's New". |

## Data shapes

```typescript
// Completed workout (stored in forge_workouts)
Workout { id, date (ISO), name, exercises: WorkoutExercise[], duration (min) }

// In-progress workout (stored in forge_active)
ActiveWorkout { ...same fields, startTime (ms timestamp), no duration }

// Editable template with goal sets (stored in forge_templates)
WorkoutTemplate { id, name, exercises: TemplateExercise[] }
TemplateExercise { id, exerciseId, exerciseName, category, sets: TemplateSet[] }
TemplateSet { id, weight, reps, restSeconds }  // no `completed` field

// Exercise in a workout
WorkoutExercise { id, exerciseId, exerciseName, category, sets: WorkoutSet[] }
WorkoutSet { id, reps, weight, completed, restSeconds }  // rest after this set (default 90s)
```

## localStorage keys

| Key | Type | Notes |
|-----|------|-------|
| `forge_workouts` | `Workout[]` | Sorted newest-first. |
| `forge_active` | `ActiveWorkout \| null` | Cleared on finish/cancel. |
| `forge_templates` | `WorkoutTemplate[]` | Seeded from history on first run. |
| `forge_custom_exercises` | `Exercise[]` | User-created exercises. Managed by `useCustomExercises`. |

## Patterns

**Functional state updates.** `useWorkouts` uses functional setState (`prev => ...`) to avoid stale closure bugs, especially in `finishWorkout` which writes to both workouts and active simultaneously.

**Deduplication on import.** Strong re-imports match on `workout.date + '||' + workout.name` (full ISO datetime). This lets the same CSV be re-imported safely. Manual workouts have different timestamps so they won't conflict.

**Template seeding.** On first load (when `forge_templates` is null in storage), `initTemplates()` reads `forge_workouts` directly from localStorage and seeds templates from the most recent matching workout for each default name. This runs once.

**Category inference.** `inferCategory(exerciseName)` in `importStrong.ts` uses ordered regex tests. Legs checked before generic "press/curl" patterns to avoid misclassifying "Leg Press" as chest. Order matters — don't reorder without testing.

**Estimated 1RM.** Epley formula: `weight * (1 + reps / 30)`. Used in `personalRecords` memo inside `useWorkouts`.

## CSS / styling

Global CSS classes are in `src/index.css`. Key ones:

| Class | Use |
|-------|-----|
| `.forge-card` | Standard card (dark bg, border) |
| `.forge-card-accent` | Card with left accent border |
| `.forge-label` | Tiny uppercase Barlow Condensed label |
| `.forge-stat` | Space Mono bold number |
| `.forge-display` | Bebas Neue heading |
| `.forge-input` | Dark input with focus accent border |
| `.btn-accent` | Chartreuse primary button |
| `.btn-ghost` | Transparent bordered secondary button |
| `.btn-danger` | Red outlined danger button |
| `.cat-{muscle}` | Coloured category badge (chest/back/etc.) |
| `.stepper` | Weight/reps stepper control |
| `.forge-table` | Dark-themed table |
| `.forge-checkbox` | Custom checkbox (accent when checked) |

CSS variables (defined in `:root`): `--bg`, `--surface`, `--card`, `--border`, `--muted`, `--dim`, `--text`, `--accent` (#C8FF00), `--danger`, `--success`, `--blue`.

**Responsive:** Mobile-first. Sidebar uses `lg:translate-x-0` to always show on desktop; on mobile it's a slide-in drawer controlled by `navOpen` state in `App.tsx`. Content uses `lg:ml-[220px]` and `pt-[52px] lg:pt-0` to account for the mobile top bar.

## What NOT to do

- Don't add a router (React Router etc.) — the current view-string pattern is intentional.
- Don't add a state management library (Redux, Zustand, etc.) — the single hook is sufficient.
- Don't add a chart library — charts are intentionally hand-written SVG.
- Don't add a backend or database — localStorage is the intentional persistence layer.
- Don't add a CSS framework beyond Tailwind — custom classes cover all edge cases.
