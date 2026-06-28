import { useEffect, useMemo, useRef, useState } from 'react'
import { useStore } from '../context/StoreContext.jsx'
import { WEIGHT_PLAN, WEIGHT_PHASES, SHOW_DAY } from '../lib/storage.js'
import { parseYMD, toYMD, fmtWeekLabel, startOfWeek } from '../lib/utils.js'
import { ConfirmModal } from './Modal.jsx'

const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const PHASE_BY_KEY = Object.fromEntries(WEIGHT_PHASES.map((p) => [p.key, p]))

// Chart geometry (SVG user units).
const COL_W = 46
const LEFT_INSET = 10
const RIGHT_INSET = 22
const AXIS_W = 44
const H = 300
const PAD_TOP = 30
const PAD_BOTTOM = 46
const PLOT_H = H - PAD_TOP - PAD_BOTTOM

export default function WeightTrendTab() {
  const { weeklyWeighIns, weightTargets, setWeighIn, setWeightTarget, resetWeightTargets } =
    useStore()

  const hasWeighIns = Object.keys(weeklyWeighIns).length > 0

  // Pre-compute the full chart data array once per data change (perf note).
  const chart = useMemo(() => {
    const weeks = WEIGHT_PLAN.map((w) => {
      const target = weightTargets[w.date] ?? w.target
      const raw = weeklyWeighIns[w.date]
      const actual = typeof raw === 'number' ? raw : null
      return { date: w.date, phaseKey: w.phaseKey, target, actual }
    })

    // Y range: auto-fit with ~5lb padding, snapped to 5lb increments.
    let lo = Infinity
    let hi = -Infinity
    for (const w of weeks) {
      lo = Math.min(lo, w.target)
      hi = Math.max(hi, w.target)
      if (w.actual != null) {
        lo = Math.min(lo, w.actual)
        hi = Math.max(hi, w.actual)
      }
    }
    const yMin = Math.floor((lo - 5) / 5) * 5
    const yMax = Math.ceil((hi + 5) / 5) * 5
    const ticks = []
    for (let t = yMin; t <= yMax; t += 5) ticks.push(t)

    const n = weeks.length
    const width = LEFT_INSET + n * COL_W + RIGHT_INSET
    const x = (i) => LEFT_INSET + i * COL_W + COL_W / 2
    const y = (val) => PAD_TOP + ((yMax - val) / (yMax - yMin)) * PLOT_H

    // Target line points (all weeks).
    const targetPoints = weeks.map((w, i) => `${x(i)},${y(w.target)}`).join(' ')

    // Actual line: split into runs of consecutive weeks that have a weigh-in.
    const actualRuns = []
    let run = []
    weeks.forEach((w, i) => {
      if (w.actual != null) {
        run.push({ i, x: x(i), y: y(w.actual), date: w.date, actual: w.actual })
      } else if (run.length) {
        actualRuns.push(run)
        run = []
      }
    })
    if (run.length) actualRuns.push(run)
    const actualDots = actualRuns.flat()

    // Phase background bands + labels.
    const bands = WEIGHT_PHASES.map((p) => {
      const idxs = weeks.map((w, i) => (w.phaseKey === p.key ? i : -1)).filter((i) => i >= 0)
      const first = idxs[0]
      const last = idxs[idxs.length - 1]
      return {
        ...p,
        x: x(first) - COL_W / 2,
        w: x(last) - x(first) + COL_W,
      }
    })

    // Month labels at month boundaries (readable interval for mobile).
    const monthLabels = []
    weeks.forEach((w, i) => {
      const d = parseYMD(w.date)
      const prev = i > 0 ? parseYMD(weeks[i - 1].date) : null
      if (i === 0 || d.getMonth() !== prev.getMonth()) {
        const label =
          d.getMonth() === 0 || i === 0
            ? `${MON[d.getMonth()].toUpperCase()} '${String(d.getFullYear()).slice(2)}`
            : MON[d.getMonth()].toUpperCase()
        monthLabels.push({ x: x(i), label })
      }
    })

    // Show-day marker positioned within its week by day-of-week fraction.
    const showIdx = weeks.findIndex((w, i) => {
      const start = parseYMD(w.date)
      const next = new Date(start)
      next.setDate(next.getDate() + 7)
      const sd = parseYMD(SHOW_DAY)
      return sd >= start && sd < next
    })
    let showX = null
    if (showIdx >= 0) {
      const start = parseYMD(weeks[showIdx].date)
      const frac = (parseYMD(SHOW_DAY) - start) / (7 * 86400000)
      showX = x(showIdx) - COL_W / 2 + frac * COL_W
    }

    return {
      weeks,
      ticks,
      yMin,
      yMax,
      width,
      x,
      y,
      targetPoints,
      actualRuns,
      actualDots,
      bands,
      monthLabels,
      showX,
    }
  }, [weeklyWeighIns, weightTargets])

  return (
    <div>
      <Chart chart={chart} />
      <TargetsTable
        chart={chart}
        hasWeighIns={hasWeighIns}
        setWeighIn={setWeighIn}
        setWeightTarget={setWeightTarget}
        resetWeightTargets={resetWeightTargets}
      />
    </div>
  )
}

