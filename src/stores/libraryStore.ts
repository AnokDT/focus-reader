import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { PDFDocument } from '@/types/pdf'

interface LibraryState {
  documents: PDFDocument[]
  addDocument: (doc: PDFDocument) => void
  removeDocument: (id: string) => void
  updateDocument: (id: string, updates: Partial<PDFDocument>) => void
  getDocument: (id: string) => PDFDocument | undefined
}

export const useLibraryStore = create<LibraryState>()(
  persist(
    (set, get) => ({
      documents: [],
      addDocument: (doc: PDFDocument) =>
        set((state) => ({
          documents: [doc, ...state.documents],
        })),
      removeDocument: (id: string) =>
        set((state) => ({
          documents: state.documents.filter((d) => d.id !== id),
        })),
      updateDocument: (id: string, updates: Partial<PDFDocument>) =>
        set((state) => ({
          documents: state.documents.map((d) =>
            d.id === id ? { ...d, ...updates } : d
          ),
        })),
      getDocument: (id: string) => get().documents.find((d) => d.id === id),
    }),
    {
      name: 'focus-reader-library',
    }
  )
)
