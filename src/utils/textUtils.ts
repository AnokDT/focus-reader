export function getCharCountPerPage(): number {
  return 2000
}

export function estimateReadingTime(
  totalPages: number,
  avgWpm: number,
  charsPerPage: number = getCharCountPerPage()
): number {
  const avgCharsPerWord = 5
  const wordsPerPage = charsPerPage / avgCharsPerWord
  const totalWords = totalPages * wordsPerPage
  return (totalWords / avgWpm) * 60 * 1000
}

export function extractTextFromPages(pages: Array<{ textContent?: string }>): string {
  return pages
    .filter((p) => p.textContent)
    .map((p) => p.textContent)
    .join(' ')
}

export function countWords(text: string): number {
  return text
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0).length
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength - 3) + '...'
}

export function cleanFileName(fileName: string): string {
  return fileName.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ')
}
