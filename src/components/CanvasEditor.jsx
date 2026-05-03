import { useRef, useState, useEffect, forwardRef, useImperativeHandle } from 'react'
import { Stage, Layer, Rect } from 'react-konva'
import Block from './Block'
import {
  mmToPx, getPaperDims,
  computeBlocks, computeBlocksByGrid, computeBlocksBySize,
  resolveBlockImages, resolveBlockImagesFill,
} from '../utils/layoutEngine'

/** Fisher-Yates in-place shuffle */
function shuffleArray(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

const CanvasEditor = forwardRef(function CanvasEditor(
  {
    images = [],
    fillMode = 'none',
    imageOffset = 0,             // images consumed by preceding pages
    template = 'Grid',
    grid = { mode: 'square', slots: 16, cols: 4, rows: 4 },
    blockSize = { w: mmToPx(35), h: mmToPx(45) },
    paper = 'A4',
    orientation = 'portrait',
    blockStyle = { borderWidth: 0, borderColor: '#000000', gap: 0 },
    presets = [],
    activePresetId = null,
    onSelectionChange = null,
    onImagesChange = null,       // called with (hasImages: bool) when block image state changes
  },
  ref
) {
  const containerRef = useRef(null)
  const stageRef = useRef(null)
  const [containerWidth, setContainerWidth] = useState(0)

  // Per-block image overrides: { [blockId]: url | '' }
  // '' = explicitly empty sentinel (suppresses auto-fill)
  const [blockImages, setBlockImages] = useState({})

  // Multi-selection: Set of block ids
  const [selectedIds, setSelectedIds] = useState(new Set())

  // Block currently being dragged over (for drop highlight)
  const [dragOverBlockId, setDragOverBlockId] = useState(null)

  // Block currently in crop/edit mode
  const [editingBlockId, setEditingBlockId] = useState(null)

  // Ref for latest render-scope values used by imperative methods
  const renderStateRef = useRef({ blocks: [], autoUrls: [], blockImages: {} })

  useEffect(() => {
    const observer = new ResizeObserver(([entry]) => setContainerWidth(entry.contentRect.width))
    if (containerRef.current) observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [])

  // Notify parent when selection changes
  useEffect(() => {
    onSelectionChange?.(selectedIds.size)
  }, [selectedIds, onSelectionChange])

  // Reset when block layout changes
  useEffect(() => {
    setBlockImages({})
    setSelectedIds(new Set())
    setEditingBlockId(null)
  }, [template, grid, blockSize, paper, orientation, activePresetId])

  const { width: pageW, height: pageH } = getPaperDims(paper, orientation)

  let blocks = []
  if (template === 'Free Size') {
    blocks = computeBlocksBySize(blockSize.w, blockSize.h, paper, orientation, blockStyle.gap)
  } else if (template === 'Preset') {
    const preset = presets.find((p) => p.id === activePresetId)
    if (preset) {
      blocks = preset.slots
        ? preset.slots
        : computeBlocksByGrid(preset.cols, preset.rows, paper, orientation, blockStyle.gap)
    }
  } else {
    blocks = grid.mode === 'custom'
      ? computeBlocksByGrid(grid.cols, grid.rows, paper, orientation, blockStyle.gap)
      : computeBlocks(Math.round(Math.sqrt(grid.slots)), paper, orientation, blockStyle.gap)
  }

  let autoUrls
  if (fillMode === 'autofill-all') {
    autoUrls = resolveBlockImages(blocks, images, imageOffset)
  } else if (fillMode === 'autofill') {
    autoUrls = resolveBlockImagesFill(blocks, images, imageOffset)
  } else {
    autoUrls = blocks.map(() => null)
  }

  renderStateRef.current = { blocks, autoUrls, blockImages }

  // Notify parent when block image state changes (for Clear Page enabled state)
  const pageHasImages = blocks.some((b, i) => {
    const override = blockImages[b.id]
    return !!(override === undefined ? autoUrls[i] : (override || null))
  })
  useEffect(() => {
    onImagesChange?.(pageHasImages)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageHasImages])

  const stageScale = containerWidth / pageW

  function getEffectiveUrl(blockId, autoIndex) {
    const override = blockImages[blockId]
    return override === undefined ? autoUrls[autoIndex] : (override || null)
  }

  function blockAtPoint(canvasX, canvasY) {
    return blocks.find(
      (b) => canvasX >= b.x && canvasX <= b.x + b.w && canvasY >= b.y && canvasY <= b.y + b.h
    )
  }

  function handleDragOver(e) {
    e.preventDefault()
    // Highlight the block under the cursor
    const rect = containerRef.current.getBoundingClientRect()
    const canvasX = (e.clientX - rect.left) / stageScale
    const canvasY = (e.clientY - rect.top) / stageScale
    const target = blockAtPoint(canvasX, canvasY)
    setDragOverBlockId(target ? target.id : null)
  }

  function handleDragLeave(e) {
    // Only clear if leaving the container entirely
    if (!containerRef.current.contains(e.relatedTarget)) {
      setDragOverBlockId(null)
    }
  }

  function handleDrop(e) {
    e.preventDefault()
    setDragOverBlockId(null)

    const url      = e.dataTransfer.getData('text/plain')
    const sourceId = e.dataTransfer.getData('application/block-id')
    if (!url) return

    const rect = containerRef.current.getBoundingClientRect()
    const canvasX = (e.clientX - rect.left) / stageScale
    const canvasY = (e.clientY - rect.top) / stageScale
    const target = blockAtPoint(canvasX, canvasY)
    if (!target) return

    if (sourceId && sourceId !== target.id) {
      // Block-to-block swap: exchange effective urls
      const sourceIndex = blocks.findIndex((b) => b.id === sourceId)
      const targetIndex = blocks.findIndex((b) => b.id === target.id)
      const sourceUrl = getEffectiveUrl(sourceId, sourceIndex)
      const targetUrl = getEffectiveUrl(target.id, targetIndex)
      setBlockImages((prev) => ({
        ...prev,
        [sourceId]:  targetUrl ?? '',
        [target.id]: sourceUrl ?? '',
      }))
      setSelectedIds(new Set([target.id]))
    } else if (!sourceId) {
      // Library drop: assign url to target block
      setBlockImages((prev) => ({ ...prev, [target.id]: url }))
      setSelectedIds(new Set([target.id]))
    }
  }

  function handleBlockSelect(blockId, additive) {
    setSelectedIds((prev) => {
      if (additive) {
        const next = new Set(prev)
        next.has(blockId) ? next.delete(blockId) : next.add(blockId)
        return next
      }
      if (prev.size === 1 && prev.has(blockId)) return new Set()
      return new Set([blockId])
    })
  }

  function handleRemoveImage(blockId) {
    setBlockImages((prev) => ({ ...prev, [blockId]: '' }))
    setSelectedIds((prev) => {
      const next = new Set(prev)
      next.delete(blockId)
      return next
    })
  }

  function handleStageClick(e) {
    if (e.target === e.target.getStage() || e.target.name() === 'paper-bg') {
      setSelectedIds(new Set())
    }
  }

  useImperativeHandle(ref, () => ({
    stageRef,

    getBlockCount() {
      return renderStateRef.current.blocks.length
    },

    hasImages() {
      const { blocks: b, autoUrls: au, blockImages: bi } = renderStateRef.current
      return b.some((block, i) => {
        const override = bi[block.id]
        return !!(override === undefined ? au[i] : (override || null))
      })
    },

    hasSelection() {
      return selectedIds.size > 0
    },

    deselectAll() {
      setSelectedIds(new Set())
    },

    clearAll() {
      setBlockImages({})
      setSelectedIds(new Set())
    },

    clearSelected() {
      setBlockImages((prev) => {
        const next = { ...prev }
        selectedIds.forEach((id) => { next[id] = '' })
        return next
      })
      setSelectedIds(new Set())
    },

    shuffle() {
      const { blocks: b, autoUrls: au, blockImages: bi } = renderStateRef.current
      if (b.length === 0) return
      const currentUrls = b.map((block, i) => {
        const override = bi[block.id]
        return override === undefined ? (au[i] ?? null) : (override || null)
      })
      const shuffled = shuffleArray(currentUrls)
      const next = {}
      b.forEach((block, i) => { next[block.id] = shuffled[i] ?? '' })
      setBlockImages(next)
      setSelectedIds(new Set())
    },
  }))

  return (
    <div
      ref={containerRef}
      className="w-full relative"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {containerWidth > 0 && (
        <>
          <Stage
            ref={stageRef}
            width={containerWidth}
            height={pageH * stageScale}
            scaleX={stageScale}
            scaleY={stageScale}
            onClick={handleStageClick}
            onTap={handleStageClick}
          >
            <Layer>
              <Rect name="paper-bg" x={0} y={0} width={pageW} height={pageH} fill="white" />
              {blocks.map((block, i) => {
                const url = getEffectiveUrl(block.id, i)
                return (
                  <Block
                    key={block.id}
                    block={block}
                    url={url}
                    blockStyle={blockStyle}
                    isSelected={selectedIds.has(block.id)}
                    isDragOver={dragOverBlockId === block.id}
                    isEditing={editingBlockId === block.id}
                    onSelect={handleBlockSelect}
                    onRemoveImage={handleRemoveImage}
                  />
                )
              })}
            </Layer>
          </Stage>

          {/* DOM overlay per block: handles X button, edit button, and drag-source behaviour */}
          {blocks.map((block, i) => {
            const url = getEffectiveUrl(block.id, i)
            const isEditing = editingBlockId === block.id
            return (
              <BlockOverlay
                key={block.id}
                block={block}
                url={url}
                stageScale={stageScale}
                isEditing={isEditing}
                onEdit={() => { setEditingBlockId(block.id); setSelectedIds(new Set()) }}
                onDone={() => setEditingBlockId(null)}
                onRemove={() => handleRemoveImage(block.id)}
              />
            )
          })}
        </>
      )}
    </div>
  )
})

/**
 * Transparent DOM overlay covering a block.
 * - Normal mode: drag source for swapping, shows ✎ edit + ✕ remove on hover
 * - Edit mode: passes pointer events through to Konva for drag/zoom crop,
 *   shows an amber "Done" pill to exit
 * - Empty blocks: shows a dashed placeholder border (DOM only, never exported)
 */
function BlockOverlay({ block, url, stageScale, isEditing, onEdit, onDone, onRemove }) {
  const BTN_SIZE = 20

  function handleDragStart(e) {
    if (!url || isEditing) { e.preventDefault(); return }
    e.dataTransfer.setData('text/plain', url)
    e.dataTransfer.setData('application/block-id', block.id)
    e.dataTransfer.effectAllowed = 'move'
  }

  return (
    <div
      draggable={!!url && !isEditing}
      onDragStart={handleDragStart}
      className={`absolute ${isEditing ? '' : 'group'}`}
      style={{
        left:          block.x * stageScale,
        top:           block.y * stageScale,
        width:         block.w * stageScale,
        height:        block.h * stageScale,
        pointerEvents: isEditing ? 'none' : 'auto',
        cursor:        isEditing ? 'default' : (url ? 'grab' : 'default'),
        // DOM-only placeholder for empty blocks — never captured by canvas export
        boxSizing:     'border-box',
        border:        !url ? '1.5px dashed #c0c8d8' : 'none',
        background:    !url ? 'rgba(245,247,250,0.5)' : 'transparent',
      }}
    >
      {/* Normal mode buttons — visible on hover */}
      {!isEditing && url && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); onEdit() }}
            title="Edit crop"
            style={{ position: 'absolute', top: 2, right: BTN_SIZE + 6, width: BTN_SIZE, height: BTN_SIZE, pointerEvents: 'auto' }}
            className="flex items-center justify-center rounded bg-black/60 hover:bg-amber-500 text-white text-xs leading-none opacity-0 group-hover:opacity-100 transition-opacity duration-150"
          >✎</button>
          <button
            onClick={(e) => { e.stopPropagation(); onRemove() }}
            title="Remove image"
            style={{ position: 'absolute', top: 2, right: 2, width: BTN_SIZE, height: BTN_SIZE, pointerEvents: 'auto' }}
            className="flex items-center justify-center rounded bg-black/60 hover:bg-rose-600 text-white text-xs leading-none opacity-0 group-hover:opacity-100 transition-opacity duration-150"
          >✕</button>
        </>
      )}

      {/* Edit mode — Done button */}
      {isEditing && (
        <button
          onClick={(e) => { e.stopPropagation(); onDone() }}
          title="Done editing"
          style={{ position: 'absolute', bottom: 6, left: '50%', transform: 'translateX(-50%)', pointerEvents: 'auto', whiteSpace: 'nowrap' }}
          className="flex items-center gap-1 px-3 py-1 rounded-full bg-amber-500 hover:bg-amber-400 text-white text-xs font-medium shadow-lg"
        >✓ Done</button>
      )}
    </div>
  )
}

export default CanvasEditor
