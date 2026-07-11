export function getDocumentId(fileName: string, fileSize: number): string {
  return `${fileName}-${fileSize}-${Date.now()}`
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

export function calculateWpm(wordsRead: number, timeMs: number): number {
  if (timeMs <= 0) return 0
  return Math.round((wordsRead / (timeMs / 60000)))
}

export function highlightSearchResults(
  text: string,
  query: string
): { text: string; isHighlight: boolean }[] {
  if (!query.trim()) {
    return [{ text, isHighlight: false }]
  }

  const results: { text: string; isHighlight: boolean }[] = []
  const lowerText = text.toLowerCase()
  const lowerQuery = query.toLowerCase()
  let lastIndex = 0

  let index = lowerText.indexOf(lowerQuery, lastIndex)
  while (index !== -1) {
    if (index > lastIndex) {
      results.push({
        text: text.slice(lastIndex, index),
        isHighlight: false,
      })
    }
    results.push({
      text: text.slice(index, index + query.length),
      isHighlight: true,
    })
    lastIndex = index + query.length
    index = lowerText.indexOf(lowerQuery, lastIndex)
  }

  if (lastIndex < text.length) {
    results.push({
      text: text.slice(lastIndex),
      isHighlight: false,
    })
  }

  return results.length > 0 ? results : [{ text, isHighlight: false }]
}
