export interface DictionaryResult {
  word: string
  partOfSpeech: string
  meaning: string
  example?: string
  phonetic?: string
}

export async function lookupWord(word: string): Promise<DictionaryResult | null> {
  try {
    const clean = word.toLowerCase().replace(/[^a-z]/g, '')
    if (!clean || clean.length < 2) return null

    const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(clean)}`)
    if (!res.ok) return null

    const data = await res.json()
    if (!data || !data[0]) return null

    const entry = data[0]
    const phonetic = entry.phonetic || entry.phonetics?.[0]?.text || ''
    const meaning = entry.meanings?.[0]
    if (!meaning) return null

    const def = meaning.definitions?.[0]
    if (!def) return null

    return {
      word: entry.word,
      partOfSpeech: meaning.partOfSpeech,
      meaning: def.definition,
      example: def.example,
      phonetic,
    }
  } catch {
    return null
  }
}
