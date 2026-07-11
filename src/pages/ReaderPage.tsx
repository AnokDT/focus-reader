import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import * as pdfjsLib from 'pdfjs-dist'
import { AnimatePresence, motion } from 'framer-motion'
import { useLibraryStore } from '@/stores/libraryStore'
import { useUIStore } from '@/stores/uiStore'
import { useFocusStore } from '@/stores/focusStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { useAnalyticsStore } from '@/stores/analyticsStore'
import { storageService } from '@/services/storageService'
import { pdfService } from '@/services/pdfService'
import { ReaderHeader } from '@/components/layout/ReaderHeader'
import { PDFPageRenderer } from '@/components/pdf/PDFPageRenderer'
import { PDFThumbnailPanel } from '@/components/pdf/PDFThumbnails'
import { PDFSearchPanel } from '@/components/pdf/PDFSearch'
import { FocusGuide } from '@/components/reader/FocusGuide'
import { FocusControls } from '@/components/reader/FocusControls'
import { WordPopup } from '@/components/reader/WordPopup'
import { InlineRSVP } from '@/components/reader/InlineRSVP'
import { VocabularyPanel } from '@/components/reader/VocabularyPanel'
import { ReadingTimer } from '@/components/reader/ReadingTimer'
import { ReadingHeatmap } from '@/components/reader/ReadingHeatmap'
import { ReadingInsights } from '@/components/reader/ReadingInsights'

interface PageDimensions {
  width: number
  height: number
}

const VIRTUALIZATION_BUFFER = 2

