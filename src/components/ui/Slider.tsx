import { type InputHTMLAttributes, forwardRef } from 'react'

interface SliderProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange'> {
  min: number
  max: number
  step?: number
  value: number
  onChange: (value: number) => void
  label?: string
  showValue?: boolean
  formatValue?: (value: number) => string
}

export const Slider = forwardRef<HTMLInputElement, SliderProps>(
  ({ min, max, step = 1, value, onChange, label, showValue = true, formatValue, className = '', ...props }, ref) => {
    const percentage = ((value - min) / (max - min)) * 100
    const displayValue = formatValue ? formatValue(value) : value

    return (
      <div className={`flex flex-col gap-1.5 ${className}`}>
        {(label || showValue) && (
          <div className="flex items-center justify-between">
            {label && (
              <label className="text-xs font-medium text-[var(--color-text-secondary)]">
                {label}
              </label>
            )}
            {showValue && (
              <span className="text-xs text-[var(--color-text-tertiary)] tabular-nums">
                {displayValue}
              </span>
            )}
          </div>
        )}
        <div className="relative h-5 flex items-center">
          <div className="absolute w-full h-1.5 bg-[var(--color-surface-3)] rounded-full" />
          <div
            className="absolute h-1.5 bg-[var(--color-accent)] rounded-full"
            style={{ width: `${percentage}%` }}
          />
          <input
            ref={ref}
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            className="absolute w-full h-5 opacity-0 cursor-pointer z-10"
            {...props}
          />
          <div
            className="absolute w-4 h-4 bg-white border-2 border-[var(--color-accent)] rounded-full shadow-sm pointer-events-none transition-transform"
            style={{ left: `calc(${percentage}% - 8px)` }}
          />
        </div>
      </div>
    )
  }
)

Slider.displayName = 'Slider'
