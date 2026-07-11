import { motion } from 'framer-motion'
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  ChevronUp,
  ChevronDown,
  Eye,
} from 'lucide-react'
import { useFocusStore } from '@/stores/focusStore'
import { Slider } from '@/components/ui/Slider'
import { Button } from '@/components/ui/Button'
import { Tooltip } from '@/components/ui/Tooltip'
import type { GuideStyle } from '@/types/reader'
import { useState } from 'react'

const guideStyles: { value: GuideStyle; label: string }[] = [
  { value: 'line', label: 'Line' },
  { value: 'box', label: 'Box' },
  { value: 'highlight', label: 'Highlight' },
  { value: 'ruler', label: 'Ruler' },
]

const guideColors = [
  { name: 'Blue', color: '#3b82f6' },
  { name: 'Amber', color: '#f59e0b' },
  { name: 'Green', color: '#10b981' },
  { name: 'Red', color: '#ef4444' },
  { name: 'Purple', color: '#8b5cf6' },
]

interface FocusControlsProps {
  isVisible: boolean
}

export function FocusControls({ isVisible }: FocusControlsProps) {
  const focus = useFocusStore()
  const [showSettings, setShowSettings] = useState(false)

  if (!isVisible) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
    >
      <div className="bg-[var(--color-surface-0)] border border-[var(--color-surface-3)] rounded-2xl shadow-2xl backdrop-blur-xl bg-opacity-95">
        <div className="flex items-center gap-2 p-3">
          <Tooltip content="Previous sentence">
            <Button variant="ghost" size="sm" onClick={focus.moveGuideUp} icon={<SkipBack size={16} />} />
          </Tooltip>

          <Tooltip content={focus.autoScroll ? (focus.isPaused ? 'Resume' : 'Pause') : 'Auto-scroll'}>
            <Button
              variant={focus.autoScroll ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => {
                if (focus.autoScroll) {
                  focus.togglePause()
                } else {
                  focus.toggleAutoScroll()
                }
              }}
              icon={focus.autoScroll && !focus.isPaused ? <Pause size={16} /> : <Play size={16} />}
            />
          </Tooltip>

          <Tooltip content="Next sentence">
            <Button variant="ghost" size="sm" onClick={focus.moveGuideDown} icon={<SkipForward size={16} />} />
          </Tooltip>

          <div className="w-px h-6 bg-[var(--color-surface-3)] mx-1" />

          <Tooltip content="Guide up">
            <Button variant="ghost" size="sm" onClick={focus.moveGuideUp} icon={<ChevronUp size={16} />} />
          </Tooltip>

          <Tooltip content="Guide down">
            <Button variant="ghost" size="sm" onClick={focus.moveGuideDown} icon={<ChevronDown size={16} />} />
          </Tooltip>

          <div className="w-px h-6 bg-[var(--color-surface-3)] mx-1" />

          <Tooltip content="Focus settings">
            <Button
              variant={showSettings ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
              icon={<Eye size={16} />}
            />
          </Tooltip>
        </div>

        {showSettings && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-[var(--color-surface-3)] p-4 space-y-4 w-80"
          >
            <div className="flex gap-1.5">
              {guideStyles.map((s) => (
                <button
                  key={s.value}
                  onClick={() => focus.setStyle(s.value)}
                  className={`
                    flex-1 px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors
                    ${focus.style === s.value
                      ? 'bg-[var(--color-accent)] text-white'
                      : 'bg-[var(--color-surface-2)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-3)]'
                    }
                  `}
                >
                  {s.label}
                </button>
              ))}
            </div>

            <Slider
              label="Width"
              min={30}
              max={100}
              value={focus.width}
              onChange={focus.setWidth}
              formatValue={(v: number) => `${v}%`}
            />

            <Slider
              label="Opacity"
              min={5}
              max={50}
              value={Math.round(focus.opacity * 100)}
              onChange={(v: number) => focus.setOpacity(v / 100)}
              formatValue={(v: number) => `${v}%`}
            />

            <Slider
              label="Thickness"
              min={1}
              max={8}
              value={focus.thickness}
              onChange={focus.setThickness}
            />

            <Slider
              label="Speed"
              min={50}
              max={500}
              step={10}
              value={focus.speed}
              onChange={focus.setSpeed}
              formatValue={(v: number) => `${v}ms`}
            />

            <div>
              <p className="text-xs font-medium text-[var(--color-text-secondary)] mb-2">Color</p>
              <div className="flex gap-2">
                {guideColors.map((c) => (
                  <button
                    key={c.color}
                    onClick={() => focus.setColor(c.color)}
                    className={`
                      w-7 h-7 rounded-full transition-transform
                      ${focus.color === c.color ? 'ring-2 ring-offset-2 ring-[var(--color-accent)] scale-110' : 'hover:scale-105'}
                    `}
                    style={{ backgroundColor: c.color }}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}
