import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface VocabularyWord {
  id: string
  word: string
  meaning: string
  partOfSpeech: string
  example?: string
  addedAt: string
  documentId?: string
  pageNumber?: number
}

interface VocabularyState {
  words: VocabularyWord[]
  addWord: (word: Omit<VocabularyWord, 'id' | 'addedAt'>) => void
  removeWord: (id: string) => void
  hasWord: (word: string) => boolean
  searchWords: (query: string) => VocabularyWord[]
}

export const useVocabularyStore = create<VocabularyState>()(
  persist(
    (set, get) => ({
      words: [],
      addWord: (wordData) => {
        if (get().hasWord(wordData.word)) return
        set((state) => ({
          words: [
            {
              ...wordData,
              id: `${wordData.word}-${Date.now()}`,
              addedAt: new Date().toISOString(),
            },
            ...state.words,
          ],
        }))
      },
      removeWord: (id) =>
        set((state) => ({
          words: state.words.filter((w) => w.id !== id),
        })),
      hasWord: (word) => get().words.some((w) => w.word.toLowerCase() === word.toLowerCase()),
      searchWords: (query) =>
        get().words.filter((w) =>
          w.word.toLowerCase().includes(query.toLowerCase())
        ),
    }),
    { name: 'focus-reader-vocabulary' }
  )
)
