import { useState, useEffect, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  FileText,
  Bookmark,
  Eye,
  EyeOff,
  Zap,
  BookOpen,
  BarChart3,
  Settings,
  Columns,
  List,
  Moon,
  Sun,
  Columns2,
  type LucideIcon,
} from 'lucide-react'

interface Command {
  id: string
  label: string
  description?: string
  icon: LucideIcon
  shortcut?: string
  action: () => void
  category: string
}

interface CommandPaletteProps {
  isOpen: boolean
  onClose: () => void
  commands: Command[]
}

export function CommandPalette({ isOpen, onClose, commands }: CommandPaletteProps) {
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const filtered = useMemo(() => {
    if (!query.trim()) return commands
    const q = query.toLowerCase()
    return commands.filter(
      (c) =>
        c.label.toLowerCase().includes(q) ||
        c.description?.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q)
    )
  }, [commands, query])

  const grouped = useMemo(() => {
    const groups: Record<string, Command[]> = {}
    for (const cmd of filtered) {
      if (!groups[cmd.category]) groups[cmd.category] = []
      groups[cmd.category].push(cmd)
    }
    return groups
  }, [filtered])

  useEffect(() => {
    if (isOpen) {
      setQuery('')
      setSelectedIndex(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [isOpen])

  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex((i) => Math.max(i - 1, 0))
        break
      case 'Enter':
        e.preventDefault()
        if (filtered[selectedIndex]) {
          filtered[selectedIndex].action()
          onClose()
        }
        break
      case 'Escape':
        onClose()
        break
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[200]"
            onClick={onClose}
          />

          {/* Palette */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -20 }}
            transition={{ duration: 0.15 }}
            className="fixed top-[20%] left-1/2 -translate-x-1/2 w-full max-w-lg z-[201]"
          >
            <div className="bg-[var(--color-surface-1)] border border-[var(--color-surface-3)] rounded-2xl shadow-2xl overflow-hidden">
              {/* Search input */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--color-surface-3)]">
                <Search size={18} className="text-[var(--color-text-tertiary)] shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a command..."
                  className="flex-1 bg-transparent text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none"
                />
                <kbd className="text-[10px] text-[var(--color-text-tertiary)] bg-[var(--color-surface-2)] px-1.5 py-0.5 rounded font-mono border border-[var(--color-surface-3)]">
                  ESC
                </kbd>
              </div>

              {/* Results */}
              <div className="max-h-80 overflow-auto py-2">
                {filtered.length === 0 ? (
                  <div className="px-4 py-8 text-center">
                    <p className="text-sm text-[var(--color-text-tertiary)]">No commands found</p>
                  </div>
                ) : (
                  Object.entries(grouped).map(([category, cmds]) => (
                    <div key={category}>
                      <div className="px-4 py-1.5">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
                          {category}
                        </span>
                      </div>
                      {cmds.map((cmd) => {
                        const globalIndex = filtered.indexOf(cmd)
                        const Icon = cmd.icon
                        return (
                          <button
                            key={cmd.id}
                            onClick={() => { cmd.action(); onClose() }}
                            onMouseEnter={() => setSelectedIndex(globalIndex)}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                              globalIndex === selectedIndex
                                ? 'bg-[var(--color-accent-muted)]'
                                : 'hover:bg-[var(--color-surface-2)]'
                            }`}
                          >
                            <Icon size={16} className={globalIndex === selectedIndex ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-tertiary)]'} />
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm font-medium ${globalIndex === selectedIndex ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-primary)]'}`}>
                                {cmd.label}
                              </p>
                              {cmd.description && (
                                <p className="text-xs text-[var(--color-text-tertiary)] truncate">{cmd.description}</p>
                              )}
                            </div>
                            {cmd.shortcut && (
                              <kbd className="text-[10px] text-[var(--color-text-tertiary)] bg-[var(--color-surface-2)] px-1.5 py-0.5 rounded font-mono border border-[var(--color-surface-3)]">
                                {cmd.shortcut}
                              </kbd>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  ))
                )}
              </div>

              {/* Footer */}
              <div className="px-4 py-2 border-t border-[var(--color-surface-3)] flex items-center gap-4 text-[10px] text-[var(--color-text-tertiary)]">
                <span className="flex items-center gap-1">
                  <kbd className="bg-[var(--color-surface-2)] px-1 py-0.5 rounded border border-[var(--color-surface-3)] font-mono">↑↓</kbd>
                  navigate
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="bg-[var(--color-surface-2)] px-1 py-0.5 rounded border border-[var(--color-surface-3)] font-mono">↵</kbd>
                  select
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="bg-[var(--color-surface-2)] px-1 py-0.5 rounded border border-[var(--color-surface-3)] font-mono">esc</kbd>
                  close
                </span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
