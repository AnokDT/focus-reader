import { useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, X, Lock, Check } from 'lucide-react'
import { useAchievementStore, type Achievement } from '@/stores/achievementStore'

interface AchievementPopupProps {
  isOpen: boolean
  onClose: () => void
}

export function AchievementPopup({ isOpen, onClose }: AchievementPopupProps) {
  const getUnlocked = useAchievementStore((s) => s.getUnlocked)
  const getLocked = useAchievementStore((s) => s.getLocked)
  const unlocked = useMemo(() => getUnlocked(), [getUnlocked])
  const locked = useMemo(() => getLocked(), [getLocked])

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[95]"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed top-[10%] left-1/2 -translate-x-1/2 w-full max-w-md z-[96] bg-[var(--color-surface-1)] rounded-2xl shadow-2xl border border-[var(--color-surface-3)] overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-surface-3)]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                  <Trophy size={16} className="text-white" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">Achievements</h2>
                  <p className="text-[10px] text-[var(--color-text-tertiary)]">{unlocked.length} / {unlocked.length + locked.length} unlocked</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 rounded-lg text-[var(--color-text-tertiary)] hover:bg-[var(--color-surface-2)]">
                <X size={16} />
              </button>
            </div>

            {/* Content */}
            <div className="max-h-[60vh] overflow-y-auto p-5 space-y-3">
              {/* Unlocked */}
              {unlocked.length > 0 && (
                <div>
                  <h3 className="text-[10px] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wider mb-2">Unlocked</h3>
                  <div className="space-y-2">
                    {unlocked.map((a) => (
                      <AchievementCard key={a.id} achievement={a} isUnlocked />
                    ))}
                  </div>
                </div>
              )}

              {/* Locked */}
              {locked.length > 0 && (
                <div>
                  <h3 className="text-[10px] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wider mb-2">Locked</h3>
                  <div className="space-y-2">
                    {locked.map((a) => (
                      <AchievementCard key={a.id} achievement={a} isUnlocked={false} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

function AchievementCard({ achievement, isUnlocked }: { achievement: Achievement; isUnlocked: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
        isUnlocked
          ? 'bg-[var(--color-surface-0)] border-amber-500/30'
          : 'bg-[var(--color-surface-2)] border-[var(--color-surface-3)] opacity-60'
      }`}
    >
      <div className={`text-2xl ${!isUnlocked ? 'grayscale opacity-50' : ''}`}>
        {isUnlocked ? achievement.icon : '🔒'}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${isUnlocked ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-text-tertiary)]'}`}>
          {achievement.name}
        </p>
        <p className="text-[10px] text-[var(--color-text-tertiary)]">{achievement.description}</p>
      </div>
      {isUnlocked && (
        <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
          <Check size={10} className="text-emerald-500" />
        </div>
      )}
    </motion.div>
  )
}
