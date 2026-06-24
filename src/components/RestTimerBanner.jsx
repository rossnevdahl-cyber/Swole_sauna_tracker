import { useEffect, useRef, useState } from 'react'
import { fmtClock } from '../lib/utils.js'

function beep() {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext
    if (!Ctx) return
    const ctx = new Ctx()
    const now = ctx.currentTime
    // Two short beeps.
    ;[0, 0.25].forEach((t) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.value = 880
      gain.gain.setValueAtTime(0.0001, now + t)
      gain.gain.exponentialRampToValueAtTime(0.4, now + t + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + t + 0.18)
      osc.connect(gain).connect(ctx.destination)
      osc.start(now + t)
      osc.stop(now + t + 0.2)
    })
    setTimeout(() => ctx.close(), 800)
  } catch (e) {
    /* audio not available */
  }
}

export default function RestTimerBanner({ timer, onSkip }) {
  // timer: { movementName, duration, startedAt } | null
  const [remaining, setRemaining] = useState(timer?.duration ?? 0)
  const beeped = useRef(false)

  useEffect(() => {
    if (!timer) return
    beeped.current = false
    function tick() {
      const elapsed = (Date.now() - timer.startedAt) / 1000
      const rem = Math.max(0, timer.duration - elapsed)
      setRemaining(rem)
      if (rem <= 0 && !beeped.current) {
        beeped.current = true
        beep()
        setTimeout(() => onSkip?.(), 700)
      }
    }
    tick()
    const id = setInterval(tick, 100)
    return () => clearInterval(id)
  }, [timer, onSkip])

  if (!timer) return null

  const pct = timer.duration > 0 ? remaining / timer.duration : 0
  const R = 26
  const C = 2 * Math.PI * R
  const dash = C * pct

  return (
    <div className="fixed left-0 right-0 bottom-[64px] z-40 px-3 safe-bottom pointer-events-none">
      <div className="pointer-events-auto bg-surface border border-accent slide-up flex items-center gap-3 p-3 shadow-xl">
        <div className="relative w-16 h-16 shrink-0">
          <svg viewBox="0 0 64 64" className="w-16 h-16 -rotate-90">
            <circle cx="32" cy="32" r={R} fill="none" stroke="#242424" strokeWidth="6" />
            <circle
              cx="32"
              cy="32"
              r={R}
              fill="none"
              stroke="#C8FF00"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={C}
              strokeDashoffset={C - dash}
              style={{ transition: 'stroke-dashoffset 0.1s linear' }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="font-display font-bold tabular-nums text-sm text-accent">
              {fmtClock(remaining)}
            </span>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[11px] uppercase tracking-wide text-muted">Resting</div>
          <div className="font-display font-semibold uppercase text-lg leading-tight truncate">
            {timer.movementName}
          </div>
        </div>
        <button className="btn-ghost px-5 self-stretch" onClick={onSkip}>
          Skip
        </button>
      </div>
    </div>
  )
}
