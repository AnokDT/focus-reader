export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null
}

export function rgbToHex(r: number, g: number, b: number): string {
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`
}

export function getContrastColor(hex: string): string {
  const rgb = hexToRgb(hex)
  if (!rgb) return '#000000'
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255
  return luminance > 0.5 ? '#000000' : '#ffffff'
}

export function adjustOpacity(hex: string, opacity: number): string {
  const rgb = hexToRgb(hex)
  if (!rgb) return hex
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})`
}

export function getThemeColors(theme: string) {
  switch (theme) {
    case 'dark':
      return {
        bg: '#0a0a0b',
        surface: '#141416',
        text: '#ececec',
        textSecondary: '#a1a1a6',
        border: '#2a2a2e',
        canvas: '#ffffff',
      }
    case 'sepia':
      return {
        bg: '#f5f0e8',
        surface: '#efe9dd',
        text: '#3c3226',
        textSecondary: '#6b5d4d',
        border: '#ddd3bf',
        canvas: '#ffffff',
      }
    default:
      return {
        bg: '#ffffff',
        surface: '#f8f9fa',
        text: '#0a0a0b',
        textSecondary: '#495057',
        border: '#e9ecef',
        canvas: '#ffffff',
      }
  }
}
