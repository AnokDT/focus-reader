import { memo } from 'react'
import { useEyeLockStore } from '@/stores/eyeLockStore'

interface ReadingLaneProps {
  active: boolean
}

function ReadingLaneInner({ active }: ReadingLaneProps) {
  const enabled = useEyeLockStore((s) => s.enabled)

  if (!enabled || !active) return null

  return (
    <div
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 45 }}
    >
      {/* Top fade */}
      <div
        className="absolute top-0 left-0 right-0"
        style={{
          height: '30%',
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.08) 50%, transparent 100%)',
        }}
      />

      {/* Bottom fade */}
      <div
        className="absolute bottom-0 left-0 right-0"
        style={{
          height: '30%',
          background: 'linear-gradient(to top, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.08) 50%, transparent 100%)',
        }}
      />

      {/* Left edge */}
      <div
        className="absolute top-0 bottom-0 left-0"
        style={{
          width: '12%',
          background: 'linear-gradient(to right, rgba(0,0,0,0.12) 0%, transparent 100%)',
        }}
      />

      {/* Right edge */}
      <div
        className="absolute top-0 bottom-0 right-0"
        style={{
          width: '12%',
          background: 'linear-gradient(to left, rgba(0,0,0,0.12) 0%, transparent 100%)',
        }}
      />
    </div>
  )
}

export const ReadingLane = memo(ReadingLaneInner)
