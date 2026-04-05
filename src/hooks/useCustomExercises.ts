import { useState, useCallback, useEffect } from 'react';
import { Exercise, MuscleGroup } from '../types';
import { loadFromServer, saveToServer } from '../api';

const KEY = 'forge_custom_exercises';

const loadLocal = (): Exercise[] => {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]');
  } catch {
    return [];
  }
};

export function useCustomExercises() {
  const [customs, setCustoms] = useState<Exercise[]>(loadLocal);

  // Hydrate from server on mount
  useEffect(() => {
    loadFromServer<Exercise[]>(KEY).then(result => {
      if (result.found && result.value && result.value.length > 0) {
        localStorage.setItem(KEY, JSON.stringify(result.value));
        setCustoms(result.value);
      }
    });
  }, []);

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
      saveToServer(KEY, next);
      return next;
    });
    return ex;
  }, []);

  return { customs, createExercise };
}
