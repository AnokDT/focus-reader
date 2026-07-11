import { useRef, useEffect, useCallback, useState } from 'react'
import * as pdfjsLib from 'pdfjs-dist'

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
  onWordSelect?: (word: string, x: number, y: number) => void
  onPositionExtracted?: (pageNumber: number, positions: { word: string; x: number; y: number; width: number; height: number; isItem?: boolean }[]) => void
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
  onWordSelect,
  onPositionExtracted,
}: PDFPageRendererProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const textLayerRef = useRef<HTMLDivElement>(null)
  const [rendered, setRendered] = useState(false)
  const [loading, setLoading] = useState(true)
  const renderTaskRef = useRef<any>(null)
  const [pageWidth, setPageWidth] = useState(0)
  const [pageHeight, setPageHeight] = useState(0)
  const textContentRef = useRef<any>(null)
  const viewportRef = useRef<any>(null)

  const renderPage = useCallback(async () => {
    if (!canvasRef.current || !isVisible || rendered) return

    try {
      setLoading(true)
      const page = await pdf.getPage(pageNumber)
      const viewport = page.getViewport({ scale })
      const dpr = window.devicePixelRatio || 1

      const canvas = canvasRef.current
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
      setRendered(true)
      setLoading(false)

      // Extract text content
      const content = await page.getTextContent()
      textContentRef.current = content
      viewportRef.current = viewport

      const text = content.items.map((item: any) => item.str).join(' ')
      onTextExtracted?.(pageNumber, text)

      // Build word positions for RSVP (in absolute viewport pixel coordinates)
      if (onPositionExtracted) {
        const positions: { word: string; x: number; y: number; width: number; height: number; isItem?: boolean }[] = []
        content.items.forEach((item: any) => {
          if (!item.str || !item.transform) return
          const tx = applyTransform(viewport.transform, item.transform)
          const screenX = tx[4]
          const screenY = tx[5]
          const fontHeight = Math.abs(tx[3]) || Math.abs(tx[0])
          const itemWidth = item.width * scale || item.str.length * fontHeight * 0.5
          positions.push({
            word: item.str,
            x: screenX,
            y: screenY,
            width: itemWidth,
            height: fontHeight,
            isItem: true,
          })
        })
        onPositionExtracted(pageNumber, positions)
      }
    } catch (err: any) {
      if (err?.name !== 'RenderingCancelledException') {
        console.error(`Failed to render page ${pageNumber}:`, err)
      }
      setLoading(false)
    }
  }, [pdf, pageNumber, scale, isVisible, rendered, onTextExtracted, onDimensionsReady, onPositionExtracted])

  useEffect(() => {
    if (isVisible && !rendered) {
      renderPage()
    }
  }, [isVisible, rendered, renderPage])

  useEffect(() => {
    return () => {
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel()
      }
    }
  }, [])

  // Build/clear text layer — only for current page, only when RSVP is NOT active
  useEffect(() => {
    const textLayerEl = textLayerRef.current
    if (!textLayerEl) return

    if (isCurrentPage && !rsvpActive && rendered && textContentRef.current && viewportRef.current) {
      const content = textContentRef.current
      const vp = viewportRef.current
      textLayerEl.innerHTML = ''

      content.items.forEach((item: any) => {
        if (!item.str || !item.transform) return
        const tx = applyTransform(vp.transform, item.transform)
        const screenX = tx[4]
        const screenY = tx[5]
        const fontHeight = Math.abs(tx[3]) || Math.abs(tx[0])
        const itemWidth = item.width * scale || item.str.length * fontHeight * 0.5

        const left = (screenX / vp.width) * 100
        const top = (screenY / vp.height) * 100
        const widthPct = (itemWidth / vp.width) * 100
        const heightPct = (fontHeight / vp.height) * 100

        const span = window.document.createElement('span')
        span.textContent = item.str
        span.setAttribute('data-text', item.str)
        span.style.position = 'absolute'
        span.style.left = `${left}%`
        span.style.top = `${top}%`
        span.style.width = `${widthPct}%`
        span.style.height = `${heightPct}%`
        span.style.fontSize = `${fontHeight * 0.9}px`
        span.style.fontFamily = 'sans-serif, Noto Sans, Noto Sans Malayalam, Noto Sans Devanagari, system-ui'
        span.style.lineHeight = '1.1'
        span.style.whiteSpace = 'pre'
        span.style.color = 'transparent'
        span.style.cursor = 'text'
        span.style.userSelect = 'text'
        span.style.webkitUserSelect = 'text'
        span.style.pointerEvents = 'auto'

        span.addEventListener('mouseup', (e: MouseEvent) => {
          e.stopPropagation()
          const range = document.caretRangeFromPoint(e.clientX, e.clientY)
          let word = ''
          if (range && range.startContainer instanceof Text) {
            const text = range.startContainer.textContent || ''
            const offset = range.startOffset
            let start = offset
            let end = offset
            while (start > 0 && /[\p{L}\p{N}]/u.test(text[start - 1])) start--
            while (end < text.length && /[\p{L}\p{N}]/u.test(text[end])) end++
            word = text.slice(start, end).trim()
          }
          if (!word) {
            const selection = window.getSelection()
            word = selection?.toString().trim() || ''
          }
          if (word.length >= 2 && onWordSelect) {
            const rect = span.getBoundingClientRect()
            onWordSelect(word, rect.left + rect.width / 2, rect.bottom + 8)
          }
        })

        textLayerEl.appendChild(span)
      })
    } else {
      textLayerEl.innerHTML = ''
    }
  }, [isCurrentPage, rsvpActive, rendered, scale, onWordSelect])

  // Only show text layer for current page when RSVP is not active
  const showTextLayer = isCurrentPage && !rsvpActive && rendered

  return (
    <div
      className={`relative ${isDarkMode ? 'bg-[#1a1a2e]' : 'bg-white'}`}
      style={{
        width: pageWidth || 'auto',
        height: pageHeight || 'auto',
        overflow: 'hidden',
      }}
    >
      <canvas
        ref={canvasRef}
        className={`block relative ${isDarkMode ? 'pdf-canvas-dark' : ''}`}
        style={{ imageRendering: 'auto' }}
      />

      {/* Dimming overlay when RSVP is active — darkens entire page */}
      {rsvpActive && isCurrentPage && rendered && (
        <div
          className="absolute inset-0 z-[3]"
          style={{ background: 'rgba(0, 0, 0, 0.65)' }}
        />
      )}

      {/* Text layer — ONLY for current page, ONLY when RSVP is off */}
      {showTextLayer && (
        <div
          ref={textLayerRef}
          className="absolute inset-0 z-[2]"
          style={{
            pointerEvents: 'auto',
            userSelect: 'text',
            WebkitUserSelect: 'text',
            overflow: 'hidden',
          }}
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
