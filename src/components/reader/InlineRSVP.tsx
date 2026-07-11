import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Pause, SkipBack, SkipForward, X, Minus, Plus } from 'lucide-react'

interface WordPosition {
  word: string
  x: number
  y: number
  width: number
  height: number
  isItem?: boolean
}

interface InlineRSVPProps {
  text: string
  positions: WordPosition[]
  onClose: () => void
}

// Unicode-aware word tokenization — works for English, Malayalam, Arabic, Hindi, etc.
function tokenizeWords(text: string): string[] {
  // Match word characters including Unicode letters/digits, or single punctuation
  const tokens: string[] = []
  const regex = /[\p{L}\p{N}]+/gu
  let match
  while ((match = regex.exec(text)) !== null) {
    tokens.push(match[0])
  }
  return tokens
}

// Build a mapping from token index → position index + offset within item
function buildWordPositionMap(
  tokens: string[],
  positions: WordPosition[]
): Map<number, { posIdx: number; subOffset: number }> {
  const map = new Map<number, { posIdx: number; subOffset: number }>()
  let tokenIdx = 0

  for (let posIdx = 0; posIdx < positions.length && tokenIdx < tokens.length; posIdx++) {
    const pos = positions[posIdx]
    // Split the item text into words using same tokenizer
    const itemWords = tokenizeWords(pos.word)

    for (let subIdx = 0; subIdx < itemWords.length && tokenIdx < tokens.length; subIdx++) {
      // Try to match by content
      if (itemWords[subIdx] === tokens[tokenIdx]) {
        map.set(tokenIdx, { posIdx, subOffset: subIdx })
        tokenIdx++
      } else {
        // Fallback: advance both — this handles cases where tokenizers differ slightly
        map.set(tokenIdx, { posIdx, subOffset: subIdx })
        tokenIdx++
      }
    }
  }

  // Map any remaining tokens to the last position
  while (tokenIdx < tokens.length) {
    map.set(tokenIdx, { posIdx: Math.max(0, positions.length - 1), subOffset: 0 })
    tokenIdx++
  }

  return map
}

