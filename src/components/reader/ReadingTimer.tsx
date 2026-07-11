import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Clock, Pause, Play } from 'lucide-react'

export function ReadingTimer() {
  const [elapsed, setElapsed] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined)

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      if (!isPaused) {
        setElapsed((e) => e + 1)
      }
    }, 1000)
    return () => clearInterval(intervalRef.current)
  }, [isPaused])

  const hours = Math.floor(elapsed / 3600)
  const minutes = Math.floor((elapsed % 3600) / 60)
  const seconds = elapsed % 60

  const pad = (n: number) => n.toString().padStart(2, '0')

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex items-center gap-2 px-3 py-1.5 bg-[var(--color-surface-0)]/80 backdrop-blur-lg border border-[var(--color-surface-3)] rounded-full shadow-lg"
    >
      <Clock size={12} className="text-[var(--color-accent)]" />
      <span className="text-xs font-mono font-medium text-[var(--color-text-primary)] tabular-nums">
        {hours > 0 ? `${pad(hours)}:` : ''}{pad(minutes)}:{pad(seconds)}
      </span>
      <button
        onClick={() => setIsPaused(!isPaused)}
        className="p-0.5 rounded text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors"
      >
        {isPaused ? <Play size={10} /> : <Pause size={10} />}
      </button>
    </motion.div>
  )
}
