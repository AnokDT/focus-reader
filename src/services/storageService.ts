import type { PDFDocument } from '@/types/pdf'

const STORAGE_KEYS = {
  LIBRARY: 'focus-reader-library',
  SETTINGS: 'focus-reader-settings',
  ANALYTICS: 'focus-reader-analytics',
} as const

export const storageService = {
  getLibrary(): PDFDocument[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.LIBRARY)
      if (data) {
        const parsed = JSON.parse(data)
        return parsed.state?.documents || []
      }
    } catch {
      console.error('Failed to read library from storage')
    }
    return []
  },

  saveLibrary(documents: PDFDocument[]): void {
    try {
      localStorage.setItem(
        STORAGE_KEYS.LIBRARY,
        JSON.stringify({ state: { documents }, version: 0 })
      )
    } catch {
      console.error('Failed to save library to storage')
    }
  },

  saveFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const base64 = reader.result as string
        try {
          localStorage.setItem(`file-${file.name}`, base64)
          resolve(base64)
        } catch {
          reject(new Error('File too large for localStorage'))
        }
      }
      reader.onerror = () => reject(reader.error)
      reader.readAsDataURL(file)
    })
  },

  getFile(fileName: string): string | null {
    return localStorage.getItem(`file-${fileName}`)
  },

  removeFile(fileName: string): void {
    localStorage.removeItem(`file-${fileName}`)
  },

  clearAll(): void {
    Object.values(STORAGE_KEYS).forEach((key) => {
      localStorage.removeItem(key)
    })
  },
}

export default storageService
