export type MuscleGroup =
  | 'chest'
  | 'back'
  | 'shoulders'
  | 'arms'
  | 'legs'
  | 'core'
  | 'cardio';

export type View = 'dashboard' | 'log' | 'library' | 'progress' | 'records';

export interface Exercise {
  id: string;
  name: string;
  category: MuscleGroup;
  description: string;
  primaryMuscles: string[];
  equipment: string;
}

export interface WorkoutSet {
  id: string;
  reps: number;
  weight: number; // lbs
  completed: boolean;
  restSeconds: number; // rest after this set, default 90
}

export interface WorkoutExercise {
  id: string;
  exerciseId: string;
  exerciseName: string;
  category: MuscleGroup;
  sets: WorkoutSet[];
}

export interface Workout {
  id: string;
  date: string;
  name: string;
  exercises: WorkoutExercise[];
  duration: number; // minutes
  notes?: string;
}

export interface ActiveWorkout {
  id: string;
  date: string;
  name: string;
  exercises: WorkoutExercise[];
  startTime: number; // ms timestamp
  notes?: string;
}

export interface PersonalRecord {
  exerciseId: string;
  exerciseName: string;
  category: MuscleGroup;
  maxWeight: number;
  repsAtMax: number;
  date: string;
  estimatedOneRepMax: number;
}

export interface ExerciseProgress {
  date: string;
  maxWeight: number;
  totalVolume: number;
  totalSets: number;
}

export interface WeeklyStats {
  workoutsThisWeek: number;
  volumeThisWeek: number;
  streak: number;
}

export interface TemplateSet {
  id: string;
  weight: number;
  reps: number;
  restSeconds: number; // rest after this set, default 90
}

export interface TemplateExercise {
  id: string;
  exerciseId: string;
  exerciseName: string;
  category: MuscleGroup;
  sets: TemplateSet[];
}

export interface WorkoutTemplate {
  id: string;
  name: string;
  exercises: TemplateExercise[];
}
