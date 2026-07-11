import { useState, useRef, useEffect } from 'react'
import { Highlighter, StickyNote, X, Trash2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAnnotationStore } from '@/stores/annotationStore'
import { useSettingsStore } from '@/stores/settingsStore'

interface AnnotationToolbarProps {
  documentId: string
  pageNumber: number
  selectedText: string
  rects: { x: number; y: number; width: number; height: number }[]
  screenX: number
  screenY: number
  onClose: () => void
}

export function AnnotationToolbar({
  documentId,
  pageNumber,
  selectedText,
  rects,
  screenX,
  screenY,
  onClose,
}: AnnotationToolbarProps) {
  const highlightColors = useSettingsStore((s) => s.highlightColors)
  const addAnnotation = useAnnotationStore((s) => s.addAnnotation)
  const removeAnnotation = useAnnotationStore((s) => s.removeAnnotation)
  const hasAnnotation = useAnnotationStore((s) => s.hasAnnotation)
  const [showNoteInput, setShowNoteInput] = useState(false)
  const [note, setNote] = useState('')
  const [selectedColor, setSelectedColor] = useState(highlightColors[0]?.color || '#fbbf24')
  const noteRef = useRef<HTMLTextAreaElement>(null)

  const isHighlighted = hasAnnotation(documentId, pageNumber, selectedText)

  useEffect(() => {
    if (showNoteInput && noteRef.current) {
      noteRef.current.focus()
    }
  }, [showNoteInput])

  const handleHighlight = (color?: string) => {
    addAnnotation({
      documentId,
      pageNumber,
      text: selectedText,
      color: color || selectedColor,
      note: '',
      rects,
    })
    onClose()
  }

  const handleHighlightWithNote = () => {
    addAnnotation({
      documentId,
      pageNumber,
      text: selectedText,
      color: selectedColor,
      note,
      rects,
    })
    onClose()
  }

  const handleRemoveHighlight = () => {
    const state = useAnnotationStore.getState()
    const ann = state.annotations.find(
      (a) => a.documentId === documentId && a.pageNumber === pageNumber && a.text === selectedText
    )
    if (ann) removeAnnotation(ann.id)
    onClose()
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 4 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 4 }}
      transition={{ duration: 0.15 }}
      className="fixed z-[100] bg-[var(--color-surface-1)] border border-[var(--color-surface-3)] rounded-xl shadow-xl p-2 min-w-[200px]"
      style={{ left: screenX, top: screenY - 50 }}
    >
      {!showNoteInput ? (
        <div className="flex flex-col gap-1">
          {/* Color palette */}
          <div className="flex items-center gap-1 px-1 pb-1 border-b border-[var(--color-surface-3)]">
            {highlightColors.map((c) => (
              <button
                key={c.color}
                onClick={() => handleHighlight(c.color)}
                className="w-6 h-6 rounded-full border-2 transition-transform hover:scale-110"
                style={{
                  backgroundColor: c.color,
                  borderColor: selectedColor === c.color ? 'var(--color-text-primary)' : 'transparent',
                }}
                title={c.name}
              />
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-0.5">
            <button
              onClick={() => handleHighlight()}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-surface-2)] transition-colors"
            >
              <Highlighter size={13} />
              Highlight
            </button>
            <button
              onClick={() => setShowNoteInput(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-surface-2)] transition-colors"
            >
              <StickyNote size={13} />
              Note
            </button>
            {isHighlighted && (
              <button
                onClick={handleRemoveHighlight}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-[var(--color-error)] hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
              >
                <Trash2 size={13} />
                Remove
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2 p-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[var(--color-text-secondary)]">Add note</span>
            <button onClick={() => setShowNoteInput(false)} className="p-0.5 rounded hover:bg-[var(--color-surface-2)]">
              <X size={12} className="text-[var(--color-text-tertiary)]" />
            </button>
          </div>
          <textarea
            ref={noteRef}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Your note..."
            className="w-48 h-20 text-xs p-2 rounded-lg border border-[var(--color-surface-3)] bg-[var(--color-surface-0)] text-[var(--color-text-primary)] resize-none focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
          />
          {/* Color selector */}
          <div className="flex items-center gap-1">
            {highlightColors.map((c) => (
              <button
                key={c.color}
                onClick={() => setSelectedColor(c.color)}
                className="w-5 h-5 rounded-full border-2 transition-transform hover:scale-110"
                style={{
                  backgroundColor: c.color,
                  borderColor: selectedColor === c.color ? 'var(--color-text-primary)' : 'transparent',
                }}
              />
            ))}
          </div>
          <button
            onClick={handleHighlightWithNote}
            className="w-full py-1.5 rounded-lg text-xs font-medium bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)] transition-colors"
          >
            Save
          </button>
        </div>
      )}
    </motion.div>
  )
}
