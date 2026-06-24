import { useMemo } from 'react'
import { useStore } from '../context/StoreContext.jsx'
import { MUSCLE_GROUPS } from '../lib/storage.js'
import { PlusIcon, ChevronRightIcon } from '../components/icons.jsx'

export default function HomeScreen({ goTo }) {
  const { templates, movements, startWorkoutFromTemplate, startScratchWorkout } = useStore()

  const today = useMemo(() => {
    const d = new Date()
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    return days[d.getDay()]
  }, [])

  function muscleGroupsFor(template) {
    const groups = new Set()
    for (const tm of template.movements) {
      const mv = movements.find((m) => m.id === tm.movementId)
      if (mv) groups.add(mv.muscleGroup)
    }
    return MUSCLE_GROUPS.filter((g) => groups.has(g))
  }

  return (
    <div className="px-4 pt-8">
      <header className="mb-6">
        <div className="text-xs uppercase tracking-widest text-muted">{today}</div>
        <h1 className="heading text-4xl text-accent leading-none mt-1">Swole Sauna</h1>
        <div className="heading text-2xl text-ink/90 leading-none">Tracker</div>
      </header>

      <button className="btn-accent w-full text-xl h-16 mb-3" onClick={startScratchWorkout}>
        Start Workout
      </button>
      <p className="text-center text-xs text-muted mb-8">Begins a blank "Custom Workout"</p>

      <div className="flex items-center justify-between mb-3">
        <h2 className="heading text-xl">Quick Start</h2>
        <button
          className="text-xs uppercase tracking-wide text-accent font-semibold"
          onClick={() => goTo('templates')}
        >
          Manage
        </button>
      </div>

      {templates.length === 0 ? (
        <div className="card text-center py-8">
          <p className="text-muted mb-4">No templates yet. Build one to start workouts fast.</p>
          <button className="btn-accent" onClick={() => goTo('templates')}>
            <PlusIcon width={18} height={18} />
            <span className="ml-2">New Template</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {templates.map((t) => (
            <button
              key={t.id}
              onClick={() => startWorkoutFromTemplate(t)}
              className="card w-full flex items-center justify-between active:bg-surface2 text-left"
            >
              <div className="min-w-0">
                <div className="font-display font-bold uppercase text-xl leading-tight truncate">
                  {t.name}
                </div>
                <div className="text-xs text-muted mt-0.5">
                  {t.movements.length} movement{t.movements.length === 1 ? '' : 's'}
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {muscleGroupsFor(t).map((g) => (
                    <span key={g} className="pill">
                      {g}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0 ml-3">
                <span className="text-[10px] uppercase tracking-wide text-accent font-bold">
                  Start
                </span>
                <ChevronRightIcon className="text-accent" />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
