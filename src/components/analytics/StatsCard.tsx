import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Clock, BookOpen, Flame, Target, TrendingUp, Calendar } from 'lucide-react'
import { useAnalyticsStore } from '@/stores/analyticsStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { formatDuration } from '@/utils/dateUtils'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { ReadingCalendar } from '@/components/analytics/ReadingCalendar'

function StatsCard({ icon, label, value, subtext }: { icon: React.ReactNode; label: string; value: string; subtext?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[var(--color-surface-1)] rounded-xl p-5 border border-[var(--color-surface-3)] theme-transition"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-[var(--color-text-tertiary)] font-medium">{label}</p>
          <p className="text-2xl font-bold text-[var(--color-text-primary)] mt-1 tabular-nums">{value}</p>
          {subtext && <p className="text-xs text-[var(--color-text-tertiary)] mt-1">{subtext}</p>}
        </div>
        <div className="p-2.5 bg-[var(--color-accent-muted)] rounded-lg text-[var(--color-accent)]">
          {icon}
        </div>
      </div>
    </motion.div>
  )
}

export function StatsPage() {
  const { getTodayStats, getStreak, getWeeklyStats } = useAnalyticsStore()
  const { dailyGoalMinutes, dailyGoalEnabled } = useSettingsStore()

  const todayStats = getTodayStats()
  const streak = getStreak()
  const weeklyStats = getWeeklyStats()

  const goalProgress = useMemo(() => {
    if (!dailyGoalEnabled) return 0
    const todayMs = todayStats.readingTimeMs
    const goalMs = dailyGoalMinutes * 60 * 1000
    return Math.min((todayMs / goalMs) * 100, 100)
  }, [todayStats.readingTimeMs, dailyGoalMinutes, dailyGoalEnabled])

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-2xl mx-auto p-8 space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Reading Stats</h1>
          <p className="text-sm text-[var(--color-text-tertiary)] mt-1">
            Track your reading progress and habits
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <StatsCard
            icon={<Clock size={20} />}
            label="Today"
            value={formatDuration(todayStats.readingTimeMs)}
            subtext={`${todayStats.pagesRead} pages read`}
          />
          <StatsCard
            icon={<Flame size={20} />}
            label="Streak"
            value={`${streak} day${streak !== 1 ? 's' : ''}`}
            subtext={streak > 0 ? 'Keep it up!' : 'Start reading today!'}
          />
          <StatsCard
            icon={<TrendingUp size={20} />}
            label="Avg WPM"
            value={todayStats.avgWpm > 0 ? `${todayStats.avgWpm}` : '—'}
            subtext="Words per minute"
          />
          <StatsCard
            icon={<BookOpen size={20} />}
            label="This Week"
            value={formatDuration(weeklyStats.totalTime)}
            subtext={`${weeklyStats.totalPages} pages total`}
          />
        </div>

        {dailyGoalEnabled && (
          <div className="bg-[var(--color-surface-1)] rounded-xl p-5 border border-[var(--color-surface-3)] theme-transition">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-[var(--color-accent-muted)] rounded-lg text-[var(--color-accent)]">
                <Target size={20} />
              </div>
              <div>
                <p className="text-sm font-medium text-[var(--color-text-primary)]">Daily Goal</p>
                <p className="text-xs text-[var(--color-text-tertiary)]">
                  {dailyGoalMinutes} minutes per day
                </p>
              </div>
              <span className="ml-auto text-lg font-bold text-[var(--color-text-primary)] tabular-nums">
                {Math.round(goalProgress)}%
              </span>
            </div>
            <ProgressBar
              value={goalProgress}
              size="lg"
              color={goalProgress >= 100 ? 'var(--color-success)' : 'var(--color-accent)'}
            />
            {goalProgress >= 100 && (
              <p className="text-xs text-[var(--color-success)] mt-2 font-medium">
                Daily goal reached! Great work!
              </p>
            )}
          </div>
        )}

        <div className="bg-[var(--color-surface-1)] rounded-xl p-5 border border-[var(--color-surface-3)] theme-transition">
          <div className="flex items-center gap-2 mb-4">
            <Calendar size={18} className="text-[var(--color-text-secondary)]" />
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Weekly Overview</h3>
          </div>
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 7 }, (_, i) => {
              const date = new Date()
              date.setDate(date.getDate() - (6 - i))
              const dayName = date.toLocaleDateString('en-US', { weekday: 'short' })
              const isToday = i === 6

              return (
                <div key={i} className="text-center">
                  <p className="text-[10px] text-[var(--color-text-tertiary)] mb-1">{dayName}</p>
                  <div
                    className={`
                      w-full aspect-square rounded-lg flex items-center justify-center
                      ${isToday ? 'bg-[var(--color-accent)] text-white' : 'bg-[var(--color-surface-2)] text-[var(--color-text-secondary)]'}
                    `}
                  >
                    <span className="text-xs font-medium">{date.getDate()}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="bg-[var(--color-surface-1)] rounded-xl p-5 border border-[var(--color-surface-3)] theme-transition">
          <ReadingCalendar />
        </div>
      </div>
    </div>
  )
}
