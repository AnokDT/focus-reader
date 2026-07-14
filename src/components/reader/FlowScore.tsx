import { memo } from 'react'
import { motion } from 'framer-motion'

interface FlowScoreProps {
  score: number
  compact?: boolean
}

function FlowScoreInner({ score, compact = false }: FlowScoreProps) {
  const color = score > 80 ? '#22c55e' : score > 60 ? '#eab308' : score > 40 ? '#f97316' : '#ef4444'
  const label = score > 80 ? 'Deep Flow' : score > 60 ? 'In the Zone' : score > 40 ? 'Warming Up' : 'Getting Started'
  const ringProgress = (score / 100) * 283

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div className="relative w-5 h-5">
          <svg className="w-5 h-5 -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" fill="none" stroke="var(--color-surface-3)" strokeWidth="8" />
            <motion.circle
              cx="50" cy="50" r="45" fill="none" stroke={color} strokeWidth="8"
              strokeDasharray="283"
              animate={{ strokeDashoffset: 283 - ringProgress }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              strokeLinecap="round"
            />
          </svg>
        </div>
        <span className="text-[10px] font-medium" style={{ color }}>{score}%</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3">
      <div className="relative w-12 h-12">
        <svg className="w-12 h-12 -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="45" fill="none" stroke="var(--color-surface-3)" strokeWidth="6" />
          <motion.circle
            cx="50" cy="50" r="45" fill="none" stroke={color} strokeWidth="6"
            strokeDasharray="283"
            animate={{ strokeDashoffset: 283 - ringProgress }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-bold" style={{ color }}>{score}</span>
        </div>
      </div>
      <div>
        <div className="text-xs font-semibold" style={{ color }}>{label}</div>
        <div className="text-[10px] text-[var(--color-text-tertiary)]">Flow Score</div>
      </div>
    </div>
  )
}

export const FlowScore = memo(FlowScoreInner)
