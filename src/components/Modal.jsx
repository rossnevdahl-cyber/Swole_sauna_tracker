import { useEffect } from 'react'
import { XIcon } from './icons.jsx'

export default function Modal({ open, onClose, title, children, fullHeight = false }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose?.()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div
        className={`relative w-full sm:max-w-md bg-bg border-t border-surface2 sm:border slide-up flex flex-col ${
          fullHeight ? 'h-[90vh]' : 'max-h-[90vh]'
        }`}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-surface2 shrink-0">
          <h2 className="heading text-xl">{title}</h2>
          <button
            onClick={onClose}
            className="w-10 h-10 -mr-2 flex items-center justify-center text-muted active:text-ink"
            aria-label="Close"
          >
            <XIcon />
          </button>
        </div>
        <div className="overflow-y-auto no-scrollbar flex-1 safe-bottom">{children}</div>
      </div>
    </div>
  )
}

export function ConfirmModal({ open, onClose, title, message, confirmLabel = 'Confirm', danger = false, onConfirm }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-surface border border-surface2 p-5 slide-up">
        <h3 className="heading text-xl mb-2">{title}</h3>
        {message && <div className="text-sm text-ink/80 mb-5">{message}</div>}
        <div className="flex gap-3">
          <button className="btn-ghost flex-1" onClick={onClose}>
            Cancel
          </button>
          <button
            className={`flex-1 ${danger ? 'btn-danger' : 'btn-accent'}`}
            onClick={() => {
              onConfirm?.()
              onClose?.()
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
