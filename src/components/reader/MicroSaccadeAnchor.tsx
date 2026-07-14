import { useRef, useEffect, memo } from 'react'
import { useEyeLockStore } from '@/stores/eyeLockStore'

interface MicroSaccadeAnchorProps {
  x: number
  y: number
  wordHeight: number
}

function MicroSaccadeAnchorInner({ x, y, wordHeight }: MicroSaccadeAnchorProps) {
  const anchorEnabled = useEyeLockStore((s) => s.anchorEnabled)
  const anchorIntensity = useEyeLockStore((s) => s.anchorIntensity)
  const dotRef = useRef<HTMLDivElement>(null)
  const rafRef = useRef<number>(0)
  const targetRef = useRef({ x, y })
  const currentRef = useRef({ x, y })

  useEffect(() => {
    targetRef.current = { x, y }
  }, [x, y])

  useEffect(() => {
    if (!anchorEnabled) return

    const animate = () => {
      const dot = dotRef.current
      if (!dot) return

      const dx = targetRef.current.x - currentRef.current.x
      const dy = targetRef.current.y - currentRef.current.y

      if (Math.abs(dx) > 0.1 || Math.abs(dy) > 0.1) {
        currentRef.current.x += dx * 0.35
        currentRef.current.y += dy * 0.35
        dot.style.transform = `translate(${currentRef.current.x}px, ${currentRef.current.y}px)`
        rafRef.current = requestAnimationFrame(animate)
      } else {
        currentRef.current.x = targetRef.current.x
        currentRef.current.y = targetRef.current.y
        dot.style.transform = `translate(${currentRef.current.x}px, ${currentRef.current.y}px)`
      }
    }

    rafRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(rafRef.current)
  }, [anchorEnabled, x, y])

  if (!anchorEnabled) return null

  const size = 2
  const opacity = anchorIntensity / 100

  return (
    <div
      ref={dotRef}
      className="fixed pointer-events-none"
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: 'var(--color-accent)',
        opacity,
        transform: `translate(${x}px, ${y}px)`,
        willChange: 'transform',
        zIndex: 60,
        boxShadow: `0 0 ${size * 3}px var(--color-accent)`,
      }}
    />
  )
}

export const MicroSaccadeAnchor = memo(MicroSaccadeAnchorInner)
