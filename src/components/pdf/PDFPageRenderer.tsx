import { useRef, useEffect, useCallback, useState } from 'react'
import * as pdfjsLib from 'pdfjs-dist'
import { ocrService } from '@/services/ocrService'

interface PDFPageRendererProps {
  pdf: pdfjsLib.PDFDocumentProxy
  pageNumber: number
  scale: number
  isVisible: boolean
  isDarkMode?: boolean
  selectMode?: boolean
  onTextExtracted?: (pageNumber: number, text: string) => void
  onDimensionsReady?: (pageNumber: number, width: number, height: number) => void
  onWordSelect?: (word: string, x: number, y: number) => void
}

export function PDFPageRenderer({
  pdf,
  pageNumber,
  scale,
  isVisible,
  isDarkMode = false,
  selectMode = false,
  onTextExtracted,
  onDimensionsReady,
  onWordSelect,
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

      renderTaskRef.current = page.render({
        canvas,
        viewport,
      })

      await renderTaskRef.current.promise
      setRendered(true)
      setLoading(false)

      // Extract text content for search and RSVP
      if (onTextExtracted) {
        const content = await page.getTextContent()
        let text = content.items.map((item: any) => item.str).join(' ')

        // If text is sparse/empty (image-based PDF), try OCR
        if (text.trim().length < 20) {
          try {
            const ocrResult = await ocrService.recognizePDFPage(pdf, pageNumber, 2)
            if (ocrResult.text.trim().length > text.trim().length) {
              text = ocrResult.text
            }
          } catch {
            // OCR failed, use extracted text as-is
          }
        }

        onTextExtracted(pageNumber, text)
      }

      // Build text layer for word selection (only when selectMode is active)
      if (textLayerRef.current) {
        const content = await page.getTextContent()
        const textLayer = textLayerRef.current
        textLayer.innerHTML = ''

        content.items.forEach((item: any) => {
          if (!item.str || !item.transform) return
          const [x, y, , , w, h] = item.transform
          const left = (x / viewport.width) * 100
          const top = ((viewport.height - y - h) / viewport.height) * 100
          const width = (w / viewport.width) * 100
          const height = (h / viewport.height) * 100

          const span = window.document.createElement('span')
          span.textContent = item.str
          span.style.position = 'absolute'
          span.style.left = `${left}%`
          span.style.top = `${top}%`
          span.style.width = `${width}%`
          span.style.height = `${height}%`
          span.style.fontSize = `${h * 0.8}px`
          span.style.fontFamily = 'sans-serif'
          span.style.color = 'transparent'
          span.style.cursor = selectMode ? 'text' : 'default'
          span.style.lineHeight = '1'
          span.style.whiteSpace = 'pre'
          span.style.userSelect = selectMode ? 'text' : 'none'

          span.addEventListener('mouseup', () => {
            if (!selectMode || !onWordSelect) return
            const selection = window.getSelection()
            const selectedText = selection?.toString().trim() || ''
            if (selectedText.length >= 2 && selectedText.length <= 30 && !selectedText.includes(' ')) {
              const rect = span.getBoundingClientRect()
              onWordSelect(selectedText, rect.left, rect.bottom)
            }
          })

          textLayer.appendChild(span)
        })
      }
    } catch (err: any) {
      if (err?.name !== 'RenderingCancelledException') {
        console.error(`Failed to render page ${pageNumber}:`, err)
      }
      setLoading(false)
    }
  }, [pdf, pageNumber, scale, isVisible, rendered, selectMode, onTextExtracted, onDimensionsReady, onWordSelect])

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
    <div className={`relative ${isDarkMode ? 'bg-[#1a1a2e]' : 'bg-white'}`} style={{ width: pageWidth || 'auto', height: pageHeight || 'auto' }}>
      <canvas
        ref={canvasRef}
        className={`block ${isDarkMode ? 'pdf-canvas-dark' : ''}`}
        style={{ imageRendering: 'auto' }}
      />
      {/* Text layer — only interactive in selectMode, always pointer-events:none to prevent bleeding */}
      <div
        ref={textLayerRef}
        className="absolute inset-0"
        style={{
          pointerEvents: selectMode ? 'auto' : 'none',
          userSelect: selectMode ? 'text' : 'none',
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
