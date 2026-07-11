import { useState, useCallback, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, X, ChevronUp, ChevronDown, FileText } from 'lucide-react'

interface PDFSearchPanelProps {
  onSearch: (query: string) => void
  onClose: () => void
  resultCount: number
  currentResult: number
  onNavigateResult: (direction: 'next' | 'prev') => void
}

export function PDFSearchPanel({
  onSearch,
  onClose,
  resultCount,
  currentResult,
  onNavigateResult,
}: PDFSearchPanelProps) {
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleSearch = useCallback(
    (value: string) => {
      setQuery(value)
      onSearch(value)
    },
    [onSearch]
  )

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (e.shiftKey) {
        onNavigateResult('prev')
      } else {
        onNavigateResult('next')
      }
    }
    if (e.key === 'Escape') {
      onClose()
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.15, ease: [0.25, 0.1, 0.25, 1] }}
      className="absolute top-0 right-0 z-40 w-96 bg-[var(--color-surface-0)] border border-[var(--color-surface-3)] rounded-bl-xl shadow-2xl overflow-hidden"
    >
      <div className="flex items-center gap-2 p-3 bg-[var(--color-surface-1)] border-b border-[var(--color-surface-3)]">
        <Search size={16} className="text-[var(--color-text-tertiary)] shrink-0" />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search in document..."
          className="flex-1 text-sm bg-transparent text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none"
        />
        {query && (
          <span className="text-xs text-[var(--color-text-tertiary)] tabular-nums shrink-0 px-2 py-0.5 bg-[var(--color-surface-2)] rounded-full">
            {resultCount > 0 ? `${currentResult} of ${resultCount}` : 'No results'}
          </span>
        )}
        <button
          onClick={onClose}
          className="p-1 rounded-md text-[var(--color-text-tertiary)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text-primary)] transition-colors"
        >
          <X size={14} />
        </button>
      </div>

      {resultCount > 0 && (
        <div className="flex items-center justify-between px-3 py-2 bg-[var(--color-surface-0)] border-t border-[var(--color-surface-3)]">
          <div className="flex items-center gap-1">
            <button
              onClick={() => onNavigateResult('prev')}
              className="p-1.5 rounded-md text-[var(--color-text-tertiary)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text-primary)] transition-colors"
              title="Previous result (Shift+Enter)"
            >
              <ChevronUp size={14} />
            </button>
            <button
              onClick={() => onNavigateResult('next')}
              className="p-1.5 rounded-md text-[var(--color-text-tertiary)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text-primary)] transition-colors"
              title="Next result (Enter)"
            >
              <ChevronDown size={14} />
            </button>
          </div>
          <span className="text-[10px] text-[var(--color-text-tertiary)]">
            Press Enter to navigate
          </span>
        </div>
      )}
    </motion.div>
  )
}
