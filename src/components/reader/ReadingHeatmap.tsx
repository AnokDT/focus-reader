import { useMemo } from 'react'

interface ReadingHeatmapProps {
  totalPages: number
  currentPage: number
  pageTimes: Record<number, number>
  onPageClick: (page: number) => void
}

// Minimum time (ms) to count as a real reading session — ignores accidental scrolls
const MIN_READING_TIME = 3000

function getHeatColor(timeMs: number, maxTime: number): string {
  if (timeMs < MIN_READING_TIME) return 'bg-[var(--color-surface-3)]'
  const intensity = Math.min(timeMs / Math.max(maxTime, 1), 1)

  // Green → teal → amber → orange → red gradient
  if (intensity < 0.2) return 'bg-emerald-400'
  if (intensity < 0.4) return 'bg-teal-400'
  if (intensity < 0.6) return 'bg-amber-400'
  if (intensity < 0.8) return 'bg-orange-400'
  return 'bg-rose-400'
}

function formatTime(ms: number): string {
  if (ms < MIN_READING_TIME) return 'scanned'
  const seconds = Math.floor(ms / 1000)
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  const remainSec = seconds % 60
  return remainSec > 0 ? `${minutes}m ${remainSec}s` : `${minutes}m`
}

export function ReadingHeatmap({ totalPages, currentPage, pageTimes, onPageClick }: ReadingHeatmapProps) {
  const maxTime = useMemo(() => {
    const times = Object.values(pageTimes).filter((t) => t >= MIN_READING_TIME)
    return times.length > 0 ? Math.max(...times) : 1
  }, [pageTimes])

  // How many pages to show (scale with total)
  const visiblePages = Math.min(totalPages, 80)
  const startPage = Math.max(1, Math.floor((currentPage / totalPages) * totalPages) - Math.floor(visiblePages / 2))
  const endPage = Math.min(totalPages, startPage + visiblePages - 1)

  if (totalPages <= 0) return null

  return (
    <div className="flex flex-col items-center gap-0.5 py-2 overflow-y-auto max-h-full flex-1">
      <span className="text-[8px] font-medium text-[var(--color-text-tertiary)] mb-1 uppercase tracking-wider">Heat</span>

      {Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i).map((page) => {
        const time = pageTimes[page] || 0
        return (
          <button
            key={page}
            onClick={() => onPageClick(page)}
            className={`
              w-3 h-1.5 rounded-sm transition-all duration-150 hover:scale-x-[1.8] hover:scale-y-[1.6]
              ${page === currentPage ? 'ring-1 ring-[var(--color-accent)] ring-offset-[1px] ring-offset-[var(--color-surface-1)]' : ''}
              ${getHeatColor(time, maxTime)}
            `}
            title={`Page ${page}: ${formatTime(time)}`}
          />
        )
      })}

      {totalPages > visiblePages && (
        <span className="text-[7px] text-[var(--color-text-tertiary)] mt-1">
          {startPage}–{endPage}
        </span>
      )}

      {/* Legend */}
      <div className="flex flex-col items-center gap-0.5 mt-2 pt-2 border-t border-[var(--color-surface-3)]">
        <div className="flex items-center gap-0.5">
          <div className="w-2 h-1 rounded-sm bg-[var(--color-surface-3)]" />
          <span className="text-[7px] text-[var(--color-text-tertiary)]">none</span>
        </div>
        <div className="flex items-center gap-0.5">
          <div className="w-2 h-1 rounded-sm bg-emerald-400" />
          <span className="text-[7px] text-[var(--color-text-tertiary)]">&lt;30s</span>
        </div>
        <div className="flex items-center gap-0.5">
          <div className="w-2 h-1 rounded-sm bg-amber-400" />
          <span className="text-[7px] text-[var(--color-text-tertiary)]">30s-2m</span>
        </div>
        <div className="flex items-center gap-0.5">
          <div className="w-2 h-1 rounded-sm bg-rose-400" />
          <span className="text-[7px] text-[var(--color-text-tertiary)]">&gt;2m</span>
        </div>
      </div>
    </div>
  )
}
