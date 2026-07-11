import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { useSettingsStore } from '@/stores/settingsStore'

export function AppShell() {
  const theme = useSettingsStore((s) => s.theme)
  const reduceMotion = useSettingsStore((s) => s.reduceMotion)
  const largeText = useSettingsStore((s) => s.largeText)
  const highContrast = useSettingsStore((s) => s.highContrast)
  const dyslexiaFriendly = useSettingsStore((s) => s.dyslexiaFriendly)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  useEffect(() => {
    document.documentElement.classList.toggle('reduce-motion', reduceMotion)
    document.documentElement.classList.toggle('large-text', largeText)
    document.documentElement.classList.toggle('high-contrast', highContrast)
    document.documentElement.classList.toggle('dyslexia-friendly', dyslexiaFriendly)
  }, [reduceMotion, largeText, highContrast, dyslexiaFriendly])

  return (
    <div className="h-screen w-screen overflow-hidden bg-[var(--color-surface-0)] theme-transition">
      <Outlet />
    </div>
  )
}
