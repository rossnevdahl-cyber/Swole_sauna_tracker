import { useMemo, useState } from 'react'
import { useStore } from '../context/StoreContext.jsx'
import { MUSCLE_GROUPS } from '../lib/storage.js'
import {
  fmtDate,
  fmtDateFull,
  fmtDuration,
  fmtNum,
  workoutVolume,
  workoutSetCount,
  workoutMuscleGroups,
  workoutDurationMs,
  lbsToDisplay,
  unitLabel,
} from '../lib/utils.js'
import { ConfirmModal } from '../components/Modal.jsx'
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  RepeatIcon,
  TrashIcon,
  SearchIcon,
} from '../components/icons.jsx'

export default function HistoryScreen({ goTo }) {
  const { workouts, settings } = useStore()
  const [detailId, setDetailId] = useState(null)
  const [query, setQuery] = useState('')
  const [groupFilter, setGroupFilter] = useState('All')
  const [sort, setSort] = useState('date')
  const [showFilters, setShowFilters] = useState(false)

  const unit = settings.weightUnit

  const filtered = useMemo(() => {
    let list = [...workouts]
    const q = query.trim().toLowerCase()
    if (q) {
      list = list.filter((w) => {
        const inName = (w.templateName || 'custom').toLowerCase().includes(q)
        const inMovement = (w.movements || []).some((m) =>
          m.movementName.toLowerCase().includes(q)
        )
        return inName || inMovement
      })
    }
    if (groupFilter !== 'All') {
      list = list.filter((w) => workoutMuscleGroups(w).includes(groupFilter))
    }
    list.sort((a, b) => {
      if (sort === 'volume') return workoutVolume(b) - workoutVolume(a)
      if (sort === 'duration') return workoutDurationMs(b) - workoutDurationMs(a)
      return new Date(b.date) - new Date(a.date)
    })
    return list
  }, [workouts, query, groupFilter, sort])

  if (detailId) {
    return (
      <WorkoutDetail
        workoutId={detailId}
        onBack={() => setDetailId(null)}
        goTo={goTo}
        unit={unit}
      />
    )
  }

  return (
    <div className="px-4 pt-8">
      <h1 className="heading text-4xl mb-4">History</h1>

      <div className="relative mb-3">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted">
          <SearchIcon width={18} height={18} />
        </span>
        <input
          className="w-full bg-surface2 pl-10 pr-3 h-11 text-ink focus:outline-none focus:ring-2 focus:ring-accent"
          placeholder="Search by template or movement"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className="flex items-center gap-2 mb-3">
        <select
          className="bg-surface2 h-10 px-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent"
          value={sort}
          onChange={(e) => setSort(e.target.value)}
        >
          <option value="date">Sort: Date</option>
          <option value="volume">Sort: Volume</option>
          <option value="duration">Sort: Duration</option>
        </select>
        <button
          className={`h-10 px-3 text-sm font-semibold uppercase tracking-wide ${
            showFilters || groupFilter !== 'All' ? 'bg-accent text-black' : 'bg-surface2 text-muted'
          }`}
          onClick={() => setShowFilters((s) => !s)}
        >
          {groupFilter === 'All' ? 'Filter' : groupFilter}
        </button>
      </div>

      {showFilters && (
        <div className="flex flex-wrap gap-2 mb-4">
          {['All', ...MUSCLE_GROUPS].map((g) => (
            <button
              key={g}
              onClick={() => setGroupFilter(g)}
              className={`px-3 h-8 text-xs font-semibold uppercase tracking-wide ${
                groupFilter === g ? 'bg-accent text-black' : 'bg-surface2 text-muted'
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      )}

      {workouts.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-muted mb-4">No workouts logged yet.</p>
          <button className="btn-accent" onClick={() => goTo('home')}>
            Start Your First Workout
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-10 text-muted">No workouts match your filters.</div>
      ) : (
        <div className="space-y-3">
          {filtered.map((w) => (
            <button
              key={w.id}
              onClick={() => setDetailId(w.id)}
              className="card w-full text-left active:bg-surface2"
            >
              <div className="flex items-center justify-between">
                <div className="font-display font-bold uppercase text-xl leading-tight">
                  {fmtDate(w.date)}
                </div>
                <ChevronRightIcon className="text-muted" />
              </div>
              <div className="text-sm text-ink/80 mt-0.5">
                {w.templateName || 'Custom Workout'}
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted mt-2">
                <span>{fmtDuration(workoutDurationMs(w))}</span>
                <span>{workoutSetCount(w)} sets</span>
                <span className="text-accent font-semibold">
                  {fmtNum(lbsToDisplay(workoutVolume(w), unit))} {unitLabel(unit)} vol
                </span>
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {workoutMuscleGroups(w).map((g) => (
                  <span key={g} className="pill">
                    {g}
                  </span>
                ))}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function WorkoutDetail({ workoutId, onBack, goTo, unit }) {
  const { workouts, updateWorkout, deleteWorkout, repeatWorkout, activeWorkout } = useStore()
  const w = workouts.find((x) => x.id === workoutId)
  const [notes, setNotes] = useState(w?.notes || '')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [confirmRepeat, setConfirmRepeat] = useState(false)

  if (!w) {
    onBack()
    return null
  }

  function doRepeat() {
    repeatWorkout(w)
    goTo?.('home')
  }

  return (
    <div className="px-4 pt-6">
      <div className="flex items-center justify-between mb-4">
        <button
          className="w-10 h-10 -ml-2 flex items-center justify-center text-muted active:text-ink"
          onClick={onBack}
          aria-label="Back"
        >
          <ChevronLeftIcon />
        </button>
        <button
          className="w-10 h-10 flex items-center justify-center text-muted active:text-danger"
          onClick={() => setConfirmDelete(true)}
          aria-label="Delete workout"
        >
          <TrashIcon width={18} height={18} />
        </button>
      </div>

      <h1 className="heading text-3xl leading-none">{fmtDateFull(w.date)}</h1>
      <div className="text-sm text-ink/70 mt-1">{w.templateName || 'Custom Workout'}</div>

      <div className="grid grid-cols-3 gap-2 my-5">
        <Stat label="Duration" value={fmtDuration(workoutDurationMs(w))} />
        <Stat label="Sets" value={workoutSetCount(w)} />
        <Stat
          label={`Volume (${unitLabel(unit)})`}
          value={fmtNum(lbsToDisplay(workoutVolume(w), unit))}
          accent
        />
      </div>

      <button
        className="btn-accent w-full mb-6"
        onClick={() => (activeWorkout ? null : setConfirmRepeat(true))}
        disabled={!!activeWorkout}
      >
        <RepeatIcon width={18} height={18} />
        <span className="ml-2">{activeWorkout ? 'Workout In Progress' : 'Repeat This Workout'}</span>
      </button>

      <div className="space-y-3 mb-6">
        {w.movements.map((mv, i) => (
          <div key={i} className="card p-0">
            <div className="p-4 pb-2">
              <span className="pill">{mv.muscleGroup}</span>
              <h3 className="font-display font-bold uppercase text-xl leading-tight mt-1">
                {mv.movementName}
              </h3>
            </div>
            <div className="px-4 pb-3">
              {mv.sets.length === 0 ? (
                <div className="text-xs text-muted py-2">No sets logged.</div>
              ) : (
                <div>
                  <div className="flex text-[10px] uppercase tracking-wide text-muted pb-1">
                    <span className="w-10">Set</span>
                    <span className="flex-1">{unitLabel(unit)}</span>
                    <span className="flex-1">Reps</span>
                  </div>
                  {mv.sets.map((s) => (
                    <div key={s.setNumber} className="flex py-1 border-t border-surface2/60">
                      <span className="w-10 font-display font-bold text-muted tabular-nums">
                        {s.setNumber}
                      </span>
                      <span className="flex-1 font-display font-semibold tabular-nums">
                        {lbsToDisplay(s.weight, unit)}
                      </span>
                      <span className="flex-1 font-display font-semibold tabular-nums">{s.reps}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mb-10">
        <label className="text-xs uppercase tracking-wide text-muted">Notes</label>
        <textarea
          className="w-full mt-1 bg-surface2 p-3 text-ink focus:outline-none focus:ring-2 focus:ring-accent min-h-[90px] resize-none"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={() => updateWorkout(w.id, { notes })}
          placeholder="How did it feel? Pumps, energy, sleep…"
        />
      </div>

      <ConfirmModal
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Delete Workout?"
        message="This workout will be permanently removed from your history."
        confirmLabel="Delete"
        danger
        onConfirm={() => {
          deleteWorkout(w.id)
          onBack()
        }}
      />
      <ConfirmModal
        open={confirmRepeat}
        onClose={() => setConfirmRepeat(false)}
        title="Repeat Workout?"
        message="Starts a new active workout with the same movements, but blank set logs."
        confirmLabel="Start"
        onConfirm={doRepeat}
      />
    </div>
  )
}

function Stat({ label, value, accent }) {
  return (
    <div className="bg-surface2 p-3 text-center">
      <div className={`font-display font-bold text-2xl leading-none ${accent ? 'text-accent' : ''}`}>
        {value}
      </div>
      <div className="text-[10px] uppercase tracking-wide text-muted mt-1">{label}</div>
    </div>
  )
}
