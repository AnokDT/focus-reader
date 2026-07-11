import { create } from 'zustand'
import type { GuideStyle } from '@/types/reader'

interface FocusState {
  enabled: boolean
  style: GuideStyle
  width: number
  opacity: number
  color: string
  thickness: number
  speed: number
  autoScroll: boolean
  isPaused: boolean
  guidePosition: number

  toggleFocus: () => void
  setEnabled: (enabled: boolean) => void
  setStyle: (style: GuideStyle) => void
  setWidth: (width: number) => void
  setOpacity: (opacity: number) => void
  setColor: (color: string) => void
  setThickness: (thickness: number) => void
  setSpeed: (speed: number) => void
  toggleAutoScroll: () => void
  togglePause: () => void
  setGuidePosition: (position: number) => void
  moveGuideUp: () => void
  moveGuideDown: () => void
}

export const useFocusStore = create<FocusState>()((set) => ({
  enabled: false,
  style: 'line',
  width: 80,
  opacity: 0.15,
  color: 'var(--color-focus-guide)',
  thickness: 3,
  speed: 250,
  autoScroll: false,
  isPaused: false,
  guidePosition: 50,

  toggleFocus: () => set((state) => ({ enabled: !state.enabled })),
  setEnabled: (enabled) => set({ enabled }),
  setStyle: (style) => set({ style }),
  setWidth: (width) => set({ width }),
  setOpacity: (opacity) => set({ opacity }),
  setColor: (color) => set({ color }),
  setThickness: (thickness) => set({ thickness }),
  setSpeed: (speed) => set({ speed }),
  toggleAutoScroll: () => set((state) => ({ autoScroll: !state.autoScroll, isPaused: false })),
  togglePause: () => set((state) => ({ isPaused: !state.isPaused })),
  setGuidePosition: (position) => set({ guidePosition: Math.max(0, Math.min(100, position)) }),
  moveGuideUp: () =>
    set((state) => ({
      guidePosition: Math.max(0, state.guidePosition - 2),
    })),
  moveGuideDown: () =>
    set((state) => ({
      guidePosition: Math.min(100, state.guidePosition + 2),
    })),
}))