export function InlineRSVP({ text, positions, onClose }: InlineRSVPProps) {
  const tokens = useMemo(() => tokenizeWords(text), [text])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [wpm, setWpm] = useState(300)
  const [showControls, setShowControls] = useState(true)
  const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined)
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  // Build position map
  const wordPositionMap = useMemo(() => buildWordPositionMap(tokens, positions), [tokens, positions])

  const currentWord = tokens[currentIndex] || ''
  const progress = tokens.length > 0 ? (currentIndex / tokens.length) * 100 : 0

  // Get position for current word
  const currentPosition = useMemo(() => {
    if (positions.length === 0 || currentIndex >= tokens.length) return null
    const mapping = wordPositionMap.get(currentIndex)
    if (!mapping) return null

    const pos = positions[mapping.posIdx]
    if (!pos) return null

    // If the item contains multiple words, estimate the sub-word position
    if (pos.isItem && mapping.subOffset > 0) {
      const itemWords = tokenizeWords(pos.word)
      const totalWords = itemWords.length || 1
      const wordWidth = pos.width / totalWords
      return {
        ...pos,
        x: pos.x + wordWidth * mapping.subOffset,
        width: wordWidth,
      }
    }

    return pos
  }, [positions, currentIndex, wordPositionMap, tokens.length])

  // Auto-play timer
  useEffect(() => {
    if (isPlaying && currentIndex < tokens.length - 1) {
      const msPerWord = (60 / wpm) * 1000
      intervalRef.current = setInterval(() => {
        setCurrentIndex((prev) => {
          if (prev >= tokens.length - 1) {
            setIsPlaying(false)
            return prev
          }
          return prev + 1
        })
      }, msPerWord)
    }
    return () => clearInterval(intervalRef.current)
  }, [isPlaying, wpm, tokens.length, currentIndex])

  useEffect(() => {
    if (currentIndex >= tokens.length - 1 && isPlaying) setIsPlaying(false)
  }, [currentIndex, tokens.length, isPlaying])

  // Hide controls after inactivity
  useEffect(() => {
    if (showControls) {
      clearTimeout(controlsTimeoutRef.current)
      controlsTimeoutRef.current = setTimeout(() => {
        if (isPlaying) setShowControls(false)
      }, 3000)
    }
    return () => clearTimeout(controlsTimeoutRef.current)
  }, [showControls, isPlaying, currentIndex])

  const handlePlay = useCallback(() => {
    if (currentIndex >= tokens.length - 1) setCurrentIndex(0)
    setIsPlaying(true)
    setShowControls(true)
  }, [currentIndex, tokens.length])

  const handlePause = useCallback(() => {
    setIsPlaying(false)
    setShowControls(true)
  }, [])

  const handlePrev = useCallback(() => {
    setIsPlaying(false)
    setCurrentIndex((p) => Math.max(0, p - 1))
    setShowControls(true)
  }, [])

  const handleNext = useCallback(() => {
    setIsPlaying(false)
    setCurrentIndex((p) => Math.min(tokens.length - 1, p + 1))
    setShowControls(true)
  }, [tokens.length])

  // Keyboard
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === ' ') { e.preventDefault(); isPlaying ? handlePause() : handlePlay() }
      if (e.key === 'ArrowLeft') handlePrev()
      if (e.key === 'ArrowRight') handleNext()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [isPlaying, onClose, handlePlay, handlePause, handlePrev, handleNext])

  // Show controls on mouse move
  useEffect(() => {
    const handleMove = () => setShowControls(true)
    window.addEventListener('mousemove', handleMove)
    return () => window.removeEventListener('mousemove', handleMove)
  }, [])

  return (
    <>
      {/* Word highlight overlay ON the PDF page */}
      <AnimatePresence>
        {currentPosition && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.08 }}
            className="fixed pointer-events-none z-[60]"
            style={{
              left: `${currentPosition.x * 100}%`,
              top: `${currentPosition.y * 100}%`,
              width: `${Math.max(currentPosition.width * 100, 3)}%`,
              height: `${Math.max(currentPosition.height * 100, 2)}%`,
            }}
          >
            <div
              className="absolute -inset-[2px] rounded"
              style={{
                background: 'rgba(var(--color-accent-rgb, 59, 130, 246), 0.22)',
                border: '2px solid var(--color-accent)',
                boxShadow: '0 0 16px rgba(var(--color-accent-rgb, 59, 130, 246), 0.25)',
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating control bar */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            data-rsvp-controls
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
            className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[70]"
          >
            <div className="bg-[var(--color-surface-0)]/95 backdrop-blur-2xl border border-[var(--color-surface-3)] rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.15)] overflow-hidden">
              {/* Current word */}
              <div className="px-6 pt-3 pb-1">
                <div className="text-center" style={{ fontFamily: 'var(--font-reading)' }}>
                  <span className="text-lg font-bold text-[var(--color-accent)]">{currentWord}</span>
                  <span className="text-xs text-[var(--color-text-tertiary)] ml-2">
                    {currentIndex + 1}/{tokens.length}
                  </span>
                </div>
              </div>

              {/* Progress */}
              <div className="px-5">
                <div className="relative h-1 bg-[var(--color-surface-3)] rounded-full overflow-hidden">
                  <motion.div
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-[var(--color-accent)] to-purple-500 rounded-full"
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.1 }}
                  />
                </div>
              </div>

              {/* Controls */}
              <div className="px-5 py-3 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <button onClick={() => setWpm((w) => Math.max(100, w - 25))} className="p-1.5 rounded-lg text-[var(--color-text-tertiary)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text-primary)] transition-colors">
                    <Minus size={14} />
                  </button>
                  <span className="text-xs font-semibold text-[var(--color-accent)] tabular-nums w-14 text-center">
                    {wpm} <span className="text-[9px] font-normal text-[var(--color-text-tertiary)]">WPM</span>
                  </span>
                  <button onClick={() => setWpm((w) => Math.min(800, w + 25))} className="p-1.5 rounded-lg text-[var(--color-text-tertiary)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text-primary)] transition-colors">
                    <Plus size={14} />
                  </button>
                </div>

                <div className="flex items-center gap-1.5">
                  <button onClick={handlePrev} className="p-2 rounded-lg text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-2)] transition-colors">
                    <SkipBack size={16} />
                  </button>
                  <button
                    onClick={() => isPlaying ? handlePause() : handlePlay()}
                    className="p-3 rounded-xl bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)] transition-colors shadow-lg shadow-[var(--color-accent)]/25"
                  >
                    {isPlaying ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
                  </button>
                  <button onClick={handleNext} className="p-2 rounded-lg text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-2)] transition-colors">
                    <SkipForward size={16} />
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button onClick={onClose} className="p-1.5 rounded-lg text-[var(--color-text-tertiary)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text-primary)] transition-colors">
                    <X size={14} />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
