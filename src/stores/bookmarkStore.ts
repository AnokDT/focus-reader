import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface Bookmark {
  id: string
  documentId: string
  pageNumber: number
  label: string
  createdAt: string
  color: string
}

interface BookmarkState {
  bookmarks: Bookmark[]
  addBookmark: (bookmark: Omit<Bookmark, 'id' | 'createdAt'>) => void
  removeBookmark: (id: string) => void
  updateBookmark: (id: string, updates: Partial<Pick<Bookmark, 'label' | 'color'>>) => void
  getDocumentBookmarks: (documentId: string) => Bookmark[]
  hasBookmark: (documentId: string, pageNumber: number) => boolean
  toggleBookmark: (documentId: string, pageNumber: number, label: string) => void
}

const BOOKMARK_COLORS = ['#fbbf24', '#34d399', '#60a5fa', '#f472b6', '#fb923c', '#a78bfa']

export const useBookmarkStore = create<BookmarkState>()(
  persist(
    (set, get) => ({
      bookmarks: [],
      addBookmark: (bookmark) =>
        set((state) => ({
          bookmarks: [
            ...state.bookmarks,
            {
              ...bookmark,
              id: `bm_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
              createdAt: new Date().toISOString(),
            },
          ],
        })),
      removeBookmark: (id) =>
        set((state) => ({
          bookmarks: state.bookmarks.filter((b) => b.id !== id),
        })),
      updateBookmark: (id, updates) =>
        set((state) => ({
          bookmarks: state.bookmarks.map((b) =>
            b.id === id ? { ...b, ...updates } : b
          ),
        })),
      getDocumentBookmarks: (documentId) =>
        get().bookmarks.filter((b) => b.documentId === documentId),
      hasBookmark: (documentId, pageNumber) =>
        get().bookmarks.some(
          (b) => b.documentId === documentId && b.pageNumber === pageNumber
        ),
      toggleBookmark: (documentId, pageNumber, label) => {
        const existing = get().bookmarks.find(
          (b) => b.documentId === documentId && b.pageNumber === pageNumber
        )
        if (existing) {
          get().removeBookmark(existing.id)
        } else {
          const colorIndex = get().bookmarks.filter((b) => b.documentId === documentId).length % BOOKMARK_COLORS.length
          get().addBookmark({
            documentId,
            pageNumber,
            label,
            color: BOOKMARK_COLORS[colorIndex],
          })
        }
      },
    }),
    { name: 'focus-reader-bookmarks' }
  )
)
