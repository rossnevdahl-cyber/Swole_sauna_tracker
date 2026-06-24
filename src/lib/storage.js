// localStorage keys
export const KEYS = {
  movements: 'sst_movements',
  templates: 'sst_templates',
  workouts: 'sst_workouts',
  hypertrophyTargets: 'sst_hypertrophyTargets',
  settings: 'sst_settings',
  activeWorkout: 'sst_activeWorkout',
}

export const MUSCLE_GROUPS = [
  'Chest',
  'Back',
  'Shoulders',
  'Biceps',
  'Triceps',
  'Legs',
  'Glutes',
  'Core',
  'Calves',
]

export const DEFAULT_TARGETS = {
  Chest: { min: 10, max: 20 },
  Back: { min: 12, max: 20 },
  Shoulders: { min: 12, max: 20 },
  Biceps: { min: 8, max: 16 },
  Triceps: { min: 8, max: 16 },
  Legs: { min: 12, max: 20 },
  Glutes: { min: 8, max: 16 },
  Core: { min: 6, max: 12 },
  Calves: { min: 8, max: 16 },
}

export const DEFAULT_SETTINGS = { weightUnit: 'lbs' }

// A small starter set of common movements so the app isn't empty on first run.
export const SEED_MOVEMENTS = [
  { name: 'Incline DB Press', muscleGroup: 'Chest', defaultRestSeconds: 90 },
  { name: 'Flat Barbell Bench', muscleGroup: 'Chest', defaultRestSeconds: 120 },
  { name: 'Cable Fly', muscleGroup: 'Chest', defaultRestSeconds: 60 },
  { name: 'Lat Pulldown', muscleGroup: 'Back', defaultRestSeconds: 90 },
  { name: 'Barbell Row', muscleGroup: 'Back', defaultRestSeconds: 120 },
  { name: 'Seated Cable Row', muscleGroup: 'Back', defaultRestSeconds: 90 },
  { name: 'Overhead Press', muscleGroup: 'Shoulders', defaultRestSeconds: 90 },
  { name: 'Lateral Raise', muscleGroup: 'Shoulders', defaultRestSeconds: 60 },
  { name: 'DB Curl', muscleGroup: 'Biceps', defaultRestSeconds: 60 },
  { name: 'Cable Pushdown', muscleGroup: 'Triceps', defaultRestSeconds: 60 },
  { name: 'Barbell Squat', muscleGroup: 'Legs', defaultRestSeconds: 150 },
  { name: 'Leg Press', muscleGroup: 'Legs', defaultRestSeconds: 120 },
  { name: 'Romanian Deadlift', muscleGroup: 'Glutes', defaultRestSeconds: 120 },
  { name: 'Hanging Leg Raise', muscleGroup: 'Core', defaultRestSeconds: 60 },
  { name: 'Standing Calf Raise', muscleGroup: 'Calves', defaultRestSeconds: 60 },
]

export function uuid() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

export function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    if (raw === null || raw === undefined) return fallback
    return JSON.parse(raw)
  } catch (e) {
    console.warn('Failed to load', key, e)
    return fallback
  }
}

export function save(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (e) {
    console.warn('Failed to save', key, e)
  }
}

export function remove(key) {
  try {
    localStorage.removeItem(key)
  } catch (e) {
    console.warn('Failed to remove', key, e)
  }
}
