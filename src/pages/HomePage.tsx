import { useCallback, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Plus, BookOpen, FileText, Clock, Trash2, Upload, GripVertical } from 'lucide-react'
import { useLibraryStore } from '@/stores/libraryStore'
import { storageService } from '@/services/storageService'
import { Button } from '@/components/ui/Button'
import { cleanFileName } from '@/utils/textUtils'
import { formatDate } from '@/utils/dateUtils'
import { formatFileSize } from '@/utils/pdfUtils'

export function HomePage() {
  const navigate = useNavigate()
  const documents = useLibraryStore((s) => s.documents)
  const removeDocument = useLibraryStore((s) => s.removeDocument)
  const [isDragging, setIsDragging] = useState(false)

  const importFiles = useCallback(async (files: File[]) => {
    let lastId = ''
    for (const file of files) {
      try {
        await storageService.saveFile(file)
        const id = `${file.name}-${file.size}-${Date.now()}`
        lastId = id
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
      } catch (err) {
        console.error('Failed to import file:', err)
      }
    }
    if (lastId) navigate(`/reader/${lastId}`)
  }, [navigate])

  const handleFileOpen = useCallback(() => {
    const input = window.document.createElement('input')
    input.type = 'file'
    input.accept = '.pdf'
    input.multiple = true
    input.onchange = (e) => {
      const files = Array.from((e.target as HTMLInputElement).files || [])
      importFiles(files)
    }
    input.click()
  }, [importFiles])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const files = Array.from(e.dataTransfer.files).filter(
      (f) => f.type === 'application/pdf'
    )
    if (files.length > 0) importFiles(files)
  }, [importFiles])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  return (
    <div
      className="h-full overflow-y-auto"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="max-w-4xl mx-auto p-8 space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-end justify-between"
        >
          <div>
            <h1 className="text-3xl font-bold text-[var(--color-text-primary)] tracking-tight">
              Library
            </h1>
            <p className="text-sm text-[var(--color-text-tertiary)] mt-1">
              {documents.length === 0
                ? 'Import your first PDF to get started'
                : `${documents.length} document${documents.length !== 1 ? 's' : ''}`}
            </p>
          </div>
          <Button onClick={handleFileOpen} icon={<Plus size={18} />}>
            Open PDF
          </Button>
        </motion.div>

        {/* Drag overlay */}
        <AnimatePresence>
          {isDragging && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-[var(--color-accent)]/10 backdrop-blur-sm flex items-center justify-center"
            >
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.9 }}
                className="bg-[var(--color-surface-0)] border-2 border-dashed border-[var(--color-accent)] rounded-2xl p-16 text-center shadow-2xl"
              >
                <Upload size={48} className="mx-auto text-[var(--color-accent)] mb-4" />
                <p className="text-lg font-semibold text-[var(--color-text-primary)]">
                  Drop PDF files here
                </p>
                <p className="text-sm text-[var(--color-text-tertiary)] mt-1">
                  Release to import into your library
                </p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty state */}
        {documents.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex flex-col items-center justify-center py-20"
          >
            <div className="relative mb-8">
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-[var(--color-accent)]/20 to-[var(--color-accent)]/5 flex items-center justify-center">
                <BookOpen size={40} className="text-[var(--color-accent)]" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-xl bg-[var(--color-accent)] flex items-center justify-center shadow-lg">
                <Plus size={16} className="text-white" />
              </div>
            </div>

            <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-2">
              Your reading journey starts here
            </h2>
            <p className="text-sm text-[var(--color-text-tertiary)] mb-8 max-w-sm text-center">
              Import PDFs to build your personal library. Focus Reader helps you stay concentrated and track your reading progress.
            </p>

            <div className="flex gap-3 mb-12">
              <Button onClick={handleFileOpen} icon={<Upload size={16} />} size="lg">
                Import PDFs
              </Button>
            </div>

            {/* Drop zone */}
            <div className="w-full max-w-md border-2 border-dashed border-[var(--color-surface-3)] rounded-2xl p-12 text-center hover:border-[var(--color-accent)]/50 hover:bg-[var(--color-accent)]/5 transition-all duration-300 cursor-pointer" onClick={handleFileOpen}>
              <Upload size={24} className="mx-auto text-[var(--color-text-tertiary)] mb-3" />
              <p className="text-sm text-[var(--color-text-tertiary)]">
                Drag & drop PDF files here
              </p>
              <p className="text-xs text-[var(--color-text-tertiary)] mt-1 opacity-60">
                or click to browse
              </p>
            </div>

            {/* Features */}
            <div className="grid grid-cols-3 gap-6 mt-16 w-full max-w-lg">
              {[
                { icon: '🎯', title: 'Focus Mode', desc: 'Reading guide that keeps you on track' },
                { icon: '📊', title: 'Analytics', desc: 'Track pages, WPM, and streaks' },
                { icon: '🌙', title: 'Smart Dark Mode', desc: 'Preserves images, inverts text' },
              ].map((feature, i) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + i * 0.1 }}
                  className="text-center"
                >
                  <div className="text-2xl mb-2">{feature.icon}</div>
                  <h3 className="text-xs font-semibold text-[var(--color-text-primary)]">{feature.title}</h3>
                  <p className="text-[10px] text-[var(--color-text-tertiary)] mt-0.5">{feature.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {documents.map((doc: any, index: number) => (
              <motion.div
                key={doc.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                onClick={() => navigate(`/reader/${doc.id}`)}
                className="group relative bg-[var(--color-surface-1)] border border-[var(--color-surface-3)] rounded-xl p-4 cursor-pointer hover:border-[var(--color-accent)] hover:shadow-lg hover:shadow-[var(--color-accent)]/5 transition-all duration-200"
              >
                <div className="flex items-start gap-3">
                  <div className="w-11 h-14 bg-gradient-to-br from-[var(--color-accent)]/20 to-[var(--color-accent)]/5 rounded-lg flex items-center justify-center shrink-0 group-hover:from-[var(--color-accent)]/30 group-hover:to-[var(--color-accent)]/10 transition-colors">
                    <FileText size={20} className="text-[var(--color-accent)]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-[var(--color-text-primary)] truncate group-hover:text-[var(--color-accent)] transition-colors">
                      {doc.title}
                    </h3>
                    <p className="text-xs text-[var(--color-text-tertiary)] mt-0.5">
                      {formatFileSize(doc.fileSize)}
                    </p>
                    <div className="flex items-center gap-3 mt-2.5">
                      <div className="flex items-center gap-1">
                        <Clock size={11} className="text-[var(--color-text-tertiary)]" />
                        <span className="text-[10px] text-[var(--color-text-tertiary)]">
                          {formatDate(doc.lastReadAt)}
                        </span>
                      </div>
                      {doc.lastReadPage > 0 && (
                        <span className="text-[10px] text-[var(--color-accent)] font-medium">
                          Page {doc.lastReadPage}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      removeDocument(doc.id)
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md text-[var(--color-text-tertiary)] hover:text-red-500 hover:bg-red-50 transition-all"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </motion.div>
            ))}

            {/* Add more card */}
            <motion.button
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: documents.length * 0.03 }}
              onClick={handleFileOpen}
              className="border-2 border-dashed border-[var(--color-surface-3)] rounded-xl p-4 flex flex-col items-center justify-center gap-2 hover:border-[var(--color-accent)]/50 hover:bg-[var(--color-accent)]/5 transition-all duration-200 min-h-[100px]"
            >
              <Plus size={20} className="text-[var(--color-text-tertiary)]" />
              <span className="text-xs font-medium text-[var(--color-text-tertiary)]">Add PDF</span>
            </motion.button>
          </div>
        )}
      </div>
    </div>
  )
}
