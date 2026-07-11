export interface PDFDocument {
  id: string
  title: string
  fileName: string
  pageCount: number
  lastReadPage: number
  lastReadAt: string
  addedAt: string
  filePath?: string
  fileSize: number
}

export interface PDFPage {
  pageNumber: number
  width: number
  height: number
  textContent?: string
}

export interface PDFOutline {
  title: string
  dest: string | unknown[] | null
  items: PDFOutline[]
}

export interface SearchResult {
  pageNumber: number
  text: string
  index: number
}
