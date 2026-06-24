import { useEffect, useState } from 'react'
import { useStore } from '../context/StoreContext.jsx'
import { fmtClock } from '../lib/utils.js'
import { HomeIcon, TemplatesIcon, HistoryIcon, AnalyticsIcon, SettingsIcon } from './icons.jsx'

const TABS = [
  { id: 'home', label: 'Home', Icon: HomeIcon },
  { id: 'templates', label: 'Templates', Icon: TemplatesIcon },
  { id: 'history', label: 'History', Icon: HistoryIcon },
  { id: 'analytics', label: 'Analytics', Icon: AnalyticsIcon },
  { id: 'settings', label: 'Settings', Icon: SettingsIcon },
]

export default function BottomNav({ tab, setTab }) {
  const { activeWorkout } = useStore()
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    if (!activeWorkout) return
    const update = () => setElapsed((Date.now() - new Date(activeWorkout.startTime)) / 1000)
    update()
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [activeWorkout])

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-surface border-t border-surface2 safe-bottom">
      <div className="flex">
        {TABS.map(({ id, label, Icon }) => {
          const active = tab === id
          const showBadge = id === 'home' && activeWorkout
          return (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`relative flex-1 flex flex-col items-center justify-center gap-0.5 h-16 ${
                active ? 'text-accent' : 'text-muted'
              }`}
            >
              <Icon width={22} height={22} />
              <span className="text-[10px] font-semibold uppercase tracking-wide">{label}</span>
              {showBadge && (
                <span className="absolute top-1 right-1/2 translate-x-[26px] bg-accent text-black text-[9px] font-display font-bold px-1 tabular-nums">
                  {fmtClock(elapsed)}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
