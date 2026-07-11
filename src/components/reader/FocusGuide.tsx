import { useEffect, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useFocusStore } from '@/stores/focusStore'

interface FocusGuideProps {
  containerRef: React.RefObject<HTMLDivElement | null>
}

export function FocusGuide({ containerRef }: FocusGuideProps) {
  const {
    style,
    width,
    opacity,
    color,
    thickness,
    guidePosition,
    autoScroll,
    isPaused,
    speed,
    moveGuideUp,
    moveGuideDown,
  } = useFocusStore()

  const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined)
  const scrollIntervalRef = useRef<ReturnType<typeof setInterval>>(undefined)

  // Find the scroll container
  const getScrollContainer = useCallback(() => {
    if (!containerRef?.current) return null
    return containerRef.current.querySelector('[class*="overflow-auto"]') as HTMLElement | null
  }, [containerRef])

  // Auto-scroll: move guide down, and when it reaches bottom, scroll the page
  useEffect(() => {
    if (autoScroll && !isPaused) {
      intervalRef.current = setInterval(() => {
        const state = useFocusStore.getState()
        const pos = state.guidePosition

        if (pos >= 90) {
          // Guide is near bottom — scroll the container down to bring new content
          const scrollEl = getScrollContainer()
          if (scrollEl) {
            const { scrollTop, scrollHeight, clientHeight } = scrollEl
            const isAtBottom = scrollTop + clientHeight >= scrollHeight - 20

            if (isAtBottom) {
              // Truly at the end — stop
              useFocusStore.getState().toggleAutoScroll()
              return
            }

            // Smooth scroll down by ~30% of viewport
            scrollEl.scrollBy({
              top: clientHeight * 0.3,
              behavior: 'smooth',
            })

            // Reset guide to ~30% after scroll so reading continues naturally
            setTimeout(() => {
              useFocusStore.getState().setGuidePosition(30)
            }, 150)
          } else {
            // No scroll container found — just stop
            useFocusStore.getState().toggleAutoScroll()
          }
        } else {
          moveGuideDown()
        }
      }, speed)
    }
    return () => {
      clearInterval(intervalRef.current)
    }
  }, [autoScroll, isPaused, speed, moveGuideDown, getScrollContainer])

  // Keyboard
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        moveGuideUp()
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        moveGuideDown()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [moveGuideUp, moveGuideDown])

  if (style === 'line') {
    return (
      <div className="focus-guide-overlay">
        <motion.div
          animate={{ top: `${guidePosition}%` }}
          transition={{ duration: 0.1, ease: 'linear' }}
          className="absolute left-0 right-0"
        >
          <div
            className="w-full"
            style={{
              height: `${thickness}px`,
              backgroundColor: color,
              opacity,
            }}
          />
        </motion.div>
      </div>
    )
  }

  if (style === 'box') {
    return (
      <div className="focus-guide-overlay">
        <motion.div
          animate={{ top: `${guidePosition}%` }}
          transition={{ duration: 0.1, ease: 'linear' }}
          className="absolute left-0 right-0"
        >
          <div className="flex justify-center">
            <div
              style={{
                width: `${width}%`,
                height: `${thickness * 8}px`,
                border: `${thickness}px solid ${color}`,
                opacity,
                borderRadius: `${thickness}px`,
              }}
            />
          </div>
        </motion.div>
      </div>
    )
  }

  if (style === 'highlight') {
    return (
      <div className="focus-guide-overlay">
        <motion.div
          animate={{ top: `${guidePosition}%` }}
          transition={{ duration: 0.1, ease: 'linear' }}
          className="absolute left-0 right-0"
        >
          <div className="flex justify-center">
            <div
              style={{
                width: `${width}%`,
                height: `${thickness * 8}px`,
                backgroundColor: color,
                opacity: opacity * 0.5,
                borderRadius: `${thickness}px`,
              }}
            />
          </div>
        </motion.div>
      </div>
    )
  }

  if (style === 'ruler') {
    return (
      <div className="focus-guide-overlay">
        <motion.div
          animate={{ top: `${guidePosition}%` }}
          transition={{ duration: 0.1, ease: 'linear' }}
          className="absolute left-0 right-0"
        >
          <div className="flex justify-center">
            <div
              style={{
                width: `${width}%`,
                height: `${thickness * 8}px`,
                background: `linear-gradient(180deg, ${color} 0%, transparent 100%)`,
                opacity,
                borderRadius: `${thickness}px ${thickness}px 0 0`,
              }}
            />
          </div>
        </motion.div>
      </div>
    )
  }

  return null
}
