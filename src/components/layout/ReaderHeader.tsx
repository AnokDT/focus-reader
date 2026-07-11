import {
  Search,
  ChevronLeft,
  ZoomIn,
  ZoomOut,
  Eye,
  EyeOff,
  Columns,
  List,
  Zap,
  BookOpen,
} from 'lucide-react'
import { useUIStore } from '@/stores/uiStore'
import { Button } from '@/components/ui/Button'
import { Tooltip } from '@/components/ui/Tooltip'

interface ReaderHeaderProps {
  title: string
  currentPage: number
  totalPages: number
  zoom: number
  onPageChange: (page: number) => void
  onZoomIn: () => void
  onZoomOut: () => void
  onResetZoom: () => void
  onFitWidth: () => void
  isFocusMode: boolean
  onToggleFocus: () => void
  showThumbnails: boolean
  onToggleThumbnails: () => void
  showOutline: boolean
  onToggleOutline: () => void
  onToggleRSVP: () => void
  onToggleVocabulary: () => void
}

export function ReaderHeader({
  title,
  currentPage,
  totalPages,
  zoom,
  onPageChange,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  isFocusMode,
  onToggleFocus,
  showThumbnails,
  onToggleThumbnails,
  showOutline,
  onToggleOutline,
  onToggleRSVP,
  onToggleVocabulary,
}: ReaderHeaderProps) {
  return (
    <header className="h-12 border-b border-[var(--color-surface-3)] bg-[var(--color-surface-1)] flex items-center justify-between px-4 shrink-0 theme-transition z-20">
      <div className="flex items-center gap-3">
        <Tooltip content="Back to library">
          <button
            onClick={() => window.history.back()}
            className="p-1.5 rounded-md text-[var(--color-text-tertiary)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text-primary)] transition-colors"
          >
            <ChevronLeft size={18} />
          </button>
        </Tooltip>
        <h1 className="text-sm font-medium text-[var(--color-text-primary)] truncate max-w-xs">
          {title}
        </h1>
      </div>

      <div className="flex items-center gap-0.5">
        <Tooltip content="Thumbnails">
          <Button variant={showThumbnails ? 'secondary' : 'ghost'} size="sm" onClick={onToggleThumbnails} icon={<Columns size={15} />} />
        </Tooltip>
        <Tooltip content="Outline">
          <Button variant={showOutline ? 'secondary' : 'ghost'} size="sm" onClick={onToggleOutline} icon={<List size={15} />} />
        </Tooltip>

        <div className="w-px h-5 bg-[var(--color-surface-3)] mx-1" />

        {totalPages > 0 && (
          <div className="flex items-center gap-1">
            <input
              type="number"
              value={currentPage}
              onChange={(e) => { const v = parseInt(e.target.value); if (v >= 1 && v <= totalPages) onPageChange(v) }}
              className="w-10 h-6 text-center text-xs font-medium bg-[var(--color-surface-2)] border border-[var(--color-surface-3)] rounded text-[var(--color-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)] tabular-nums"
            />
            <span className="text-xs text-[var(--color-text-tertiary)] tabular-nums">/ {totalPages}</span>
          </div>
        )}

        <div className="w-px h-5 bg-[var(--color-surface-3)] mx-1" />

        <Tooltip content="Zoom in (+)">
          <Button variant="ghost" size="sm" onClick={onZoomIn} icon={<ZoomIn size={15} />} />
        </Tooltip>
        <Tooltip content={`${Math.round(zoom * 100)}% — click to reset`}>
          <button
            onClick={onResetZoom}
            className="px-1.5 py-1 text-[11px] font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-2)] rounded transition-colors tabular-nums"
          >
            {Math.round(zoom * 100)}%
          </button>
        </Tooltip>
        <Tooltip content="Zoom out (-)">
          <Button variant="ghost" size="sm" onClick={onZoomOut} icon={<ZoomOut size={15} />} />
        </Tooltip>

        <div className="w-px h-5 bg-[var(--color-surface-3)] mx-1" />

        <Tooltip content="Speed reader (R)">
          <Button variant="ghost" size="sm" onClick={onToggleRSVP} icon={<Zap size={15} />} />
        </Tooltip>
        <Tooltip content="My vocabulary (V)">
          <Button variant="ghost" size="sm" onClick={onToggleVocabulary} icon={<BookOpen size={15} />} />
        </Tooltip>
        <Tooltip content="Search (Ctrl+F)">
          <Button variant="ghost" size="sm" onClick={() => useUIStore.getState().toggleSearch()} icon={<Search size={15} />} />
        </Tooltip>

        <div className="w-px h-5 bg-[var(--color-surface-3)] mx-1" />

        <Tooltip content={isFocusMode ? 'Exit focus mode (Space)' : 'Focus mode (Space)'}>
          <Button variant={isFocusMode ? 'primary' : 'ghost'} size="sm" onClick={onToggleFocus} icon={isFocusMode ? <EyeOff size={15} /> : <Eye size={15} />} />
        </Tooltip>
      </div>
    </header>
  )
}
