import { createContext, useContext, useEffect, useRef, useState } from 'react'
import {
  KEYS,
  DEFAULT_TARGETS,
  DEFAULT_SETTINGS,
  SEED_MOVEMENTS,
  MUSCLE_GROUPS,
  buildDefaultWeightTargets,
  uuid,
  load,
  save,
  remove,
} from '../lib/storage.js'

const StoreContext = createContext(null)

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}

function firstRunSeed() {
  // Seed movements with ids the first time the app runs.
  return SEED_MOVEMENTS.map((m) => ({ id: uuid(), ...m }))
}

export function StoreProvider({ children }) {
  const [movements, setMovements] = useState(() => {
    const existing = load(KEYS.movements, null)
    if (existing) return existing
    const seeded = firstRunSeed()
    save(KEYS.movements, seeded)
    return seeded
  })
  const [templates, setTemplates] = useState(() => load(KEYS.templates, []))
  const [workouts, setWorkouts] = useState(() => load(KEYS.workouts, []))
  const [hypertrophyTargets, setHypertrophyTargets] = useState(() => {
    const existing = load(KEYS.hypertrophyTargets, null)
    return existing || DEFAULT_TARGETS
  })
  const [settings, setSettings] = useState(() => ({
    ...DEFAULT_SETTINGS,
    ...load(KEYS.settings, {}),
  }))
  const [activeWorkout, setActiveWorkout] = useState(() => load(KEYS.activeWorkout, null))
  const [weeklyWeighIns, setWeeklyWeighIns] = useState(() => load(KEYS.weeklyWeighIns, {}))
  const [weightTargets, setWeightTargets] = useState(() => {
    const existing = load(KEYS.weightTargets, null)
    return existing || buildDefaultWeightTargets()
  })
  const [weeklyNutritionCompliance, setWeeklyNutritionCompliance] = useState(() =>
    load(KEYS.weeklyNutritionCompliance, {})
  )

  // Persist on change.
  useEffect(() => save(KEYS.movements, movements), [movements])
  useEffect(() => save(KEYS.templates, templates), [templates])
  useEffect(() => save(KEYS.workouts, workouts), [workouts])
  useEffect(() => save(KEYS.hypertrophyTargets, hypertrophyTargets), [hypertrophyTargets])
  useEffect(() => save(KEYS.settings, settings), [settings])
  useEffect(() => {
    if (activeWorkout) save(KEYS.activeWorkout, activeWorkout)
    else remove(KEYS.activeWorkout)
  }, [activeWorkout])
  useEffect(() => save(KEYS.weeklyWeighIns, weeklyWeighIns), [weeklyWeighIns])
  useEffect(() => save(KEYS.weightTargets, weightTargets), [weightTargets])
  useEffect(
    () => save(KEYS.weeklyNutritionCompliance, weeklyNutritionCompliance),
    [weeklyNutritionCompliance]
  )

  // ---------- Movements ----------
  function createMovement({ name, muscleGroup, defaultRestSeconds }) {
    const mv = {
      id: uuid(),
      name: name.trim(),
      muscleGroup,
      defaultRestSeconds: Number(defaultRestSeconds) || 90,
    }
    setMovements((prev) => [...prev, mv])
    return mv
  }

  function updateMovement(id, patch) {
    setMovements((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m)))
  }

  function deleteMovement(id) {
    setMovements((prev) => prev.filter((m) => m.id !== id))
    // Remove from templates as well.
    setTemplates((prev) =>
      prev.map((t) => ({ ...t, movements: t.movements.filter((m) => m.movementId !== id) }))
    )
  }

  // ---------- Templates ----------
  function createTemplate(name = 'New Template') {
    const t = { id: uuid(), name, movements: [] }
    setTemplates((prev) => [...prev, t])
    return t
  }

  function updateTemplate(id, patch) {
    setTemplates((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)))
  }

  function deleteTemplate(id) {
    setTemplates((prev) => prev.filter((t) => t.id !== id))
  }

  // ---------- Active workout ----------
  function buildLiveMovement(movement, opts = {}) {
    return {
      movementId: movement.id,
      movementName: movement.name,
      muscleGroup: movement.muscleGroup,
      restSeconds: opts.restSeconds ?? movement.defaultRestSeconds ?? 90,
      sets: [],
    }
  }

  function startWorkoutFromTemplate(template) {
    const liveMovements = template.movements
      .map((tm) => {
        const mv = movements.find((m) => m.id === tm.movementId)
        if (!mv) return null
        return {
          movementId: mv.id,
          movementName: mv.name,
          muscleGroup: mv.muscleGroup,
          restSeconds: tm.restSeconds ?? mv.defaultRestSeconds ?? 90,
          sets: [],
        }
      })
      .filter(Boolean)
    const w = {
      id: uuid(),
      startTime: new Date().toISOString(),
      templateId: template.id,
      templateName: template.name,
      notes: '',
      movements: liveMovements,
    }
    setActiveWorkout(w)
    return w
  }

  function startScratchWorkout() {
    const w = {
      id: uuid(),
      startTime: new Date().toISOString(),
      templateId: null,
      templateName: null,
      notes: '',
      movements: [],
    }
    setActiveWorkout(w)
    return w
  }

  function repeatWorkout(workout) {
    const liveMovements = workout.movements.map((mv) => ({
      movementId: mv.movementId,
      movementName: mv.movementName,
      muscleGroup: mv.muscleGroup,
      restSeconds: mv.restSeconds ?? 90,
      sets: [],
    }))
    const w = {
      id: uuid(),
      startTime: new Date().toISOString(),
      templateId: workout.templateId ?? null,
      templateName: workout.templateName ?? null,
      notes: '',
      movements: liveMovements,
    }
    setActiveWorkout(w)
    return w
  }

  function patchActiveWorkout(patch) {
    setActiveWorkout((prev) => (prev ? { ...prev, ...patch } : prev))
  }

  function patchLiveMovement(index, patch) {
    setActiveWorkout((prev) => {
      if (!prev) return prev
      const movements = prev.movements.map((m, i) => (i === index ? { ...m, ...patch } : m))
      return { ...prev, movements }
    })
  }

  function addMovementToActive(movement, opts) {
    setActiveWorkout((prev) => {
      if (!prev) return prev
      return { ...prev, movements: [...prev.movements, buildLiveMovement(movement, opts)] }
    })
  }

  function removeMovementFromActive(index) {
    setActiveWorkout((prev) => {
      if (!prev) return prev
      return { ...prev, movements: prev.movements.filter((_, i) => i !== index) }
    })
  }

  function moveLiveMovement(index, dir) {
    setActiveWorkout((prev) => {
      if (!prev) return prev
      const arr = [...prev.movements]
      const j = index + dir
      if (j < 0 || j >= arr.length) return prev
      ;[arr[index], arr[j]] = [arr[j], arr[index]]
      return { ...prev, movements: arr }
    })
  }

  function addSet(movementIndex, set) {
    setActiveWorkout((prev) => {
      if (!prev) return prev
      const movements = prev.movements.map((m, i) => {
        if (i !== movementIndex) return m
        const setNumber = m.sets.length + 1
        const newSet = {
          setNumber,
          weight: set?.weight ?? '',
          reps: set?.reps ?? '',
          unit: 'lbs',
          done: false,
        }
        return { ...m, sets: [...m.sets, newSet] }
      })
      return { ...prev, movements }
    })
  }

  function updateSet(movementIndex, setIndex, patch) {
    setActiveWorkout((prev) => {
      if (!prev) return prev
      const movements = prev.movements.map((m, i) => {
        if (i !== movementIndex) return m
        const sets = m.sets.map((s, si) => (si === setIndex ? { ...s, ...patch } : s))
        return { ...m, sets }
      })
      return { ...prev, movements }
    })
  }

  function deleteSet(movementIndex, setIndex) {
    setActiveWorkout((prev) => {
      if (!prev) return prev
      const movements = prev.movements.map((m, i) => {
        if (i !== movementIndex) return m
        const sets = m.sets
          .filter((_, si) => si !== setIndex)
          .map((s, idx) => ({ ...s, setNumber: idx + 1 }))
        return { ...m, sets }
      })
      return { ...prev, movements }
    })
  }

  function finishWorkout() {
    setActiveWorkout((prev) => {
      if (!prev) return null
      // Drop unfinished/empty sets that have no weight & reps; keep logged ones.
      const cleaned = {
        ...prev,
        date: prev.startTime,
        endTime: new Date().toISOString(),
        movements: prev.movements.map((m) => ({
          movementId: m.movementId,
          movementName: m.movementName,
          muscleGroup: m.muscleGroup,
          restSeconds: m.restSeconds,
          sets: m.sets
            .filter((s) => s.weight !== '' || s.reps !== '')
            .map((s) => ({
              setNumber: s.setNumber,
              weight: Number(s.weight) || 0,
              reps: Number(s.reps) || 0,
              unit: 'lbs',
            })),
        })),
      }
      setWorkouts((w) => [cleaned, ...w])
      return null
    })
  }

  function discardWorkout() {
    setActiveWorkout(null)
  }

  // ---------- History ----------
  function updateWorkout(id, patch) {
    setWorkouts((prev) => prev.map((w) => (w.id === id ? { ...w, ...patch } : w)))
  }

  function deleteWorkout(id) {
    setWorkouts((prev) => prev.filter((w) => w.id !== id))
  }

  // ---------- Settings ----------
  function updateSettings(patch) {
    setSettings((prev) => ({ ...prev, ...patch }))
  }

  function updateTarget(group, patch) {
    setHypertrophyTargets((prev) => ({
      ...prev,
      [group]: { ...prev[group], ...patch },
    }))
  }

  // ---------- Weight Trend ----------
  function setWeighIn(dateStr, value) {
    const n = Number(value)
    setWeeklyWeighIns((prev) => {
      if (value === '' || value === null || value === undefined || Number.isNaN(n)) {
        // Clearing a weigh-in removes the key entirely.
        if (!(dateStr in prev)) return prev
        const next = { ...prev }
        delete next[dateStr]
        return next
      }
      return { ...prev, [dateStr]: n }
    })
  }

  function setWeightTarget(dateStr, value) {
    const n = Number(value)
    if (value === '' || value === null || value === undefined || Number.isNaN(n)) return
    setWeightTargets((prev) => ({ ...prev, [dateStr]: n }))
  }

  function resetWeightTargets() {
    setWeightTargets(buildDefaultWeightTargets())
  }

  // field is 'calorieDays' or 'proteinDays'. Empty clears just that field; when
  // both fields are cleared the week's entry is removed entirely.
  function setNutritionDays(dateStr, field, value) {
    setWeeklyNutritionCompliance((prev) => {
      const entry = { ...(prev[dateStr] || {}) }
      if (value === '' || value === null || value === undefined) {
        delete entry[field]
      } else {
        let n = Math.round(Number(value))
        if (Number.isNaN(n)) return prev
        entry[field] = Math.max(0, Math.min(7, n))
      }
      const next = { ...prev }
      if (entry.calorieDays == null && entry.proteinDays == null) delete next[dateStr]
      else next[dateStr] = entry
      return next
    })
  }

  // ---------- Data management ----------
  function exportData() {
    return {
      _app: 'swole-sauna-tracker',
      _version: 1,
      _exportedAt: new Date().toISOString(),
      unit: 'lbs',
      movements,
      templates,
      workouts,
      hypertrophyTargets,
      settings,
    }
  }

  function importData(data) {
    if (!data || data._app !== 'swole-sauna-tracker') {
      throw new Error('Not a valid Swole Sauna Tracker export file.')
    }
    if (Array.isArray(data.movements)) setMovements(data.movements)
    if (Array.isArray(data.templates)) setTemplates(data.templates)
    if (Array.isArray(data.workouts)) setWorkouts(data.workouts)
    if (data.hypertrophyTargets) setHypertrophyTargets(data.hypertrophyTargets)
    if (data.settings) setSettings({ ...DEFAULT_SETTINGS, ...data.settings })
  }

  function clearAllData() {
    setMovements([])
    setTemplates([])
    setWorkouts([])
    setHypertrophyTargets(DEFAULT_TARGETS)
    setSettings(DEFAULT_SETTINGS)
    setActiveWorkout(null)
  }

  const value = {
    // state
    movements,
    templates,
    workouts,
    hypertrophyTargets,
    settings,
    activeWorkout,
    weeklyWeighIns,
    weightTargets,
    weeklyNutritionCompliance,
    muscleGroups: MUSCLE_GROUPS,
    // movements
    createMovement,
    updateMovement,
    deleteMovement,
    // templates
    createTemplate,
    updateTemplate,
    deleteTemplate,
    // active workout
    startWorkoutFromTemplate,
    startScratchWorkout,
    repeatWorkout,
    patchActiveWorkout,
    patchLiveMovement,
    addMovementToActive,
    removeMovementFromActive,
    moveLiveMovement,
    addSet,
    updateSet,
    deleteSet,
    finishWorkout,
    discardWorkout,
    // history
    updateWorkout,
    deleteWorkout,
    // settings
    updateSettings,
    updateTarget,
    // weight trend
    setWeighIn,
    setWeightTarget,
    resetWeightTargets,
    setNutritionDays,
    // data
    exportData,
    importData,
    clearAllData,
  }

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}
