import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Volume2, VolumeX, Play, Pause, SkipForward, SkipBack, ChevronUp, ChevronDown } from 'lucide-react'

interface TextToSpeechProps {
  text: string
  isOpen: boolean
  onClose: () => void
  pageNumber: number
  totalPages: number
  onNextPage?: () => void
  onPrevPage?: () => void
}

export function TextToSpeech({ text, isOpen, onClose, pageNumber, totalPages, onNextPage, onPrevPage }: TextToSpeechProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [rate, setRate] = useState(1.0)
  const [pitch, setPitch] = useState(1.0)
  const [currentWordIndex, setCurrentWordIndex] = useState(-1)
  const [isMuted, setIsMuted] = useState(false)
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)
  const wordsRef = useRef<string[]>([])
  const resumeRef = useRef(false)

  const words = text.split(/\s+/).filter((w) => w.length > 0)
  wordsRef.current = words

  const stop = useCallback(() => {
    window.speechSynthesis.cancel()
    utteranceRef.current = null
    setIsPlaying(false)
    setCurrentWordIndex(-1)
    resumeRef.current = false
  }, [])

  const speak = useCallback((startIndex: number = 0) => {
    if (!text.trim()) return
    stop()

    const utterance = new SpeechSynthesisUtterance()
    utterance.text = wordsRef.current.slice(startIndex).join(' ')
    utterance.rate = isMuted ? 0 : rate
    utterance.pitch = pitch
    utterance.lang = 'en-US'

    utterance.onboundary = (event) => {
      if (event.name === 'word') {
        const charIndex = event.charIndex
        let wordCount = 0
        for (let i = 0; i < startIndex + wordsRef.current.length; i++) {
          if (i >= startIndex) {
            const wordStart = wordsRef.current.slice(startIndex, i - startIndex).join(' ').length
            if (charIndex <= wordStart + wordsRef.current[i - startIndex].length + 1) {
              setCurrentWordIndex(i)
              break
            }
          }
          wordCount++
        }
      }
    }

    utterance.onend = () => {
      setIsPlaying(false)
      setCurrentWordIndex(-1)
      utteranceRef.current = null
    }

    utterance.onerror = () => {
      setIsPlaying(false)
      setCurrentWordIndex(-1)
      utteranceRef.current = null
    }

    utteranceRef.current = utterance
    window.speechSynthesis.speak(utterance)
    setIsPlaying(true)
  }, [text, rate, pitch, isMuted, stop])

  const togglePlayPause = useCallback(() => {
    if (isPlaying) {
      window.speechSynthesis.pause()
      setIsPlaying(false)
      resumeRef.current = true
    } else if (resumeRef.current) {
      window.speechSynthesis.resume()
      setIsPlaying(true)
    } else {
      speak(0)
    }
  }, [isPlaying, speak])

  const handleNextPage = useCallback(() => {
    stop()
    onNextPage?.()
  }, [stop, onNextPage])

  const handlePrevPage = useCallback(() => {
    stop()
    onPrevPage?.()
  }, [stop, onPrevPage])

  useEffect(() => {
    return () => stop()
  }, [stop])

  useEffect(() => {
    if (isOpen && text.trim()) {
      // Auto-play when opened
      setTimeout(() => speak(0), 300)
    }
    return () => stop()
  }, [isOpen])

  const highlightWord = (word: string, index: number) => {
    const isCurrent = index === currentWordIndex
    return (
      <span
        key={index}
        className={`transition-all duration-100 ${
          isCurrent
            ? 'bg-[var(--color-accent)] text-white px-0.5 rounded font-medium'
            : index < currentWordIndex
            ? 'text-[var(--color-text-tertiary)]'
            : 'text-[var(--color-text-primary)]'
        }`}
      >
        {word}{' '}
      </span>
    )
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[90] w-[600px] max-w-[calc(100vw-2rem)]"
        >
          <div className="bg-[var(--color-surface-1)] border border-[var(--color-surface-3)] rounded-2xl shadow-2xl overflow-hidden">
            {/* Word display */}
            <div className="p-4 max-h-32 overflow-y-auto border-b border-[var(--color-surface-3)]">
              <p className="text-sm leading-relaxed">
                {words.map((word, i) => highlightWord(word, i))}
              </p>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between p-3">
              <div className="flex items-center gap-1">
                <button
                  onClick={handlePrevPage}
                  disabled={pageNumber <= 1}
                  className="p-1.5 rounded-lg text-[var(--color-text-tertiary)] hover:bg-[var(--color-surface-2)] disabled:opacity-30 transition-colors"
                >
                  <SkipBack size={14} />
                </button>
                <button
                  onClick={togglePlayPause}
                  className="p-2.5 rounded-xl bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)] transition-colors"
                >
                  {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                </button>
                <button
                  onClick={handleNextPage}
                  disabled={pageNumber >= totalPages}
                  className="p-1.5 rounded-lg text-[var(--color-text-tertiary)] hover:bg-[var(--color-surface-2)] disabled:opacity-30 transition-colors"
                >
                  <SkipForward size={14} />
                </button>
              </div>

              {/* Speed control */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setRate((r) => Math.max(0.5, r - 0.25))}
                  className="p-1 rounded text-[var(--color-text-tertiary)] hover:bg-[var(--color-surface-2)]"
                >
                  <ChevronDown size={12} />
                </button>
                <span className="text-xs font-medium text-[var(--color-text-primary)] w-12 text-center tabular-nums">
                  {rate.toFixed(2)}x
                </span>
                <button
                  onClick={() => setRate((r) => Math.min(3, r + 0.25))}
                  className="p-1 rounded text-[var(--color-text-tertiary)] hover:bg-[var(--color-surface-2)]"
                >
                  <ChevronUp size={12} />
                </button>
              </div>

              {/* Pitch control */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-[var(--color-text-tertiary)]">Pitch</span>
                <button
                  onClick={() => setPitch((p) => Math.max(0.5, p - 0.1))}
                  className="p-1 rounded text-[var(--color-text-tertiary)] hover:bg-[var(--color-surface-2)]"
                >
                  <ChevronDown size={12} />
                </button>
                <span className="text-xs font-medium text-[var(--color-text-primary)] w-8 text-center tabular-nums">
                  {pitch.toFixed(1)}
                </span>
                <button
                  onClick={() => setPitch((p) => Math.min(2, p + 0.1))}
                  className="p-1 rounded text-[var(--color-text-tertiary)] hover:bg-[var(--color-surface-2)]"
                >
                  <ChevronUp size={12} />
                </button>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setIsMuted((m) => !m)}
                  className="p-1.5 rounded-lg text-[var(--color-text-tertiary)] hover:bg-[var(--color-surface-2)] transition-colors"
                >
                  {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
                </button>
                <button
                  onClick={() => { stop(); onClose() }}
                  className="p-1.5 rounded-lg text-[var(--color-text-tertiary)] hover:bg-[var(--color-surface-2)] transition-colors text-xs"
                >
                  ✕
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
