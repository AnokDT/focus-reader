import { useRef, useEffect, memo } from 'react'
import { useEyeLockStore } from '@/stores/eyeLockStore'

interface FocusCorridorProps {
  scrollContainer: HTMLElement | null
  currentLineY: number
  lineHeight: number
}

function FocusCorridorInner({ scrollContainer, currentLineY, lineHeight }: FocusCorridorProps) {
  const corridorEnabled = useEyeLockStore((s) => s.corridorEnabled)
  const corridorIntensity = useEyeLockStore((s) => s.corridorIntensity)
  const maskRef = useRef<HTMLDivElement>(null)
  const rafRef = useRef<number>(0)
  const targetRef = useRef(currentLineY)
  const currentRef = useRef(currentLineY)

  useEffect(() => {
    targetRef.current = currentLineY
  }, [currentLineY])

  useEffect(() => {
    if (!corridorEnabled || !scrollContainer) return

    const animate = () => {
      const mask = maskRef.current
      if (!mask) return

      const dy = targetRef.current - currentRef.current
      if (Math.abs(dy) > 0.5) {
        currentRef.current += dy * 0.2
        mask.style.setProperty('--line-y', `${currentRef.current}px`)
        rafRef.current = requestAnimationFrame(animate)
      } else {
        currentRef.current = targetRef.current
        mask.style.setProperty('--line-y', `${currentRef.current}px`)
      }
    }

    rafRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(rafRef.current)
  }, [corridorEnabled, scrollContainer, currentLineY])

  if (!corridorEnabled || !scrollContainer) return null

  const dimAmount = corridorIntensity / 100
  const corridorHeight = lineHeight * 1.8

  return (
    <div
      ref={maskRef}
      className="pointer-events-none"
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 5,
        maskImage: `linear-gradient(
          to bottom,
          rgba(0,0,0,${dimAmount}) 0%,
          rgba(0,0,0,0) calc(var(--line-y, 0px) - ${corridorHeight}px),
          rgba(0,0,0,0) var(--line-y, 0px),
          rgba(0,0,0,0) calc(var(--line-y, 0px) + ${lineHeight}px),
          rgba(0,0,0,0) calc(var(--line-y, 0px) + ${corridorHeight}px),
          rgba(0,0,0,${dimAmount}) 100%
        )`,
        WebkitMaskImage: `linear-gradient(
          to bottom,
          rgba(0,0,0,${dimAmount}) 0%,
          rgba(0,0,0,0) calc(var(--line-y, 0px) - ${corridorHeight}px),
          rgba(0,0,0,0) var(--line-y, 0px),
          rgba(0,0,0,0) calc(var(--line-y, 0px) + ${lineHeight}px),
          rgba(0,0,0,0) calc(var(--line-y, 0px) + ${corridorHeight}px),
          rgba(0,0,0,${dimAmount}) 100%
        )`,
        background: 'var(--color-surface-0)',
        transition: 'none',
      }}
    />
  )
}

export const FocusCorridor = memo(FocusCorridorInner)
