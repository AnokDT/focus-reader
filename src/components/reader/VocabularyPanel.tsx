import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BookOpen, Trash2, Search, Volume2, X } from 'lucide-react'
import { useVocabularyStore, type VocabularyWord } from '@/stores/vocabularyStore'

interface VocabularyPanelProps {
  isOpen: boolean
  onClose: () => void
}

export function VocabularyPanel({ isOpen, onClose }: VocabularyPanelProps) {
  const { words, removeWord } = useVocabularyStore()
  const [search, setSearch] = useState('')

  const filteredWords = words.filter(
    (w) =>
      w.word.toLowerCase().includes(search.toLowerCase()) ||
      w.meaning.toLowerCase().includes(search.toLowerCase())
  )

  const handleSpeak = (word: string) => {
    const utterance = new SpeechSynthesisUtterance(word)
    utterance.rate = 0.8
    speechSynthesis.speak(utterance)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] bg-black/20 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
            className="fixed right-0 top-0 bottom-0 z-[85] w-96 bg-[var(--color-surface-0)] border-l border-[var(--color-surface-3)] shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-surface-3)]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[var(--color-accent)] flex items-center justify-center">
                  <BookOpen size={16} className="text-white" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">My Vocabulary</h2>
                  <p className="text-[10px] text-[var(--color-text-tertiary)]">{words.length} words saved</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg text-[var(--color-text-tertiary)] hover:bg-[var(--color-surface-2)] transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Search */}
            <div className="px-4 py-3 border-b border-[var(--color-surface-3)]">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)]" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search words..."
                  className="w-full h-8 pl-9 pr-3 text-xs bg-[var(--color-surface-2)] border border-[var(--color-surface-3)] rounded-lg text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
                />
              </div>
            </div>

            {/* Words list */}
            <div className="flex-1 overflow-y-auto">
              {filteredWords.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-[var(--color-surface-2)] flex items-center justify-center mb-4">
                    <BookOpen size={24} className="text-[var(--color-text-tertiary)]" />
                  </div>
                  <p className="text-sm font-medium text-[var(--color-text-primary)] mb-1">
                    {words.length === 0 ? 'No words yet' : 'No matches found'}
                  </p>
                  <p className="text-xs text-[var(--color-text-tertiary)]">
                    {words.length === 0
                      ? 'Select any word in the PDF to look up its meaning and save it here.'
                      : 'Try a different search term.'}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-[var(--color-surface-3)]">
                  {filteredWords.map((item: VocabularyWord) => (
                    <motion.div
                      key={item.id}
                      layout
                      className="px-4 py-3 hover:bg-[var(--color-surface-1)] transition-colors group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-[var(--color-text-primary)]">
                              {item.word}
                            </span>
                            <span className="px-1.5 py-0.5 text-[9px] font-medium bg-[var(--color-accent-muted)] text-[var(--color-accent)] rounded">
                              {item.partOfSpeech}
                            </span>
                          </div>
                          <p className="text-xs text-[var(--color-text-secondary)] mt-1 leading-relaxed">
                            {item.meaning}
                          </p>
                          {item.example && (
                            <p className="text-[10px] text-[var(--color-text-tertiary)] italic mt-1 border-l border-[var(--color-accent)]/30 pl-2">
                              "{item.example}"
                            </p>
                          )}
                          <p className="text-[9px] text-[var(--color-text-tertiary)] mt-1.5">
                            {new Date(item.addedAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </p>
                        </div>
                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleSpeak(item.word)}
                            className="p-1.5 rounded-md text-[var(--color-text-tertiary)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text-primary)] transition-colors"
                          >
                            <Volume2 size={12} />
                          </button>
                          <button
                            onClick={() => removeWord(item.id)}
                            className="p-1.5 rounded-md text-[var(--color-text-tertiary)] hover:bg-red-50 hover:text-red-500 transition-colors"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
