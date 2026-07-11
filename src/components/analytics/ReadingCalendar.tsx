import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { useAnalyticsStore } from '@/stores/analyticsStore'

interface ReadingCalendarProps {
  className?: string
}

const LEVELS = [
  { min: 0, color: 'var(--color-surface-3)' },
  { min: 1, color: '#9be9a8' },
  { min: 30, color: '#40c463' },
  { min: 60, color: '#30a14e' },
  { min: 120, color: '#216e39' },
]

function getLevel(minutes: number) {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (minutes >= LEVELS[i].min) return LEVELS[i].color
  }
  return LEVELS[0].color
}

export function ReadingCalendar({ className }: ReadingCalendarProps) {
  const { dailyStats } = useAnalyticsStore()

  const calendarData = useMemo(() => {
    const today = new Date()
    const weeks: { date: Date; minutes: number; color: string }[][] = []
    let currentWeek: { date: Date; minutes: number; color: string }[] = []

    // Go back 52 weeks (1 year)
    const startDate = new Date(today)
    startDate.setDate(startDate.getDate() - 364)
    // Adjust to start on Sunday
    startDate.setDate(startDate.getDate() - startDate.getDay())

    const totalWeeks = 53
    const daysToGenerate = totalWeeks * 7

    for (let i = 0; i < daysToGenerate; i++) {
      const date = new Date(startDate)
      date.setDate(date.getDate() + i)
      const dateStr = date.toISOString().split('T')[0]
      const stats = dailyStats[dateStr]
      const minutes = stats ? Math.round(stats.readingTimeMs / 60000) : 0

      currentWeek.push({
        date: new Date(date),
        minutes,
        color: getLevel(minutes),
      })

      if (currentWeek.length === 7) {
        weeks.push(currentWeek)
        currentWeek = []
      }
    }

    return weeks
  }, [dailyStats])

  const months = useMemo(() => {
    const result: { label: string; weekIndex: number }[] = []
    let lastMonth = -1

    calendarData.forEach((week, weekIndex) => {
      const firstDay = week[0]
      if (firstDay) {
        const month = firstDay.date.getMonth()
        if (month !== lastMonth) {
          result.push({
            label: firstDay.date.toLocaleDateString('en-US', { month: 'short' }),
            weekIndex,
          })
          lastMonth = month
        }
      }
    })

    return result
  }, [calendarData])

  const totalMinutes = useMemo(() => {
    return Object.values(dailyStats).reduce((sum, s) => sum + Math.round(s.readingTimeMs / 60000), 0)
  }, [dailyStats])

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">
          Reading Activity
        </h3>
        <span className="text-[10px] text-[var(--color-text-tertiary)]">
          {totalMinutes > 0 ? `${Math.round(totalMinutes / 60)}h ${totalMinutes % 60}m this year` : 'No reading yet'}
        </span>
      </div>

      {/* Month labels */}
      <div className="flex ml-6 mb-1">
        {months.map((m, i) => (
          <span
            key={i}
            className="text-[8px] text-[var(--color-text-tertiary)]"
            style={{ left: `${m.weekIndex * 13}px`, position: i === 0 ? 'relative' : 'absolute' }}
          >
            {m.label}
          </span>
        ))}
      </div>

      {/* Grid */}
      <div className="flex gap-[3px]">
        {/* Day labels */}
        <div className="flex flex-col gap-[3px] text-[8px] text-[var(--color-text-tertiary)] pt-0">
          <span className="h-[10px] leading-[10px]">Mon</span>
          <span className="h-[10px] leading-[10px]">Wed</span>
          <span className="h-[10px] leading-[10px]">Fri</span>
        </div>

        {/* Weeks */}
        <div className="flex gap-[3px]">
          {calendarData.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-[3px]">
              {week.map((day, di) => {
                const isToday = day.date.toDateString() === new Date().toDateString()
                const isFuture = day.date > new Date()
                return (
                  <motion.div
                    key={di}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: (wi * 7 + di) * 0.0005 }}
                    className={`w-[10px] h-[10px] rounded-sm ${isFuture ? 'opacity-30' : ''} ${
                      isToday ? 'ring-1 ring-[var(--color-accent)] ring-offset-1' : ''
                    }`}
                    style={{ backgroundColor: isFuture ? 'var(--color-surface-3)' : day.color }}
                    title={`${day.date.toLocaleDateString()}: ${day.minutes}min`}
                  />
                )
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-1.5 mt-2 justify-end">
        <span className="text-[8px] text-[var(--color-text-tertiary)]">Less</span>
        {LEVELS.map((l, i) => (
          <div
            key={i}
            className="w-[10px] h-[10px] rounded-sm"
            style={{ backgroundColor: l.color }}
            title={`${l.min}+ min`}
          />
        ))}
        <span className="text-[8px] text-[var(--color-text-tertiary)]">More</span>
      </div>
    </div>
  )
}
