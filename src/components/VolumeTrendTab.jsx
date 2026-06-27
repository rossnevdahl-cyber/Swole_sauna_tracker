import { useMemo } from 'react'
import { useStore } from '../context/StoreContext.jsx'
import { MUSCLE_GROUPS } from '../lib/storage.js'
import { startOfWeek, endOfWeek } from '../lib/utils.js'

// Fixed prep-cycle boundaries (Monday weeks, local timezone).
const PREP_START = new Date(2026, 6, 5) // Mon Jul 5, 2026
const PREP_END = new Date(2027, 7, 21) // week of Mon Aug 17, 2027 (contains Aug 21, 2027)

// Abbreviated column headers for mobile width.
const GROUP_ABBR = {
  Chest: 'Chest',
  Back: 'Back',
  Shoulders: 'Shldrs',
  Biceps: 'Bis',
  Triceps: 'Tris',
  Legs: 'Legs',
  Glutes: 'Glutes',
  Core: 'Core',
  Calves: 'Calves',
}

const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function fmtWeekLabel(d) {
  return `${DOW[d.getDay()]} ${MON[d.getMonth()]} ${d.getDate()}`
}

export default function VolumeTrendTab() {
  const { workouts, hypertrophyTargets } = useStore()

  // Reverse-chronological list of week start dates across the prep cycle.
  const weeks = useMemo(() => {
    const first = startOfWeek(PREP_START)
    const last = startOfWeek(PREP_END)
    const list = []
    const cur = new Date(last)
    while (cur >= first) {
      list.push(new Date(cur))
      cur.setDate(cur.getDate() - 7)
    }
    return list
  }, [])

  // Set counts keyed by `weekStartMs_muscleGroup`, computed once per workouts change.
  const counts = useMemo(() => {
    const map = {}
    for (const week of weeks) {
      const start = startOfWeek(week)
      const end = endOfWeek(week)
      const startMs = start.getTime()
      for (const w of workouts) {
        const d = new Date(w.date)
        if (d < start || d > end) continue
        for (const mv of w.movements || []) {
          const n = (mv.sets || []).length
          if (n === 0) continue
          const key = `${startMs}_${mv.muscleGroup}`
          map[key] = (map[key] || 0) + n
        }
      }
    }
    return map
  }, [workouts, weeks])

  const now = new Date()

  return (
    <div className="overflow-x-auto bg-surface" style={{ border: '1px solid #2A2A2A' }}>
      <table className="border-collapse" style={{ borderSpacing: 0 }}>
        <thead>
          <tr>
            <th
              className="sticky top-0 left-0 z-20 bg-surface w-20 px-1 py-2 text-left font-display font-bold uppercase text-[11px] text-ink"
              style={{ border: '1px solid #2A2A2A' }}
            >
              Week
            </th>
            {MUSCLE_GROUPS.map((g) => (
              <th
                key={g}
                className="sticky top-0 z-10 bg-surface w-14 px-1 py-2 text-center font-display font-bold uppercase text-[11px] text-ink"
                style={{ border: '1px solid #2A2A2A' }}
              >
                {GROUP_ABBR[g]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {weeks.map((week) => {
            const start = startOfWeek(week)
            const startMs = start.getTime()
            const isFuture = start > now
            return (
              <tr key={startMs}>
                <td
                  className="sticky left-0 z-10 bg-surface w-20 px-1 py-2 text-left font-semibold text-[11px] text-ink whitespace-nowrap"
                  style={{ border: '1px solid #2A2A2A' }}
                >
                  {fmtWeekLabel(start)}
                </td>
                {MUSCLE_GROUPS.map((g) => {
                  if (isFuture) {
                    return (
                      <td
                        key={g}
                        className="w-14"
                        style={{ border: '1px solid #2A2A2A', background: '#0D0D0D' }}
                      />
                    )
                  }
                  const min = hypertrophyTargets[g]?.min ?? 0
                  const actual = counts[`${startMs}_${g}`] || 0
                  const ok = actual >= min
                  return (
                    <td
                      key={g}
                      className="w-14 px-1 py-2 text-center text-xs text-white"
                      style={{
                        border: '1px solid #2A2A2A',
                        background: ok ? '#22C55E' : '#FF3B30',
                      }}
                    >
                      {actual}/{min}
                    </td>
                  )
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
