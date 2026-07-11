import { useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bookmark, BookmarkCheck, X, ChevronRight } from 'lucide-react'
import { useBookmarkStore } from '@/stores/bookmarkStore'

interface BookmarkPanelProps {
  isOpen: boolean
  documentId: string
  currentPage: number
  totalPages: number
  onPageSelect: (page: number) => void
  onClose: () => void
}

export function BookmarkPanel({
  isOpen,
  documentId,
  currentPage,
  totalPages,
  onPageSelect,
  onClose,
}: BookmarkPanelProps) {
  const getDocumentBookmarks = useBookmarkStore((s) => s.getDocumentBookmarks)
  const removeBookmark = useBookmarkStore((s) => s.removeBookmark)
  const bookmarks = useMemo(
    () => getDocumentBookmarks(documentId).sort((a, b) => a.pageNumber - b.pageNumber),
    [getDocumentBookmarks, documentId]
  )

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: -300, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -300, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="absolute left-0 top-0 bottom-0 w-72 bg-[var(--color-surface-1)] border-r border-[var(--color-surface-3)] z-30 flex flex-col theme-transition"
        >
          {/* Header */}
          <div className="h-12 border-b border-[var(--color-surface-3)] flex items-center justify-between px-4 shrink-0">
            <div className="flex items-center gap-2">
              <Bookmark size={15} className="text-[var(--color-accent)]" />
              <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">Bookmarks</h2>
              <span className="text-xs text-[var(--color-text-tertiary)] bg-[var(--color-surface-2)] px-1.5 py-0.5 rounded-full">
                {bookmarks.length}
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-md text-[var(--color-text-tertiary)] hover:bg-[var(--color-surface-2)] transition-colors"
            >
              <X size={15} />
            </button>
          </div>

          {/* Bookmark list */}
          <div className="flex-1 overflow-auto py-2">
            {bookmarks.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full px-4">
                <div className="w-12 h-12 rounded-2xl bg-[var(--color-surface-2)] flex items-center justify-center mb-3">
                  <Bookmark size={20} className="text-[var(--color-text-tertiary)]" />
                </div>
                <p className="text-sm text-[var(--color-text-tertiary)] text-center">
                  No bookmarks yet
                </p>
                <p className="text-xs text-[var(--color-text-tertiary)] text-center mt-1">
                  Press B to bookmark this page
                </p>
              </div>
            ) : (
              <div className="px-2 space-y-0.5">
                {bookmarks.map((bm) => (
                  <motion.div
                    key={bm.id}
                    layout
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className={`group flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                      bm.pageNumber === currentPage
                        ? 'bg-[var(--color-accent-muted)] text-[var(--color-accent)]'
                        : 'hover:bg-[var(--color-surface-2)] text-[var(--color-text-primary)]'
                    }`}
                    onClick={() => onPageSelect(bm.pageNumber)}
                  >
                    <div
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: bm.color }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{bm.label}</p>
                      <p className="text-xs text-[var(--color-text-tertiary)]">Page {bm.pageNumber}</p>
                    </div>
                    {bm.pageNumber === currentPage && <BookmarkCheck size={14} className="text-[var(--color-accent)] shrink-0" />}
                    <button
                      onClick={(e) => { e.stopPropagation(); removeBookmark(bm.id) }}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-[var(--color-surface-3)] transition-all"
                    >
                      <X size={12} className="text-[var(--color-text-tertiary)]" />
                    </button>
                    <ChevronRight size={14} className="text-[var(--color-text-tertiary)] shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
