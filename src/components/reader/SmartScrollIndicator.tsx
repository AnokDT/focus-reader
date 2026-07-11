import { useEffect, useState, useRef } from 'react'
import { motion } from 'framer-motion'

interface SmartScrollIndicatorProps {
  scrollRef: React.RefObject<HTMLDivElement | null>
  totalPages: number
  currentPage: number
}

export function SmartScrollIndicator({ scrollRef, totalPages, currentPage }: SmartScrollIndicatorProps) {
  const [scrollProgress, setScrollProgress] = useState(0)
  const [isVisible, setIsVisible] = useState(false)
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = el
      const progress = scrollHeight > clientHeight
        ? (scrollTop / (scrollHeight - clientHeight)) * 100
        : 0
      setScrollProgress(Math.min(100, Math.max(0, progress)))
      setIsVisible(true)

      clearTimeout(hideTimeoutRef.current)
      hideTimeoutRef.current = setTimeout(() => setIsVisible(false), 2000)
    }

    el.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      el.removeEventListener('scroll', handleScroll)
      clearTimeout(hideTimeoutRef.current)
    }
  }, [scrollRef])

  // Generate chapter markers (every 10 pages)
  const markers = Array.from({ length: Math.ceil(totalPages / 10) }, (_, i) => ({
    position: ((i * 10) / totalPages) * 100,
    label: `${i * 10 + 1}`,
  }))

  return (
    <motion.div
      className="fixed right-3 top-1/2 -translate-y-1/2 z-40 flex flex-col items-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: isVisible ? 1 : 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Track */}
      <div className="relative w-1.5 h-48 bg-[var(--color-surface-3)] rounded-full overflow-hidden">
        {/* Progress fill */}
        <motion.div
          className="absolute bottom-0 left-0 right-0 rounded-full"
          style={{
            background: 'linear-gradient(to top, var(--color-accent), #8b5cf6)',
          }}
          animate={{ height: `${scrollProgress}%` }}
          transition={{ duration: 0.1 }}
        />

        {/* Current page indicator */}
        <motion.div
          className="absolute left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-[var(--color-accent)] border-2 border-white shadow-lg"
          animate={{ bottom: `${scrollProgress}%` }}
          transition={{ duration: 0.1 }}
          style={{ marginBottom: '-6px' }}
        />

        {/* Chapter markers */}
        {markers.map((marker, i) => (
          <div
            key={i}
            className="absolute left-1/2 -translate-x-1/2 w-2.5 h-px bg-[var(--color-text-tertiary)]"
            style={{ bottom: `${marker.position}%` }}
          />
        ))}
      </div>

      {/* Page indicator */}
      <div className="mt-2 px-1.5 py-0.5 rounded bg-[var(--color-surface-0)]/80 backdrop-blur border border-[var(--color-surface-3)]">
        <span className="text-[9px] font-medium text-[var(--color-text-tertiary)] tabular-nums">
          {currentPage}/{totalPages}
        </span>
      </div>
    </motion.div>
  )
}
