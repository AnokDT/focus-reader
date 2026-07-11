import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { List, X, ChevronRight, ChevronDown } from 'lucide-react'
import * as pdfjsLib from 'pdfjs-dist'
import type { PDFOutline } from '@/types/pdf'

interface PDFOutlinePanelProps {
  isOpen: boolean
  pdf: pdfjsLib.PDFDocumentProxy
  onPageSelect: (page: number) => void
  onClose: () => void
}

export function PDFOutlinePanel({ isOpen, pdf, onPageSelect, onClose }: PDFOutlinePanelProps) {
  const [outline, setOutline] = useState<PDFOutline[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!isOpen || outline.length > 0) return
    const loadOutline = async () => {
      try {
        setLoading(true)
        const outlineData = await pdf.getOutline()
        if (outlineData) {
          setOutline(outlineData as PDFOutline[])
        }
      } catch (err) {
        console.error('Failed to load outline:', err)
      } finally {
        setLoading(false)
      }
    }
    loadOutline()
  }, [isOpen, pdf])

  const handleItemClick = async (item: PDFOutline) => {
    if (!item.dest) return
    try {
      let ref: any
      if (typeof item.dest === 'string') {
        const dest = await pdf.getDestination(item.dest)
        ref = dest[0]
      } else {
        ref = (item.dest as any[])[0]
      }
      const pageIndex = await pdf.getPageIndex(ref)
      onPageSelect(pageIndex + 1)
    } catch (err) {
      console.error('Failed to navigate to outline item:', err)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: 300, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 300, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="absolute right-0 top-0 bottom-0 w-72 bg-[var(--color-surface-1)] border-l border-[var(--color-surface-3)] z-30 flex flex-col theme-transition"
        >
          {/* Header */}
          <div className="h-12 border-b border-[var(--color-surface-3)] flex items-center justify-between px-4 shrink-0">
            <div className="flex items-center gap-2">
              <List size={15} className="text-[var(--color-accent)]" />
              <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">Document Outline</h2>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-md text-[var(--color-text-tertiary)] hover:bg-[var(--color-surface-2)] transition-colors"
            >
              <X size={15} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto py-2">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-6 h-6 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : outline.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full px-4">
                <div className="w-12 h-12 rounded-2xl bg-[var(--color-surface-2)] flex items-center justify-center mb-3">
                  <List size={20} className="text-[var(--color-text-tertiary)]" />
                </div>
                <p className="text-sm text-[var(--color-text-tertiary)] text-center">
                  No outline available
                </p>
                <p className="text-xs text-[var(--color-text-tertiary)] text-center mt-1">
                  This PDF doesn't have a table of contents
                </p>
              </div>
            ) : (
              <div className="px-2">
                {outline.map((item, i) => (
                  <OutlineItem key={i} item={item} depth={0} onItemClick={handleItemClick} />
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function OutlineItem({ item, depth, onItemClick }: { item: PDFOutline; depth: number; onItemClick: (item: PDFOutline) => void }) {
  const [expanded, setExpanded] = useState(depth < 1)
  const hasChildren = item.items && item.items.length > 0

  return (
    <div>
      <button
        onClick={() => {
          onItemClick(item)
          if (hasChildren) setExpanded(!expanded)
        }}
        className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left hover:bg-[var(--color-surface-2)] transition-colors group"
        style={{ paddingLeft: `${8 + depth * 16}px` }}
      >
        {hasChildren && (
          <span className="text-[var(--color-text-tertiary)] shrink-0">
            {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          </span>
        )}
        {!hasChildren && <span className="w-3 shrink-0" />}
        <span className="text-sm text-[var(--color-text-primary)] truncate group-hover:text-[var(--color-accent)] transition-colors">
          {item.title}
        </span>
      </button>
      {hasChildren && expanded && (
        <div>
          {item.items.map((child, i) => (
            <OutlineItem key={i} item={child} depth={depth + 1} onItemClick={onItemClick} />
          ))}
        </div>
      )}
    </div>
  )
}
