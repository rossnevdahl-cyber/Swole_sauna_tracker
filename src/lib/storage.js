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
  weeklyNutritionCompliance: 'weeklyNutritionCompliance',
  // Phase-driven target plan.
  weightPhases: 'weightPhases',
  planStartWeight: 'planStartWeight',
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

// Show date for the prep cycle (vertical marker on the chart).
export const SHOW_DAY = '2027-08-21'

// The starting body weight the target curve grows from. The first week of the
// earliest phase equals this; every later week compounds from it.
export const DEFAULT_PLAN_START_WEIGHT = 187.5

// Prep-cycle phases. Each phase spans a Monday (YYYY-MM-DD) start/end range and
// carries a `weeklyPct` — the per-week body-weight change applied while inside
// that phase (negative = weekly loss, positive = weekly gain). `color` is the
// label/line color; `band` is the chart background tint derived from it.
export const DEFAULT_WEIGHT_PHASES = [
  {
    id: 'mini',
    label: 'Mini Cut',
    color: '#FF3B30',
    start: '2026-07-06',
    end: '2026-08-24',
    weeklyPct: -0.75,
  },
  {
    id: 'bulk',
    label: 'Lean Bulk',
    color: '#3B82F6',
    start: '2026-08-31',
    end: '2027-02-22',
    weeklyPct: 0.15,
  },
  {
    id: 'cut',
    label: 'Comp Cut',
    color: '#FB923C',
    start: '2027-03-01',
    end: '2027-08-16',
    weeklyPct: -0.53,
  },
]

// Palette for auto-coloring newly added phases (cycles once exhausted).
export const PHASE_COLORS = [
  '#FF3B30',
  '#3B82F6',
  '#FB923C',
  '#22C55E',
  '#A855F7',
  '#EAB308',
  '#14B8A6',
  '#EC4899',
]

// Derive the faint chart band tint (rgba, alpha 0.08) from a phase color.
export function bandFromColor(hex) {
  const m = /^#?([0-9a-f]{6})$/i.exec(String(hex || '').trim())
  if (!m) return 'rgba(200, 255, 0, 0.08)'
  const int = parseInt(m[1], 16)
  const r = (int >> 16) & 255
  const g = (int >> 8) & 255
  const b = int & 255
  return `rgba(${r}, ${g}, ${b}, 0.08)`
}

// Local-midnight parse / format for 'YYYY-MM-DD' strings (avoids UTC drift).
// Duplicated from utils.js so storage stays dependency-free.
function ymdToDate(s) {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}
function dateToYmd(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}
// Snap a Date to the Monday that starts its week.
function mondayOf(date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  const day = d.getDay() // 0 = Sun
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day))
  return d
}

// Compute the ordered target-weight plan from a start weight + phase list.
// Walks every Monday covered by the phases in chronological order; the first
// week equals `planStartWeight` and each subsequent week compounds by the
// weekly percentage of the phase that contains it. Returns
// `[{ date, target, phaseKey }]` — the same shape the chart/table consume.
export function computeWeightPlan(planStartWeight, phases) {
  const valid = (phases || [])
    .filter((p) => p && p.start && p.end)
    .sort((a, b) => a.start.localeCompare(b.start))

  // Ordered, de-duplicated list of { date, phase } — one entry per week.
  const seen = new Set()
  const seq = []
  for (const p of valid) {
    const last = mondayOf(ymdToDate(p.end))
    const cur = mondayOf(ymdToDate(p.start))
    while (cur <= last) {
      const ymd = dateToYmd(cur)
      if (!seen.has(ymd)) {
        seen.add(ymd)
        seq.push({ date: ymd, phase: p })
      }
      cur.setDate(cur.getDate() + 7)
    }
  }

  const base = Number(planStartWeight)
  let prev = Number.isFinite(base) ? base : 0
  return seq.map((w, i) => {
    const pct = Number(w.phase.weeklyPct) || 0
    const raw = i === 0 ? prev : prev * (1 + pct / 100)
    prev = raw
    return { date: w.date, target: Math.round(raw * 10) / 10, phaseKey: w.phase.id }
  })
}
