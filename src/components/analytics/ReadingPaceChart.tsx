import { useMemo } from 'react'
import { motion } from 'framer-motion'

interface ReadingPaceChartProps {
  pageTimes: Record<number, number>
  totalPages: number
  currentPage: number
  onPageClick?: (page: number) => void
}

interface BarData {
  page: number
  time: number
  normalizedHeight: number
  color: string
}

const PACE_COLORS = {
  fast: '#10b981',
  medium: '#f59e0b',
  slow: '#ef4444',
  unread: '#e5e7eb',
}

function getTimeColor(seconds: number, avg: number): string {
  if (seconds === 0) return PACE_COLORS.unread
  if (seconds < avg * 0.6) return PACE_COLORS.fast
  if (seconds < avg * 1.5) return PACE_COLORS.medium
  return PACE_COLORS.slow
}

export function ReadingPaceChart({ pageTimes, totalPages, currentPage, onPageClick }: ReadingPaceChartProps) {
  const { bars, avgTime } = useMemo(() => {
    const maxTime = Math.max(...Object.values(pageTimes), 1)
    const times = Object.values(pageTimes).filter((t) => t > 0)
    const avg = times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0

    const barData: BarData[] = []
    for (let p = 1; p <= totalPages; p++) {
      const time = (pageTimes[p] || 0) / 1000
      barData.push({
        page: p,
        time,
        normalizedHeight: maxTime > 0 ? (time / maxTime) * 100 : 0,
        color: getTimeColor(time, avg / 1000),
      })
    }
    return { bars: barData, avgTime: avg }
  }, [pageTimes, totalPages])

  if (totalPages === 0) return null

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">Reading Pace</h3>
        <div className="flex items-center gap-3 text-[10px] text-[var(--color-text-tertiary)]">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: PACE_COLORS.fast }} /> Fast</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: PACE_COLORS.medium }} /> Normal</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: PACE_COLORS.slow }} /> Slow</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: PACE_COLORS.unread }} /> Unread</span>
        </div>
      </div>

      {/* Chart */}
      <div className="relative h-32 flex items-end gap-[2px]">
        {bars.map((bar) => (
          <motion.button
            key={bar.page}
            initial={{ height: 0 }}
            animate={{ height: `${Math.max(bar.normalizedHeight, 2)}%` }}
            transition={{ duration: 0.3, delay: bar.page * 0.01 }}
            onClick={() => onPageClick?.(bar.page)}
            className={`flex-1 rounded-t-sm cursor-pointer transition-opacity hover:opacity-80 relative group ${
              bar.page === currentPage ? 'ring-1 ring-[var(--color-accent)] ring-offset-1' : ''
            }`}
            style={{ backgroundColor: bar.color, minWidth: 2 }}
            title={`Page ${bar.page}: ${bar.time.toFixed(1)}s`}
          >
            {/* Tooltip */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-[var(--color-surface-0)] border border-[var(--color-surface-3)] rounded-lg shadow-lg text-[10px] text-[var(--color-text-primary)] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
              <p className="font-medium">Page {bar.page}</p>
              <p className="text-[var(--color-text-tertiary)]">
                {bar.time === 0 ? 'Not read' : bar.time < 1 ? `${(bar.time * 1000).toFixed(0)}ms` : `${bar.time.toFixed(1)}s`}
              </p>
            </div>
          </motion.button>
        ))}

        {/* Average line */}
        {avgTime > 0 && (
          <div
            className="absolute left-0 right-0 h-px bg-[var(--color-accent)] opacity-60"
            style={{
              bottom: `${(avgTime / 1000 / Math.max(...Object.values(pageTimes).map((t) => t / 1000), 1)) * 100}%`,
            }}
          >
            <span className="absolute right-0 -top-4 text-[9px] text-[var(--color-accent)] font-medium">
              avg {(avgTime / 1000).toFixed(1)}s
            </span>
          </div>
        )}
      </div>

      {/* Page labels */}
      <div className="flex items-center justify-between mt-1">
        <span className="text-[9px] text-[var(--color-text-tertiary)]">1</span>
        <span className="text-[9px] text-[var(--color-text-tertiary)]">{totalPages}</span>
      </div>
    </div>
  )
}
