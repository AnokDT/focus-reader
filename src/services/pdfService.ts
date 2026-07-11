import * as pdfjsLib from 'pdfjs-dist'

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url
).toString()

export const pdfService = {
  async loadDocument(source: string | ArrayBuffer) {
    const loadingTask = pdfjsLib.getDocument(
      typeof source === 'string' ? { url: source } : { data: source }
    )
    return await loadingTask.promise
  },

  async renderPageToCanvas(
    pdf: pdfjsLib.PDFDocumentProxy,
    pageNumber: number,
    canvas: HTMLCanvasElement,
    scale: number = 1.5
  ): Promise<void> {
    const page = await pdf.getPage(pageNumber)
    const viewport = page.getViewport({ scale })

    canvas.height = viewport.height
    canvas.width = viewport.width

    await page.render({
      canvas,
      viewport,
    }).promise
  },

  async getPageText(
    pdf: pdfjsLib.PDFDocumentProxy,
    pageNumber: number
  ): Promise<string> {
    const page = await pdf.getPage(pageNumber)
    const content = await page.getTextContent()
    return content.items
      .map((item: any) => item.str)
      .join(' ')
  },

  async getOutline(pdf: pdfjsLib.PDFDocumentProxy) {
    try {
      return await pdf.getOutline()
    } catch {
      return null
    }
  },

  async getPageDimensions(
    pdf: pdfjsLib.PDFDocumentProxy,
    pageNumber: number
  ) {
    const page = await pdf.getPage(pageNumber)
    const viewport = page.getViewport({ scale: 1 })
    return {
      width: viewport.width,
      height: viewport.height,
    }
  },
}

export default pdfService
