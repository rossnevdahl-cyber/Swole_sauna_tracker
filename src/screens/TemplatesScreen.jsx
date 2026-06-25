import { useState } from 'react'
import { useStore } from '../context/StoreContext.jsx'
import { MUSCLE_GROUPS } from '../lib/storage.js'
import MovementLibraryModal from '../components/MovementLibraryModal.jsx'
import { ConfirmModal } from '../components/Modal.jsx'
import {
  PlusIcon,
  ChevronRightIcon,
  ChevronLeftIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  TrashIcon,
} from '../components/icons.jsx'

export default function TemplatesScreen({ goTo }) {
  const { templates, movements, createTemplate } = useStore()
  const [editingId, setEditingId] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)

  if (editingId) {
    return <TemplateEditor templateId={editingId} onBack={() => setEditingId(null)} goTo={goTo} />
  }

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
      <div className="flex items-center justify-between mb-6">
        <h1 className="heading text-4xl">Templates</h1>
        <button
          className="btn-accent px-4 h-12"
          onClick={() => {
            const t = createTemplate('New Template')
            setEditingId(t.id)
          }}
        >
          <PlusIcon width={18} height={18} />
          <span className="ml-1">New</span>
        </button>
      </div>

      {templates.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-muted mb-4">No templates yet.</p>
          <p className="text-sm text-muted mb-6">
            Templates let you start a workout with all your movements pre-loaded.
          </p>
          <button
            className="btn-accent"
            onClick={() => {
              const t = createTemplate('New Template')
              setEditingId(t.id)
            }}
          >
            <PlusIcon width={18} height={18} />
            <span className="ml-2">Create First Template</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {templates.map((t) => (
            <div key={t.id} className="card flex items-center justify-between">
              <button className="flex-1 text-left min-w-0" onClick={() => setEditingId(t.id)}>
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
              </button>
              <div className="flex items-center gap-1 shrink-0 ml-2">
                <button
                  className="w-10 h-10 flex items-center justify-center text-muted active:text-danger"
                  onClick={() => setConfirmDelete(t)}
                  aria-label="Delete template"
                >
                  <TrashIcon width={18} height={18} />
                </button>
                <button
                  className="w-10 h-10 flex items-center justify-center text-muted active:text-ink"
                  onClick={() => setEditingId(t.id)}
                  aria-label="Edit template"
                >
                  <ChevronRightIcon />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <DeleteTemplateConfirm template={confirmDelete} onClose={() => setConfirmDelete(null)} />
    </div>
  )
}

function DeleteTemplateConfirm({ template, onClose }) {
  const { deleteTemplate } = useStore()
  return (
    <ConfirmModal
      open={!!template}
      onClose={onClose}
      title="Delete Template?"
      message={template ? `"${template.name}" will be permanently deleted.` : ''}
      confirmLabel="Delete"
      danger
      onConfirm={() => template && deleteTemplate(template.id)}
    />
  )
}

function TemplateEditor({ templateId, onBack, goTo }) {
  const {
    templates,
    movements,
    updateTemplate,
    startWorkoutFromTemplate,
  } = useStore()
  const template = templates.find((t) => t.id === templateId)
  const [showLibrary, setShowLibrary] = useState(false)
  const [editIndex, setEditIndex] = useState(null)

  if (!template) {
    onBack()
    return null
  }

  function movementName(id) {
    return movements.find((m) => m.id === id)?.name || 'Unknown'
  }
  function movementGroup(id) {
    return movements.find((m) => m.id === id)?.muscleGroup || ''
  }

  function addMovement(m) {
    updateTemplate(template.id, {
      movements: [
        ...template.movements,
        {
          movementId: m.id,
          targetSets: null,
          targetReps: '',
          restSeconds: m.defaultRestSeconds ?? 90,
        },
      ],
    })
  }

  function patchMovement(index, patch) {
    updateTemplate(template.id, {
      movements: template.movements.map((tm, i) => (i === index ? { ...tm, ...patch } : tm)),
    })
  }

  function removeMovement(index) {
    updateTemplate(template.id, {
      movements: template.movements.filter((_, i) => i !== index),
    })
    setEditIndex(null)
  }

  function move(index, dir) {
    const arr = [...template.movements]
    const j = index + dir
    if (j < 0 || j >= arr.length) return
    ;[arr[index], arr[j]] = [arr[j], arr[index]]
    updateTemplate(template.id, { movements: arr })
  }

  return (
    <div className="px-4 pt-6">
      <div className="flex items-center gap-2 mb-4">
        <button
          className="w-10 h-10 -ml-2 flex items-center justify-center text-muted active:text-ink"
          onClick={onBack}
          aria-label="Back"
        >
          <ChevronLeftIcon />
        </button>
        <span className="text-xs uppercase tracking-widest text-muted">Edit Template</span>
      </div>

      <input
        className="w-full bg-transparent heading text-3xl text-ink focus:outline-none border-b-2 border-surface2 focus:border-accent pb-1 mb-4"
        value={template.name}
        onChange={(e) => updateTemplate(template.id, { name: e.target.value })}
        placeholder="Template name"
      />

      <button
        className="btn-accent w-full mb-6"
        onClick={() => {
          startWorkoutFromTemplate(template)
          goTo?.('home')
        }}
        disabled={template.movements.length === 0}
      >
        Start Workout
      </button>

      <h2 className="heading text-xl mb-3">Movements</h2>

      {template.movements.length === 0 ? (
        <div className="card text-center py-8 mb-4">
          <p className="text-muted mb-4">No movements in this template.</p>
          <button className="btn-accent" onClick={() => setShowLibrary(true)}>
            <PlusIcon width={18} height={18} />
            <span className="ml-2">Add Movement</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3 mb-4">
          {template.movements.map((tm, i) => (
            <div key={i} className="card p-0">
              <div className="flex items-center">
                <button
                  className="flex-1 text-left p-4 min-w-0"
                  onClick={() => setEditIndex(editIndex === i ? null : i)}
                >
                  <div className="flex items-center gap-2">
                    <span className="pill">{movementGroup(tm.movementId)}</span>
                  </div>
                  <div className="font-display font-bold uppercase text-xl leading-tight mt-1 truncate">
                    {movementName(tm.movementId)}
                  </div>
                  <div className="text-xs text-muted mt-1">
                    {tm.targetSets || '–'} × {tm.targetReps || '–'} · {tm.restSeconds}s rest
                  </div>
                </button>
                <div className="flex flex-col items-center pr-2">
                  <button
                    className="w-8 h-7 flex items-center justify-center text-muted active:text-ink disabled:opacity-20"
                    onClick={() => move(i, -1)}
                    disabled={i === 0}
                    aria-label="Move up"
                  >
                    <ChevronUpIcon width={18} height={18} />
                  </button>
                  <button
                    className="w-8 h-7 flex items-center justify-center text-muted active:text-ink disabled:opacity-20"
                    onClick={() => move(i, 1)}
                    disabled={i === template.movements.length - 1}
                    aria-label="Move down"
                  >
                    <ChevronDownIcon width={18} height={18} />
                  </button>
                </div>
              </div>

              {editIndex === i && (
                <div className="border-t border-surface2 p-4 grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] uppercase tracking-wide text-muted">Sets</label>
                    <input
                      type="number"
                      inputMode="numeric"
                      className="num-input w-full h-11 mt-1"
                      value={tm.targetSets ?? ''}
                      onChange={(e) =>
                        patchMovement(i, { targetSets: e.target.value === '' ? null : Number(e.target.value) })
                      }
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-wide text-muted">Reps</label>
                    <input
                      className="num-input w-full h-11 mt-1"
                      value={tm.targetReps ?? ''}
                      onChange={(e) => patchMovement(i, { targetReps: e.target.value })}
                      placeholder="8-12"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-wide text-muted">Rest (s)</label>
                    <input
                      type="number"
                      inputMode="numeric"
                      className="num-input w-full h-11 mt-1"
                      value={tm.restSeconds ?? ''}
                      onChange={(e) => patchMovement(i, { restSeconds: Number(e.target.value) || 0 })}
                    />
                  </div>
                  <button
                    className="col-span-3 btn-ghost text-danger mt-1"
                    onClick={() => removeMovement(i)}
                  >
                    <TrashIcon width={16} height={16} />
                    <span className="ml-2">Remove Movement</span>
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {template.movements.length > 0 && (
        <button className="btn-ghost w-full mb-8" onClick={() => setShowLibrary(true)}>
          <PlusIcon width={18} height={18} />
          <span className="ml-2">Add Movement</span>
        </button>
      )}

      <MovementLibraryModal
        open={showLibrary}
        onClose={() => setShowLibrary(false)}
        onSelect={addMovement}
        title="Add Movement"
      />
    </div>
  )
}
