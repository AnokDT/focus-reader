import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Pause, X, Minus, Plus, ChevronRight, ChevronLeft, Zap, Eye, EyeOff, Timer } from 'lucide-react'
import type { WordPos } from '@/components/pdf/PDFPageRenderer'
import { MicroSaccadeAnchor } from './MicroSaccadeAnchor'
import { FocusCorridor } from './FocusCorridor'
import { useEyeLockStore } from '@/stores/eyeLockStore'

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
      map.set(t, {
        word: tokens[t],
        x: prevPos.x + t * 40,
        y: prevPos.y,
        width: tokens[t].length * 10,
        height: prevPos.height,
      })
    }
  }
  return map
}

// Smart pacing heuristics
function getSmartDelay(word: string, prevWord: string, baseWpm: number): number {
  const baseMs = (60 / baseWpm) * 1000
  let multiplier = 1

  // Paragraph break (sentence ending + next word starts with capital)
  if (/[.!?]$/.test(prevWord) && /^[A-Z]/.test(word)) {
    multiplier = 2.5
  }
  // Sentence ending
  else if (/[.!?]$/.test(word)) {
    multiplier = 1.8
  }
  // Comma or semicolon
  else if (/[,;:]$/.test(word)) {
    multiplier = 1.3
  }
  // Dialogue (word starts with quote)
  else if (/^["'\u201C\u201D]/.test(word)) {
    multiplier = 0.85
  }
  // Long word (6+ chars)
  else if (word.length >= 6) {
    multiplier = 1.1
  }
  // Short word (1-2 chars)
  else if (word.length <= 2) {
    multiplier = 0.9
  }

  return baseMs * multiplier
}

function BionicWord({ word }: { word: string }) {
  const split = Math.min(3, word.length)
  return (
    <span className="select-none">
      <span className="font-black" style={{ color: 'var(--color-accent)', fontSize: '1.1em' }}>{word.slice(0, split)}</span>
      <span className="font-normal opacity-45">{word.slice(split)}</span>
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
  const [bionicMode, setBionicMode] = useState(true)
  const [focusTunnel, setFocusTunnel] = useState(false)
  const [smartPauseEnabled, setSmartPauseEnabled] = useState(true)
  const [isSmartPaused, setIsSmartPaused] = useState(false)

  const [flowScore, setFlowScore] = useState(100)
  const wpmHistoryRef = useRef<number[]>([])

  const intervalRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  const scrollRafRef = useRef<number>(0)
  const autoPlayRef = useRef(autoPlay)
  const prevTextRef = useRef(text)
  const prevStartIndexRef = useRef(-1)
  const currentIndexRef = useRef(0)

  autoPlayRef.current = autoPlay
  currentIndexRef.current = currentIndex

  const posMap = useMemo(() => buildPositionMap(tokens, wordPositions), [tokens, wordPositions])

  // Seamless page transition: when text changes, find where we are in the new page
  useEffect(() => {
    if (prevTextRef.current !== text) {
      prevTextRef.current = text
      // Don't reset to 0 — keep playing from where we were
      // The startIndex prop tells us where to continue on the new page
      if (autoPlayRef.current && startIndex >= 0 && startIndex < tokens.length) {
        setCurrentIndex(startIndex)
        // Resume playing immediately
        setTimeout(() => setIsPlaying(true), 50)
      }
    }
  }, [text, startIndex, tokens.length])

  useEffect(() => {
    if (startIndex >= 0 && startIndex < tokens.length && startIndex !== prevStartIndexRef.current) {
      prevStartIndexRef.current = startIndex
      setCurrentIndex(startIndex)
      setTimeout(() => setIsPlaying(true), 50)
    }
  }, [startIndex, tokens.length])

  // Flow score
  useEffect(() => {
    if (isPlaying && wpm > 0) {
      const history = wpmHistoryRef.current
      history.push(wpm)
      if (history.length > 20) history.shift()
      const avg = history.reduce((a, b) => a + b, 0) / history.length
      const variance = history.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) / history.length
      const consistency = Math.max(0, 100 - Math.sqrt(variance) / 2)
      setFlowScore(Math.round(consistency * Math.min(1, history.length / 10)))
    }
  }, [currentIndex, isPlaying, wpm])

  // Smart pause at paragraph breaks
  useEffect(() => {
    if (!smartPauseEnabled || !isPlaying) return
    const word = tokens[currentIndex]
    const prevWord = currentIndex > 0 ? tokens[currentIndex - 1] : ''
    if (word && /[.!?]$/.test(prevWord) && /^[A-Z]/.test(word) && currentIndex > 0) {
      setIsSmartPaused(true)
      setIsPlaying(false)
    }
  }, [currentIndex, isPlaying, smartPauseEnabled, tokens])

  const currentWord = tokens[currentIndex] || ''
  const currentPos = posMap.get(currentIndex)
  const progress = tokens.length > 0 ? (currentIndex / tokens.length) * 100 : 0

  // Highlight position ON the actual PDF text
  const highlight = useMemo(() => {
    if (currentIndex >= tokens.length || !pageContainerRef?.current || !currentPos) return null
    const containerRect = pageContainerRef.current.getBoundingClientRect()
    return {
      x: containerRect.left + currentPos.x,
      y: containerRect.top + currentPos.y,
      w: Math.max(currentPos.width, 30),
      h: Math.max(currentPos.height, 14),
    }
  }, [currentIndex, currentPos, pageContainerRef])

  // SMOOTH AUTO-SCROLL: RAF-based, escalator feel
  useEffect(() => {
    if (!highlight || !isPlaying) return
    if (!pageContainerRef?.current) return

    const scrollContainer = pageContainerRef.current.closest('[class*="overflow-auto"]') as HTMLElement | null
    if (!scrollContainer) return

    const targetY = highlight.y
    const scrollRect = scrollContainer.getBoundingClientRect()
    const wordRelativeY = targetY - scrollRect.top
    const viewportHeight = scrollRect.height

    // Target: word at 40% from top of viewport
    const targetViewportY = viewportHeight * 0.4
    const delta = wordRelativeY - targetViewportY

    // Only scroll if word is outside the comfortable zone (10% dead zone)
    if (Math.abs(delta) > viewportHeight * 0.1) {
      const scrollAmount = delta * 0.15 // Smooth lerp

      cancelAnimationFrame(scrollRafRef.current)
      scrollRafRef.current = requestAnimationFrame(() => {
        scrollContainer.scrollBy({ top: scrollAmount, behavior: 'auto' })
      })
    }

    return () => cancelAnimationFrame(scrollRafRef.current)
  }, [highlight, isPlaying, pageContainerRef])

  // Auto-play with smart pacing
  useEffect(() => {
    if (!isPlaying || !isSmartPaused) {
      clearInterval(intervalRef.current as any)
      return
    }

    const advance = () => {
      setCurrentIndex((prev) => {
        if (prev >= tokens.length - 1) {
          // Page ended — signal to parent to advance
          clearTimeout(intervalRef.current as any)
          setTimeout(() => {
            setIsPlaying(false)
            setShowControls(true)
            onPageEnd?.()
          }, 100)
          return prev
        }
        const nextIdx = prev + 1
        const prevWord = tokens[prev]
        const nextWord = tokens[nextIdx]
        const delay = getSmartDelay(nextWord, prevWord, wpm)

        clearTimeout(intervalRef.current as any)
        intervalRef.current = setTimeout(advance, delay)
        return nextIdx
      })
    }

    // Start the chain
    const firstDelay = currentIndex < tokens.length - 1
      ? getSmartDelay(tokens[currentIndex + 1] || '', tokens[currentIndex], wpm)
      : (60 / wpm) * 1000

    intervalRef.current = setTimeout(advance, firstDelay)

    return () => clearTimeout(intervalRef.current as any)
  }, [isPlaying, isSmartPaused, wpm, tokens, currentIndex, onPageEnd])

  // Controls auto-hide
  useEffect(() => {
    if (showControls) {
      clearTimeout(controlsTimeoutRef.current)
      controlsTimeoutRef.current = setTimeout(() => {
        if (isPlaying) setShowControls(false)
      }, 4000)
    }
    return () => clearTimeout(controlsTimeoutRef.current)
  }, [showControls, isPlaying, currentIndex])

  const handlePlay = useCallback(() => {
    if (currentIndex >= tokens.length - 1) {
      setCurrentIndex(0)
      onPageStart?.()
    }
    setIsPlaying(true)
    setIsSmartPaused(false)
    setShowControls(true)
  }, [currentIndex, tokens.length, onPageStart])

  const handlePause = useCallback(() => {
    setIsPlaying(false)
    setShowControls(true)
  }, [])

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

  // Keyboard
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.stopImmediatePropagation(); onClose(); return }
      if (e.key === ' ') { e.preventDefault(); e.stopImmediatePropagation(); isPlaying ? handlePause() : handlePlay(); return }
      if (e.key === 'ArrowLeft') { e.stopImmediatePropagation(); handlePrevWord(); return }
      if (e.key === 'ArrowRight') { e.stopImmediatePropagation(); handleNextWord(); return }
      if (e.key === 'b') { e.stopImmediatePropagation(); setBionicMode((b) => !b); return }
      if (e.key === 'f') { e.stopImmediatePropagation(); setFocusTunnel((f) => !f); return }
    }
    window.addEventListener('keydown', handleKey, true)
    return () => window.removeEventListener('keydown', handleKey, true)
  }, [isPlaying, onClose, handlePlay, handlePause, handlePrevWord, handleNextWord])

  useEffect(() => {
    const handleMove = () => setShowControls(true)
    window.addEventListener('mousemove', handleMove)
    return () => window.removeEventListener('mousemove', handleMove)
  }, [])

  const flowColor = flowScore > 70 ? '#22c55e' : flowScore > 40 ? '#eab308' : '#ef4444'
  const flowLabel = flowScore > 70 ? 'Deep Flow' : flowScore > 40 ? 'Warming Up' : 'Getting Started'

  const eyeLockEnabled = useEyeLockStore((s) => s.enabled)

  // Anchor position
  const anchorPos = useMemo(() => {
    if (!highlight) return null
    return {
      x: highlight.x + highlight.w * 0.35,
      y: highlight.y + highlight.h * 0.5,
    }
  }, [highlight])

  // Line Y for Focus Corridor
  const lineY = useMemo(() => {
    if (!highlight) return 0
    const scrollContainer = pageContainerRef?.current?.closest('[class*="overflow-auto"]') as HTMLElement | null
    if (!scrollContainer) return highlight.y
    const scrollRect = scrollContainer.getBoundingClientRect()
    return highlight.y - scrollRect.top + scrollContainer.scrollTop
  }, [highlight, pageContainerRef])

  const scrollContainer = useMemo(() => {
    return pageContainerRef?.current?.closest('[class*="overflow-auto"]') as HTMLElement | null
  }, [pageContainerRef])

  return (
    <>
      {/* EyeLock: Micro-Saccade Anchor */}
      {eyeLockEnabled && anchorPos && (
        <MicroSaccadeAnchor
          x={anchorPos.x}
          y={anchorPos.y}
          wordHeight={highlight?.h || 14}
        />
      )}

      {/* EyeLock: Focus Corridor */}
      {eyeLockEnabled && (
        <FocusCorridor
          scrollContainer={scrollContainer}
          currentLineY={lineY}
          lineHeight={highlight?.h || 20}
        />
      )}

      {/* Reading Lane — soft vignette on edges */}
      {eyeLockEnabled && highlight && (
        <div
          className="fixed inset-0 pointer-events-none"
          style={{
            zIndex: 4,
            background: `linear-gradient(
              to right,
              rgba(0,0,0,0.12) 0%,
              transparent 25%,
              transparent 75%,
              rgba(0,0,0,0.12) 100%
            )`,
          }}
        />
      )}

      {/* Focus Tunnel — dim everything except highlight area */}
      {focusTunnel && highlight && (
        <div
          className="fixed inset-0 pointer-events-none"
          style={{
            zIndex: 50,
            background: `radial-gradient(ellipse 600px 120px at ${highlight.x + highlight.w / 2}px ${highlight.y + highlight.h / 2}px, transparent 0%, rgba(0,0,0,0.45) 50%, rgba(0,0,0,0.85) 100%)`,
            transition: 'all 0.2s ease-out',
          }}
        />
      )}

      {/* Current word highlight */}
      {highlight && (
        <div
          className="fixed pointer-events-none"
          style={{
            left: highlight.x - 4,
            top: highlight.y - 2,
            width: highlight.w + 8,
            height: highlight.h + 4,
            zIndex: 55,
          }}
        >
          <div
            className="absolute -inset-[8px] rounded-lg"
            style={{
              background: 'rgba(250, 204, 21, 0.12)',
              boxShadow: '0 0 30px 8px rgba(250, 204, 21, 0.25)',
            }}
          />
          <div
            className="absolute inset-0 rounded-sm"
            style={{
              background: 'linear-gradient(180deg, rgba(250, 204, 21, 0.55) 0%, rgba(250, 204, 21, 0.4) 100%)',
              boxShadow: '0 0 12px 2px rgba(250, 204, 21, 0.3), inset 0 1px 0 rgba(255,255,255,0.2)',
            }}
          />
          <div
            className="absolute top-0 left-0 right-0 h-[2px] rounded-full"
            style={{ background: 'rgba(234, 179, 8, 0.6)' }}
          />
        </div>
      )}

      {/* Control bar */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            data-rsvp-controls
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[70]"
          >
            <div className="bg-[var(--color-surface-0)]/95 backdrop-blur-2xl border border-[var(--color-surface-3)] rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.2)] overflow-hidden w-[440px]">
              {isSmartPaused && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-4 py-2 bg-amber-500/10 border-b border-amber-500/20 flex items-center gap-2">
                  <Timer size={14} className="text-amber-500" />
                  <span className="text-xs text-amber-600 dark:text-amber-400">Comprehension pause — Space to continue</span>
                </motion.div>
              )}

              <div className="px-6 pt-3 pb-1">
                <div className="text-center" style={{ fontFamily: 'var(--font-reading)' }}>
                  <span className="text-lg font-bold text-[var(--color-accent)]">
                    {bionicMode ? <BionicWord word={currentWord} /> : currentWord}
                  </span>
                </div>
              </div>

              <div className="px-5">
                <div className="relative h-1 bg-[var(--color-surface-3)] rounded-full overflow-hidden">
                  <motion.div className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-yellow-400 to-amber-500" animate={{ width: `${progress}%` }} transition={{ duration: 0.1 }} />
                </div>
                <div className="flex items-center justify-between mt-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: flowColor, boxShadow: `0 0 6px ${flowColor}` }} />
                    <span className="text-[10px] font-medium" style={{ color: flowColor }}>{flowLabel}</span>
                  </div>
                  <span className="text-[10px] text-[var(--color-text-tertiary)] tabular-nums">{wpm} WPM · Pg {pageNumber || '?'}</span>
                </div>
              </div>

              <div className="px-4 py-3 flex items-center justify-between gap-1">
                <div className="flex items-center gap-0.5">
                  <button onClick={() => setWpm((w) => Math.max(100, w - 25))} className="p-1.5 rounded-lg text-[var(--color-text-tertiary)] hover:bg-[var(--color-surface-2)] transition-colors"><Minus size={14} /></button>
                  <span className="text-xs font-semibold text-[var(--color-accent)] tabular-nums w-12 text-center">{wpm}</span>
                  <button onClick={() => setWpm((w) => Math.min(800, w + 25))} className="p-1.5 rounded-lg text-[var(--color-text-tertiary)] hover:bg-[var(--color-surface-2)] transition-colors"><Plus size={14} /></button>
                </div>

                <div className="flex items-center gap-0.5">
                  <button onClick={handlePrevWord} className="p-1.5 rounded-lg text-[var(--color-text-tertiary)] hover:bg-[var(--color-surface-2)] transition-colors"><ChevronLeft size={16} /></button>
                  <button onClick={() => isPlaying ? handlePause() : handlePlay()} className="p-3 rounded-xl bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)] transition-colors shadow-lg shadow-[var(--color-accent)]/25 mx-1">
                    {isPlaying ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
                  </button>
                  <button onClick={handleNextWord} className="p-1.5 rounded-lg text-[var(--color-text-tertiary)] hover:bg-[var(--color-surface-2)] transition-colors"><ChevronRight size={16} /></button>
                </div>

                <div className="flex items-center gap-0.5">
                  <button onClick={() => setBionicMode((b) => !b)} className={`p-1.5 rounded-lg transition-colors ${bionicMode ? 'bg-yellow-400/15 text-yellow-600' : 'text-[var(--color-text-tertiary)] hover:bg-[var(--color-surface-2)]'}`} title="Bionic (B)"><Zap size={14} /></button>
                  <button onClick={() => setFocusTunnel((f) => !f)} className={`p-1.5 rounded-lg transition-colors ${focusTunnel ? 'bg-purple-500/15 text-purple-500' : 'text-[var(--color-text-tertiary)] hover:bg-[var(--color-surface-2)]'}`} title="Tunnel (F)">{focusTunnel ? <Eye size={14} /> : <EyeOff size={14} />}</button>
                  <button onClick={() => setSmartPauseEnabled((p) => !p)} className={`p-1.5 rounded-lg transition-colors ${smartPauseEnabled ? 'bg-amber-500/15 text-amber-500' : 'text-[var(--color-text-tertiary)] hover:bg-[var(--color-surface-2)]'}`} title="Smart pause at sentences"><Timer size={14} /></button>
                  <button onClick={onClose} className="p-1.5 rounded-lg text-[var(--color-text-tertiary)] hover:bg-[var(--color-surface-2)] transition-colors"><X size={14} /></button>
                </div>
              </div>

              {(bionicMode || focusTunnel || smartPauseEnabled || eyeLockEnabled) && (
                <div className="px-4 pb-2 flex items-center gap-2 flex-wrap">
                  {bionicMode && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-400/10 text-[9px] font-medium text-yellow-600"><Zap size={8} /> Bionic</span>}
                  {focusTunnel && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-500/10 text-[9px] font-medium text-purple-500"><Eye size={8} /> Tunnel</span>}
                  {smartPauseEnabled && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-[9px] font-medium text-amber-500"><Timer size={8} /> Auto-pause</span>}
                  {eyeLockEnabled && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/10 text-[9px] font-medium text-blue-500"><span className="w-1.5 h-1.5 rounded-full bg-blue-500" /> EyeLock</span>}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
