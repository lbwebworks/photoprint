import { useState, useRef, useEffect, useCallback } from 'react'

const MIN_THUMB = 100
const MAX_THUMB = 200
const DEFAULT_THUMB = 100
const MIN_PANEL = 180
const DEFAULT_PANEL = 328  // 3 × 100 + 2×6 gaps + 2×8 padding

export default function ImagePanel({ images, onRemove, onFiles, disabled = false }) {
  const [thumbSize, setThumbSize] = useState(DEFAULT_THUMB)
  const [panelWidth, setPanelWidth] = useState(DEFAULT_PANEL)
  const isDragging = useRef(false)
  const startX = useRef(0)
  const startWidth = useRef(0)

  // Drag-to-resize: mouse down on the left edge handle
  const handleMouseDown = useCallback((e) => {
    e.preventDefault()
    isDragging.current = true
    startX.current = e.clientX
    startWidth.current = panelWidth
  }, [panelWidth])

  useEffect(() => {
    function onMouseMove(e) {
      if (!isDragging.current) return
      const delta = startX.current - e.clientX
      const maxW = Math.floor(window.innerWidth * 0.5)
      setPanelWidth(Math.min(maxW, Math.max(MIN_PANEL, startWidth.current + delta)))
    }
    function onMouseUp() { isDragging.current = false }
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
  }, [])

  // Compute columns based on panel width and thumb size
  const padding = 8   // p-2 = 8px each side
  const gap = 6
  const availableW = panelWidth - padding * 2
  const cols = Math.max(1, Math.floor((availableW + gap) / (thumbSize + gap)))

  function handleDragStart(e, url) {
    e.dataTransfer.setData('text/plain', url)
    e.dataTransfer.effectAllowed = 'copy'
  }

  return (
    <aside
      style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)', width: panelWidth, maxWidth: '50vw', position: 'relative' }}
      className={`shrink-0 border-l flex flex-col ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
    >
      {/* Drag-to-resize handle on the left edge */}
      <div
        onMouseDown={handleMouseDown}
        style={{
          position: 'absolute',
          left: 0, top: 0, bottom: 0,
          width: 4,
          cursor: 'ew-resize',
          zIndex: 10,
          background: 'transparent',
        }}
        className="hover:bg-indigo-500/30 transition-colors"
      />

      {/* Header */}
      <div style={{ borderColor: 'var(--border)' }} className="px-3 py-3 border-b flex flex-col gap-2 shrink-0">
        <span style={{ color: 'var(--text-primary)' }} className="text-sm font-semibold">
          Image Library{images.length > 0 && (
            <span style={{ color: 'var(--text-muted)' }} className="text-xs font-normal"> ({images.length})</span>
          )}
        </span>

        {/* Image size slider */}
        <div className="flex flex-col gap-1">
          <div className="flex justify-between items-center">
            <span style={{ color: 'var(--text-secondary)' }} className="text-xs">Size</span>
            <span style={{ color: 'var(--text-muted)' }} className="text-xs">{thumbSize}px</span>
          </div>
          <input
            type="range"
            min={MIN_THUMB}
            max={MAX_THUMB}
            value={thumbSize}
            onChange={(e) => setThumbSize(Number(e.target.value))}
            className="w-full accent-indigo-500"
          />
        </div>

        <label
          style={{ borderColor: 'var(--border)' }}
          className="w-full text-center bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium px-2 py-1.5 rounded transition"
        >
          Upload Photos
          <input type="file" multiple accept="image/*" className="hidden" onChange={onFiles} disabled={disabled} />
        </label>
      </div>

      {/* Image grid — scrollable */}
      {images.length === 0 ? (
        <div className="flex-1 flex items-center justify-center p-4">
          <p style={{ color: 'var(--text-muted)' }} className="text-xs text-center">No images uploaded yet</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-2">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${cols}, ${thumbSize}px)`,
              gap,
            }}
          >
            {images.map((url, i) => (
              <div
                key={url}
                draggable
                onDragStart={(e) => handleDragStart(e, url)}
                style={{ borderColor: 'var(--border)', width: thumbSize, height: thumbSize }}
                className="relative group rounded overflow-hidden border cursor-grab active:cursor-grabbing shrink-0"
              >
                <img
                  src={url}
                  alt={`Image ${i + 1}`}
                  className="w-full h-full object-cover pointer-events-none"
                />
                <span className="absolute bottom-1 left-1 bg-black/60 text-white text-[10px] px-1 rounded leading-tight">
                  {i + 1}
                </span>
                <button
                  onClick={() => onRemove(i)}
                  className="absolute top-1 right-1 bg-black/60 hover:bg-rose-600 text-white text-xs w-5 h-5 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                  title="Remove"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </aside>
  )
}
