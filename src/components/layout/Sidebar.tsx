import { useCallback } from 'react'
import { motion } from 'framer-motion'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  BookOpen,
  BarChart3,
  Settings,
  Plus,
  FileText,
  Trash2,
} from 'lucide-react'
import { useLibraryStore } from '@/stores/libraryStore'
import { useUIStore } from '@/stores/uiStore'
import { storageService } from '@/services/storageService'
import { Button } from '@/components/ui/Button'
import { Tooltip } from '@/components/ui/Tooltip'
import { cleanFileName } from '@/utils/textUtils'

const navItems = [
  { path: '/', icon: BookOpen, label: 'Library' },
  { path: '/stats', icon: BarChart3, label: 'Stats' },
  { path: '/settings', icon: Settings, label: 'Settings' },
]

export function Sidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const documents = useLibraryStore((s) => s.documents)
  const removeDocument = useLibraryStore((s) => s.removeDocument)
  const sidebarOpen = useUIStore((s) => s.sidebarOpen)

  const handleFileOpen = useCallback(async () => {
    const input = window.document.createElement('input')
    input.type = 'file'
    input.accept = '.pdf'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      try {
        await storageService.saveFile(file)
        const id = `${file.name}-${file.size}-${Date.now()}`
        useLibraryStore.getState().addDocument({
          id,
          title: cleanFileName(file.name),
          fileName: file.name,
          pageCount: 0,
          lastReadPage: 0,
          lastReadAt: new Date().toISOString(),
          addedAt: new Date().toISOString(),
          fileSize: file.size,
        })
        navigate(`/reader/${id}`)
      } catch (err) {
        console.error('Failed to open file:', err)
      }
    }
    input.click()
  }, [navigate])

  return (
    <motion.aside
      initial={false}
      animate={{
        width: sidebarOpen ? 260 : 56,
      }}
      transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
      className="h-full bg-[var(--color-surface-1)] border-r border-[var(--color-surface-3)] flex flex-col shrink-0 theme-transition overflow-hidden"
    >
      <div className="flex items-center justify-between p-3 border-b border-[var(--color-surface-3)]">
        {sidebarOpen ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2"
          >
            <div className="w-7 h-7 rounded-lg bg-[var(--color-accent)] flex items-center justify-center">
              <BookOpen size={14} className="text-white" />
            </div>
            <span className="text-sm font-semibold text-[var(--color-text-primary)]">
              Focus Reader
            </span>
          </motion.div>
        ) : (
          <Tooltip content="Focus Reader">
            <div className="w-7 h-7 rounded-lg bg-[var(--color-accent)] flex items-center justify-center mx-auto">
              <BookOpen size={14} className="text-white" />
            </div>
          </Tooltip>
        )}
      </div>

      <div className="p-2 space-y-1">
        {sidebarOpen && (
          <Button
            variant="secondary"
            size="sm"
            className="w-full justify-start"
            onClick={handleFileOpen}
            icon={<Plus size={16} />}
          >
            Open PDF
          </Button>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path
          return (
            <Tooltip key={item.path} content={item.label} side="right">
              <button
                onClick={() => navigate(item.path)}
                className={`
                  w-full flex items-center gap-3 px-3 py-2 rounded-lg
                  text-sm font-medium transition-colors duration-150
                  ${isActive
                    ? 'bg-[var(--color-accent-muted)] text-[var(--color-accent)]'
                    : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text-primary)]'
                  }
                  ${!sidebarOpen ? 'justify-center px-0' : ''}
                `}
              >
                <item.icon size={18} />
                {sidebarOpen && <span>{item.label}</span>}
              </button>
            </Tooltip>
          )
        })}
      </nav>

      {sidebarOpen && documents.length > 0 && (
        <div className="border-t border-[var(--color-surface-3)] p-2">
          <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
            Recent
          </p>
          <div className="space-y-0.5 max-h-48 overflow-y-auto">
            {documents.slice(0, 5).map((doc: any) => (
              <button
                key={doc.id}
                onClick={() => navigate(`/reader/${doc.id}`)}
                className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-md text-xs text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text-primary)] transition-colors group"
              >
                <FileText size={14} className="shrink-0 text-[var(--color-text-tertiary)]" />
                <span className="truncate flex-1 text-left">{doc.title}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    removeDocument(doc.id)
                  }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-[var(--color-text-tertiary)] hover:text-red-500"
                >
                  <Trash2 size={12} />
                </button>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="p-2 border-t border-[var(--color-surface-3)]">
        <Tooltip content="Toggle sidebar" side="right">
          <button
            onClick={() => useUIStore.getState().toggleSidebar()}
            className="w-full flex items-center justify-center p-2 rounded-lg text-[var(--color-text-tertiary)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text-primary)] transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="1" y="2" width="14" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" />
              <line x1="5.5" y1="2" x2="5.5" y2="14" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </button>
        </Tooltip>
      </div>
    </motion.aside>
  )
}
