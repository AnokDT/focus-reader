import { useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useFocusStore } from '@/stores/focusStore'

interface SmoothPageScrollerProps {
  scrollRef: React.RefObject<HTMLDivElement | null>
  containerRef: React.RefObject<HTMLDivElement | null>
  currentPage: number
  onPageChange: (page: number) => void
}

export function SmoothPageScroller({ scrollRef, containerRef, currentPage, onPageChange }: SmoothPageScrollerProps) {
  const { autoScroll, isPaused, speed } = useFocusStore()
  const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined)
  const lastScrollTop = useRef(0)

  // Smooth scroll to page with easing
  const scrollToPage = useCallback((page: number) => {
    const scrollEl = scrollRef.current
    if (!scrollEl) return

    const pageEl = scrollEl.querySelector(`[data-page-number="${page}"]`)
    if (!pageEl) return

    const scrollContainerRect = scrollEl.getBoundingClientRect()
    const pageRect = pageEl.getBoundingClientRect()
    const targetScroll = scrollEl.scrollTop + pageRect.top - scrollContainerRect.top - 60

    scrollEl.scrollTo({
      top: targetScroll,
      behavior: 'smooth',
    })
  }, [scrollRef])

  // Enhanced auto-scroll with page awareness
  useEffect(() => {
    if (!autoScroll || isPaused) {
      clearInterval(intervalRef.current)
      return
    }

    intervalRef.current = setInterval(() => {
      const scrollEl = scrollRef.current
      if (!scrollEl) return

      const { scrollTop, scrollHeight, clientHeight } = scrollEl
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 30

      if (isAtBottom) {
        // At the end of the document
        useFocusStore.getState().toggleAutoScroll()
        return
      }

      // Smooth scroll down by a small amount
      scrollEl.scrollBy({
        top: 3,
        behavior: 'auto',
      })
    }, speed / 10)

    return () => clearInterval(intervalRef.current)
  }, [autoScroll, isPaused, speed, scrollRef])

  return null
}
