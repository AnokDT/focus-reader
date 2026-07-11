import { useRef, useEffect, useCallback, useState } from 'react'
import * as pdfjsLib from 'pdfjs-dist'

interface PDFPageRendererProps {
  pdf: pdfjsLib.PDFDocumentProxy
  pageNumber: number
  scale: number
  isVisible: boolean
  isDarkMode?: boolean
  onTextExtracted?: (pageNumber: number, text: string) => void
  onDimensionsReady?: (pageNumber: number, width: number, height: number) => void
  onWordSelect?: (word: string, x: number, y: number) => void
  onPositionExtracted?: (pageNumber: number, positions: { word: string; x: number; y: number; width: number; height: number }[]) => void
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
  isDarkMode = false,
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

  const renderPage = useCallback(async () => {
    if (!canvasRef.current || !isVisible || rendered) return

    try {
      setLoading(true)
      const page = await pdf.getPage(pageNumber)
      const viewport = page.getViewport({ scale })
      const baseViewport = page.getViewport({ scale: 1 })
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

      // Extract text
      if (onTextExtracted || onPositionExtracted || textLayerRef.current) {
        const content = await page.getTextContent()
        const text = content.items.map((item: any) => item.str).join(' ')
        onTextExtracted?.(pageNumber, text)

        // Build text layer with CORRECT coordinate transform
        if (textLayerRef.current) {
          const textLayer = textLayerRef.current
          textLayer.innerHTML = ''
          const positions: { word: string; x: number; y: number; width: number; height: number }[] = []

          content.items.forEach((item: any) => {
            if (!item.str || !item.transform) return

            // Apply viewport transform to get screen coordinates
            const tx = applyTransform(viewport.transform, item.transform)
            // tx[4] = screen X, tx[5] = screen Y (from top), tx[0] = horizontal scale, tx[3] = vertical scale

            const screenX = tx[4]
            const screenY = tx[5]
            const fontHeight = Math.abs(tx[3]) || Math.abs(tx[0])
            const itemWidth = item.width * scale || item.str.length * fontHeight * 0.5

            const left = (screenX / viewport.width) * 100
            const top = (screenY / viewport.height) * 100
            const widthPct = (itemWidth / viewport.width) * 100
            const heightPct = (fontHeight / viewport.height) * 100

            const span = window.document.createElement('span')
            span.textContent = item.str
            span.setAttribute('data-text', item.str)
            span.style.position = 'absolute'
            span.style.left = `${left}%`
            span.style.top = `${top}%`
            span.style.width = `${widthPct}%`
            span.style.height = `${heightPct}%`
            span.style.fontSize = `${fontHeight * 0.9}px`
            span.style.fontFamily = 'sans-serif'
            span.style.lineHeight = '1.1'
            span.style.whiteSpace = 'pre'
            span.style.color = 'transparent'
            span.style.cursor = 'text'
            span.style.userSelect = 'text'
            span.style.webkitUserSelect = 'text'
            span.style.pointerEvents = 'auto'

            // Collect word positions for RSVP
            if (onPositionExtracted) {
              const words = item.str.split(/(\s+)/)
              let xOffset = 0
              const charWidth = itemWidth / Math.max(item.str.length, 1)

              words.forEach((word: string) => {
                if (word.trim().length === 0) {
                  xOffset += word.length * charWidth
                  return
                }
                const wordWidth = word.length * charWidth
                positions.push({
                  word,
                  x: (screenX + xOffset) / viewport.width,
                  y: screenY / viewport.height,
                  width: wordWidth / viewport.width,
                  height: fontHeight / viewport.height,
                })
                xOffset += wordWidth
              })
            }

            // Word selection
            span.addEventListener('mouseup', (e: MouseEvent) => {
              e.stopPropagation()
              const selection = window.getSelection()
              const selectedText = selection?.toString().trim() || ''
              if (selectedText.length >= 2 && onWordSelect) {
                const rect = span.getBoundingClientRect()
                onWordSelect(selectedText, rect.left + rect.width / 2, rect.bottom + 8)
              }
            })

            textLayer.appendChild(span)
          })

          onPositionExtracted?.(pageNumber, positions)
        }
      }
    } catch (err: any) {
      if (err?.name !== 'RenderingCancelledException') {
        console.error(`Failed to render page ${pageNumber}:`, err)
      }
      setLoading(false)
    }
  }, [pdf, pageNumber, scale, isVisible, rendered, onTextExtracted, onDimensionsReady, onWordSelect, onPositionExtracted])

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

  return (
    <div
      className={`relative overflow-hidden ${isDarkMode ? 'bg-[#1a1a2e]' : 'bg-white'}`}
      style={{ width: pageWidth || 'auto', height: pageHeight || 'auto' }}
    >
      <canvas
        ref={canvasRef}
        className={`block ${isDarkMode ? 'pdf-canvas-dark' : ''}`}
        style={{ imageRendering: 'auto' }}
      />

      {/* Text layer — invisible but selectable, CORRECTLY positioned */}
      <div
        ref={textLayerRef}
        className="absolute inset-0 overflow-hidden"
        style={{
          pointerEvents: 'auto',
          userSelect: 'text',
          WebkitUserSelect: 'text',
        }}
      />

      {loading && isVisible && (
        <div
          className={`absolute inset-0 flex flex-col items-center justify-center rounded-sm ${isDarkMode ? 'bg-[#1a1a2e]' : 'bg-white'}`}
          style={{ width: pageWidth || 612, height: pageHeight || 792 }}
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
