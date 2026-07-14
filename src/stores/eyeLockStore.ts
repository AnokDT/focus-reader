import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface EyeLockState {
  enabled: boolean
  anchorEnabled: boolean
  anchorIntensity: number
  corridorEnabled: boolean
  corridorIntensity: number
  beautifulMode: boolean
  setEnabled: (enabled: boolean) => void
  setAnchorEnabled: (enabled: boolean) => void
  setAnchorIntensity: (intensity: number) => void
  setCorridorEnabled: (enabled: boolean) => void
  setCorridorIntensity: (intensity: number) => void
  setBeautifulMode: (enabled: boolean) => void
}

export const useEyeLockStore = create<EyeLockState>()(
  persist(
    (set) => ({
      enabled: true,
      anchorEnabled: true,
      anchorIntensity: 12,
      corridorEnabled: true,
      corridorIntensity: 15,
      beautifulMode: true,
      setEnabled: (enabled) => set({ enabled }),
      setAnchorEnabled: (anchorEnabled) => set({ anchorEnabled }),
      setAnchorIntensity: (anchorIntensity) => set({ anchorIntensity }),
      setCorridorEnabled: (corridorEnabled) => set({ corridorEnabled }),
      setCorridorIntensity: (corridorIntensity) => set({ corridorIntensity }),
      setBeautifulMode: (beautifulMode) => set({ beautifulMode }),
    }),
    {
      name: 'focus-reader-eyelock',
    }
  )
)
