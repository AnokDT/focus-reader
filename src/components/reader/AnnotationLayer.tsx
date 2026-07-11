import { useMemo } from 'react'
import { useAnnotationStore, type Annotation } from '@/stores/annotationStore'

interface AnnotationLayerProps {
  documentId: string
  pageNumber: number
  pageWidth: number
  pageHeight: number
}

export function AnnotationLayer({ documentId, pageNumber, pageWidth, pageHeight }: AnnotationLayerProps) {
  const getPageAnnotations = useAnnotationStore((s) => s.getPageAnnotations)
  const annotations = useMemo(
    () => getPageAnnotations(documentId, pageNumber),
    [getPageAnnotations, documentId, pageNumber]
  )

  if (annotations.length === 0) return null

  return (
    <div className="absolute inset-0 pointer-events-none z-[2]">
      {annotations.map((ann) => (
        <AnnotationHighlight key={ann.id} annotation={ann} pageWidth={pageWidth} pageHeight={pageHeight} />
      ))}
    </div>
  )
}

function AnnotationHighlight({ annotation, pageWidth, pageHeight }: { annotation: Annotation; pageWidth: number; pageHeight: number }) {
  return (
    <>
      {annotation.rects.map((rect, i) => (
        <div
          key={i}
          className="absolute rounded-sm opacity-35 hover:opacity-55 transition-opacity"
          style={{
            left: rect.x,
            top: rect.y,
            width: rect.width,
            height: rect.height,
            backgroundColor: annotation.color,
          }}
        >
          {i === 0 && annotation.note && (
            <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-[var(--color-accent)] flex items-center justify-center pointer-events-auto">
              <svg width="8" height="8" viewBox="0 0 24 24" fill="white" stroke="none">
                <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4V4c0-1.1-.9-2-2-2z" />
              </svg>
            </div>
          )}
        </div>
      ))}
    </>
  )
}
