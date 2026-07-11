export interface ReadingSession {
  id: string
  documentId: string
  startedAt: string
  endedAt: string
  pagesRead: number
  readingTimeMs: number
  wpm: number
}

export interface DailyReadingStats {
  date: string
  readingTimeMs: number
  pagesRead: number
  sessionCount: number
  avgWpm: number
}

export interface WeeklyReadingStats {
  weekStart: string
  totalReadingTimeMs: number
  totalPagesRead: number
  avgDailyReadingTimeMs: number
  streak: number
}

export interface ReadingGoal {
  dailyMinutes: number
  enabled: boolean
}
