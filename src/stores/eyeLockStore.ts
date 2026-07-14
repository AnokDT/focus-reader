import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface EyeLockState {
  enabled: boolean
  anchorEnabled: boolean
  anchorIntensity: number
  corridorEnabled: boolean
  corridorIntensity: number
  beautifulMode: boolean
  // Typography
  fontFamily: string
  fontSize: number
  lineHeight: number
  paragraphSpacing: number
  textWidth: number
  fontWeight: number
  letterSpacing: number
  // Actions
  setEnabled: (enabled: boolean) => void
  setAnchorEnabled: (enabled: boolean) => void
  setAnchorIntensity: (intensity: number) => void
  setCorridorEnabled: (enabled: boolean) => void
  setCorridorIntensity: (intensity: number) => void
  setBeautifulMode: (enabled: boolean) => void
  setFontFamily: (family: string) => void
  setFontSize: (size: number) => void
  setLineHeight: (height: number) => void
  setParagraphSpacing: (spacing: number) => void
  setTextWidth: (width: number) => void
  setFontWeight: (weight: number) => void
  setLetterSpacing: (spacing: number) => void
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
      // Typography defaults
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSize: 18,
      lineHeight: 1.7,
      paragraphSpacing: 1.2,
      textWidth: 680,
      fontWeight: 400,
      letterSpacing: 0.01,
      // Actions
      setEnabled: (enabled) => set({ enabled }),
      setAnchorEnabled: (anchorEnabled) => set({ anchorEnabled }),
      setAnchorIntensity: (anchorIntensity) => set({ anchorIntensity }),
      setCorridorEnabled: (corridorEnabled) => set({ corridorEnabled }),
      setCorridorIntensity: (corridorIntensity) => set({ corridorIntensity }),
      setBeautifulMode: (beautifulMode) => set({ beautifulMode }),
      setFontFamily: (fontFamily) => set({ fontFamily }),
      setFontSize: (fontSize) => set({ fontSize }),
      setLineHeight: (lineHeight) => set({ lineHeight }),
      setParagraphSpacing: (paragraphSpacing) => set({ paragraphSpacing }),
      setTextWidth: (textWidth) => set({ textWidth }),
      setFontWeight: (fontWeight) => set({ fontWeight }),
      setLetterSpacing: (letterSpacing) => set({ letterSpacing }),
    }),
    {
      name: 'focus-reader-eyelock',
    }
  )
)
