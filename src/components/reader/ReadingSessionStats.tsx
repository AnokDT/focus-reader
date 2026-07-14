import { memo, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Clock, BookOpen, Zap, Target, X } from 'lucide-react'
import { FlowScore } from './FlowScore'

interface ReadingSessionStatsProps {
  isOpen: boolean
  onClose: () => void
  pageTimes: Record<number, number>
  currentPage: number
  totalPages: number
  flowScore: number
  wpm: number
}

function ReadingSessionStatsInner({
  isOpen,
  onClose,
  pageTimes,
  currentPage,
  totalPages,
  flowScore,
  wpm,
}: ReadingSessionStatsProps) {
  const stats = useMemo(() => {
    const totalTimeMs = Object.values(pageTimes).reduce((a, b) => a + b, 0)
    const totalTimeMin = Math.round(totalTimeMs / 60000)
    const pagesRead = Object.keys(pageTimes).filter((p) => pageTimes[parseInt(p)] > 0).length
    const avgTimePerPage = pagesRead > 0 ? Math.round(totalTimeMs / pagesRead / 1000) : 0
    const progress = totalPages > 0 ? Math.round((currentPage / totalPages) * 100) : 0

    return {
      totalTimeMin,
      pagesRead,
      avgTimePerPage,
      progress,
      wordsPerMinute: wpm,
      flowScore,
    }
  }, [pageTimes, currentPage, totalPages, flowScore, wpm])

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="bg-[var(--color-surface-0)] rounded-2xl shadow-2xl border border-[var(--color-surface-3)] w-[380px] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 pt-5 pb-4 border-b border-[var(--color-surface-3)]">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Session Stats</h3>
                  <p className="text-xs text-[var(--color-text-tertiary)] mt-0.5">Keep reading to improve</p>
                </div>
                <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[var(--color-surface-2)] transition-colors">
                  <X size={16} className="text-[var(--color-text-tertiary)]" />
                </button>
              </div>
            </div>

            {/* Flow Score */}
            <div className="px-6 py-4 border-b border-[var(--color-surface-3)]">
              <FlowScore score={stats.flowScore} />
            </div>

            {/* Stats Grid */}
            <div className="px-6 py-4 grid grid-cols-2 gap-4">
              <StatItem
                icon={<Clock size={14} />}
                label="Reading Time"
                value={`${stats.totalTimeMin} min`}
                color="var(--color-accent)"
              />
              <StatItem
                icon={<BookOpen size={14} />}
                label="Pages Read"
                value={`${stats.pagesRead} / ${totalPages}`}
                color="#8b5cf6"
              />
              <StatItem
                icon={<Zap size={14} />}
                label="Speed"
                value={`${stats.wordsPerMinute} WPM`}
                color="#f59e0b"
              />
              <StatItem
                icon={<Target size={14} />}
                label="Progress"
                value={`${stats.progress}%`}
                color="#22c55e"
              />
            </div>

            {/* Footer */}
            <div className="px-6 py-3 bg-[var(--color-surface-1)] border-t border-[var(--color-surface-3)]">
              <p className="text-[10px] text-[var(--color-text-tertiary)] text-center">
                Session saved automatically
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function StatItem({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="p-1.5 rounded-lg" style={{ backgroundColor: `${color}15` }}>
        <span style={{ color }}>{icon}</span>
      </div>
      <div>
        <div className="text-sm font-semibold text-[var(--color-text-primary)]">{value}</div>
        <div className="text-[10px] text-[var(--color-text-tertiary)]">{label}</div>
      </div>
    </div>
  )
}

export const ReadingSessionStats = memo(ReadingSessionStatsInner)
