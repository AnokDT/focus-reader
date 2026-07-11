import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface Annotation {
  id: string
  documentId: string
  pageNumber: number
  text: string
  color: string
  note: string
  createdAt: string
  rects: { x: number; y: number; width: number; height: number }[]
}

interface AnnotationState {
  annotations: Annotation[]
  addAnnotation: (annotation: Omit<Annotation, 'id' | 'createdAt'>) => void
  updateAnnotation: (id: string, updates: Partial<Pick<Annotation, 'color' | 'note'>>) => void
  removeAnnotation: (id: string) => void
  getDocumentAnnotations: (documentId: string) => Annotation[]
  getPageAnnotations: (documentId: string, pageNumber: number) => Annotation[]
  hasAnnotation: (documentId: string, pageNumber: number, text: string) => boolean
}

export const useAnnotationStore = create<AnnotationState>()(
  persist(
    (set, get) => ({
      annotations: [],
      addAnnotation: (annotation) =>
        set((state) => ({
          annotations: [
            ...state.annotations,
            {
              ...annotation,
              id: `ann_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
              createdAt: new Date().toISOString(),
            },
          ],
        })),
      updateAnnotation: (id, updates) =>
        set((state) => ({
          annotations: state.annotations.map((a) =>
            a.id === id ? { ...a, ...updates } : a
          ),
        })),
      removeAnnotation: (id) =>
        set((state) => ({
          annotations: state.annotations.filter((a) => a.id !== id),
        })),
      getDocumentAnnotations: (documentId) =>
        get().annotations.filter((a) => a.documentId === documentId),
      getPageAnnotations: (documentId, pageNumber) =>
        get().annotations.filter(
          (a) => a.documentId === documentId && a.pageNumber === pageNumber
        ),
      hasAnnotation: (documentId, pageNumber, text) =>
        get().annotations.some(
          (a) =>
            a.documentId === documentId &&
            a.pageNumber === pageNumber &&
            a.text === text
        ),
    }),
    { name: 'focus-reader-annotations' }
  )
)
