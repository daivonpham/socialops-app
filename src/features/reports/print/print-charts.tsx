import { useId } from 'react'
import { color } from '@/shared/styles/tokens'

/**
 * Charts for the PDF print page, drawn as plain SVG: vector output, no animation and no
 * container measuring, so Chromium always captures them complete and sharp.
 */

type Point = { label: string; value: number | null; previous?: number | null }

function niceMax(value: number): number {
  if (value <= 0) return 1
  const magnitude = 10 ** Math.floor(Math.log10(value))
  const step = [1, 2, 2.5, 5, 10].find((candidate) => candidate * magnitude >= value) ?? 10
  return step * magnitude
}

/** Area line for the current period with the previous period dashed behind it. */
export function PrintLineChart({
  points,
  format,
  currentLabel,
  previousLabel,
}: {
  points: Point[]
  format: (value: number) => string
  currentLabel: string
  previousLabel?: string
}) {
  const gradient = useId()
  // The SVG prints at about half its viewBox width (two charts per row), so text is drawn large.
  const width = 600
  const height = 220
  const left = 64
  const bottom = 34
  const top = 10
  const plotWidth = width - left - 8
  const plotHeight = height - bottom - top
  const values = points.flatMap((point) => [point.value, point.previous ?? null])
  const max = niceMax(Math.max(0, ...values.filter((value): value is number => value !== null)))
  const x = (index: number) =>
    left + (points.length <= 1 ? plotWidth / 2 : (index / (points.length - 1)) * plotWidth)
  const y = (value: number) => top + plotHeight - (value / max) * plotHeight
  const path = (pick: (point: Point) => number | null | undefined) =>
    points
      .map((point, index) => {
        const value = pick(point)
        return value === null || value === undefined ? null : `${x(index)},${y(value)}`
      })
      .filter(Boolean)
      .join(' L ')
  const current = path((point) => point.value)
  const previous = previousLabel ? path((point) => point.previous) : ''
  const firstX = points.findIndex((point) => point.value !== null)
  const lastX = points.length - 1 - [...points].reverse().findIndex((point) => point.value !== null)
  const ticks = [0, 0.25, 0.5, 0.75, 1]
  const labelIndexes = [...new Set([0, Math.floor((points.length - 1) / 2), points.length - 1])]

  return (
    <figure>
      <figcaption className="mb-2 flex items-center gap-4 text-[10px] text-text-secondary">
        <span className="flex items-center gap-1">
          <span className="block h-[2px] w-4 rounded-pill bg-brand-600" />
          {currentLabel}
        </span>
        {previousLabel ? (
          <span className="flex items-center gap-1">
            <span className="block w-4 border-t-2 border-dashed border-neutral-400" />
            {previousLabel}
          </span>
        ) : null}
      </figcaption>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-auto w-full"
        role="img"
        aria-label={currentLabel}
      >
        <defs>
          <linearGradient id={gradient} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={color.brand[500]} stopOpacity="0.22" />
            <stop offset="100%" stopColor={color.brand[500]} stopOpacity="0" />
          </linearGradient>
        </defs>
        {ticks.map((tick) => (
          <g key={tick}>
            <line
              x1={left}
              x2={width - 8}
              y1={y(max * tick)}
              y2={y(max * tick)}
              stroke={color.neutral[200]}
              strokeWidth="1.5"
            />
            <text
              x={left - 10}
              y={y(max * tick) + 6}
              textAnchor="end"
              fontSize="16"
              fill={color.neutral[500]}
            >
              {format(max * tick)}
            </text>
          </g>
        ))}
        {previous ? (
          <path
            d={`M ${previous}`}
            fill="none"
            stroke={color.neutral[400]}
            strokeWidth="2.5"
            strokeDasharray="7 5"
          />
        ) : null}
        {current && firstX >= 0 ? (
          <>
            <path
              d={`M ${current} L ${x(lastX)},${top + plotHeight} L ${x(firstX)},${top + plotHeight} Z`}
              fill={`url(#${gradient})`}
            />
            <path
              d={`M ${current}`}
              fill="none"
              stroke={color.brand[600]}
              strokeWidth="3.5"
              strokeLinejoin="round"
            />
          </>
        ) : null}
        {labelIndexes.map((index) =>
          points[index] ? (
            <text
              key={index}
              x={x(index)}
              y={height - 6}
              textAnchor={index === 0 ? 'start' : index === points.length - 1 ? 'end' : 'middle'}
              fontSize="16"
              fill={color.neutral[500]}
            >
              {points[index].label}
            </text>
          ) : null,
        )}
      </svg>
    </figure>
  )
}

