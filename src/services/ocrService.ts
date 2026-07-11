import Tesseract from 'tesseract.js'
import * as pdfjsLib from 'pdfjs-dist'

export interface OCRResult {
  text: string
  confidence: number
  words: { text: string; confidence: number }[]
}

export class OCRService {
  private worker: Tesseract.Worker | null = null
  private initializing = false

  async initialize(): Promise<void> {
    if (this.worker || this.initializing) return
    this.initializing = true
    try {
      this.worker = await Tesseract.createWorker('eng', 1, {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            // Progress callback could be added here
          }
        },
      })
    } catch (err) {
      console.error('Failed to initialize OCR worker:', err)
      this.initializing = false
    }
  }

  async recognizeImage(imageData: ImageData | HTMLCanvasElement | string): Promise<OCRResult> {
    if (!this.worker) await this.initialize()
    if (!this.worker) throw new Error('OCR worker not initialized')

    const result = await this.worker.recognize(imageData as any)
    const data = result.data
    return {
      text: data.text,
      confidence: data.confidence,
      words: (data as any).words
        ? (data as any).words.map((w: any) => ({
            text: w.text,
            confidence: w.confidence,
          }))
        : [],
    }
  }

  async recognizePDFPage(
    pdf: pdfjsLib.PDFDocumentProxy,
    pageNumber: number,
    scale: number = 2
  ): Promise<OCRResult> {
    const page = await pdf.getPage(pageNumber)
    const viewport = page.getViewport({ scale })

    const canvas = window.document.createElement('canvas')
    canvas.width = viewport.width
    canvas.height = viewport.height
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Failed to create canvas')

    await page.render({ canvas, viewport }).promise
    return this.recognizeImage(canvas)
  }

  async terminate(): Promise<void> {
    if (this.worker) {
      await this.worker.terminate()
      this.worker = null
    }
  }
}

export const ocrService = new OCRService()
