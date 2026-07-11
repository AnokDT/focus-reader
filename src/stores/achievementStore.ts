import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  unlockedAt?: string
  condition: (stats: AchievementStats) => boolean
}

export interface AchievementStats {
  totalPagesRead: number
  totalReadingTimeMs: number
  currentStreak: number
  longestStreak: number
  totalSessions: number
  documentsRead: number
  maxWpm: number
  bookmarksCount: number
  annotationsCount: number
  vocabularyCount: number
}

const ACHIEVEMENTS: Omit<Achievement, 'unlockedAt'>[] = [
  { id: 'first_page', name: 'First Steps', description: 'Read your first page', icon: '📖', condition: (s) => s.totalPagesRead >= 1 },
  { id: 'ten_pages', name: 'Bookworm', description: 'Read 10 pages', icon: '🐛', condition: (s) => s.totalPagesRead >= 10 },
  { id: 'fifty_pages', name: 'Page Turner', description: 'Read 50 pages', icon: '📚', condition: (s) => s.totalPagesRead >= 50 },
  { id: 'hundred_pages', name: 'Centurion', description: 'Read 100 pages', icon: '💯', condition: (s) => s.totalPagesRead >= 100 },
  { id: 'five_hundred_pages', name: 'Literary Legend', description: 'Read 500 pages', icon: '🏆', condition: (s) => s.totalPagesRead >= 500 },
  { id: 'first_session', name: 'Getting Started', description: 'Complete your first reading session', icon: '🎯', condition: (s) => s.totalSessions >= 1 },
  { id: 'ten_sessions', name: 'Dedicated Reader', description: 'Complete 10 reading sessions', icon: '🔥', condition: (s) => s.totalSessions >= 10 },
  { id: 'fifty_sessions', name: 'Reading Machine', description: 'Complete 50 reading sessions', icon: '⚡', condition: (s) => s.totalSessions >= 50 },
  { id: 'streak_3', name: 'On a Roll', description: '3-day reading streak', icon: '🔥', condition: (s) => s.longestStreak >= 3 },
  { id: 'streak_7', name: 'Week Warrior', description: '7-day reading streak', icon: '🗓️', condition: (s) => s.longestStreak >= 7 },
  { id: 'streak_30', name: 'Monthly Master', description: '30-day reading streak', icon: '👑', condition: (s) => s.longestStreak >= 30 },
  { id: 'streak_100', name: 'Century Streak', description: '100-day reading streak', icon: '💎', condition: (s) => s.longestStreak >= 100 },
  { id: 'hour_read', name: 'Time Flyer', description: 'Read for 1 hour total', icon: '⏰', condition: (s) => s.totalReadingTimeMs >= 3600000 },
  { id: 'ten_hours', name: 'Time Lord', description: 'Read for 10 hours total', icon: '⏳', condition: (s) => s.totalReadingTimeMs >= 36000000 },
  { id: 'hundred_hours', name: 'Century Club', description: 'Read for 100 hours total', icon: '🌟', condition: (s) => s.totalReadingTimeMs >= 360000000 },
  { id: 'first_bookmark', name: 'Marked', description: 'Save your first bookmark', icon: '🔖', condition: (s) => s.bookmarksCount >= 1 },
  { id: 'ten_bookmarks', name: 'Collector', description: 'Save 10 bookmarks', icon: '📋', condition: (s) => s.bookmarksCount >= 10 },
  { id: 'first_annotation', name: 'Highlighter', description: 'Create your first highlight', icon: '🖍️', condition: (s) => s.annotationsCount >= 1 },
  { id: 'ten_annotations', name: 'Annotator', description: 'Create 10 highlights', icon: '📝', condition: (s) => s.annotationsCount >= 10 },
  { id: 'first_vocab', name: 'Word Collector', description: 'Save your first vocabulary word', icon: '🔤', condition: (s) => s.vocabularyCount >= 1 },
  { id: 'ten_vocab', name: 'Lexicon', description: 'Save 10 vocabulary words', icon: '📖', condition: (s) => s.vocabularyCount >= 10 },
  { id: 'speed_reader', name: 'Speed Demon', description: 'Read at 400+ WPM', icon: '🚀', condition: (s) => s.maxWpm >= 400 },
  { id: 'multi_doc', name: 'Well Rounded', description: 'Read 5 different documents', icon: '🗂️', condition: (s) => s.documentsRead >= 5 },
]

interface AchievementState {
  unlockedIds: string[]
  checkAndUnlock: (stats: AchievementStats) => string[]
  getUnlocked: () => Achievement[]
  getLocked: () => Achievement[]
  getNewAchievements: () => Achievement[]
  clearNewAchievements: () => void
}

export const useAchievementStore = create<AchievementState>()(
  persist(
    (set, get) => {
      const allAchievements: Achievement[] = ACHIEVEMENTS.map((a) => ({
        ...a,
        unlockedAt: undefined,
      }))

      return {
        unlockedIds: [],
        checkAndUnlock: (stats: AchievementStats) => {
          const { unlockedIds } = get()
          const newUnlocks: string[] = []

          for (const achievement of allAchievements) {
            if (!unlockedIds.includes(achievement.id) && achievement.condition(stats)) {
              newUnlocks.push(achievement.id)
            }
          }

          if (newUnlocks.length > 0) {
            set((state) => ({
              unlockedIds: [...state.unlockedIds, ...newUnlocks],
            }))
          }

          return newUnlocks
        },
        getUnlocked: () => {
          const { unlockedIds } = get()
          return allAchievements.map((a) => ({
            ...a,
            unlockedAt: unlockedIds.includes(a.id) ? 'unlocked' : undefined,
          })).filter((a) => a.unlockedAt)
        },
        getLocked: () => {
          const { unlockedIds } = get()
          return allAchievements.filter((a) => !unlockedIds.includes(a.id))
        },
        getNewAchievements: () => {
          const { unlockedIds } = get()
          return allAchievements
            .filter((a) => unlockedIds.includes(a.id))
            .map((a) => ({ ...a, unlockedAt: 'new' }))
        },
        clearNewAchievements: () => {},
      }
    },
    { name: 'focus-reader-achievements' }
  )
)
