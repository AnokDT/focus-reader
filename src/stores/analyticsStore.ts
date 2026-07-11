import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { DailyReadingStats, ReadingGoal } from '@/types/analytics'
import { getToday, getWeekStart } from '@/utils/dateUtils'

interface AnalyticsState {
  dailyStats: Record<string, DailyReadingStats>
  readingGoal: ReadingGoal
  currentSessionStart: number | null
  sessionPagesRead: number

  startSession: () => void
  endSession: (wpm: number) => void
  recordPageRead: (wpm: number) => void
  setDailyGoal: (minutes: number) => void
  setDailyGoalEnabled: (enabled: boolean) => void

  getTodayStats: () => DailyReadingStats
  getStreak: () => number
  getWeeklyStats: () => { totalTime: number; totalPages: number; avgDaily: number }
  getEstimatedCompletionTime: (pagesRemaining: number, avgWpm: number, avgCharsPerPage: number) => number
}

const createEmptyDailyStats = (date: string): DailyReadingStats => ({
  date,
  readingTimeMs: 0,
  pagesRead: 0,
  sessionCount: 0,
  avgWpm: 0,
})

export const useAnalyticsStore = create<AnalyticsState>()(
  persist(
    (set, get) => ({
      dailyStats: {},
      readingGoal: { dailyMinutes: 30, enabled: true },
      currentSessionStart: null,
      sessionPagesRead: 0,

      startSession: () => {
        set({ currentSessionStart: Date.now(), sessionPagesRead: 0 })
      },

      endSession: (wpm: number) => {
        const { currentSessionStart, sessionPagesRead } = get()
        if (!currentSessionStart) return

        const today = getToday()
        const readingTimeMs = Date.now() - currentSessionStart

        set((state) => {
          const existing = state.dailyStats[today] || createEmptyDailyStats(today)
          const newTotalReadingTime = existing.readingTimeMs + readingTimeMs
          const newTotalPages = existing.pagesRead + sessionPagesRead
          const newSessionCount = existing.sessionCount + 1

          return {
            dailyStats: {
              ...state.dailyStats,
              [today]: {
                ...existing,
                readingTimeMs: newTotalReadingTime,
                pagesRead: newTotalPages,
                sessionCount: newSessionCount,
                avgWpm: wpm,
              },
            },
            currentSessionStart: null,
            sessionPagesRead: 0,
          }
        })
      },

      recordPageRead: (wpm: number) => {
        const { currentSessionStart } = get()
        if (!currentSessionStart) return

        const today = getToday()
        set((state) => {
          const existing = state.dailyStats[today] || createEmptyDailyStats(today)
          return {
            sessionPagesRead: state.sessionPagesRead + 1,
            dailyStats: {
              ...state.dailyStats,
              [today]: {
                ...existing,
                pagesRead: existing.pagesRead + 1,
                avgWpm: wpm,
              },
            },
          }
        })
      },

      setDailyGoal: (dailyMinutes) =>
        set((state) => ({
          readingGoal: { ...state.readingGoal, dailyMinutes },
        })),

      setDailyGoalEnabled: (enabled) =>
        set((state) => ({
          readingGoal: { ...state.readingGoal, enabled },
        })),

      getTodayStats: () => {
        const today = getToday()
        const { dailyStats } = get()
        return dailyStats[today] || createEmptyDailyStats(today)
      },

      getStreak: () => {
        const { dailyStats } = get()
        let streak = 0
        const today = new Date()

        for (let i = 0; i < 365; i++) {
          const date = new Date(today)
          date.setDate(date.getDate() - i)
          const dateStr = date.toISOString().split('T')[0]
          const stats = dailyStats[dateStr]

          if (stats && stats.readingTimeMs > 0) {
            streak++
          } else if (i > 0) {
            break
          }
        }

        return streak
      },

      getWeeklyStats: () => {
        const { dailyStats } = get()
        const weekStart = getWeekStart()
        let totalTime = 0
        let totalPages = 0
        let daysWithReading = 0

        for (let i = 0; i < 7; i++) {
          const date = new Date(weekStart)
          date.setDate(date.getDate() + i)
          const dateStr = date.toISOString().split('T')[0]
          const stats = dailyStats[dateStr]

          if (stats) {
            totalTime += stats.readingTimeMs
            totalPages += stats.pagesRead
            if (stats.readingTimeMs > 0) daysWithReading++
          }
        }

        return {
          totalTime,
          totalPages,
          avgDaily: daysWithReading > 0 ? totalTime / daysWithReading : 0,
        }
      },

      getEstimatedCompletionTime: (pagesRemaining, avgWpm, avgCharsPerPage) => {
        if (avgWpm <= 0 || avgCharsPerPage <= 0) return 0
        const wordsRemaining = (pagesRemaining * avgCharsPerPage) / 5
        return (wordsRemaining / avgWpm) * 60 * 1000
      },
    }),
    {
      name: 'focus-reader-analytics',
    }
  )
)
