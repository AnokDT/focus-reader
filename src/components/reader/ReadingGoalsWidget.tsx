import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Target, Flame, TrendingUp, Clock } from 'lucide-react'
import { useAnalyticsStore } from '@/stores/analyticsStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { formatDuration } from '@/utils/dateUtils'

interface ReadingGoalsWidgetProps {
  compact?: boolean
}

export function ReadingGoalsWidget({ compact = false }: ReadingGoalsWidgetProps) {
  const { getTodayStats, getStreak } = useAnalyticsStore()
  const { dailyGoalMinutes, dailyGoalEnabled } = useSettingsStore()
  const todayStats = getTodayStats()
  const streak = getStreak()

  const goals = useMemo(() => {
    const todayMinutes = todayStats.readingTimeMs / 60000
    const goalProgress = dailyGoalEnabled ? Math.min((todayMinutes / dailyGoalMinutes) * 100, 100) : 0
    const pagesGoal = Math.max(dailyGoalMinutes / 2, 5) // ~2 min per page estimate
    const pagesProgress = Math.min((todayStats.pagesRead / pagesGoal) * 100, 100)

    return {
      timeGoal: { current: todayMinutes, target: dailyGoalMinutes, progress: goalProgress },
      pagesGoal: { current: todayStats.pagesRead, target: pagesGoal, progress: pagesProgress },
      streak,
    }
  }, [todayStats, dailyGoalMinutes, dailyGoalEnabled, streak])

  if (compact) {
    return (
      <div className="flex items-center gap-3">
        {/* Time goal mini */}
        <div className="flex items-center gap-1.5">
          <div className="relative w-6 h-6">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="14" fill="none" stroke="var(--color-surface-3)" strokeWidth="3" />
              <circle
                cx="18" cy="18" r="14" fill="none"
                stroke={goals.timeGoal.progress >= 100 ? '#10b981' : 'var(--color-accent)'}
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={`${goals.timeGoal.progress * 0.88} 100`}
              />
            </svg>
            <Target size={10} className="absolute inset-0 m-auto text-[var(--color-text-tertiary)]" />
          </div>
          <span className="text-[10px] text-[var(--color-text-tertiary)] tabular-nums">
            {Math.round(goals.timeGoal.current)}/{goals.timeGoal.target}m
          </span>
        </div>

        {/* Streak */}
        {streak > 0 && (
          <div className="flex items-center gap-1">
            <Flame size={12} className="text-amber-500" />
            <span className="text-[10px] font-medium text-amber-500 tabular-nums">{streak}</span>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Daily time goal */}
      <div className="bg-[var(--color-surface-1)] rounded-xl p-4 border border-[var(--color-surface-3)]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Target size={14} className="text-[var(--color-accent)]" />
            <span className="text-xs font-semibold text-[var(--color-text-primary)]">Daily Time Goal</span>
          </div>
          <span className="text-xs font-bold text-[var(--color-accent)] tabular-nums">
            {Math.round(goals.timeGoal.progress)}%
          </span>
        </div>
        <div className="relative h-3 bg-[var(--color-surface-3)] rounded-full overflow-hidden">
          <motion.div
            className="absolute inset-y-0 left-0 rounded-full"
            style={{
              background: goals.timeGoal.progress >= 100
                ? 'linear-gradient(90deg, #10b981, #34d399)'
                : 'linear-gradient(90deg, var(--color-accent), #8b5cf6)',
            }}
            initial={{ width: 0 }}
            animate={{ width: `${goals.timeGoal.progress}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
          {goals.timeGoal.progress >= 100 && (
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
              initial={{ x: '-100%' }}
              animate={{ x: '100%' }}
              transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2 }}
            />
          )}
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="text-[10px] text-[var(--color-text-tertiary)]">
            {formatDuration(todayStats.readingTimeMs)} read
          </span>
          <span className="text-[10px] text-[var(--color-text-tertiary)]">
            {goals.timeGoal.target} min goal
          </span>
        </div>
        {goals.timeGoal.progress >= 100 && (
          <motion.p
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xs text-[var(--color-success)] font-medium mt-2 text-center"
          >
            Daily goal reached! Keep going!
          </motion.p>
        )}
      </div>

      {/* Streak card */}
      {streak > 0 && (
        <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-xl p-4 border border-amber-500/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
              <Flame size={20} className="text-white" />
            </div>
            <div>
              <p className="text-lg font-bold text-[var(--color-text-primary)]">{streak} day streak</p>
              <p className="text-[10px] text-[var(--color-text-tertiary)]">
                {streak >= 7 ? 'Incredible dedication!' : streak >= 3 ? 'Great consistency!' : 'Keep it going!'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