function Chart({ chart }) {
  const scrollRef = useRef(null)
  const [tip, setTip] = useState(null) // selected actual dot
  const { ticks, width, x, y, targetPoints, actualRuns, actualDots, bands, monthLabels, showX } =
    chart

  // Default scroll: show the most recent ~12 weeks up to today (or the start of
  // the cycle if today precedes it).
  useEffect(() => {
    const sc = scrollRef.current
    if (!sc) return
    const today = startOfWeek(new Date())
    let focus = -1
    chart.weeks.forEach((w, i) => {
      if (parseYMD(w.date) <= today) focus = i
    })
    if (focus < 0) focus = 0
    const target = (focus + 1) * COL_W + LEFT_INSET - sc.clientWidth
    sc.scrollLeft = Math.max(0, target)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="card mb-5 p-0 overflow-hidden">
      <div className="flex">
        {/* Fixed Y-axis */}
        <svg
          width={AXIS_W}
          height={H}
          viewBox={`0 0 ${AXIS_W} ${H}`}
          className="shrink-0"
          style={{ background: '#1A1A1A' }}
        >
          {ticks.map((t) => (
            <text
              key={t}
              x={AXIS_W - 6}
              y={y(t) + 3}
              fill="#8A8A8A"
              fontSize="10"
              textAnchor="end"
              style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
            >
              {t}
            </text>
          ))}
        </svg>

        {/* Scrollable plot */}
        <div ref={scrollRef} className="overflow-x-auto no-scrollbar flex-1">
          <svg
            width={width}
            height={H}
            viewBox={`0 0 ${width} ${H}`}
            onClick={() => setTip(null)}
          >
            {/* Phase bands */}
            {bands.map((b) => (
              <rect key={b.key} x={b.x} y={PAD_TOP} width={b.w} height={PLOT_H} fill={b.band} />
            ))}

            {/* Grid lines */}
            {ticks.map((t) => (
              <line key={t} x1={0} x2={width} y1={y(t)} y2={y(t)} stroke="#2A2A2A" strokeWidth="1" />
            ))}

            {/* Phase labels */}
            {bands.map((b) => (
              <text
                key={b.key}
                x={b.x + 6}
                y={PAD_TOP + 14}
                fill={b.color}
                fontSize="11"
                fontWeight="700"
                style={{ fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: '0.05em' }}
              >
                {b.label.toUpperCase()}
              </text>
            ))}

            {/* Month labels */}
            {monthLabels.map((m, i) => (
              <text
                key={i}
                x={m.x}
                y={H - 8}
                fill="#8A8A8A"
                fontSize="9"
                textAnchor="middle"
                style={{ fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: '0.05em' }}
              >
                {m.label}
              </text>
            ))}

            {/* Show-day marker */}
            {showX != null && (
              <g>
                <line
                  x1={showX}
                  x2={showX}
                  y1={PAD_TOP}
                  y2={PAD_TOP + PLOT_H}
                  stroke="#C9A84C"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                />
                <text
                  x={showX - 4}
                  y={PAD_TOP + 26}
                  fill="#C9A84C"
                  fontSize="10"
                  fontWeight="700"
                  textAnchor="end"
                  style={{ fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: '0.05em' }}
                >
                  SHOW DAY
                </text>
              </g>
            )}

            {/* Target curve (dashed accent) */}
            <polyline
              points={targetPoints}
              fill="none"
              stroke="#C8FF00"
              strokeWidth="2"
              strokeDasharray="5 4"
              strokeLinejoin="round"
            />

            {/* Actual weight (solid white, broken across gaps) */}
            {actualRuns.map((r, i) => (
              <polyline
                key={i}
                points={r.map((p) => `${p.x},${p.y}`).join(' ')}
                fill="none"
                stroke="#F2F2F2"
                strokeWidth="2"
                strokeLinejoin="round"
              />
            ))}

            {/* Actual dots */}
            {actualDots.map((p) => (
              <g key={p.date}>
                <circle
                  cx={p.x}
                  cy={p.y}
                  r="12"
                  fill="transparent"
                  style={{ cursor: 'pointer' }}
                  onClick={(e) => {
                    e.stopPropagation()
                    setTip((cur) => (cur && cur.date === p.date ? null : p))
                  }}
                />
                <circle cx={p.x} cy={p.y} r="4" fill="#F2F2F2" pointerEvents="none" />
              </g>
            ))}

            {/* Tooltip */}
            {tip && (
              <g pointerEvents="none">
                {(() => {
                  const label = fmtWeekLabel(tip.date)
                  const w = Math.max(64, label.length * 6 + 16)
                  let tx = tip.x - w / 2
                  tx = Math.max(2, Math.min(tx, width - w - 2))
                  const above = tip.y - 44 > PAD_TOP
                  const ty = above ? tip.y - 44 : tip.y + 12
                  return (
                    <>
                      <rect x={tx} y={ty} width={w} height={34} fill="#242424" stroke="#C8FF00" />
                      <text x={tx + w / 2} y={ty + 14} fill="#8A8A8A" fontSize="9" textAnchor="middle">
                        {label}
                      </text>
                      <text
                        x={tx + w / 2}
                        y={ty + 27}
                        fill="#F2F2F2"
                        fontSize="12"
                        fontWeight="700"
                        textAnchor="middle"
                      >
                        {tip.actual.toFixed(1)} lbs
                      </text>
                    </>
                  )
                })()}
              </g>
            )}
          </svg>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 px-4 py-2.5 border-t border-surface2 text-[11px] text-muted">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-4 border-t-2 border-dashed border-accent" /> Target
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-4 border-t-2 border-ink" /> Actual
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 border-t-2 border-dashed" style={{ borderColor: '#C9A84C' }} />
          Show Day
        </span>
      </div>
    </div>
  )
}

function TargetsTable({ chart, hasWeighIns, setWeighIn, setWeightTarget, resetWeightTargets }) {
  const [editing, setEditing] = useState(null) // { date, field }
  const [draft, setDraft] = useState('')
  const [confirmReset, setConfirmReset] = useState(false)
  const todayWeek = toYMD(startOfWeek(new Date()))

  // Reverse-chronological rows, with a phase header above each phase's weeks.
  const rows = useMemo(() => {
    const out = []
    const byPhase = {}
    for (const w of chart.weeks) {
      ;(byPhase[w.phaseKey] ||= []).push(w)
    }
    for (const p of [...WEIGHT_PHASES].reverse()) {
      const weeks = byPhase[p.key] || []
      out.push({ type: 'header', phase: p })
      for (let i = weeks.length - 1; i >= 0; i--) out.push({ type: 'week', ...weeks[i] })
    }
    return out
  }, [chart.weeks])

  function startEdit(date, field, current) {
    setEditing({ date, field })
    setDraft(current == null ? '' : String(current))
  }

  function commit() {
    if (!editing) return
    if (editing.field === 'actual') setWeighIn(editing.date, draft.trim())
    else setWeightTarget(editing.date, draft.trim())
    setEditing(null)
    setDraft('')
  }


  function diffMeta(actual, target) {
    if (actual == null) return null
    const d = actual - target
    let color = '#C8FF00'
    if (d > 1.5) color = '#FF3B30'
    else if (d < -1.5) color = '#FFC400'
    const s = d.toFixed(1)
    const text = d >= 0 ? `+${s}` : `–${Math.abs(d).toFixed(1)}`
    return { color, text }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h2 className="heading text-xl">Weekly Log</h2>
        <button
          onClick={() => setConfirmReset(true)}
          className="font-display font-bold uppercase tracking-wide text-xs px-3 h-9 bg-surface2 text-muted active:text-ink"
        >
          Reset to Plan
        </button>
      </div>

      <ConfirmModal
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        title="Reset Targets"
        message="Reset all targets to original plan values? This cannot be undone."
        confirmLabel="Reset"
        onConfirm={resetWeightTargets}
      />

      {!hasWeighIns && (
        <p className="text-xs text-muted mb-2">
          Tap any cell in the Actual column to log your first weigh-in.
        </p>
      )}

      <div className="card p-0 overflow-hidden">
        <div className="flex text-[10px] uppercase tracking-wide text-muted px-3 py-2 bg-surface2">
          <span className="flex-1">Week</span>
          <span className="w-20 text-right">Target</span>
          <span className="w-20 text-right">Actual</span>
          <span className="w-16 text-right">Diff</span>
        </div>

        {rows.map((row) => {
          if (row.type === 'header') {
            return (
              <div
                key={`h-${row.phase.key}`}
                className="px-3 py-2 bg-bg border-t border-surface2 font-display font-bold uppercase tracking-wide text-xs"
                style={{ color: row.phase.color }}
              >
                {row.phase.tableLabel}
              </div>
            )
          }

          const target = row.target
          const actual = row.actual
          const diff = diffMeta(actual, target)
          const isToday = row.date === todayWeek

          return (
            <div
              key={row.date}
              className={`flex items-center px-3 min-h-[48px] border-t border-surface2/60 text-sm tabular-nums ${
                isToday ? 'bg-surface2/40' : ''
              }`}
            >
              <span className="flex-1">
                {isToday && <span className="text-accent mr-1">●</span>}
                {fmtWeekLabel(row.date)}
              </span>

              {/* Target (editable) */}
              <span className="w-20 text-right">
                {editing && editing.date === row.date && editing.field === 'target' ? (
                  <input
                    autoFocus
                    type="number"
                    inputMode="decimal"
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onBlur={commit}
                    onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                    className="num-input w-16 h-9 px-1 text-right"
                  />
                ) : (
                  <button
                    onClick={() => startEdit(row.date, 'target', target)}
                    className="w-16 h-9 text-right text-muted active:text-ink"
                  >
                    {target.toFixed(1)}
                  </button>
                )}
              </span>

              {/* Actual (editable) */}
              <span className="w-20 text-right">
                {editing && editing.date === row.date && editing.field === 'actual' ? (
                  <input
                    autoFocus
                    type="number"
                    inputMode="decimal"
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onBlur={commit}
                    onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                    className="num-input w-16 h-9 px-1 text-right"
                  />
                ) : (
                  <button
                    onClick={() => startEdit(row.date, 'actual', actual)}
                    className={`w-16 h-9 text-right ${actual == null ? 'text-muted/40' : 'text-ink font-semibold'}`}
                  >
                    {actual == null ? '—' : actual.toFixed(1)}
                  </button>
                )}
              </span>

              {/* Diff */}
              <span className="w-16 text-right font-semibold" style={{ color: diff?.color }}>
                {diff ? diff.text : ''}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
