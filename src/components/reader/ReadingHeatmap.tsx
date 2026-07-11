import { useMemo } from 'react'
import { motion } from 'framer-motion'

interface ReadingHeatmapProps {
  totalPages: number
  currentPage: number
  pageTimes: Record<number, number>
  onPageClick: (page: number) => void
}

export function ReadingHeatmap({ totalPages, currentPage, pageTimes, onPageClick }: ReadingHeatmapProps) {
  const maxTime = useMemo(() => {
    const times = Object.values(pageTimes)
    return times.length > 0 ? Math.max(...times) : 1
  }, [pageTimes])

  const getColor = (page: number) => {
    const time = pageTimes[page] || 0
    if (time === 0) return 'bg-[var(--color-surface-3)]'
    const intensity = Math.min(time / maxTime, 1)
    if (intensity < 0.33) return 'bg-emerald-400'
    if (intensity < 0.66) return 'bg-amber-400'
    return 'bg-rose-400'
  }

  if (totalPages <= 0) return null

  return (
    <div className="flex flex-col items-center gap-0.5 py-2">
      <span className="text-[8px] font-medium text-[var(--color-text-tertiary)] mb-1 uppercase tracking-wider">Heat</span>
      {Array.from({ length: Math.min(totalPages, 50) }, (_, i) => i + 1).map((page) => (
        <button
          key={page}
          onClick={() => onPageClick(page)}
          className={`
            w-3 h-1.5 rounded-sm transition-all duration-200 hover:scale-x-150 hover:scale-y-150
            ${page === currentPage ? 'ring-1 ring-[var(--color-accent)] ring-offset-1 ring-offset-[var(--color-surface-1)]' : ''}
            ${getColor(page)}
          `}
          title={`Page ${page}: ${pageTimes[page] ? `${Math.round(pageTimes[page] / 1000)}s` : 'not read'}`}
        />
      ))}
      {totalPages > 50 && (
        <span className="text-[7px] text-[var(--color-text-tertiary)] mt-1">+{totalPages - 50}</span>
      )}
      <div className="flex items-center gap-1 mt-1.5">
        <div className="w-2 h-1 rounded-sm bg-[var(--color-surface-3)]" />
        <div className="w-2 h-1 rounded-sm bg-emerald-400" />
        <div className="w-2 h-1 rounded-sm bg-amber-400" />
        <div className="w-2 h-1 rounded-sm bg-rose-400" />
      </div>
    </div>
  )
}
