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

- **Dashboard** — weekly stats (sessions, volume, streak), all-time totals, recent workout list
- **Log Workout** — start a new workout, add exercises, log sets with weight × reps, live timer
- **Templates** — saved workout templates (Push, Pull, Leg Day, etc.) with goal weights/reps per exercise; ordered by how long since you last did each one
- **Exercise Library** — 36 exercises across 7 muscle groups with descriptions and muscle targets
- **Progress** — SVG line charts for max weight and volume over time per exercise; weekly volume bar chart
- **Personal Records** — auto-calculated from workout history using the Epley estimated 1RM formula

## Importing from Strong

1. In the Strong app: **Settings → Export Data** → export as CSV
2. On the Dashboard, tap **Import**
3. Drop or select the `.csv` file
4. Preview shows workout count, date range, and breakdown by workout type
5. Confirm import — existing workouts are never duplicated (matched on full datetime + name)

Re-importing a newer Strong export is safe: only new workouts are added.

## Project structure

```
src/
  App.tsx                   # Root: view routing, nav state
  types/index.ts            # All TypeScript types
  hooks/useWorkouts.ts      # Central state management + localStorage persistence
  data/exercises.ts         # Exercise library (36 exercises, static)
  utils/importStrong.ts     # Strong CSV parser
  components/
    Navigation.tsx          # Sidebar (desktop always-open, mobile drawer)
    Dashboard.tsx           # Stats overview + import trigger
    WorkoutLogger.tsx       # New workout, templates, history, template editor
    ExerciseLibrary.tsx     # Browse exercises
    ProgressCharts.tsx      # SVG charts
    PersonalRecords.tsx     # PR table
    ImportModal.tsx         # Strong import flow
    ui/LineChart.tsx        # Reusable SVG line chart
```

## Data model

All data lives in `localStorage` under these keys:

| Key | Contents |
|-----|----------|
| `forge_workouts` | `Workout[]` — completed sessions, newest first |
| `forge_active` | `ActiveWorkout \| null` — in-progress session |
| `forge_templates` | `WorkoutTemplate[]` — editable goal templates |

## Design

**"Industrial Athlete"** aesthetic: near-black background with dot-grid, acid chartreuse (`#C8FF00`) accent, Bebas Neue display type, Space Mono for numbers. Sharp corners, no border-radius. Fonts loaded from Google Fonts.
