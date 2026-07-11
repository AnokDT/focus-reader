import { useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { TrendingUp, Clock, BookOpen, Zap, Target, X } from 'lucide-react'
import { useAnalyticsStore } from '@/stores/analyticsStore'
import { formatDuration } from '@/utils/dateUtils'
import { ReadingPaceChart } from '@/components/analytics/ReadingPaceChart'

interface ReadingInsightsProps {
  isOpen: boolean
  onClose: () => void
  currentPage: number
  totalPages: number
  pageTimes: Record<number, number>
}

export function ReadingInsights({ isOpen, onClose, currentPage, totalPages, pageTimes }: ReadingInsightsProps) {
  const { getTodayStats, getStreak } = useAnalyticsStore()
  const todayStats = getTodayStats()
  const streak = getStreak()

  const insights = useMemo(() => {
    const times = Object.values(pageTimes)
    const readPages = times.filter((t) => t > 0)
    const avgTimePerPage = readPages.length > 0 ? readPages.reduce((a, b) => a + b, 0) / readPages.length : 0
    const fastestPage = readPages.length > 0 ? Math.min(...readPages) : 0
    const slowestPage = readPages.length > 0 ? Math.max(...readPages) : 0
    const readCount = readPages.length
    const unreadCount = totalPages - readCount
    const estimatedTimeLeft = unreadCount * avgTimePerPage

    return {
      avgTimePerPage,
      fastestPage,
      slowestPage,
      readCount,
      unreadCount,
      estimatedTimeLeft,
      readingSpeed: avgTimePerPage > 0 ? Math.round(250 / (avgTimePerPage / 1000)) : 0,
    }
  }, [pageTimes, totalPages])

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, x: 300 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 300 }}
          transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
          className="fixed right-0 top-0 bottom-0 z-[85] w-80 bg-[var(--color-surface-0)] border-l border-[var(--color-surface-3)] shadow-2xl flex flex-col"
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-surface-3)]">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <TrendingUp size={16} className="text-white" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">Reading Insights</h2>
                <p className="text-[10px] text-[var(--color-text-tertiary)]">Session analytics</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg text-[var(--color-text-tertiary)] hover:bg-[var(--color-surface-2)] transition-colors">
              <X size={16} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {/* Current position */}
            <div className="bg-[var(--color-surface-1)] rounded-xl p-4 border border-[var(--color-surface-3)]">
              <div className="flex items-center gap-2 mb-3">
                <BookOpen size={14} className="text-[var(--color-accent)]" />
                <span className="text-xs font-semibold text-[var(--color-text-primary)]">Position</span>
              </div>
              <div className="flex items-end justify-between">
                <div>
                  <span className="text-2xl font-bold text-[var(--color-text-primary)]">{currentPage}</span>
                  <span className="text-sm text-[var(--color-text-tertiary)]"> / {totalPages}</span>
                </div>
                <span className="text-xs text-[var(--color-text-tertiary)]">
                  {Math.round((currentPage / totalPages) * 100)}% complete
                </span>
              </div>
              <div className="mt-2 h-2 bg-[var(--color-surface-3)] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[var(--color-accent)] to-purple-500 rounded-full transition-all"
                  style={{ width: `${(currentPage / totalPages) * 100}%` }}
                />
              </div>
            </div>

            {/* Speed stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[var(--color-surface-1)] rounded-xl p-3 border border-[var(--color-surface-3)]">
                <Zap size={14} className="text-amber-500 mb-1.5" />
                <p className="text-lg font-bold text-[var(--color-text-primary)]">
                  {insights.readingSpeed || '—'}
                </p>
                <p className="text-[10px] text-[var(--color-text-tertiary)]">Est. WPM</p>
              </div>
              <div className="bg-[var(--color-surface-1)] rounded-xl p-3 border border-[var(--color-surface-3)]">
                <Clock size={14} className="text-[var(--color-accent)] mb-1.5" />
                <p className="text-lg font-bold text-[var(--color-text-primary)]">
                  {insights.avgTimePerPage > 0 ? formatDuration(insights.avgTimePerPage) : '—'}
                </p>
                <p className="text-[10px] text-[var(--color-text-tertiary)]">Avg / page</p>
              </div>
            </div>

            {/* Reading heatmap summary */}
            <div className="bg-[var(--color-surface-1)] rounded-xl p-4 border border-[var(--color-surface-3)]">
              <div className="flex items-center gap-2 mb-3">
                <Target size={14} className="text-emerald-500" />
                <span className="text-xs font-semibold text-[var(--color-text-primary)]">Progress</span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[var(--color-text-tertiary)]">Pages read</span>
                  <span className="text-xs font-medium text-[var(--color-text-primary)]">{insights.readCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[var(--color-text-tertiary)]">Unread</span>
                  <span className="text-xs font-medium text-[var(--color-text-primary)]">{insights.unreadCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[var(--color-text-tertiary)]">Fastest page</span>
                  <span className="text-xs font-medium text-emerald-500">
                    {insights.fastestPage > 0 ? formatDuration(insights.fastestPage) : '—'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[var(--color-text-tertiary)]">Slowest page</span>
                  <span className="text-xs font-medium text-rose-500">
                    {insights.slowestPage > 0 ? formatDuration(insights.slowestPage) : '—'}
                  </span>
                </div>
                <div className="flex items-center justify-between border-t border-[var(--color-surface-3)] pt-2">
                  <span className="text-xs text-[var(--color-text-tertiary)]">Est. time left</span>
                  <span className="text-xs font-medium text-[var(--color-accent)]">
                    {insights.estimatedTimeLeft > 0 ? formatDuration(insights.estimatedTimeLeft) : '—'}
                  </span>
                </div>
              </div>
            </div>

            {/* Session stats */}
            <div className="bg-[var(--color-surface-1)] rounded-xl p-4 border border-[var(--color-surface-3)]">
              <span className="text-xs font-semibold text-[var(--color-text-primary)]">Today</span>
              <div className="mt-2 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[var(--color-text-tertiary)]">Reading time</span>
                  <span className="text-xs font-medium text-[var(--color-text-primary)]">
                    {formatDuration(todayStats.readingTimeMs)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[var(--color-text-tertiary)]">Pages read</span>
                  <span className="text-xs font-medium text-[var(--color-text-primary)]">{todayStats.pagesRead}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[var(--color-text-tertiary)]">Streak</span>
                  <span className="text-xs font-medium text-amber-500">{streak} days</span>
                </div>
              </div>
            </div>

            {/* Reading Pace Chart */}
            {Object.keys(pageTimes).length > 0 && (
              <div className="bg-[var(--color-surface-1)] rounded-xl p-4 border border-[var(--color-surface-3)]">
                <ReadingPaceChart
                  pageTimes={pageTimes}
                  totalPages={totalPages}
                  currentPage={currentPage}
                />
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
