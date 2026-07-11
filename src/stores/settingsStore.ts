import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AppSettings, Theme, FontFamily, HighlightColor } from '@/types/settings'

const defaultHighlightColors: HighlightColor[] = [
  { name: 'Yellow', color: '#fbbf24' },
  { name: 'Green', color: '#34d399' },
  { name: 'Blue', color: '#60a5fa' },
  { name: 'Pink', color: '#f472b6' },
  { name: 'Orange', color: '#fb923c' },
]

const defaultSettings: AppSettings = {
  theme: 'light',
  fontFamily: 'sans',
  fontSize: 16,
  lineSpacing: 1.5,
  highlightColors: defaultHighlightColors,
  sidebarWidth: 280,
  showPageNumbers: true,
  scrollBehavior: 'smooth',
  keyboardShortcuts: [
    { key: 'ArrowLeft', action: 'prevPage', label: 'Previous Page' },
    { key: 'ArrowRight', action: 'nextPage', label: 'Next Page' },
    { key: 'f', ctrl: true, action: 'search', label: 'Search' },
    { key: 'b', ctrl: true, action: 'toggleSidebar', label: 'Toggle Sidebar' },
    { key: '=', ctrl: true, action: 'zoomIn', label: 'Zoom In' },
    { key: '-', ctrl: true, action: 'zoomOut', label: 'Zoom Out' },
    { key: '0', ctrl: true, action: 'resetZoom', label: 'Reset Zoom' },
    { key: ' ', action: 'toggleFocus', label: 'Toggle Focus Mode' },
    { key: 'Escape', action: 'exitFocus', label: 'Exit Focus Mode' },
  ],
  dailyGoalMinutes: 30,
  dailyGoalEnabled: true,
  highContrast: false,
  reduceMotion: false,
  largeText: false,
  dyslexiaFriendly: false,
}

interface SettingsState extends AppSettings {
  setTheme: (theme: Theme) => void
  setFontFamily: (font: FontFamily) => void
  setFontSize: (size: number) => void
  setLineSpacing: (spacing: number) => void
  setHighlightColors: (colors: HighlightColor[]) => void
  setSidebarWidth: (width: number) => void
  setShowPageNumbers: (show: boolean) => void
  setScrollBehavior: (behavior: 'smooth' | 'instant') => void
  setDailyGoalMinutes: (minutes: number) => void
  setDailyGoalEnabled: (enabled: boolean) => void
  setHighContrast: (enabled: boolean) => void
  setReduceMotion: (enabled: boolean) => void
  setLargeText: (enabled: boolean) => void
  setDyslexiaFriendly: (enabled: boolean) => void
  resetSettings: () => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...defaultSettings,
      setTheme: (theme: Theme) => {
        document.documentElement.setAttribute('data-theme', theme)
        set({ theme })
      },
      setFontFamily: (fontFamily: FontFamily) => set({ fontFamily }),
      setFontSize: (fontSize: number) => set({ fontSize }),
      setLineSpacing: (lineSpacing: number) => set({ lineSpacing }),
      setHighlightColors: (highlightColors: HighlightColor[]) => set({ highlightColors }),
      setSidebarWidth: (sidebarWidth: number) => set({ sidebarWidth }),
      setShowPageNumbers: (showPageNumbers: boolean) => set({ showPageNumbers }),
      setScrollBehavior: (scrollBehavior: 'smooth' | 'instant') => set({ scrollBehavior }),
      setDailyGoalMinutes: (dailyGoalMinutes: number) => set({ dailyGoalMinutes }),
      setDailyGoalEnabled: (dailyGoalEnabled: boolean) => set({ dailyGoalEnabled }),
      setHighContrast: (highContrast: boolean) => set({ highContrast }),
      setReduceMotion: (reduceMotion: boolean) => set({ reduceMotion }),
      setLargeText: (largeText: boolean) => set({ largeText }),
      setDyslexiaFriendly: (dyslexiaFriendly: boolean) => set({ dyslexiaFriendly }),
      resetSettings: () => set(defaultSettings),
    }),
    {
      name: 'focus-reader-settings',
    }
  )
)
