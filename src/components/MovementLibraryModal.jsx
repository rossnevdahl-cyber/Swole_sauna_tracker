import { useMemo, useState } from 'react'
import Modal from './Modal.jsx'
import { useStore } from '../context/StoreContext.jsx'
import { PlusIcon, SearchIcon, ChevronRightIcon } from './icons.jsx'

// Reusable movement picker. onSelect(movement) is called when a movement is chosen.
export default function MovementLibraryModal({ open, onClose, onSelect, title = 'Movement Library' }) {
  const { movements, muscleGroups, createMovement } = useStore()
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('All')
  const [creating, setCreating] = useState(false)

  const [newName, setNewName] = useState('')
  const [newGroup, setNewGroup] = useState(muscleGroups[0])
  const [newRest, setNewRest] = useState(90)

  const filtered = useMemo(() => {
    return movements
      .filter((m) => (filter === 'All' ? true : m.muscleGroup === filter))
      .filter((m) => m.name.toLowerCase().includes(query.trim().toLowerCase()))
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [movements, filter, query])

  function reset() {
    setQuery('')
    setFilter('All')
    setCreating(false)
    setNewName('')
    setNewGroup(muscleGroups[0])
    setNewRest(90)
  }

  function handleClose() {
    reset()
    onClose?.()
  }

  function handleCreate() {
    if (!newName.trim()) return
    const mv = createMovement({ name: newName, muscleGroup: newGroup, defaultRestSeconds: newRest })
    onSelect?.(mv)
    handleClose()
  }

  return (
    <Modal open={open} onClose={handleClose} title={title} fullHeight>
      {creating ? (
        <div className="p-4 space-y-4">
          <div>
            <label className="text-xs uppercase tracking-wide text-muted">Name</label>
            <input
              autoFocus
              className="w-full mt-1 bg-surface2 px-3 h-12 text-ink focus:outline-none focus:ring-2 focus:ring-accent"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Incline DB Press"
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-wide text-muted">Muscle Group</label>
            <select
              className="w-full mt-1 bg-surface2 px-3 h-12 text-ink focus:outline-none focus:ring-2 focus:ring-accent"
              value={newGroup}
              onChange={(e) => setNewGroup(e.target.value)}
            >
              {muscleGroups.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs uppercase tracking-wide text-muted">Default Rest (seconds)</label>
            <input
              type="number"
              inputMode="numeric"
              className="w-full mt-1 bg-surface2 px-3 h-12 text-ink focus:outline-none focus:ring-2 focus:ring-accent"
              value={newRest}
              onChange={(e) => setNewRest(e.target.value)}
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button className="btn-ghost flex-1" onClick={() => setCreating(false)}>
              Back
            </button>
            <button className="btn-accent flex-1" onClick={handleCreate} disabled={!newName.trim()}>
              Create
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col h-full">
          <div className="p-3 space-y-3 border-b border-surface2">
            <button
              className="btn-accent w-full"
              onClick={() => setCreating(true)}
            >
              <PlusIcon width={20} height={20} />
              <span className="ml-2">Create New Movement</span>
            </button>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted">
                <SearchIcon width={18} height={18} />
              </span>
              <input
                className="w-full bg-surface2 pl-10 pr-3 h-11 text-ink focus:outline-none focus:ring-2 focus:ring-accent"
                placeholder="Search movements"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-1 px-1">
              {['All', ...muscleGroups].map((g) => (
                <button
                  key={g}
                  onClick={() => setFilter(g)}
                  className={`px-3 h-8 text-xs font-semibold uppercase tracking-wide whitespace-nowrap ${
                    filter === g ? 'bg-accent text-black' : 'bg-surface2 text-muted'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto no-scrollbar">
            {filtered.length === 0 ? (
              <div className="p-8 text-center text-muted">
                <p className="mb-4">No movements found.</p>
                <button className="btn-accent" onClick={() => setCreating(true)}>
                  <PlusIcon width={18} height={18} />
                  <span className="ml-2">Create one</span>
                </button>
              </div>
            ) : (
              filtered.map((m) => (
                <button
                  key={m.id}
                  onClick={() => {
                    onSelect?.(m)
                    handleClose()
                  }}
                  className="w-full flex items-center justify-between px-4 py-3 border-b border-surface2 active:bg-surface text-left"
                >
                  <div>
                    <div className="font-display font-semibold uppercase text-lg leading-tight">
                      {m.name}
                    </div>
                    <div className="text-xs text-muted mt-0.5">
                      {m.muscleGroup} · {m.defaultRestSeconds}s rest
                    </div>
                  </div>
                  <ChevronRightIcon width={20} height={20} className="text-muted" />
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </Modal>
  )
}
