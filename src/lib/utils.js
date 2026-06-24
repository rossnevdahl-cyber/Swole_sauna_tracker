const LBS_PER_KG = 2.2046226218

// All weights are stored internally in lbs. These helpers convert for display/input.
export function lbsToDisplay(lbs, unit) {
  if (lbs === '' || lbs === null || lbs === undefined) return ''
  const n = Number(lbs)
  if (Number.isNaN(n)) return ''
  if (unit === 'kg') return Math.round((n / LBS_PER_KG) * 10) / 10
  return Math.round(n * 10) / 10
}

export function displayToLbs(value, unit) {
  if (value === '' || value === null || value === undefined) return ''
  const n = Number(value)
  if (Number.isNaN(n)) return ''
  if (unit === 'kg') return Math.round(n * LBS_PER_KG * 10) / 10
  return n
}

export function unitLabel(unit) {
  return unit === 'kg' ? 'kg' : 'lbs'
}

// ---- Dates ----
export function startOfWeek(date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  const day = d.getDay() // 0 = Sun
  const diff = day === 0 ? -6 : 1 - day // shift to Monday
  d.setDate(d.getDate() + diff)
  return d
}

export function endOfWeek(date) {
  const s = startOfWeek(date)
  const e = new Date(s)
  e.setDate(e.getDate() + 6)
  e.setHours(23, 59, 59, 999)
  return e
}

export function addWeeks(date, n) {
  const d = new Date(date)
  d.setDate(d.getDate() + n * 7)
  return d
}

export function isSameWeek(a, b) {
  return startOfWeek(a).getTime() === startOfWeek(b).getTime()
}

const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export function fmtDate(iso) {
  const d = new Date(iso)
  return `${DOW[d.getDay()]} ${MON[d.getMonth()]} ${d.getDate()}`
}

export function fmtDateFull(iso) {
  const d = new Date(iso)
  return `${DOW[d.getDay()]}, ${MON[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`
}

export function fmtShortDate(iso) {
  const d = new Date(iso)
  return `${MON[d.getMonth()]} ${d.getDate()}`
}

export function fmtWeekRange(date) {
  const s = startOfWeek(date)
  const e = endOfWeek(date)
  return `${MON[s.getMonth()]} ${s.getDate()} – ${MON[e.getMonth()]} ${e.getDate()}`
}

export function fmtClock(totalSeconds) {
  const s = Math.max(0, Math.floor(totalSeconds))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  return `${m}:${String(sec).padStart(2, '0')}`
}

export function fmtDuration(ms) {
  const totalMin = Math.round(ms / 60000)
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

// ---- Workout calcs ----
// Volume = sum(weight * reps) across all logged sets (weight in lbs).
export function workoutVolume(workout) {
  let v = 0
  for (const mv of workout.movements || []) {
    for (const s of mv.sets || []) {
      const w = Number(s.weight) || 0
      const r = Number(s.reps) || 0
      v += w * r
    }
  }
  return v
}

export function workoutSetCount(workout) {
  let c = 0
  for (const mv of workout.movements || []) {
    c += (mv.sets || []).length
  }
  return c
}

export function workoutMuscleGroups(workout) {
  const set = new Set()
  for (const mv of workout.movements || []) {
    if (mv.muscleGroup) set.add(mv.muscleGroup)
  }
  return Array.from(set)
}

export function workoutDurationMs(workout) {
  if (workout.startTime && workout.endTime) {
    return new Date(workout.endTime) - new Date(workout.startTime)
  }
  return 0
}

// Most recent past workout (excluding a given id) that contains the movement.
export function lastSessionForMovement(workouts, movementId, excludeId = null) {
  const sorted = [...workouts]
    .filter((w) => w.id !== excludeId)
    .sort((a, b) => new Date(b.date) - new Date(a.date))
  for (const w of sorted) {
    const mv = (w.movements || []).find((m) => m.movementId === movementId)
    if (mv && mv.sets && mv.sets.length > 0) {
      return { workout: w, movement: mv }
    }
  }
  return null
}

export function fmtNum(n) {
  return new Intl.NumberFormat().format(Math.round(n))
}
