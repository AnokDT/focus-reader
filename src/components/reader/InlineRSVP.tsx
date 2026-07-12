import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Pause, SkipBack, SkipForward, X, Minus, Plus, ChevronRight, ChevronLeft, Zap, Eye, EyeOff, Timer } from 'lucide-react'
import type { WordPos } from '@/components/pdf/PDFPageRenderer'

interface InlineRSVPProps {
  text: string
  wordPositions: WordPos[]
  onClose: () => void
  pageContainerRef?: React.RefObject<HTMLDivElement | null>
  pageNumber?: number
  totalPages?: number
  onPageEnd?: () => void
  onPageStart?: () => void
  autoPlay?: boolean
  startIndex?: number
}

function tokenize(text: string): string[] {
  const tokens: string[] = []
  const regex = /[\p{L}\p{N}]+/gu
  let match
  while ((match = regex.exec(text)) !== null) {
    tokens.push(match[0])
  }
  return tokens
}

function buildPositionMap(tokens: string[], positions: WordPos[]): Map<number, WordPos> {
  const map = new Map<number, WordPos>()
  let posIdx = 0

  for (let t = 0; t < tokens.length; t++) {
    let found = false
    for (let search = posIdx; search < Math.min(posIdx + 8, positions.length); search++) {
      if (positions[search].word === tokens[t]) {
        map.set(t, positions[search])
        posIdx = search + 1
        found = true
        break
      }
    }
    if (!found && positions.length > 0) {
      const prevPos = positions[Math.max(0, posIdx - 1)]
      const nextPos = positions[Math.min(posIdx, positions.length - 1)]
      const avgX = (prevPos.x + nextPos.x) / 2
      const avgY = (prevPos.y + nextPos.y) / 2
      map.set(t, {
        word: tokens[t],
        x: avgX + t * 40,
        y: avgY,
        width: tokens[t].length * 10,
        height: prevPos.height,
      })
    }
  }
  return map
}

// Detect sentence-ending punctuation for smart pause
function isSentenceEnd(word: string): boolean {
  return /[.!?;:]$/.test(word)
}

// Detect paragraph-break-worthy punctuation
function isParagraphBreak(word: string): boolean {
  return /[.!?]$/.test(word)
}

// Bionic reading: bold first N letters — thicker, more obvious
function BionicWord({ word, boldChars = 3 }: { word: string; boldChars?: number }) {
  const split = Math.min(boldChars, word.length)
  const bold = word.slice(0, split)
  const rest = word.slice(split)
  return (
    <span className="select-none">
      <span
        className="font-black"
        style={{
          color: 'var(--color-accent)',
          textShadow: '0 0 8px rgba(var(--color-accent-rgb, 59, 130, 246), 0.4)',
          fontSize: '1.05em',
        }}
      >
        {bold}
      </span>
      <span className="font-normal opacity-50" style={{ letterSpacing: '0.02em' }}>
        {rest}
      </span>
    </span>
  )
}

