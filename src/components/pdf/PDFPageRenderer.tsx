import { useRef, useEffect, useCallback, useState } from 'react'
import * as pdfjsLib from 'pdfjs-dist'

export interface WordPos {
  word: string
  x: number
  y: number
  width: number
  height: number
}

interface PDFPageRendererProps {
  pdf: pdfjsLib.PDFDocumentProxy
  pageNumber: number
  scale: number
  isVisible: boolean
  isCurrentPage?: boolean
  isDarkMode?: boolean
  rsvpActive?: boolean
  onTextExtracted?: (pageNumber: number, text: string) => void
  onDimensionsReady?: (pageNumber: number, width: number, height: number) => void
  onWordsExtracted?: (pageNumber: number, words: WordPos[]) => void
  onPageClick?: (pageNumber: number, x: number, y: number) => void
}

function applyTransform(t1: number[], t2: number[]): number[] {
  return [
    t1[0] * t2[0] + t1[2] * t2[1],
    t1[1] * t2[0] + t1[3] * t2[1],
    t1[0] * t2[2] + t1[2] * t2[3],
    t1[1] * t2[2] + t1[3] * t2[3],
    t1[0] * t2[4] + t1[2] * t2[5] + t1[4],
    t1[1] * t2[4] + t1[3] * t2[5] + t1[5],
  ]
}

function extractWords(items: any[], viewport: any, scale: number): WordPos[] {
  const words: WordPos[] = []
  for (const item of items) {
    if (!item.str || !item.transform) continue
    const tx = applyTransform(viewport.transform, item.transform)
    const fontHeight = Math.abs(tx[3]) || Math.abs(tx[0])
    const lineHeight = fontHeight * 1.2

    // Split the text item into individual words
    const text = item.str
    const wordRegex = /[\p{L}\p{N}]+/gu
    let match: RegExpExecArray | null
    let charOffset = 0

    while ((match = wordRegex.exec(text)) !== null) {
      const word = match[0]
      const wordStart = match.index
      const wordLen = word.length

      // Estimate horizontal position within the line
      const charWidth = item.width > 0 ? item.width / Math.max(text.length, 1) : fontHeight * 0.5
      const wordX = tx[4] + wordStart * charWidth * scale
      const wordW = wordLen * charWidth * scale

      words.push({
        word,
        x: wordX,
        y: tx[5] - lineHeight * 0.85,
        width: Math.max(wordW, 10),
        height: lineHeight,
      })
      charOffset = wordStart + wordLen
    }
  }
  return words
}

export function PDFPageRenderer({
  pdf,
  pageNumber,
  scale,
  isVisible,
  isCurrentPage = false,
  isDarkMode = false,
  rsvpActive = false,
  onTextExtracted,
  onDimensionsReady,
  onWordsExtracted,
  onPageClick,
}: PDFPageRendererProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [pageWidth, setPageWidth] = useState(0)
  const [pageHeight, setPageHeight] = useState(0)
  const [loading, setLoading] = useState(true)
  const renderTaskRef = useRef<any>(null)
  const renderedRef = useRef(false)

  const renderPage = useCallback(async () => {
    if (!canvasRef.current || !isVisible || renderedRef.current) return

    try {
      setLoading(true)
      const page = await pdf.getPage(pageNumber)
      const viewport = page.getViewport({ scale })
      const dpr = window.devicePixelRatio || 1

      const canvas = canvasRef.current
      if (!canvas) { setLoading(false); return }
      canvas.width = Math.floor(viewport.width * dpr)
      canvas.height = Math.floor(viewport.height * dpr)
      canvas.style.width = `${Math.floor(viewport.width)}px`
      canvas.style.height = `${Math.floor(viewport.height)}px`

      setPageWidth(Math.floor(viewport.width))
      setPageHeight(Math.floor(viewport.height))
      onDimensionsReady?.(pageNumber, Math.floor(viewport.width), Math.floor(viewport.height))

      const ctx = canvas.getContext('2d', { alpha: false })
      if (!ctx) return
      ctx.scale(dpr, dpr)

      if (renderTaskRef.current) {
        renderTaskRef.current.cancel()
      }

      renderTaskRef.current = page.render({ canvas, viewport })
      await renderTaskRef.current.promise
      renderedRef.current = true
      setLoading(false)

      // Extract text
      const content = await page.getTextContent()
      const text = content.items.map((item: any) => item.str).join(' ')
      onTextExtracted?.(pageNumber, text)

      // Extract word positions (stored in memory, NO DOM elements created)
      const words = extractWords(content.items, viewport, scale)
      onWordsExtracted?.(pageNumber, words)
    } catch (err: any) {
      if (err?.name !== 'RenderingCancelledException') {
        console.error(`Failed to render page ${pageNumber}:`, err)
      }
      setLoading(false)
    }
  }, [pdf, pageNumber, scale, isVisible, onTextExtracted, onDimensionsReady, onWordsExtracted])

  useEffect(() => {
    if (isVisible && !renderedRef.current) {
      renderPage()
    }
  }, [isVisible, renderPage])

  useEffect(() => {
    return () => {
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel()
      }
    }
  }, [])

  // Click handler for word detection — matches click coordinates to stored word positions
  const handleClick = useCallback((e: React.MouseEvent) => {
    if (!isCurrentPage || rsvpActive || !onPageClick) return
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    onPageClick(pageNumber, x, y)
  }, [isCurrentPage, rsvpActive, pageNumber, onPageClick])

  return (
    <div
      ref={containerRef}
      className={`relative ${isDarkMode ? 'bg-[#1a1a2e]' : 'bg-white'}`}
      style={{
        width: pageWidth || 'auto',
        height: pageHeight || 'auto',
        overflow: 'hidden',
        cursor: isCurrentPage ? 'default' : 'default',
      }}
      onClick={handleClick}
    >
      {/* Canvas — the ONLY child. No text layer. No spans. Nothing else. */}
      <canvas
        ref={canvasRef}
        className={`block ${isDarkMode ? 'pdf-canvas-dark' : ''}`}
        style={{ imageRendering: 'auto' }}
      />

      {/* Dimming overlay when RSVP is active */}
      {rsvpActive && isCurrentPage && renderedRef.current && (
        <div
          className="absolute inset-0 z-[3] pointer-events-none"
          style={{ background: 'rgba(0, 0, 0, 0.65)' }}
        />
      )}

      {loading && isVisible && (
        <div
          className={`absolute inset-0 flex flex-col items-center justify-center rounded-sm pointer-events-none ${isDarkMode ? 'bg-[#1a1a2e]' : 'bg-white'}`}
          style={{ width: pageWidth || 612, height: pageHeight || 792, zIndex: 3 }}
        >
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-[var(--color-text-tertiary)]">Page {pageNumber}</span>
          </div>
        </div>
      )}
    </div>
  )
}
