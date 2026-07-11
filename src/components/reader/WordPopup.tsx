import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BookOpen, Plus, Check, Volume2, X, Loader2 } from 'lucide-react'
import { lookupWord, type DictionaryResult } from '@/services/dictionaryService'
import { useVocabularyStore } from '@/stores/vocabularyStore'

interface WordPopupProps {
  word: string
  x: number
  y: number
  onClose: () => void
  documentId?: string
  pageNumber?: number
}

export function WordPopup({ word, x, y, onClose, documentId, pageNumber }: WordPopupProps) {
  const [result, setResult] = useState<DictionaryResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [saved, setSaved] = useState(false)
  const addWord = useVocabularyStore((s) => s.addWord)
  const hasWord = useVocabularyStore((s) => s.hasWord)
  const popupRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setResult(null)
    lookupWord(word).then((r) => {
      if (!cancelled) {
        setResult(r)
        setLoading(false)
      }
    })
    return () => { cancelled = true }
  }, [word])

  useEffect(() => {
    setSaved(hasWord(word))
  }, [word, hasWord])

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.document.addEventListener('mousedown', handleClick)
    window.document.addEventListener('keydown', handleKey)
    return () => {
      window.document.removeEventListener('mousedown', handleClick)
      window.document.removeEventListener('keydown', handleKey)
    }
  }, [onClose])

  const handleSave = useCallback(() => {
    if (!result) return
    addWord({
      word: result.word,
      meaning: result.meaning,
      partOfSpeech: result.partOfSpeech,
      example: result.example,
      documentId,
      pageNumber,
    })
    setSaved(true)
  }, [result, addWord, documentId, pageNumber])

  const handleSpeak = useCallback(() => {
    if (!result) return
    const utterance = new SpeechSynthesisUtterance(result.word)
    utterance.rate = 0.8
    speechSynthesis.speak(utterance)
  }, [result])

  const popupX = Math.min(x, window.innerWidth - 340)
  const popupY = y + 24 < window.innerHeight - 250 ? y + 24 : y - 220

  return (
    <AnimatePresence>
      <motion.div
        ref={popupRef}
        initial={{ opacity: 0, y: 8, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 8, scale: 0.96 }}
        transition={{ duration: 0.15, ease: [0.25, 0.1, 0.25, 1] }}
        className="fixed z-[100] w-80 bg-[var(--color-surface-0)] border border-[var(--color-surface-3)] rounded-xl shadow-2xl overflow-hidden"
        style={{ left: popupX, top: popupY }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-[var(--color-surface-1)] border-b border-[var(--color-surface-3)]">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-[var(--color-accent)] flex items-center justify-center shrink-0">
              <BookOpen size={14} className="text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[var(--color-text-primary)] truncate">
                {word}
              </p>
              {result?.phonetic && (
                <p className="text-[10px] text-[var(--color-text-tertiary)]">{result.phonetic}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={handleSpeak}
              className="p-1.5 rounded-md text-[var(--color-text-tertiary)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text-primary)] transition-colors"
              title="Pronounce"
            >
              <Volume2 size={14} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-md text-[var(--color-text-tertiary)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text-primary)] transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-4 py-3 max-h-48 overflow-y-auto">
          {loading && (
            <div className="flex items-center justify-center py-6 gap-2">
              <Loader2 size={16} className="animate-spin text-[var(--color-accent)]" />
              <span className="text-xs text-[var(--color-text-tertiary)]">Looking up definition...</span>
            </div>
          )}

          {!loading && !result && (
            <div className="text-center py-6">
              <p className="text-xs text-[var(--color-text-tertiary)]">
                No definition found for "{word}"
              </p>
            </div>
          )}

          {!loading && result && (
            <div className="space-y-3">
              <div>
                <span className="inline-block px-1.5 py-0.5 text-[10px] font-medium bg-[var(--color-accent-muted)] text-[var(--color-accent)] rounded">
                  {result.partOfSpeech}
                </span>
              </div>
              <p className="text-sm text-[var(--color-text-primary)] leading-relaxed">
                {result.meaning}
              </p>
              {result.example && (
                <p className="text-xs text-[var(--color-text-tertiary)] italic border-l-2 border-[var(--color-accent)] pl-2">
                  "{result.example}"
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {!loading && result && (
          <div className="px-4 py-2.5 border-t border-[var(--color-surface-3)] bg-[var(--color-surface-1)]">
            <button
              onClick={handleSave}
              disabled={saved}
              className={`
                w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all
                ${saved
                  ? 'bg-[var(--color-success)]/10 text-[var(--color-success)] cursor-default'
                  : 'bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)] active:scale-[0.98]'
                }
              `}
            >
              {saved ? (
                <>
                  <Check size={14} />
                  Saved to vocabulary
                </>
              ) : (
                <>
                  <Plus size={14} />
                  Save to my vocabulary
                </>
              )}
            </button>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  )
}
