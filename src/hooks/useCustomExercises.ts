import { useState, useCallback } from 'react';
import { Exercise, MuscleGroup } from '../types';

const KEY = 'forge_custom_exercises';

const load = (): Exercise[] => {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]');
  } catch {
    return [];
  }
};

export function useCustomExercises() {
  const [customs, setCustoms] = useState<Exercise[]>(load);

  const createExercise = useCallback((
    name: string,
    category: MuscleGroup,
    equipment: string,
  ): Exercise => {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const ex: Exercise = {
      id: `custom-${slug}-${Date.now()}`,
      name: name.trim(),
      category,
      description: 'Custom exercise.',
      primaryMuscles: [],
      equipment: equipment.trim() || '—',
    };
    setCustoms(prev => {
      const next = [...prev, ex];
      localStorage.setItem(KEY, JSON.stringify(next));
      return next;
    });
    return ex;
  }, []);

  return { customs, createExercise };
}
