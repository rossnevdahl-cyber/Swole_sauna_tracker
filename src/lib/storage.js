// localStorage keys
export const KEYS = {
  movements: 'sst_movements',
  templates: 'sst_templates',
  workouts: 'sst_workouts',
  hypertrophyTargets: 'sst_hypertrophyTargets',
  settings: 'sst_settings',
  activeWorkout: 'sst_activeWorkout',
  // Weight Trend feature — spec-defined key names.
  weeklyWeighIns: 'weeklyWeighIns',
  weightTargets: 'weightTargets',
  weeklyNutritionCompliance: 'weeklyNutritionCompliance',
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

// ---------------------------------------------------------------------------
// Weight Trend feature
// ---------------------------------------------------------------------------

// The three prep-cycle phases. Dates are the Monday (YYYY-MM-DD) boundaries.
// `band` is the chart background tint; `color` is the brighter label/line color.
export const WEIGHT_PHASES = [
  {
    key: 'mini',
    label: 'Mini Cut',
    tableLabel: '▼ PHASE 1 — MINI CUT',
    color: '#FF3B30',
    band: 'rgba(255, 59, 48, 0.08)',
    start: '2026-07-06',
    end: '2026-08-24',
  },
  {
    key: 'bulk',
    label: 'Lean Bulk',
    tableLabel: '▲ PHASE 2 — LEAN BULK',
    color: '#3B82F6',
    band: 'rgba(59, 130, 246, 0.08)',
    start: '2026-08-31',
    end: '2027-02-22',
  },
  {
    key: 'cut',
    label: 'Comp Cut',
    tableLabel: '▼ PHASE 3 — COMPETITION CUT',
    color: '#FB923C',
    band: 'rgba(251, 146, 60, 0.08)',
    start: '2027-03-01',
    end: '2027-08-16',
  },
]

// Show date for the prep cycle (vertical marker on the chart).
export const SHOW_DAY = '2027-08-21'

// Hardcoded target weight curve from the competition prep plan. Each entry is
// [Monday date string, target lbs]. Ordered chronologically.
const MINI_CUT = [
  ['2026-07-06', 187.5],
  ['2026-07-13', 186.0],
  ['2026-07-20', 184.5],
  ['2026-07-27', 183.0],
  ['2026-08-03', 181.5],
  ['2026-08-10', 180.0],
  ['2026-08-17', 179.0],
  ['2026-08-24', 178.0],
]
const LEAN_BULK = [
  ['2026-08-31', 178.3],
  ['2026-09-07', 178.6],
  ['2026-09-14', 178.9],
  ['2026-09-21', 179.2],
  ['2026-09-28', 179.5],
  ['2026-10-05', 179.8],
  ['2026-10-12', 180.1],
  ['2026-10-19', 180.4],
  ['2026-10-26', 180.7],
  ['2026-11-02', 181.0],
  ['2026-11-09', 181.3],
  ['2026-11-16', 181.6],
  ['2026-11-23', 181.9],
  ['2026-11-30', 182.2],
  ['2026-12-07', 182.5],
  ['2026-12-14', 182.8],
  ['2026-12-21', 183.1],
  ['2026-12-28', 183.4],
  ['2027-01-04', 183.7],
  ['2027-01-11', 184.0],
  ['2027-01-18', 184.3],
  ['2027-01-25', 184.6],
  ['2027-02-01', 184.8],
  ['2027-02-08', 185.0],
  ['2027-02-15', 185.0],
  ['2027-02-22', 185.0],
]
const COMP_CUT = [
  ['2027-03-01', 184.1],
  ['2027-03-08', 183.2],
  ['2027-03-15', 182.3],
  ['2027-03-22', 181.4],
  ['2027-03-29', 180.5],
  ['2027-04-05', 179.6],
  ['2027-04-12', 178.7],
  ['2027-04-19', 177.8],
  ['2027-04-26', 176.9],
  ['2027-05-03', 176.0],
  ['2027-05-10', 175.1],
  ['2027-05-17', 174.2],
  ['2027-05-24', 173.3],
  ['2027-05-31', 172.4],
  ['2027-06-07', 171.5],
  ['2027-06-14', 170.6],
  ['2027-06-21', 169.7],
  ['2027-06-28', 168.8],
  ['2027-07-05', 167.9],
  ['2027-07-12', 167.0],
  ['2027-07-19', 166.1],
  ['2027-07-26', 165.2],
  ['2027-08-02', 164.3],
  ['2027-08-09', 163.4],
  ['2027-08-16', 162.0],
]

// Ordered list of every prep-cycle week: { date, target, phaseKey }.
export const WEIGHT_PLAN = [
  ...MINI_CUT.map(([date, target]) => ({ date, target, phaseKey: 'mini' })),
  ...LEAN_BULK.map(([date, target]) => ({ date, target, phaseKey: 'bulk' })),
  ...COMP_CUT.map(([date, target]) => ({ date, target, phaseKey: 'cut' })),
]

// Default weightTargets object keyed by Monday date string.
export function buildDefaultWeightTargets() {
  const out = {}
  for (const { date, target } of WEIGHT_PLAN) out[date] = target
  return out
}
