# FORGE — Performance Tracker

A fitness tracking web app built with React + TypeScript. Tracks workouts, exercises, personal records, and progress over time. Imports from the [Strong](https://www.strong.app/) iOS app.

## Stack

- **React 18** + **TypeScript**
- **Vite** — build tool and dev server
- **Tailwind CSS** — utility styling
- **localStorage** — all data is stored client-side, no backend

## Running locally

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # production build to dist/
npm run preview   # preview production build
```

## Features

- **Dashboard** — template cards with last-trained dates, 3-week training heatmap, active workout resume banner
- **Log Workout** — start a new workout, add exercises, log sets with weight × reps, per-set rest timers with inline countdown
- **Templates** — saved workout templates with goal weights/reps per exercise; ordered by longest since last trained
- **Exercise Library** — 76 exercises across 7 muscle groups with descriptions and muscle targets; create custom exercises
- **History** — list and calendar views; click any day or session to open the full workout detail; repeat any past workout
- **Progress** — SVG line charts for max weight and volume over time per exercise
- **Personal Records** — auto-calculated from workout history using the Epley estimated 1RM formula; PR badges shown inline during logging
- **Changelog** — in-app release notes accessible from the dashboard

## Importing from Strong

1. In the Strong app: **Settings → Export Data** → export as CSV
2. On the Dashboard, tap **Import from Strong**
3. Drop or select the `.csv` file
4. Preview shows workout count, date range, and breakdown by workout type
5. Confirm import — existing workouts are never duplicated (matched on full datetime + name)

Re-importing a newer Strong export is safe: only new workouts are added.

## Project structure

```
src/
  App.tsx                   # Root: view routing, nav state, showingWorkout flag
  types/index.ts            # All TypeScript types
  hooks/
    useWorkouts.ts          # Central state: workouts, active workout, templates
    useCustomExercises.ts   # Custom exercise CRUD + localStorage persistence
  data/exercises.ts         # Exercise library (76 exercises, static)
  utils/importStrong.ts     # Strong CSV parser
  components/
    Navigation.tsx          # Sidebar (desktop) / bottom tab bar (mobile)
    Dashboard.tsx           # Start workout hub: templates, heatmap, resume banner
    WorkoutLogger.tsx       # Active workout, history (list + calendar), exercise picker
    TemplateEditor.tsx      # Create/edit workout templates
    ExerciseLibrary.tsx     # Browse + create custom exercises
    ProgressCharts.tsx      # SVG charts
    PersonalRecords.tsx     # PR table
    ImportModal.tsx         # Strong import flow
    Changelog.tsx           # In-app release notes
    ui/LineChart.tsx        # Reusable SVG line chart
```

## Data model

All data lives in `localStorage` under these keys:

| Key | Contents |
|-----|----------|
| `forge_workouts` | `Workout[]` — completed sessions, newest first |
| `forge_active` | `ActiveWorkout \| null` — in-progress session |
| `forge_templates` | `WorkoutTemplate[]` — editable goal templates |
| `forge_custom_exercises` | `Exercise[]` — user-created exercises |

## Design

**"Industrial Athlete"** aesthetic: near-black background with dot-grid, acid chartreuse (`#C8FF00`) accent, Bebas Neue display type, Space Mono for numbers. Sharp corners, no border-radius. Fonts loaded from Google Fonts.
