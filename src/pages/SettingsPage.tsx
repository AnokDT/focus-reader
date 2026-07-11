import { motion } from 'framer-motion'
import { Sun, Moon, Coffee, RotateCcw } from 'lucide-react'
import { useSettingsStore } from '@/stores/settingsStore'
import { Slider } from '@/components/ui/Slider'
import { Toggle } from '@/components/ui/Toggle'
import { Button } from '@/components/ui/Button'
import type { Theme } from '@/types/settings'

const themes: { value: Theme; label: string; icon: React.ReactNode; description: string }[] = [
  { value: 'light', label: 'Light', icon: <Sun size={18} />, description: 'Clean and bright' },
  { value: 'dark', label: 'Dark', icon: <Moon size={18} />, description: 'Easy on the eyes' },
  { value: 'sepia', label: 'Sepia', icon: <Coffee size={18} />, description: 'Warm and classic' },
]

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">{title}</h3>
      <div className="space-y-4 pl-1">{children}</div>
    </div>
  )
}

export function SettingsPage() {
  const settings = useSettingsStore()

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-2xl mx-auto p-8 space-y-10">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Settings</h1>
          <p className="text-sm text-[var(--color-text-tertiary)] mt-1">
            Customize your reading experience
          </p>
        </div>

        <Section title="Appearance">
          <div className="space-y-3">
            <p className="text-sm font-medium text-[var(--color-text-secondary)]">Theme</p>
            <div className="grid grid-cols-3 gap-3">
              {themes.map((theme) => (
                <button
                  key={theme.value}
                  onClick={() => settings.setTheme(theme.value)}
                  className={`
                    flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all
                    ${settings.theme === theme.value
                      ? 'border-[var(--color-accent)] bg-[var(--color-accent-muted)]'
                      : 'border-[var(--color-surface-3)] hover:border-[var(--color-surface-3)] hover:bg-[var(--color-surface-1)]'
                    }
                  `}
                >
                  <div className={`
                    p-2.5 rounded-lg
                    ${settings.theme === theme.value
                      ? 'bg-[var(--color-accent)] text-white'
                      : 'bg-[var(--color-surface-2)] text-[var(--color-text-secondary)]'
                    }
                  `}>
                    {theme.icon}
                  </div>
                  <span className="text-sm font-medium text-[var(--color-text-primary)]">{theme.label}</span>
                  <span className="text-[10px] text-[var(--color-text-tertiary)]">{theme.description}</span>
                </button>
              ))}
            </div>
          </div>
        </Section>

        <Section title="Typography">
          <Slider
            label="Font size"
            min={12}
            max={24}
            value={settings.fontSize}
            onChange={settings.setFontSize}
            formatValue={(v: number) => `${v}px`}
          />
          <Slider
            label="Line spacing"
            min={1}
            max={2.5}
            step={0.1}
            value={settings.lineSpacing}
            onChange={settings.setLineSpacing}
            formatValue={(v: number) => `${v.toFixed(1)}x`}
          />
        </Section>

        <Section title="Reading">
          <Toggle
            label="Show page numbers"
            description="Display page numbers in the viewer"
            checked={settings.showPageNumbers}
            onChange={settings.setShowPageNumbers}
          />
          <Toggle
            label="Smooth scrolling"
            description="Animate page transitions"
            checked={settings.scrollBehavior === 'smooth'}
            onChange={(v: boolean) => settings.setScrollBehavior(v ? 'smooth' : 'instant')}
          />
        </Section>

        <Section title="Goals">
          <Toggle
            label="Daily reading goal"
            description="Track your daily reading time"
            checked={settings.dailyGoalEnabled}
            onChange={settings.setDailyGoalEnabled}
          />
          {settings.dailyGoalEnabled && (
            <Slider
              label="Daily goal"
              min={5}
              max={120}
              step={5}
              value={settings.dailyGoalMinutes}
              onChange={settings.setDailyGoalMinutes}
              formatValue={(v: number) => `${v} min`}
            />
          )}
        </Section>

        <Section title="Accessibility">
          <Toggle
            label="High contrast"
            description="Increase contrast for better visibility"
            checked={settings.highContrast}
            onChange={settings.setHighContrast}
          />
          <Toggle
            label="Reduce motion"
            description="Minimize animations"
            checked={settings.reduceMotion}
            onChange={settings.setReduceMotion}
          />
          <Toggle
            label="Large text"
            description="Increase base text size"
            checked={settings.largeText}
            onChange={settings.setLargeText}
          />
          <Toggle
            label="Dyslexia-friendly"
            description="Use OpenDyslexic font for better readability"
            checked={settings.dyslexiaFriendly}
            onChange={settings.setDyslexiaFriendly}
          />
        </Section>

        <Section title="Keyboard Shortcuts">
          <div className="space-y-2">
            {settings.keyboardShortcuts.map((shortcut: any) => (
              <div
                key={shortcut.action}
                className="flex items-center justify-between py-2 border-b border-[var(--color-surface-3)] last:border-0"
              >
                <span className="text-sm text-[var(--color-text-primary)]">{shortcut.label}</span>
                <div className="flex items-center gap-1">
                  {shortcut.ctrl && (
                    <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-[var(--color-surface-2)] border border-[var(--color-surface-3)] rounded text-[var(--color-text-secondary)]">
                      ⌘
                    </kbd>
                  )}
                  {shortcut.shift && (
                    <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-[var(--color-surface-2)] border border-[var(--color-surface-3)] rounded text-[var(--color-text-secondary)]">
                      ⇧
                    </kbd>
                  )}
                  <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-[var(--color-surface-2)] border border-[var(--color-surface-3)] rounded text-[var(--color-text-secondary)]">
                    {shortcut.key}
                  </kbd>
                </div>
              </div>
            ))}
          </div>
        </Section>

        <div className="pt-4 pb-8">
          <Button
            variant="secondary"
            onClick={settings.resetSettings}
            icon={<RotateCcw size={16} />}
          >
            Reset to defaults
          </Button>
        </div>
      </div>
    </div>
  )
}
