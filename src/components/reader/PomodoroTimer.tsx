import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Timer, Play, Pause, RotateCcw, Coffee, BookOpen } from 'lucide-react'

interface PomodoroTimerProps {
  isOpen: boolean
  onClose: () => void
}

type PomodoroState = 'idle' | 'reading' | 'break' | 'paused'
type SessionType = 'reading' | 'break'

const DEFAULTS = {
  readingMinutes: 25,
  breakMinutes: 5,
  longBreakMinutes: 15,
  sessionsBeforeLongBreak: 4,
}

export function PomodoroTimer({ isOpen, onClose }: PomodoroTimerProps) {
  const [state, setState] = useState<PomodoroState>('idle')
  const [sessionType, setSessionType] = useState<SessionType>('reading')
  const [timeLeft, setTimeLeft] = useState(DEFAULTS.readingMinutes * 60)
  const [totalTime, setTotalTime] = useState(DEFAULTS.readingMinutes * 60)
  const [completedSessions, setCompletedSessions] = useState(0)
  const intervalRef = useRef<number | null>(null)

  const isLongBreak = completedSessions > 0 && completedSessions % DEFAULTS.sessionsBeforeLongBreak === 0

  const progress = totalTime > 0 ? ((totalTime - timeLeft) / totalTime) * 100 : 0

  const startSession = useCallback((type: SessionType) => {
    const minutes = type === 'reading'
      ? DEFAULTS.readingMinutes
      : isLongBreak
      ? DEFAULTS.longBreakMinutes
      : DEFAULTS.breakMinutes

    setSessionType(type)
    setTimeLeft(minutes * 60)
    setTotalTime(minutes * 60)
    setState(type === 'reading' ? 'reading' : 'break')
  }, [isLongBreak])

  const togglePause = useCallback(() => {
    setState((s) => s === 'paused' ? (sessionType === 'reading' ? 'reading' : 'break') : 'paused')
  }, [sessionType])

  const reset = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    setState('idle')
    setTimeLeft(DEFAULTS.readingMinutes * 60)
    setTotalTime(DEFAULTS.readingMinutes * 60)
    setCompletedSessions(0)
  }, [])

  useEffect(() => {
    if (state === 'reading' || state === 'break') {
      intervalRef.current = window.setInterval(() => {
        setTimeLeft((t) => {
          if (t <= 1) {
            clearInterval(intervalRef.current!)
            // Session complete
            if (sessionType === 'reading') {
              setCompletedSessions((c) => c + 1)
              setTimeout(() => startSession('break'), 500)
            } else {
              setTimeout(() => startSession('reading'), 500)
            }
            return 0
          }
          return t - 1
        })
      }, 1000)
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [state, sessionType, startSession])

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  const circumference = 2 * Math.PI * 54
  const strokeDashoffset = circumference - (progress / 100) * circumference

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          className="bg-[var(--color-surface-1)] rounded-3xl shadow-2xl p-8 w-[340px]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className={`p-2 rounded-xl ${sessionType === 'reading' ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                {sessionType === 'reading' ? <BookOpen size={18} /> : <Coffee size={18} />}
              </div>
              <div>
                <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">
                  {sessionType === 'reading' ? 'Reading Time' : 'Break Time'}
                </h2>
                <p className="text-[10px] text-[var(--color-text-tertiary)]">
                  Session {completedSessions + 1}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg text-[var(--color-text-tertiary)] hover:bg-[var(--color-surface-2)]">
              ✕
            </button>
          </div>

          {/* Timer circle */}
          <div className="flex justify-center mb-6">
            <div className="relative w-32 h-32">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="54" fill="none" stroke="var(--color-surface-3)" strokeWidth="6" />
                <circle
                  cx="60" cy="60" r="54" fill="none"
                  stroke={sessionType === 'reading' ? '#f59e0b' : '#10b981'}
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  className="transition-all duration-1000"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-[var(--color-text-primary)] tabular-nums font-mono">
                  {formatTime(timeLeft)}
                </span>
              </div>
            </div>
          </div>

          {/* Session dots */}
          <div className="flex items-center justify-center gap-2 mb-6">
            {Array.from({ length: DEFAULTS.sessionsBeforeLongBreak }, (_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-colors ${
                  i < completedSessions % DEFAULTS.sessionsBeforeLongBreak
                    ? 'bg-amber-500'
                    : 'bg-[var(--color-surface-3)]'
                }`}
              />
            ))}
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={reset}
              className="p-3 rounded-xl bg-[var(--color-surface-2)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-3)] transition-colors"
            >
              <RotateCcw size={18} />
            </button>
            <button
              onClick={() => {
                if (state === 'idle') {
                  startSession('reading')
                } else {
                  togglePause()
                }
              }}
              className={`px-8 py-3 rounded-xl font-medium text-white transition-colors ${
                state === 'reading' || state === 'break'
                  ? 'bg-amber-500 hover:bg-amber-600'
                  : 'bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)]'
              }`}
            >
              {state === 'reading' || state === 'break' ? (
                <span className="flex items-center gap-2"><Pause size={16} /> Pause</span>
              ) : state === 'paused' ? (
                <span className="flex items-center gap-2"><Play size={16} /> Resume</span>
              ) : (
                <span className="flex items-center gap-2"><Play size={16} /> Start</span>
              )}
            </button>
          </div>

          {/* Info */}
          <p className="text-center text-[10px] text-[var(--color-text-tertiary)] mt-4">
            {DEFAULTS.readingMinutes}min reading · {DEFAULTS.breakMinutes}min break · {DEFAULTS.longBreakMinutes}min long break
          </p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
