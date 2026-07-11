import { create } from 'zustand'

interface UIState {
  sidebarOpen: boolean
  thumbnailsOpen: boolean
  outlineOpen: boolean
  searchOpen: boolean
  settingsOpen: boolean
  commandPaletteOpen: boolean

  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  toggleThumbnails: () => void
  toggleOutline: () => void
  toggleSearch: () => void
  setSearchOpen: (open: boolean) => void
  toggleSettings: () => void
  toggleCommandPalette: () => void
  closeAll: () => void
}

export const useUIStore = create<UIState>()((set) => ({
  sidebarOpen: false,
  thumbnailsOpen: false,
  outlineOpen: false,
  searchOpen: false,
  settingsOpen: false,
  commandPaletteOpen: false,

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleThumbnails: () => set((state) => ({ thumbnailsOpen: !state.thumbnailsOpen, outlineOpen: false })),
  toggleOutline: () => set((state) => ({ outlineOpen: !state.outlineOpen, thumbnailsOpen: false })),
  toggleSearch: () => set((state) => ({ searchOpen: !state.searchOpen })),
  setSearchOpen: (open) => set({ searchOpen: open }),
  toggleSettings: () => set((state) => ({ settingsOpen: !state.settingsOpen })),
  toggleCommandPalette: () => set((state) => ({ commandPaletteOpen: !state.commandPaletteOpen })),
  closeAll: () =>
    set({
      sidebarOpen: false,
      thumbnailsOpen: false,
      outlineOpen: false,
      searchOpen: false,
      settingsOpen: false,
      commandPaletteOpen: false,
    }),
}))