export function InlineRSVP({
  text,
  wordPositions,
  onClose,
  pageContainerRef,
  pageNumber,
  totalPages,
  onPageEnd,
  onPageStart,
  autoPlay = false,
  startIndex = 0,
}: InlineRSVPProps) {
  const tokens = useMemo(() => tokenize(text), [text])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [wpm, setWpm] = useState(300)
  const [showControls, setShowControls] = useState(true)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [bionicMode, setBionicMode] = useState(true)
  const [focusTunnel, setFocusTunnel] = useState(false)
  const [smartPauseEnabled, setSmartPauseEnabled] = useState(true)
  const [isSmartPaused, setIsSmartPaused] = useState(false)
  const [showFocusGuide, setShowFocusGuide] = useState(true)

  // Flow score tracking
  const [flowScore, setFlowScore] = useState(100)
  const [readingStreak, setReadingStreak] = useState(0)
  const [avgWpm, setAvgWpm] = useState(0)
  const wpmHistoryRef = useRef<number[]>([])

  // Reading rhythm — visual beat
  const [beatActive, setBeatActive] = useState(false)

  // Transition animation state
  const [displayWord, setDisplayWord] = useState(() => tokens[0] || '')
  const [wordAnimKey, setWordAnimKey] = useState(0)

  const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined)
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  const prevTextRef = useRef(text)
  const prevStartIndexRef = useRef(-1)
  const autoPlayRef = useRef(autoPlay)
  const smartPauseTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  autoPlayRef.current = autoPlay

  const posMap = useMemo(() => buildPositionMap(tokens, wordPositions), [tokens, wordPositions])

  // When text changes (new page), reset to 0
  useEffect(() => {
    if (prevTextRef.current !== text) {
      prevTextRef.current = text
      setCurrentIndex(0)
      prevStartIndexRef.current = -1
      setIsTransitioning(false)
      setDisplayWord('')
      if (autoPlayRef.current) {
        setTimeout(() => setIsPlaying(true), 300)
      }
    }
  }, [text])

  // When startIndex changes (user clicked a word), jump to that word
  useEffect(() => {
    if (startIndex >= 0 && startIndex < tokens.length && startIndex !== prevStartIndexRef.current) {
      prevStartIndexRef.current = startIndex
      setCurrentIndex(startIndex)
      setTimeout(() => setIsPlaying(true), 100)
    }
  }, [startIndex, tokens.length])

  // Smooth word transition with scale/fade animation
  useEffect(() => {
    const word = tokens[currentIndex] || ''
    setDisplayWord(word)
    setWordAnimKey((k) => k + 1)
  }, [currentIndex, tokens])

  // Reading rhythm beat — pulses with each word
  useEffect(() => {
    if (isPlaying) {
      setBeatActive(true)
      const t = setTimeout(() => setBeatActive(false), 100)
      return () => clearTimeout(t)
    }
  }, [currentIndex, isPlaying])

  // Flow score calculation — consistency of WPM over time
  useEffect(() => {
    if (isPlaying && wpm > 0) {
      const history = wpmHistoryRef.current
      history.push(wpm)
      if (history.length > 20) history.shift()

      // Calculate average
      const avg = history.reduce((a, b) => a + b, 0) / history.length
      setAvgWpm(Math.round(avg))

      // Calculate consistency (lower std dev = higher score)
      const variance = history.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) / history.length
      const stdDev = Math.sqrt(variance)
      const consistency = Math.max(0, 100 - stdDev / 2)

      // Flow = consistency × reading momentum
      const momentum = Math.min(1, history.length / 10)
      setFlowScore(Math.round(consistency * momentum))
      setReadingStreak((s) => s + 1)
    }
  }, [currentIndex, isPlaying, wpm])

  // Smart pause — detect sentence ends
  useEffect(() => {
    if (!smartPauseEnabled || !isPlaying) return
    const word = tokens[currentIndex]
    if (word && isParagraphBreak(word)) {
      // Pause at paragraph breaks — user resumes with space
      setIsSmartPaused(true)
      setIsPlaying(false)
    }
  }, [currentIndex, isPlaying, smartPauseEnabled, tokens])

  const currentWord = tokens[currentIndex] || ''
  const currentPos = posMap.get(currentIndex)
  const progress = tokens.length > 0 ? (currentIndex / tokens.length) * 100 : 0

  // Calculate highlight screen position
  const highlight = useMemo(() => {
    if (currentIndex >= tokens.length || !pageContainerRef?.current || !currentPos) return null
    const pageRect = pageContainerRef.current.getBoundingClientRect()
    return {
      x: pageRect.left + currentPos.x,
      y: pageRect.top + currentPos.y,
      w: Math.max(currentPos.width, 30),
      h: Math.max(currentPos.height, 14),
    }
  }, [currentIndex, currentPos, pageContainerRef])

  // NO auto-scroll during RSVP — page stays still, word shown in control bar
  // This prevents focus shifting and disorientation

  // Auto-advance to next page
  const advanceToNextPage = useCallback(() => {
    if (!onPageEnd) {
      setIsPlaying(false)
      return
    }
    setIsTransitioning(true)
    onPageEnd()
  }, [onPageEnd])

  // Auto-play interval
  useEffect(() => {
    if (isPlaying && !isTransitioning && !isSmartPaused) {
      intervalRef.current = setInterval(() => {
        setCurrentIndex((prev) => {
          if (prev >= tokens.length - 1) {
            // Reached end of page — stop here, don't auto-advance
            // User manually advances with Next button or Enter key
            clearInterval(intervalRef.current)
            setTimeout(() => {
              setIsPlaying(false)
              setShowControls(true)
            }, 200)
            return prev
          }
          return prev + 1
        })
      }, (60 / wpm) * 1000)
    }
    return () => clearInterval(intervalRef.current)
  }, [isPlaying, wpm, tokens.length, isTransitioning, isSmartPaused])

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
    if (currentIndex >= tokens.length - 1) {
      setCurrentIndex(0)
      onPageStart?.()
    }
    setIsPlaying(true)
    setIsTransitioning(false)
    setIsSmartPaused(false)
    setShowControls(true)
  }, [currentIndex, tokens.length, onPageStart])

  const handlePause = useCallback(() => {
    setIsPlaying(false)
    setShowControls(true)
  }, [])

  // Word-by-word navigation
  const handlePrevWord = useCallback(() => {
    setIsPlaying(false)
    setShowControls(true)
    setCurrentIndex((p) => Math.max(0, p - 1))
  }, [])

  const handleNextWord = useCallback(() => {
    setIsPlaying(false)
    setShowControls(true)
    setCurrentIndex((p) => Math.min(tokens.length - 1, p + 1))
  }, [tokens.length])

  // Keyboard — use stopImmediatePropagation to prevent ReaderPage from also handling
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.stopImmediatePropagation(); onClose(); return }
      if (e.key === ' ') { e.preventDefault(); e.stopImmediatePropagation(); isPlaying ? handlePause() : handlePlay(); return }
      if (e.key === 'ArrowLeft') { e.stopImmediatePropagation(); handlePrevWord(); return }
      if (e.key === 'ArrowRight') { e.stopImmediatePropagation(); handleNextWord(); return }
      if (e.key === 'n' || e.key === 'Enter') { e.stopImmediatePropagation(); advanceToNextPage(); return }
      if (e.key === 'b') { e.stopImmediatePropagation(); setBionicMode((b) => !b); return }
      if (e.key === 'f') { e.stopImmediatePropagation(); setFocusTunnel((f) => !f); return }
    }
    window.addEventListener('keydown', handleKey, true)
    return () => window.removeEventListener('keydown', handleKey, true)
  }, [isPlaying, onClose, handlePlay, handlePause, handlePrevWord, handleNextWord, advanceToNextPage])

  // Show controls on mouse move
  useEffect(() => {
    const handleMove = () => setShowControls(true)
    window.addEventListener('mousemove', handleMove)
    return () => window.removeEventListener('mousemove', handleMove)
  }, [])

  const hasNextPage = (pageNumber || 0) < (totalPages || 0)
  const controlsAtTop = highlight ? highlight.y > window.innerHeight * 0.6 : false

  // Flow score color
  const flowColor = flowScore > 70 ? '#22c55e' : flowScore > 40 ? '#eab308' : '#ef4444'
  const flowLabel = flowScore > 70 ? 'Deep Flow' : flowScore > 40 ? 'Warming Up' : 'Getting Started'

  return (
    <>
      {/* Focus Tunnel — radial gradient overlay */}
      {focusTunnel && highlight && (
        <div
          className="fixed inset-0 pointer-events-none"
          style={{
            zIndex: 50,
            background: `radial-gradient(ellipse 400px 200px at ${highlight.x + highlight.w / 2}px ${highlight.y + highlight.h / 2}px, transparent 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.8) 100%)`,
            transition: 'all 0.25s ease-out',
          }}
        />
      )}

      {/* Focus Guide Lines — horizontal reading zone */}
      {showFocusGuide && highlight && (
        <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 49 }}>
          {/* Top guide line */}
          <div
            className="absolute left-0 right-0 h-px"
            style={{
              top: highlight.y - 16,
              background: 'linear-gradient(90deg, transparent 15%, rgba(234, 179, 8, 0.2) 30%, rgba(234, 179, 8, 0.2) 70%, transparent 85%)',
            }}
          />
          {/* Bottom guide line */}
          <div
            className="absolute left-0 right-0 h-px"
            style={{
              top: highlight.y + highlight.h + 16,
              background: 'linear-gradient(90deg, transparent 15%, rgba(234, 179, 8, 0.2) 30%, rgba(234, 179, 8, 0.2) 70%, transparent 85%)',
            }}
          />
        </div>
      )}

      {/* Highlight on the current word — real highlighter effect */}
      {highlight && !isTransitioning && (
        <div
          className="fixed pointer-events-none"
          style={{
            left: highlight.x - 2,
            top: highlight.y - 1,
            width: highlight.w + 4,
            height: highlight.h + 2,
            zIndex: 55,
          }}
        >
          {/* Yellow highlighter background */}
          <motion.div
            className="absolute inset-0 rounded-sm"
            style={{
              background: 'linear-gradient(180deg, rgba(250, 204, 21, 0.45) 0%, rgba(250, 204, 21, 0.35) 100%)',
              boxShadow: '0 0 12px 2px rgba(250, 204, 21, 0.3)',
            }}
            animate={{
              scale: beatActive ? [1, 1.02, 1] : 1,
              opacity: beatActive ? [0.85, 1, 0.85] : 0.9,
            }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
          />
          {/* Subtle top edge — like a real marker stroke */}
          <div
            className="absolute top-0 left-0 right-0 h-px"
            style={{ background: 'rgba(234, 179, 8, 0.5)' }}
          />
        </div>
      )}

      {/* Control bar — position at top when word is near bottom */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            data-rsvp-controls
            initial={{ opacity: 0, y: controlsAtTop ? -20 : 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: controlsAtTop ? -20 : 20 }}
            transition={{ duration: 0.2 }}
            className={`fixed left-1/2 -translate-x-1/2 z-[70] ${controlsAtTop ? 'top-16' : 'bottom-20'}`}
          >
            <div className="bg-[var(--color-surface-0)]/95 backdrop-blur-2xl border border-[var(--color-surface-3)] rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.15)] overflow-hidden w-[420px]">
              {/* Smart Pause indicator */}
              {isSmartPaused && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="px-4 py-2 bg-amber-500/10 border-b border-amber-500/20 flex items-center gap-2"
                >
                  <Timer size={14} className="text-amber-500" />
                  <span className="text-xs text-amber-600 dark:text-amber-400">Comprehension pause — tap space to continue</span>
                </motion.div>
              )}

              {/* Current word display — bionic reading mode */}
              <div className="px-6 pt-4 pb-2">
                <div className="text-center" style={{ fontFamily: 'var(--font-reading)' }}>
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={wordAnimKey}
                      initial={{ opacity: 0.3, scale: 0.92, y: 4 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 1.06, y: -4 }}
                      transition={{ duration: 0.08, ease: [0.25, 0.1, 0.25, 1] }}
                      className="text-xl font-bold"
                    >
                      {bionicMode ? (
                        <BionicWord word={displayWord || currentWord} boldChars={3} />
                      ) : (
                        <span className="text-[var(--color-accent)]">{displayWord || currentWord}</span>
                      )}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>

              {/* Flow Score + Progress */}
              <div className="px-5">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: flowColor, boxShadow: `0 0 6px ${flowColor}` }}
                    />
                    <span className="text-[10px] font-medium" style={{ color: flowColor }}>
                      {flowLabel}
                    </span>
                    <span className="text-[9px] text-[var(--color-text-tertiary)] tabular-nums">
                      {flowScore}%
                    </span>
                  </div>
                  <span className="text-[10px] text-[var(--color-text-tertiary)] tabular-nums">
                    ~{avgWpm || wpm} WPM
                  </span>
                </div>
                <div className="relative h-1.5 bg-[var(--color-surface-3)] rounded-full overflow-hidden">
                  <motion.div
                    className="absolute inset-y-0 left-0 rounded-full"
                    style={{
                      background: `linear-gradient(90deg, ${flowColor}, var(--color-accent))`,
                    }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.1 }}
                  />
                </div>
                <div className="flex items-center justify-between mt-1.5">
                  <span className="text-[10px] text-[var(--color-text-tertiary)] tabular-nums">
                    {currentIndex + 1} / {tokens.length}
                  </span>
                  <span className="text-[10px] text-[var(--color-text-tertiary)]">
                    Page {pageNumber || '?'}
                  </span>
                </div>
              </div>

              {/* Controls */}
              <div className="px-4 py-3 flex items-center justify-between gap-1">
                {/* WPM control */}
                <div className="flex items-center gap-0.5">
                  <button onClick={() => setWpm((w) => Math.max(100, w - 25))} className="p-1.5 rounded-lg text-[var(--color-text-tertiary)] hover:bg-[var(--color-surface-2)] transition-colors">
                    <Minus size={14} />
                  </button>
                  <span className="text-xs font-semibold text-[var(--color-accent)] tabular-nums w-12 text-center">
                    {wpm}
                  </span>
                  <button onClick={() => setWpm((w) => Math.min(800, w + 25))} className="p-1.5 rounded-lg text-[var(--color-text-tertiary)] hover:bg-[var(--color-surface-2)] transition-colors">
                    <Plus size={14} />
                  </button>
                </div>

                {/* Playback controls */}
                <div className="flex items-center gap-0.5">
                  <button onClick={handlePrevWord} className="p-1.5 rounded-lg text-[var(--color-text-tertiary)] hover:bg-[var(--color-surface-2)] transition-colors" title="Previous word (←)">
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    onClick={() => isPlaying ? handlePause() : handlePlay()}
                    className="p-3 rounded-xl bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)] transition-colors shadow-lg shadow-[var(--color-accent)]/25 mx-1"
                    title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
                  >
                    {isPlaying ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
                  </button>
                  <button onClick={handleNextWord} className="p-1.5 rounded-lg text-[var(--color-text-tertiary)] hover:bg-[var(--color-surface-2)] transition-colors" title="Next word (→)">
                    <ChevronRight size={16} />
                  </button>
                </div>

                {/* Feature toggles + close */}
                <div className="flex items-center gap-0.5">
                  <button
                    onClick={() => setBionicMode((b) => !b)}
                    className={`p-1.5 rounded-lg transition-colors ${bionicMode ? 'bg-[var(--color-accent)]/15 text-[var(--color-accent)]' : 'text-[var(--color-text-tertiary)] hover:bg-[var(--color-surface-2)]'}`}
                    title="Bionic Reading — bold first letters for faster recognition (B)"
                  >
                    <Zap size={14} />
                  </button>
                  <button
                    onClick={() => setFocusTunnel((f) => !f)}
                    className={`p-1.5 rounded-lg transition-colors ${focusTunnel ? 'bg-[var(--color-accent)]/15 text-[var(--color-accent)]' : 'text-[var(--color-text-tertiary)] hover:bg-[var(--color-surface-2)]'}`}
                    title="Focus Tunnel — dim everything except current word (F)"
                  >
                    {focusTunnel ? <Eye size={14} /> : <EyeOff size={14} />}
                  </button>
                  <button
                    onClick={() => setSmartPauseEnabled((p) => !p)}
                    className={`p-1.5 rounded-lg transition-colors ${smartPauseEnabled ? 'bg-[var(--color-accent)]/15 text-[var(--color-accent)]' : 'text-[var(--color-text-tertiary)] hover:bg-[var(--color-surface-2)]'}`}
                    title="Smart Pause — auto-pause at sentence endings"
                  >
                    <Timer size={14} />
                  </button>
                  {hasNextPage && (
                    <button
                      onClick={advanceToNextPage}
                      className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium text-[var(--color-accent)] hover:bg-[var(--color-accent-muted)] transition-colors"
                    >
                      Next <ChevronRight size={12} />
                    </button>
                  )}
                  <button onClick={onClose} className="p-1.5 rounded-lg text-[var(--color-text-tertiary)] hover:bg-[var(--color-surface-2)] transition-colors">
                    <X size={14} />
                  </button>
                </div>

                {/* Active features indicator */}
                {(bionicMode || focusTunnel || smartPauseEnabled) && (
                  <div className="px-4 pb-2 flex items-center gap-2 flex-wrap">
                    {bionicMode && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[var(--color-accent)]/10 text-[9px] font-medium text-[var(--color-accent)]">
                        <Zap size={8} /> Bionic
                      </span>
                    )}
                    {focusTunnel && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-500/10 text-[9px] font-medium text-purple-500">
                        <Eye size={8} /> Tunnel
                      </span>
                    )}
                    {smartPauseEnabled && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-[9px] font-medium text-amber-500">
                        <Timer size={8} /> Auto-pause
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
