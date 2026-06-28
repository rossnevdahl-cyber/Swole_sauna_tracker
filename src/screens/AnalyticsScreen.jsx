import { useMemo, useState } from 'react'
import { useStore } from '../context/StoreContext.jsx'
import { MUSCLE_GROUPS } from '../lib/storage.js'
import {
  startOfWeek,
  endOfWeek,
  addWeeks,
  fmtWeekRange,
  fmtShortDate,
  isSameWeek,
  lbsToDisplay,
  unitLabel,
  fmtNum,
} from '../lib/utils.js'
import { ChevronLeftIcon, ChevronRightIcon, SearchIcon } from '../components/icons.jsx'
import VolumeTrendTab from '../components/VolumeTrendTab.jsx'
import WeightTrendTab from '../components/WeightTrendTab.jsx'

export default function AnalyticsScreen() {
  const [subtab, setSubtab] = useState('weekly')
  return (
    <div className="px-4 pt-8">
      <h1 className="heading text-4xl mb-4">Analytics</h1>
      <div className="flex gap-2 mb-5">
        <TabBtn active={subtab === 'weekly'} onClick={() => setSubtab('weekly')}>
          Weekly Volume
        </TabBtn>
        <TabBtn active={subtab === 'trend'} onClick={() => setSubtab('trend')}>
          Volume Trend
        </TabBtn>
        <TabBtn active={subtab === 'movement'} onClick={() => setSubtab('movement')}>
          By Movement
        </TabBtn>
        <TabBtn active={subtab === 'weight'} onClick={() => setSubtab('weight')}>
          Weight Trend
        </TabBtn>
      </div>
      {subtab === 'weekly' && <WeeklyVolume />}
      {subtab === 'trend' && <VolumeTrendTab />}
      {subtab === 'movement' && <MovementAnalytics />}
      {subtab === 'weight' && <WeightTrendTab />}
    </div>
  )
}

