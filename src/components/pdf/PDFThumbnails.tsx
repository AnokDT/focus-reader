import { useMemo, useRef, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import type * as pdfjsLib from 'pdfjs-dist'

interface PDFThumbnailProps {
  pdf: pdfjsLib.PDFDocumentProxy
  pageNumber: number
  isActive: boolean
  onClick: () => void
}

function PDFThumbnail({ pdf, pageNumber, isActive, onClick }: PDFThumbnailProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let cancelled = false
    const render = async () => {
      try {
        const page = await pdf.getPage(pageNumber)
        const viewport = page.getViewport({ scale: 0.2 })
        const canvas = canvasRef.current
        if (!canvas || cancelled) return
        const ctx = canvas.getContext('2d')
        if (!ctx) return
        canvas.width = viewport.width
        canvas.height = viewport.height
        await page.render({ canvas, viewport }).promise
        if (!cancelled) setLoaded(true)
      } catch {}
    }
    render()
    return () => { cancelled = true }
  }, [pdf, pageNumber])

  return (
    <motion.button
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className={`
        relative w-full p-1 rounded-lg transition-all duration-150
        ${isActive
          ? 'bg-[var(--color-accent-muted)] ring-2 ring-[var(--color-accent)]'
          : 'bg-[var(--color-surface-1)] hover:bg-[var(--color-surface-2)]'
        }
      `}
    >
      <div className="w-full aspect-[3/4] bg-white rounded shadow-sm overflow-hidden flex items-center justify-center">
        {loaded ? (
          <canvas ref={canvasRef} className="w-full h-full object-contain" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-[var(--color-surface-2)]">
            <div className="w-3 h-3 border border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>
      <p className="mt-1 text-[10px] text-center text-[var(--color-text-secondary)] font-medium tabular-nums">
        {pageNumber}
      </p>
    </motion.button>
  )
}

interface PDFThumbnailPanelProps {
  pdf: pdfjsLib.PDFDocumentProxy
  totalPages: number
  currentPage: number
  onPageSelect: (page: number) => void
}

export function PDFThumbnailPanel({ pdf, totalPages, currentPage, onPageSelect }: PDFThumbnailPanelProps) {
  const pages = useMemo(() => {
    return Array.from({ length: totalPages }, (_, i) => i + 1)
  }, [totalPages])

  const currentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    currentRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [currentPage])

  return (
    <div className="w-24 border-r border-[var(--color-surface-3)] bg-[var(--color-surface-1)] overflow-y-auto p-2 space-y-2 theme-transition">
      {pages.map((page) => (
        <div key={page} ref={page === currentPage ? currentRef : undefined}>
          <PDFThumbnail
            pdf={pdf}
            pageNumber={page}
            isActive={page === currentPage}
            onClick={() => onPageSelect(page)}
          />
        </div>
      ))}
    </div>
  )
}
