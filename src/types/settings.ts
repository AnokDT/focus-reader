export type Theme = 'light' | 'dark' | 'sepia'
export type FontFamily = 'sans' | 'serif' | 'mono'

export interface HighlightColor {
  name: string
  color: string
}

export interface KeyboardShortcut {
  key: string
  ctrl?: boolean
  shift?: boolean
  alt?: boolean
  action: string
  label: string
}

export interface AppSettings {
  theme: Theme
  fontFamily: FontFamily
  fontSize: number
  lineSpacing: number
  highlightColors: HighlightColor[]
  sidebarWidth: number
  showPageNumbers: boolean
  scrollBehavior: 'smooth' | 'instant'
  keyboardShortcuts: KeyboardShortcut[]
  dailyGoalMinutes: number
  dailyGoalEnabled: boolean
  highContrast: boolean
  reduceMotion: boolean
  largeText: boolean
  dyslexiaFriendly: boolean
}
