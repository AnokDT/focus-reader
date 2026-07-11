import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { useAnnotationStore } from '@/stores/annotationStore'
import { useBookmarkStore } from '@/stores/bookmarkStore'

interface ExportNotesProps {
  documentId: string
  documentTitle: string
  totalPages: number
}

export function useExportNotes({ documentId, documentTitle, totalPages }: ExportNotesProps) {
  const getDocumentAnnotations = useAnnotationStore((s) => s.getDocumentAnnotations)
  const getDocumentBookmarks = useBookmarkStore((s) => s.getDocumentBookmarks)

  const exportMarkdown = useMemo(() => {
    return () => {
      const annotations = getDocumentAnnotations(documentId)
      const bookmarks = getDocumentBookmarks(documentId)

      let md = `# ${documentTitle}\n\n`
      md += `*Exported from Focus Reader on ${new Date().toLocaleDateString()}*\n\n`

      // Bookmarks
      if (bookmarks.length > 0) {
        md += `## Bookmarks\n\n`
        const sorted = [...bookmarks].sort((a, b) => a.pageNumber - b.pageNumber)
        for (const bm of sorted) {
          md += `- **Page ${bm.pageNumber}**: ${bm.label}\n`
        }
        md += `\n`
      }

      // Annotations
      if (annotations.length > 0) {
        md += `## Highlights & Notes\n\n`
        const sorted = [...annotations].sort((a, b) => a.pageNumber - b.pageNumber)
        for (const ann of sorted) {
          md += `### Page ${ann.pageNumber}\n\n`
          md += `> ${ann.text}\n\n`
          if (ann.note) {
            md += `**Note:** ${ann.note}\n\n`
          }
          md += `*Highlighted in ${ann.color}*\n\n`
        }
      }

      if (bookmarks.length === 0 && annotations.length === 0) {
        md += `*No bookmarks or highlights yet.*\n`
      }

      return md
    }
  }, [documentId, documentTitle, getDocumentAnnotations, getDocumentBookmarks])

  const downloadMarkdown = useMemo(() => {
    return () => {
      const content = exportMarkdown()
      const blob = new Blob([content], { type: 'text/markdown' })
      const url = URL.createObjectURL(blob)
      const a = window.document.createElement('a')
      a.href = url
      a.download = `${documentTitle.replace(/[^a-zA-Z0-9]/g, '_')}_notes.md`
      window.document.body.appendChild(a)
      a.click()
      window.document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }
  }, [exportMarkdown, documentTitle])

  return { exportMarkdown, downloadMarkdown }
}
