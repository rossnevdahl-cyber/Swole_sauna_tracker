import { useRef, useState } from 'react'
import { useStore } from '../context/StoreContext.jsx'
import { MUSCLE_GROUPS } from '../lib/storage.js'
import Modal, { ConfirmModal } from '../components/Modal.jsx'
import { PlusIcon, TrashIcon, ChevronRightIcon } from '../components/icons.jsx'

export default function SettingsScreen() {
  const {
    settings,
    updateSettings,
    hypertrophyTargets,
    updateTarget,
    exportData,
    importData,
    clearAllData,
  } = useStore()

  const [showMovements, setShowMovements] = useState(false)
  const [confirmClear, setConfirmClear] = useState(false)
  const [clearText, setClearText] = useState('')
  const [importMsg, setImportMsg] = useState(null)
  const fileRef = useRef(null)

  function handleExport() {
    const data = exportData()
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    const stamp = new Date().toISOString().slice(0, 10)
    a.href = url
    a.download = `swole-sauna-backup-${stamp}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  function handleImportFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result)
        importData(data)
        setImportMsg({ ok: true, text: 'Data imported successfully.' })
      } catch (err) {
        setImportMsg({ ok: false, text: err.message || 'Import failed.' })
      }
      if (fileRef.current) fileRef.current.value = ''
    }
    reader.readAsText(file)
  }

  return (
    <div className="px-4 pt-8 pb-8">
      <h1 className="heading text-4xl mb-6">Settings</h1>

      {/* Weight unit */}
      <Section title="Weight Unit">
        <div className="flex bg-surface2 p-1">
          {['lbs', 'kg'].map((u) => (
            <button
              key={u}
              onClick={() => updateSettings({ weightUnit: u })}
              className={`flex-1 h-11 font-display font-bold uppercase tracking-wide ${
                settings.weightUnit === u ? 'bg-accent text-black' : 'text-muted'
              }`}
            >
              {u}
            </button>
          ))}
        </div>
        <p className="text-xs text-muted mt-2">
          Weights are stored in lbs and converted for display. Exports use raw lbs.
        </p>
      </Section>

      {/* Hypertrophy targets */}
      <Section title="Weekly Set Targets">
        <div className="card p-0 overflow-hidden">
          <div className="flex text-[10px] uppercase tracking-wide text-muted px-3 py-2 bg-surface2">
            <span className="flex-1">Muscle</span>
            <span className="w-20 text-center">Min</span>
            <span className="w-20 text-center">Max</span>
          </div>
          {MUSCLE_GROUPS.map((g) => {
            const t = hypertrophyTargets[g] || { min: 0, max: 0 }
            return (
              <div key={g} className="flex items-center px-3 py-2 border-t border-surface2/60">
                <span className="flex-1 font-display font-semibold uppercase text-sm">{g}</span>
                <div className="w-20 px-1">
                  <input
                    type="number"
                    inputMode="numeric"
                    className="num-input w-full h-10"
                    value={t.min}
                    onChange={(e) => updateTarget(g, { min: Number(e.target.value) || 0 })}
                  />
                </div>
                <div className="w-20 px-1">
                  <input
                    type="number"
                    inputMode="numeric"
                    className="num-input w-full h-10"
                    value={t.max}
                    onChange={(e) => updateTarget(g, { max: Number(e.target.value) || 0 })}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </Section>

      {/* Movement library */}
      <Section title="Movement Library">
        <button
          className="card w-full flex items-center justify-between active:bg-surface2"
          onClick={() => setShowMovements(true)}
        >
          <span className="font-display font-semibold uppercase">Manage Movements</span>
          <ChevronRightIcon className="text-muted" />
        </button>
      </Section>

      {/* Data */}
      <Section title="Data">
        <div className="space-y-3">
          <button className="btn-ghost w-full" onClick={handleExport}>
            Export Data
          </button>
          <button className="btn-ghost w-full" onClick={() => fileRef.current?.click()}>
            Import Data
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={handleImportFile}
          />
          {importMsg && (
            <p className={`text-xs ${importMsg.ok ? 'text-accent' : 'text-danger'}`}>
              {importMsg.text}
            </p>
          )}
          <button className="btn-danger w-full" onClick={() => setConfirmClear(true)}>
            Clear All Data
          </button>
        </div>
      </Section>

      <p className="text-center text-xs text-muted mt-8">
        Swole Sauna Tracker · Data stored locally on this device
      </p>

      <MovementManagerModal open={showMovements} onClose={() => setShowMovements(false)} />

      {/* Clear all with typed confirmation */}
      {confirmClear && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
          <div
            className="absolute inset-0 bg-black/70"
            onClick={() => {
              setConfirmClear(false)
              setClearText('')
            }}
          />
          <div className="relative w-full max-w-sm bg-surface border border-danger p-5 slide-up">
            <h3 className="heading text-xl text-danger mb-2">Clear All Data</h3>
            <p className="text-sm text-ink/80 mb-4">
              This deletes ALL movements, templates, workouts, and settings permanently. Type{' '}
              <span className="font-bold text-danger">DELETE</span> to confirm.
            </p>
            <input
              autoFocus
              className="w-full bg-surface2 px-3 h-12 text-ink focus:outline-none focus:ring-2 focus:ring-danger mb-4"
              value={clearText}
              onChange={(e) => setClearText(e.target.value)}
              placeholder="DELETE"
            />
            <div className="flex gap-3">
              <button
                className="btn-ghost flex-1"
                onClick={() => {
                  setConfirmClear(false)
                  setClearText('')
                }}
              >
                Cancel
              </button>
              <button
                className="btn-danger flex-1 disabled:opacity-40"
                disabled={clearText !== 'DELETE'}
                onClick={() => {
                  clearAllData()
                  setConfirmClear(false)
                  setClearText('')
                }}
              >
                Delete Everything
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div className="mb-7">
      <h2 className="heading text-lg text-muted mb-2">{title}</h2>
      {children}
    </div>
  )
}

function MovementManagerModal({ open, onClose }) {
  const { movements, muscleGroups, createMovement, updateMovement, deleteMovement, workouts, templates } =
    useStore()
  const [editId, setEditId] = useState(null)
  const [creating, setCreating] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(null)

  const [form, setForm] = useState({ name: '', muscleGroup: muscleGroups[0], defaultRestSeconds: 90 })

  function startCreate() {
    setForm({ name: '', muscleGroup: muscleGroups[0], defaultRestSeconds: 90 })
    setCreating(true)
    setEditId(null)
  }

  function startEdit(m) {
    setForm({ name: m.name, muscleGroup: m.muscleGroup, defaultRestSeconds: m.defaultRestSeconds })
    setEditId(m.id)
    setCreating(false)
  }

  function save() {
    if (!form.name.trim()) return
    if (creating) {
      createMovement(form)
    } else if (editId) {
      updateMovement(editId, {
        name: form.name.trim(),
        muscleGroup: form.muscleGroup,
        defaultRestSeconds: Number(form.defaultRestSeconds) || 90,
      })
    }
    setCreating(false)
    setEditId(null)
  }

  function usageCount(id) {
    let n = 0
    for (const w of workouts) if (w.movements.some((m) => m.movementId === id)) n++
    return n
  }

  const showForm = creating || editId

  return (
    <Modal open={open} onClose={onClose} title="Movements" fullHeight>
      {showForm ? (
        <div className="p-4 space-y-4">
          <div>
            <label className="text-xs uppercase tracking-wide text-muted">Name</label>
            <input
              autoFocus
              className="w-full mt-1 bg-surface2 px-3 h-12 text-ink focus:outline-none focus:ring-2 focus:ring-accent"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-wide text-muted">Muscle Group</label>
            <select
              className="w-full mt-1 bg-surface2 px-3 h-12 text-ink focus:outline-none focus:ring-2 focus:ring-accent"
              value={form.muscleGroup}
              onChange={(e) => setForm((f) => ({ ...f, muscleGroup: e.target.value }))}
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
              value={form.defaultRestSeconds}
              onChange={(e) => setForm((f) => ({ ...f, defaultRestSeconds: e.target.value }))}
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              className="btn-ghost flex-1"
              onClick={() => {
                setCreating(false)
                setEditId(null)
              }}
            >
              Cancel
            </button>
            <button className="btn-accent flex-1" onClick={save} disabled={!form.name.trim()}>
              Save
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col h-full">
          <div className="p-3 border-b border-surface2">
            <button className="btn-accent w-full" onClick={startCreate}>
              <PlusIcon width={20} height={20} />
              <span className="ml-2">New Movement</span>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto no-scrollbar">
            {movements.length === 0 ? (
              <div className="p-8 text-center text-muted">No movements yet.</div>
            ) : (
              [...movements]
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between px-4 py-3 border-b border-surface2"
                  >
                    <button className="flex-1 text-left min-w-0" onClick={() => startEdit(m)}>
                      <div className="font-display font-semibold uppercase text-lg leading-tight">
                        {m.name}
                      </div>
                      <div className="text-xs text-muted">
                        {m.muscleGroup} · {m.defaultRestSeconds}s
                      </div>
                    </button>
                    <button
                      className="w-10 h-10 flex items-center justify-center text-muted active:text-danger"
                      onClick={() => setConfirmDelete(m)}
                      aria-label="Delete movement"
                    >
                      <TrashIcon width={18} height={18} />
                    </button>
                  </div>
                ))
            )}
          </div>
        </div>
      )}

      <ConfirmModal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Delete Movement?"
        message={
          confirmDelete
            ? `"${confirmDelete.name}" will be removed from the library and any templates. Past workout history is preserved.${
                usageCount(confirmDelete.id) > 0
                  ? ` Used in ${usageCount(confirmDelete.id)} past workout(s).`
                  : ''
              }`
            : ''
        }
        confirmLabel="Delete"
        danger
        onConfirm={() => confirmDelete && deleteMovement(confirmDelete.id)}
      />
    </Modal>
  )
}