export function ReaderPage() {
  const { id } = useParams<{ id: string }>()
  const doc = useLibraryStore((s) => s.documents.find((d) => d.id === id))
  const updateDocument = useLibraryStore((s) => s.updateDocument)
  const focus = useFocusStore()
  const theme = useSettingsStore((s) => s.theme)
  const { startSession, endSession } = useAnalyticsStore()
  const { searchOpen, setSearchOpen, thumbnailsOpen, outlineOpen } = useUIStore()

  const [pdf, setPdf] = useState<pdfjsLib.PDFDocumentProxy | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [scale, setScale] = useState(1.4)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [currentSearchIndex, setCurrentSearchIndex] = useState(0)
  const [pageTexts, setPageTexts] = useState<Record<number, string>>({})
  const [pageDimensions, setPageDimensions] = useState<Record<number, PageDimensions>>({})
  const [pagePositions, setPagePositions] = useState<Record<number, { word: string; x: number; y: number; width: number; height: number; isItem?: boolean }[]>>({})
  const [scrollProgress, setScrollProgress] = useState(0)

  const [selectedWord, setSelectedWord] = useState<{ word: string; x: number; y: number } | null>(null)
  const [showInlineRSVP, setShowInlineRSVP] = useState(false)
  const [showVocabulary, setShowVocabulary] = useState(false)
  const [showHeatmap, setShowHeatmap] = useState(true)
  const [showInsights, setShowInsights] = useState(false)
  const [pageTimes, setPageTimes] = useState<Record<number, number>>({})

  const containerRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const pageRefs = useRef<Map<number, HTMLDivElement>>(new Map())
  const currentPageRef = useRef(1)
  const pageTimesRef = useRef<Record<number, number>>({})
  const currentPageContainerRef = useRef<HTMLDivElement | null>(null)

  const isDarkMode = theme === 'dark'

  // Consolidated time tracking: live-updates display every 2s, saves on page change
  useEffect(() => {
    const pageAtStart = currentPage
    const enterTime = Date.now()
    let lastFlushTime = enterTime

    // Live-update heatmap display every 2 seconds
    const interval = setInterval(() => {
      const now = Date.now()
      const elapsed = now - lastFlushTime
      if (pageAtStart > 0 && elapsed >= 1000) {
        pageTimesRef.current = {
          ...pageTimesRef.current,
          [pageAtStart]: (pageTimesRef.current[pageAtStart] || 0) + elapsed,
        }
        setPageTimes({ ...pageTimesRef.current })
        lastFlushTime = now
      }
    }, 2000)

    return () => {
      clearInterval(interval)
      // Final flush: accumulate remaining time since last interval
      const elapsed = Date.now() - lastFlushTime
      if (pageAtStart > 0 && (Date.now() - enterTime) >= 3000) {
        pageTimesRef.current = {
          ...pageTimesRef.current,
          [pageAtStart]: (pageTimesRef.current[pageAtStart] || 0) + elapsed,
        }
        setPageTimes({ ...pageTimesRef.current })
      }
    }
  }, [currentPage])

  // PDF loading
  useEffect(() => {
    if (!doc) return
    const loadPdf = async () => {
      try {
        setLoading(true)
        setError(null)
        const fileData = storageService.getFile(doc.fileName)
        if (!fileData) { setError('File not found. Please re-import the PDF.'); return }
        const base64 = fileData.split(',')[1]
        const binaryStr = atob(base64)
        const bytes = new Uint8Array(binaryStr.length)
        for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i)
        const loadedPdf = await pdfService.loadDocument(bytes.buffer)
        setPdf(loadedPdf)
        setTotalPages(loadedPdf.numPages)
        setCurrentPage(doc.lastReadPage || 1)
        currentPageRef.current = doc.lastReadPage || 1
        startSession()
      } catch (err) {
        console.error('Failed to load PDF:', err)
        setError('Failed to load PDF. The file may be corrupted.')
      } finally {
        setLoading(false)
      }
    }
    loadPdf()
    return () => { endSession(250) }
  }, [id])

  useEffect(() => {
    if (doc && currentPage) {
      updateDocument(doc.id, { lastReadPage: currentPage, lastReadAt: new Date().toISOString() })
    }
  }, [currentPage, doc?.id])

  // IntersectionObserver for scroll-based page detection
  useEffect(() => {
    if (!scrollRef.current) return
    observerRef.current = new IntersectionObserver(
      (entries) => {
        let maxRatio = 0
        let visiblePage = currentPageRef.current
        entries.forEach((entry) => {
          if (entry.intersectionRatio > maxRatio) {
            maxRatio = entry.intersectionRatio
            visiblePage = parseInt(entry.target.getAttribute('data-page-number') || '1')
          }
        })
        if (visiblePage !== currentPageRef.current) {
          currentPageRef.current = visiblePage
          setCurrentPage(visiblePage)
        }
      },
      { root: scrollRef.current, rootMargin: '-20% 0px -20% 0px', threshold: [0, 0.25, 0.5, 0.75, 1] }
    )
    return () => observerRef.current?.disconnect()
  }, [scrollRef.current])

  useEffect(() => {
    if (!observerRef.current) return
    pageRefs.current.forEach((el) => observerRef.current!.observe(el))
    return () => observerRef.current?.disconnect()
  }, [totalPages, pdf])

  // Scroll progress
  useEffect(() => {
    const scrollEl = scrollRef.current
    if (!scrollEl) return
    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = scrollEl
      const progress = scrollHeight > clientHeight ? (scrollTop / (scrollHeight - clientHeight)) * 100 : 0
      setScrollProgress(Math.min(100, Math.max(0, progress)))
    }
    scrollEl.addEventListener('scroll', handleScroll, { passive: true })
    return () => scrollEl.removeEventListener('scroll', handleScroll)
  }, [])

  const handlePageChange = useCallback((page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
      currentPageRef.current = page
      pageRefs.current.get(page)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [totalPages])

  const handleZoomIn = useCallback(() => setScale((s) => Math.min(s + 0.2, 4)), [])
  const handleZoomOut = useCallback(() => setScale((s) => Math.max(s - 0.2, 0.5)), [])
  const handleResetZoom = useCallback(() => setScale(1.4), [])
  const handleFitWidth = useCallback(() => {
    if (containerRef.current) setScale(containerRef.current.clientWidth / 612)
  }, [])

  const handleTextExtracted = useCallback((pageNumber: number, text: string) => {
    setPageTexts((prev) => ({ ...prev, [pageNumber]: text }))
  }, [])

  const handleDimensionsReady = useCallback((pageNumber: number, width: number, height: number) => {
    setPageDimensions((prev) => ({ ...prev, [pageNumber]: { width, height } }))
  }, [])

  const handlePositionsExtracted = useCallback((pageNumber: number, positions: { word: string; x: number; y: number; width: number; height: number; isItem?: boolean }[]) => {
    setPagePositions((prev) => ({ ...prev, [pageNumber]: positions }))
  }, [])

  const handleWordSelect = useCallback((word: string, x: number, y: number) => {
    // Only popup for single words or short phrases (max 5 words)
    const cleanWord = word.replace(/[^\p{L}\p{N}]/gu, '').trim()
    if (cleanWord.length >= 2 && cleanWord.split(/\s+/).length <= 5) {
      setSelectedWord({ word: cleanWord, x, y })
    }
  }, [])

  const handleSearch = useCallback(
    (query: string) => {
      if (!query.trim()) { setSearchResults([]); return }
      const results: { pageNumber: number; text: string }[] = []
      Object.entries(pageTexts).forEach(([pageStr, text]) => {
        if (text.toLowerCase().includes(query.toLowerCase()))
          results.push({ pageNumber: parseInt(pageStr), text: text.slice(0, 100) })
      })
      setSearchResults(results)
      setCurrentSearchIndex(0)
      if (results.length > 0) handlePageChange(results[0].pageNumber)
    },
    [pageTexts, handlePageChange]
  )

  const handleNavigateResult = useCallback(
    (direction: 'next' | 'prev') => {
      if (searchResults.length === 0) return
      const newIndex = direction === 'next'
        ? (currentSearchIndex + 1) % searchResults.length
        : (currentSearchIndex - 1 + searchResults.length) % searchResults.length
      setCurrentSearchIndex(newIndex)
      handlePageChange(searchResults[newIndex].pageNumber)
    },
    [searchResults, currentSearchIndex, handlePageChange]
  )

  const currentPageText = useMemo(() => pageTexts[currentPage] || '', [pageTexts, currentPage])
  const allText = useMemo(() => Object.values(pageTexts).join(' '), [pageTexts])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (showInlineRSVP) return // RSVP has its own keyboard handler
      switch (e.key) {
        case 'ArrowLeft': e.preventDefault(); handlePageChange(currentPage - 1); break
        case 'ArrowRight': e.preventDefault(); handlePageChange(currentPage + 1); break
        case '=': case '+': if (e.ctrlKey || e.metaKey) { e.preventDefault(); handleZoomIn() } break
        case '-': if (e.ctrlKey || e.metaKey) { e.preventDefault(); handleZoomOut() } break
        case '0': if (e.ctrlKey || e.metaKey) { e.preventDefault(); handleResetZoom() } break
        case 'f': if (e.ctrlKey || e.metaKey) { e.preventDefault(); setSearchOpen(!searchOpen) } break
        case ' ': e.preventDefault(); focus.toggleFocus(); break
        case 'Escape':
          if (selectedWord) { setSelectedWord(null); return }
          if (focus.enabled) focus.setEnabled(false)
          if (searchOpen) setSearchOpen(false)
          break
        case 'w': handleFitWidth(); break
        case 'r': if (!e.ctrlKey && !e.metaKey && currentPageText.length > 0) setShowInlineRSVP(true); break
        case 'v': if (!e.ctrlKey && !e.metaKey) setShowVocabulary((v) => !v); break
        case 'i': if (!e.ctrlKey && !e.metaKey) setShowInsights((v) => !v); break
        case 'h': if (!e.ctrlKey && !e.metaKey) setShowHeatmap((v) => !v); break
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentPage, searchOpen, focus.enabled, selectedWord, currentPageText, showInlineRSVP])

  if (!doc) {
    return (
      <div className="h-full flex items-center justify-center bg-[var(--color-surface-2)]">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-[var(--color-surface-3)] flex items-center justify-center mx-auto mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[var(--color-text-tertiary)]">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
          </div>
          <p className="text-[var(--color-text-tertiary)] font-medium">Document not found</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-[var(--color-surface-2)]">
      {/* Animated reading progress */}
      <div className="relative h-[3px] bg-[var(--color-surface-3)] shrink-0 z-30 overflow-hidden">
        <motion.div
          className="absolute inset-y-0 left-0 rounded-r-full"
          style={{ background: 'linear-gradient(90deg, var(--color-accent), #8b5cf6, #ec4899)' }}
          animate={{ width: `${scrollProgress}%` }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
        />
        <div
          className="absolute inset-y-0 left-0 opacity-40"
          style={{
            width: `${scrollProgress}%`,
            background: 'linear-gradient(90deg, var(--color-accent), #8b5cf6, #ec4899)',
            filter: 'blur(4px)',
          }}
        />
      </div>

      <ReaderHeader
        title={doc.title}
        currentPage={currentPage}
        totalPages={totalPages}
        zoom={scale}
        onPageChange={handlePageChange}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onResetZoom={handleResetZoom}
        onFitWidth={handleFitWidth}
        isFocusMode={focus.enabled}
        onToggleFocus={focus.toggleFocus}
        showThumbnails={thumbnailsOpen}
        onToggleThumbnails={() => useUIStore.getState().toggleThumbnails()}
        showOutline={outlineOpen}
        onToggleOutline={() => useUIStore.getState().toggleOutline()}
        onToggleRSVP={() => currentPageText.length > 0 && setShowInlineRSVP(true)}
        onToggleVocabulary={() => setShowVocabulary(true)}
        onToggleInsights={() => setShowInsights(true)}
      />

      <div className="flex-1 flex overflow-hidden relative">
        {/* Heatmap sidebar */}
        {showHeatmap && totalPages > 0 && (
          <div className="w-10 border-r border-[var(--color-surface-3)] bg-[var(--color-surface-1)] shrink-0 theme-transition flex flex-col items-center">
            <ReadingHeatmap
              totalPages={totalPages}
              currentPage={currentPage}
              pageTimes={pageTimes}
              onPageClick={handlePageChange}
            />
          </div>
        )}

        {thumbnailsOpen && totalPages > 0 && pdf && (
          <PDFThumbnailPanel pdf={pdf} totalPages={totalPages} currentPage={currentPage} onPageSelect={handlePageChange} />
        )}

        <div ref={containerRef} className="flex-1 flex flex-col overflow-hidden relative">
          <AnimatePresence>
            {searchOpen && (
              <PDFSearchPanel
                onSearch={handleSearch}
                onClose={() => setSearchOpen(false)}
                resultCount={searchResults.length}
                currentResult={currentSearchIndex + 1}
                onNavigateResult={handleNavigateResult}
              />
            )}
          </AnimatePresence>

          {focus.enabled && <FocusGuide containerRef={containerRef} />}

          <div ref={scrollRef} className="flex-1 overflow-auto">
            <div className="h-6" />

            {loading && (
              <div className="flex flex-col items-center justify-center py-24 gap-4">
                <div className="w-12 h-12 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" />
                <div className="text-center">
                  <p className="text-sm font-medium text-[var(--color-text-primary)]">Loading PDF...</p>
                  <p className="text-xs text-[var(--color-text-tertiary)] mt-1">{doc.title}</p>
                </div>
              </div>
            )}

            {error && (
              <div className="flex flex-col items-center justify-center py-24">
                <p className="text-sm font-medium text-[var(--color-error)]">{error}</p>
              </div>
            )}

            {!loading && !error && pdf && (
              <div className="flex flex-col items-center gap-5">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                  const isNearby = Math.abs(page - currentPage) <= VIRTUALIZATION_BUFFER
                  const dim = pageDimensions[page]
                  const w = dim ? dim.width : 612 * scale

                  return (
                    <div
                      key={page}
                      data-page-number={page}
                      ref={(el) => {
                        if (el) pageRefs.current.set(page, el)
                        if (page === currentPage) currentPageContainerRef.current = el
                      }}
                      className="relative"
                    >
                      <div className="absolute -top-5 left-1/2 -translate-x-1/2 z-10">
                        <span className="text-[10px] font-medium text-[var(--color-text-tertiary)] tabular-nums">{page}</span>
                      </div>

                      <div
                        className="mx-auto rounded"
                        style={{
                          width: w,
                          boxShadow: '0 1px 4px rgba(0,0,0,0.1), 0 4px 16px rgba(0,0,0,0.06)',
                        }}
                      >
                        {isNearby ? (
                          <PDFPageRenderer
                            pdf={pdf}
                            pageNumber={page}
                            scale={scale}
                            isVisible={true}
                            isCurrentPage={page === currentPage}
                            isDarkMode={isDarkMode}
                            rsvpActive={showInlineRSVP}
                            onTextExtracted={handleTextExtracted}
                            onDimensionsReady={handleDimensionsReady}
                            onWordSelect={handleWordSelect}
                            onPositionExtracted={handlePositionsExtracted}
                          />
                        ) : (
                          <div style={{ width: 612 * scale, height: 792 * scale }} className={isDarkMode ? 'bg-[#1a1a2e]' : 'bg-[var(--color-surface-2)]'} />
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            <div className="h-20" />
          </div>

          {/* Status bar */}
          <div className="h-10 border-t border-[var(--color-surface-3)] bg-[var(--color-surface-1)] flex items-center justify-between px-4 shrink-0 theme-transition z-20">
            <div className="flex items-center gap-2">
              <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage <= 1} className="p-1.5 rounded-md text-[var(--color-text-tertiary)] hover:bg-[var(--color-surface-2)] disabled:opacity-30 transition-colors">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6" /></svg>
              </button>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  value={currentPage}
                  onChange={(e) => { const v = parseInt(e.target.value); if (v >= 1 && v <= totalPages) handlePageChange(v) }}
                  className="w-10 h-6 text-center text-xs font-medium bg-[var(--color-surface-2)] border border-[var(--color-surface-3)] rounded text-[var(--color-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)] tabular-nums"
                />
                <span className="text-xs text-[var(--color-text-tertiary)] tabular-nums">/ {totalPages}</span>
              </div>
              <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage >= totalPages} className="p-1.5 rounded-md text-[var(--color-text-tertiary)] hover:bg-[var(--color-surface-2)] disabled:opacity-30 transition-colors">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>
              </button>
            </div>

            <ReadingTimer />

            <div className="flex items-center gap-3 text-xs text-[var(--color-text-tertiary)]">
              {focus.enabled && focus.autoScroll && (
                <span className="flex items-center gap-1.5 text-[var(--color-accent)]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)] animate-pulse" />
                  Auto-scroll
                </span>
              )}
              <span className="tabular-nums">{Math.round(scale * 100)}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Word popup */}
      <AnimatePresence>
        {selectedWord && (
          <WordPopup
            word={selectedWord.word}
            x={selectedWord.x}
            y={selectedWord.y}
            onClose={() => setSelectedWord(null)}
            documentId={doc.id}
            pageNumber={currentPage}
          />
        )}
      </AnimatePresence>

      {/* Inline RSVP speed reader */}
      <AnimatePresence>
        {showInlineRSVP && currentPageText.length > 0 && (
          <InlineRSVP
            text={currentPageText}
            positions={pagePositions[currentPage] || []}
            onClose={() => setShowInlineRSVP(false)}
            pageContainerRef={currentPageContainerRef}
          />
        )}
      </AnimatePresence>

      {/* Vocabulary Panel */}
      <VocabularyPanel isOpen={showVocabulary} onClose={() => setShowVocabulary(false)} />

      {/* Reading Insights */}
      <ReadingInsights
        isOpen={showInsights}
        onClose={() => setShowInsights(false)}
        currentPage={currentPage}
        totalPages={totalPages}
        pageTimes={pageTimes}
      />

      <AnimatePresence>
        {focus.enabled && <FocusControls isVisible={focus.enabled} />}
      </AnimatePresence>
    </div>
  )
}