/** Ranked horizontal bars with the value (and optional share) on the right. */
export function PrintBarList({
  rows,
  format,
}: {
  rows: Array<{ label: string; value: number; share?: string }>
  format: (value: number) => string
}) {
  const max = Math.max(0, ...rows.map((row) => row.value))
  return (
    <ol className="grid gap-2">
      {rows.map((row, index) => (
        <li key={`${row.label}-${index}`} className="grid gap-1">
          <div className="flex items-baseline justify-between gap-3 text-[11px]">
            <span className="flex min-w-0 items-center gap-2 text-text-primary">
              <span className="w-4 shrink-0 text-end tabular-nums text-text-tertiary">
                {index + 1}
              </span>
              <span className="truncate">{row.label}</span>
            </span>
            <span className="shrink-0 tabular-nums text-text-secondary">
              {format(row.value)}
              {row.share !== undefined ? (
                <span className="ms-1 text-text-tertiary">· {row.share}</span>
              ) : null}
            </span>
          </div>
          <span className="ms-6 block h-[6px] rounded-pill bg-neutral-100">
            <span
              className="block h-[6px] rounded-pill bg-brand-500"
              style={{ width: `${max > 0 ? Math.max(2, (row.value / max) * 100) : 0}%` }}
            />
          </span>
        </li>
      ))}
    </ol>
  )
}

const HEAT = [
  color.neutral[100],
  color.brand[100],
  color.brand[200],
  color.brand[400],
  color.brand[600],
]

/** Weekday × hour grid shaded by average interactions. */
export function PrintHeatmap({
  cells,
  weekdays,
  lowLabel,
  highLabel,
}: {
  cells: Array<{ weekday: number; hour: number; value: number | null }>
  weekdays: string[]
  lowLabel: string
  highLabel: string
}) {
  const max = Math.max(0, ...cells.map((cell) => cell.value ?? 0))
  const shade = (value: number | null) => {
    if (!value || max <= 0) return HEAT[0]
    return HEAT[Math.min(4, 1 + Math.floor((value / max) * 3.999))]
  }
  const cellWidth = 22
  const cellHeight = 14
  const left = 30
  const width = left + 24 * cellWidth
  const height = 7 * cellHeight + 18
  return (
    <figure className="grid gap-2">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-auto w-full"
        role="img"
        aria-label={highLabel}
      >
        {weekdays.map((day, row) => (
          <g key={day}>
            <text
              x={left - 6}
              y={row * cellHeight + 10}
              textAnchor="end"
              fontSize="8"
              fill={color.neutral[500]}
            >
              {day}
            </text>
            {Array.from({ length: 24 }, (_, hour) => {
              const cell = cells.find((item) => item.weekday === row && item.hour === hour)
              return (
                <rect
                  key={hour}
                  x={left + hour * cellWidth + 1}
                  y={row * cellHeight + 1}
                  width={cellWidth - 2}
                  height={cellHeight - 2}
                  rx="2"
                  fill={shade(cell?.value ?? null)}
                />
              )
            })}
          </g>
        ))}
        {[0, 6, 12, 18, 23].map((hour) => (
          <text
            key={hour}
            x={left + hour * cellWidth + cellWidth / 2}
            y={height - 4}
            textAnchor="middle"
            fontSize="8"
            fill={color.neutral[500]}
          >
            {hour}h
          </text>
        ))}
      </svg>
      <figcaption className="flex items-center justify-end gap-2 text-[10px] text-text-tertiary">
        {lowLabel}
        {HEAT.map((fill) => (
          <span key={fill} className="block size-3 rounded-xs" style={{ backgroundColor: fill }} />
        ))}
        {highLabel}
      </figcaption>
    </figure>
  )
}