function TabBtn({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 h-11 font-display font-bold uppercase tracking-wide text-sm ${
        active ? 'bg-accent text-black' : 'bg-surface2 text-muted'
      }`}
    >
      {children}
    </button>
  )
}

function WeeklyVolume() {
  const { workouts, hypertrophyTargets } = useStore()
  const [weekDate, setWeekDate] = useState(() => new Date())
  const [expanded, setExpanded] = useState(null)

  const start = startOfWeek(weekDate)
  const end = endOfWeek(weekDate)
  const isCurrent = isSameWeek(weekDate, new Date())

  // Sets per muscle group for the selected week, with contributing movements.
  const data = useMemo(() => {
    const result = {}
    for (const g of MUSCLE_GROUPS) result[g] = { sets: 0, movements: {} }
    for (const w of workouts) {
      const d = new Date(w.date)
      if (d < start || d > end) continue
      for (const mv of w.movements || []) {
        const count = (mv.sets || []).length
        if (count === 0) continue
        const g = mv.muscleGroup
        if (!result[g]) result[g] = { sets: 0, movements: {} }
        result[g].sets += count
        result[g].movements[mv.movementName] =
          (result[g].movements[mv.movementName] || 0) + count
      }
    }
    return result
  }, [workouts, start, end])

  return (
    <div>
      <div className="flex items-center justify-between bg-surface2 mb-5">
        <button
          className="w-12 h-12 flex items-center justify-center text-muted active:text-ink"
          onClick={() => setWeekDate((d) => addWeeks(d, -1))}
          aria-label="Previous week"
        >
          <ChevronLeftIcon />
        </button>
        <div className="text-center">
          <div className="font-display font-bold uppercase">{fmtWeekRange(weekDate)}</div>
          <div className="text-[10px] uppercase tracking-wide text-muted">
            {isCurrent ? 'This Week' : 'Mon – Sun'}
          </div>
        </div>
        <button
          className="w-12 h-12 flex items-center justify-center text-muted active:text-ink disabled:opacity-20"
          onClick={() => setWeekDate((d) => addWeeks(d, 1))}
          disabled={isCurrent}
          aria-label="Next week"
        >
          <ChevronRightIcon />
        </button>
      </div>

      <div className="space-y-2">
        {MUSCLE_GROUPS.map((g) => {
          const target = hypertrophyTargets[g] || { min: 0, max: 0 }
          const actual = data[g]?.sets || 0
          const movements = data[g]?.movements || {}
          const pct = target.max > 0 ? Math.min(1, actual / target.max) : 0

          let barColor = 'bg-accent'
          let status = '✅'
          if (actual === 0) {
            barColor = 'bg-danger'
            status = '❌'
          } else if (actual < target.min) {
            barColor = 'bg-warn'
            status = '⚠️'
          }

          const isOpen = expanded === g
          const movEntries = Object.entries(movements).sort((a, b) => b[1] - a[1])

          return (
            <div key={g} className="bg-surface">
              <button
                className="w-full text-left p-3 active:bg-surface2"
                onClick={() => setExpanded(isOpen ? null : g)}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-display font-bold uppercase">{g}</span>
                  <span className="text-xs tabular-nums text-muted">
                    <span className="text-ink font-semibold">{actual}</span> / {target.min}–
                    {target.max} sets {status}
                  </span>
                </div>
                <div className="h-3 bg-surface2 w-full overflow-hidden">
                  <div
                    className={`h-full ${barColor}`}
                    style={{ width: `${pct * 100}%`, transition: 'width 0.3s ease-out' }}
                  />
                </div>
              </button>
              {isOpen && (
                <div className="px-3 pb-3 pt-1 border-t border-surface2">
                  {movEntries.length === 0 ? (
                    <div className="text-xs text-muted py-2">No sets this week.</div>
                  ) : (
                    movEntries.map(([name, count]) => (
                      <div
                        key={name}
                        className="flex items-center justify-between py-1.5 text-sm border-b border-surface2/50 last:border-0"
                      >
                        <span className="text-ink/90">{name}</span>
                        <span className="text-muted tabular-nums">{count} sets</span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function MovementAnalytics() {
  const { movements, workouts, settings } = useStore()
  const unit = settings.weightUnit
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(null)

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase()
    return movements
      .filter((m) => m.name.toLowerCase().includes(q))
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [movements, query])

  // Last 8 sessions containing the selected movement, oldest -> newest.
  const sessions = useMemo(() => {
    if (!selected) return []
    const rows = []
    const sorted = [...workouts].sort((a, b) => new Date(a.date) - new Date(b.date))
    for (const w of sorted) {
      const mv = (w.movements || []).find((m) => m.movementId === selected.id)
      if (!mv || !mv.sets || mv.sets.length === 0) continue
      const maxWeight = mv.sets.reduce((mx, s) => Math.max(mx, Number(s.weight) || 0), 0)
      const volume = mv.sets.reduce((v, s) => v + (Number(s.weight) || 0) * (Number(s.reps) || 0), 0)
      const avgWeight =
        mv.sets.reduce((v, s) => v + (Number(s.weight) || 0), 0) / mv.sets.length
      rows.push({
        date: w.date,
        sets: mv.sets.length,
        maxWeight,
        avgWeight,
        volume,
      })
    }
    return rows.slice(-8)
  }, [selected, workouts])

  if (selected) {
    return (
      <div>
        <button
          className="flex items-center gap-1 text-accent text-sm font-semibold uppercase tracking-wide mb-3"
          onClick={() => setSelected(null)}
        >
          <ChevronLeftIcon width={18} height={18} /> Back to list
        </button>
        <h2 className="heading text-2xl mb-4">{selected.name}</h2>

        {sessions.length === 0 ? (
          <div className="card text-center py-10 text-muted">
            No logged sessions for this movement yet.
          </div>
        ) : (
          <>
            <BarChart
              title="Max Weight"
              unit={unitLabel(unit)}
              data={sessions.map((s) => ({
                label: fmtShortDate(s.date),
                value: lbsToDisplay(s.maxWeight, unit),
              }))}
            />
            <BarChart
              title="Total Volume / Session"
              unit={unitLabel(unit)}
              data={sessions.map((s) => ({
                label: fmtShortDate(s.date),
                value: lbsToDisplay(s.volume, unit),
              }))}
            />

            <h3 className="heading text-lg mt-6 mb-2">Last {sessions.length} Sessions</h3>
            <div className="card p-0 overflow-hidden">
              <div className="flex text-[10px] uppercase tracking-wide text-muted px-3 py-2 bg-surface2">
                <span className="flex-1">Date</span>
                <span className="w-12 text-center">Sets</span>
                <span className="w-16 text-right">Avg {unitLabel(unit)}</span>
                <span className="w-20 text-right">Volume</span>
              </div>
              {[...sessions].reverse().map((s, i) => (
                <div key={i} className="flex px-3 py-2 text-sm border-t border-surface2/60 tabular-nums">
                  <span className="flex-1">{fmtShortDate(s.date)}</span>
                  <span className="w-12 text-center">{s.sets}</span>
                  <span className="w-16 text-right">{Math.round(lbsToDisplay(s.avgWeight, unit))}</span>
                  <span className="w-20 text-right text-accent font-semibold">
                    {fmtNum(lbsToDisplay(s.volume, unit))}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    )
  }

  return (
    <div>
      <div className="relative mb-3">
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
      {matches.length === 0 ? (
        <div className="card text-center py-10 text-muted">No movements found.</div>
      ) : (
        <div className="space-y-2">
          {matches.map((m) => (
            <button
              key={m.id}
              onClick={() => setSelected(m)}
              className="card w-full flex items-center justify-between active:bg-surface2 text-left"
            >
              <div>
                <div className="font-display font-semibold uppercase text-lg leading-tight">
                  {m.name}
                </div>
                <div className="text-xs text-muted">{m.muscleGroup}</div>
              </div>
              <ChevronRightIcon className="text-muted" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function BarChart({ title, data, unit }) {
  const max = Math.max(1, ...data.map((d) => Number(d.value) || 0))
  const W = 320
  const H = 140
  const padBottom = 22
  const padTop = 14
  const barGap = 8
  const n = data.length
  const barW = n > 0 ? (W - barGap * (n + 1)) / n : 0
  const chartH = H - padBottom - padTop

  return (
    <div className="card mb-4">
      <div className="flex items-baseline justify-between mb-2">
        <h3 className="heading text-base">{title}</h3>
        <span className="text-[10px] uppercase text-muted">{unit}</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" preserveAspectRatio="xMidYMid meet">
        {data.map((d, i) => {
          const val = Number(d.value) || 0
          const h = (val / max) * chartH
          const x = barGap + i * (barW + barGap)
          const y = padTop + (chartH - h)
          return (
            <g key={i}>
              <rect x={x} y={y} width={barW} height={Math.max(2, h)} fill="#C8FF00" />
              <text
                x={x + barW / 2}
                y={y - 3}
                fill="#F2F2F2"
                fontSize="9"
                fontWeight="700"
                textAnchor="middle"
              >
                {Math.round(val)}
              </text>
              <text
                x={x + barW / 2}
                y={H - 7}
                fill="#8A8A8A"
                fontSize="8"
                textAnchor="middle"
              >
                {d.label}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}
