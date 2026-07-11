export type GuideStyle = 'line' | 'box' | 'highlight' | 'ruler'

export interface FocusSettings {
  enabled: boolean
  style: GuideStyle
  width: number
  opacity: number
  color: string
  thickness: number
  speed: number
  autoScroll: boolean
}

export interface ReaderState {
  currentPage: number
  totalPages: number
  zoom: number
  rotation: number
  isSidebarOpen: boolean
  isFocusMode: boolean
  showThumbnails: boolean
  showOutline: boolean
  showSearch: boolean
  searchQuery: string
  searchResults: SearchResult[]
  currentSearchIndex: number
}

export interface SearchResult {
  pageNumber: number
  text: string
}
