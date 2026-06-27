import { useEffect, useRef, useState } from 'react'
import { useStore } from '../context/StoreContext.jsx'
import {
  fmtClock,
  lastSessionForMovement,
  lbsToDisplay,
  displayToLbs,
  unitLabel,
  workoutSetCount,
} from '../lib/utils.js'
import MovementLibraryModal from '../components/MovementLibraryModal.jsx'
import RestTimerBanner from '../components/RestTimerBanner.jsx'
import { ConfirmModal } from '../components/Modal.jsx'
import {
  PlusIcon,
  CheckIcon,
  DotsIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  TrashIcon,
} from '../components/icons.jsx'

export default function ActiveWorkoutScreen({ goTo }) {
  const {
    activeWorkout,
    workouts,
    settings,
    addMovementToActive,
    removeMovementFromActive,
    moveLiveMovement,
    patchLiveMovement,
    addSet,
    updateSet,
    deleteSet,
    finishWorkout,
    discardWorkout,
  } = useStore()

  const [elapsed, setElapsed] = useState(0)
  const [showLibrary, setShowLibrary] = useState(false)
  const [timer, setTimer] = useState(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [confirmFinish, setConfirmFinish] = useState(false)
  const [confirmEmpty, setConfirmEmpty] = useState(false)
  const [confirmDiscard, setConfirmDiscard] = useState(false)

  useEffect(() => {
    if (!activeWorkout) return
    const update = () => setElapsed((Date.now() - new Date(activeWorkout.startTime)) / 1000)
    update()
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [activeWorkout])

  if (!activeWorkout) return null

  const unit = settings.weightUnit
  const totalSets = workoutSetCount(activeWorkout)

  function handleCompleteSet(mi, si, movement) {
    updateSet(mi, si, { done: true })
    setTimer({
      movementName: movement.movementName,
      duration: movement.restSeconds || 90,
      startedAt: Date.now(),
    })
  }

  function attemptFinish() {
    setMenuOpen(false)
    if (totalSets === 0) {
      setConfirmEmpty(true)
    } else {
      setConfirmFinish(true)
    }
  }

  function doFinish() {
    finishWorkout()
    goTo?.('history')
  }

  return (
    <div className="px-4 pt-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-1">
        <div className="min-w-0">
          <div className="text-[11px] uppercase tracking-widest text-accent font-semibold">
            Active Workout
          </div>
          <h1 className="heading text-3xl leading-none mt-0.5 truncate">
            {activeWorkout.templateName || 'Custom Workout'}
          </h1>
        </div>
        <div className="relative shrink-0 ml-2">
          <button
            className="w-10 h-10 flex items-center justify-center text-muted active:text-ink"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Menu"
          >
            <DotsIcon />
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-11 z-20 bg-surface2 border border-surface min-w-[160px]">
                <button
                  className="w-full text-left px-4 py-3 text-danger font-semibold uppercase text-sm tracking-wide active:bg-surface"
                  onClick={() => {
                    setMenuOpen(false)
                    setConfirmDiscard(true)
                  }}
                >
                  Discard Workout
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between mb-5">
        <div className="font-display font-bold text-2xl tabular-nums text-accent">
          {fmtClock(elapsed)}
        </div>
        <button className="btn-accent px-5 h-12" onClick={attemptFinish}>
          Finish
        </button>
      </div>

      {/* Movements */}
      {activeWorkout.movements.length === 0 ? (
        <div className="card text-center py-10 mb-4">
          <p className="text-muted mb-4">No movements yet. Add your first one.</p>
          <button className="btn-accent" onClick={() => setShowLibrary(true)}>
            <PlusIcon width={18} height={18} />
            <span className="ml-2">Add Movement</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4 mb-4">
          {activeWorkout.movements.map((mv, mi) => (
            <MovementCard
              key={mi}
              mv={mv}
              mi={mi}
              unit={unit}
              isFirst={mi === 0}
              isLast={mi === activeWorkout.movements.length - 1}
              last={lastSessionForMovement(workouts, mv.movementId)}
              onAddSet={() => {
                // Prefill from last set in this movement for speed.
                const lastSet = mv.sets[mv.sets.length - 1]
                addSet(mi, lastSet ? { weight: lastSet.weight, reps: lastSet.reps } : undefined)
              }}
              onUpdateSet={(si, patch) => updateSet(mi, si, patch)}
              onCompleteSet={(si) => handleCompleteSet(mi, si, mv)}
              onDeleteSet={(si) => deleteSet(mi, si)}
              onPatchMovement={(patch) => patchLiveMovement(mi, patch)}
              onRemove={() => removeMovementFromActive(mi)}
              onMoveUp={() => moveLiveMovement(mi, -1)}
              onMoveDown={() => moveLiveMovement(mi, 1)}
            />
          ))}
        </div>
      )}

      {activeWorkout.movements.length > 0 && (
        <button className="btn-ghost w-full mb-2" onClick={() => setShowLibrary(true)}>
          <PlusIcon width={18} height={18} />
          <span className="ml-2">Add Movement</span>
        </button>
      )}

      <div className="h-24" />

      <MovementLibraryModal
        open={showLibrary}
        onClose={() => setShowLibrary(false)}
        onSelect={(m) => addMovementToActive(m)}
        title="Add Movement"
      />

      <RestTimerBanner timer={timer} onSkip={() => setTimer(null)} />

      <ConfirmModal
        open={confirmFinish}
        onClose={() => setConfirmFinish(false)}
        title="Finish Workout?"
        message={`${fmtClock(elapsed)} elapsed · ${totalSets} set${totalSets === 1 ? '' : 's'} logged. This will save to your history.`}
        confirmLabel="Finish & Save"
        onConfirm={doFinish}
      />
      <ConfirmModal
        open={confirmEmpty}
        onClose={() => setConfirmEmpty(false)}
        title="No Sets Logged"
        message="You haven't logged any sets. Save anyway?"
        confirmLabel="Save Anyway"
        onConfirm={doFinish}
      />
      <ConfirmModal
        open={confirmDiscard}
        onClose={() => setConfirmDiscard(false)}
        title="Discard Workout?"
        message="This permanently deletes the current workout. This cannot be undone."
        confirmLabel="Discard"
        danger
        onConfirm={() => {
          discardWorkout()
          goTo?.('home')
        }}
      />
    </div>
  )
}

function MovementCard({
  mv,
  unit,
  isFirst,
  isLast,
  last,
  onAddSet,
  onUpdateSet,
  onCompleteSet,
  onDeleteSet,
  onPatchMovement,
  onRemove,
  onMoveUp,
  onMoveDown,
}) {
  const [editingRest, setEditingRest] = useState(false)

  const lastLabel = last
    ? `Last: ${last.movement.sets.length}×${mostCommonReps(last.movement.sets)} @ ${lbsToDisplay(
        topWeight(last.movement.sets),
        unit
      )} ${unitLabel(unit)}`
    : 'First time'

  return (
    <div className="card p-0">
      {/* Movement header */}
      <div className="p-4 pb-3 border-b border-surface2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="pill">{mv.muscleGroup}</span>
            </div>
            <h3 className="font-display font-bold uppercase text-2xl leading-tight mt-1">
              {mv.movementName}
            </h3>
          </div>
          <div className="flex flex-col items-center shrink-0">
            <button
              className="w-8 h-7 flex items-center justify-center text-muted active:text-ink disabled:opacity-20"
              onClick={onMoveUp}
              disabled={isFirst}
              aria-label="Move up"
            >
              <ChevronUpIcon width={18} height={18} />
            </button>
            <button
              className="w-8 h-7 flex items-center justify-center text-muted active:text-ink disabled:opacity-20"
              onClick={onMoveDown}
              disabled={isLast}
              aria-label="Move down"
            >
              <ChevronDownIcon width={18} height={18} />
            </button>
          </div>
        </div>

        <div className="text-xs text-accent/90 mt-2 font-medium">{lastLabel}</div>

        <div className="flex items-center gap-4 mt-2 text-xs">
          {/* Rest */}
          {editingRest ? (
            <input
              type="number"
              inputMode="numeric"
              autoFocus
              className="num-input w-20 h-8 text-sm"
              value={mv.restSeconds}
              onChange={(e) => onPatchMovement({ restSeconds: Number(e.target.value) || 0 })}
              onBlur={() => setEditingRest(false)}
            />
          ) : (
            <button className="text-muted active:text-ink" onClick={() => setEditingRest(true)}>
              Rest: <span className="text-ink font-semibold">{mv.restSeconds}s</span>
            </button>
          )}

          <button className="ml-auto text-danger/80 active:text-danger" onClick={onRemove}>
            Remove
          </button>
        </div>
      </div>

      {/* Sets */}
      <div>
        {mv.sets.length > 0 && (
          <div className="flex items-center px-4 py-1.5 text-[10px] uppercase tracking-wide text-muted">
            <span className="w-10">Set</span>
            <span className="flex-1 text-center">{unitLabel(unit)}</span>
            <span className="flex-1 text-center">Reps</span>
            <span className="w-12 text-center">Done</span>
            <span className="w-8" />
          </div>
        )}
        {mv.sets.map((s, si) => (
          <SetRow
            key={si}
            set={s}
            unit={unit}
            onUpdate={(patch) => onUpdateSet(si, patch)}
            onComplete={() => onCompleteSet(si)}
            onDelete={() => onDeleteSet(si)}
          />
        ))}
        <button
          className="w-full flex items-center justify-center gap-2 py-3 text-accent font-display font-bold uppercase tracking-wide active:bg-surface2"
          onClick={onAddSet}
        >
          <PlusIcon width={18} height={18} />
          Add Set
        </button>
      </div>
    </div>
  )
}

function SetRow({ set, unit, onUpdate, onComplete, onDelete }) {
  const [flash, setFlash] = useState(false)
  const weightDisplay = set.weight === '' ? '' : lbsToDisplay(set.weight, unit)
  const [weightStr, setWeightStr] = useState(weightDisplay === '' ? '' : String(weightDisplay))

  // Keep local input synced if unit changes externally.
  const lastUnit = useRef(unit)
  useEffect(() => {
    if (lastUnit.current !== unit) {
      lastUnit.current = unit
      const d = set.weight === '' ? '' : lbsToDisplay(set.weight, unit)
      setWeightStr(d === '' ? '' : String(d))
    }
  }, [unit, set.weight])

  function commitWeight(v) {
    setWeightStr(v)
    const lbs = v === '' ? '' : displayToLbs(v, unit)
    onUpdate({ weight: lbs })
  }

  function handleComplete() {
    setFlash(true)
    setTimeout(() => setFlash(false), 600)
    onComplete()
  }

  return (
    <div
      className={`flex items-center px-4 py-2 border-t border-surface2/60 ${
        flash ? 'flash-accent' : ''
      } ${set.done ? 'bg-surface2/40' : ''}`}
    >
      <span className="w-10 font-display font-bold text-lg text-muted tabular-nums">
        {set.setNumber}
      </span>
      <div className="flex-1 px-1">
        <input
          type="number"
          inputMode="decimal"
          className="num-input w-full h-11 text-lg"
          placeholder="–"
          value={weightStr}
          onChange={(e) => commitWeight(e.target.value)}
          onFocus={(e) => e.target.select()}
        />
      </div>
      <div className="flex-1 px-1">
        <input
          type="number"
          inputMode="numeric"
          className="num-input w-full h-11 text-lg"
          placeholder="–"
          value={set.reps}
          onChange={(e) => onUpdate({ reps: e.target.value === '' ? '' : Number(e.target.value) })}
          onFocus={(e) => e.target.select()}
        />
      </div>
      <div className="w-12 flex justify-center">
        <button
          onClick={handleComplete}
          className={`w-10 h-10 flex items-center justify-center border-2 ${
            set.done ? 'bg-accent border-accent text-black' : 'border-surface2 text-muted active:border-accent'
          }`}
          aria-label="Complete set"
        >
          <CheckIcon width={20} height={20} />
        </button>
      </div>
      <div className="w-8 flex justify-center">
        <button
          onClick={onDelete}
          className="w-8 h-10 flex items-center justify-center text-muted/60 active:text-danger"
          aria-label="Delete set"
        >
          <TrashIcon width={16} height={16} />
        </button>
      </div>
    </div>
  )
}

// Helpers for "last session" summary.
function topWeight(sets) {
  return sets.reduce((max, s) => Math.max(max, Number(s.weight) || 0), 0)
}
function mostCommonReps(sets) {
  const counts = {}
  for (const s of sets) {
    const r = Number(s.reps) || 0
    counts[r] = (counts[r] || 0) + 1
  }
  let best = 0
  let bestN = -1
  for (const [r, n] of Object.entries(counts)) {
    if (n > bestN) {
      bestN = n
      best = r
    }
  }
  return best
}
