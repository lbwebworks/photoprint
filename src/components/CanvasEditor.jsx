import { useRef, useState, useEffect, forwardRef, useImperativeHandle, useCallback } from 'react'
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
    fillMode = 'none',           // 'none' | 'autofill' | 'autofill-all'
    template = 'Grid',
    grid = { mode: 'square', slots: 16, cols: 4, rows: 4 },
    blockSize = { w: mmToPx(35), h: mmToPx(45) },
    paper = 'A4',
    orientation = 'portrait',
    blockStyle = { borderWidth: 0, borderColor: '#000000', gap: 0 },
    presets = [],
    activePresetId = null,
  },
  ref
) {
  const containerRef = useRef(null)
  const stageRef = useRef(null)
  const [containerWidth, setContainerWidth] = useState(0)

  // Per-block image overrides: { [blockId]: url }
  // Takes priority over auto-fill
  const [blockImages, setBlockImages] = useState({})

  // Currently selected block id (shows Remove button)
  const [selectedBlockId, setSelectedBlockId] = useState(null)

  // Ref that always holds the latest render-scope values shuffle needs
  const renderStateRef = useRef({ blocks: [], autoUrls: [], blockImages: {} })

  useEffect(() => {
    const observer = new ResizeObserver(([entry]) => setContainerWidth(entry.contentRect.width))
    if (containerRef.current) observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [])

  // Clear overrides and selection when the block layout changes
  useEffect(() => {
    setBlockImages({})
    setSelectedBlockId(null)
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

  // Compute auto-fill base urls according to fillMode
  let autoUrls
  if (fillMode === 'autofill-all') {
    autoUrls = resolveBlockImages(blocks, images)
  } else if (fillMode === 'autofill') {
    autoUrls = resolveBlockImagesFill(blocks, images)
  } else {
    autoUrls = blocks.map(() => null)
  }

  // Keep renderStateRef in sync every render so imperative methods can read it
  renderStateRef.current = { blocks, autoUrls, blockImages }

  const stageScale = containerWidth / pageW

  // Find which block (if any) contains the given canvas-space point
  function blockAtPoint(canvasX, canvasY) {
    return blocks.find(
      (b) => canvasX >= b.x && canvasX <= b.x + b.w && canvasY >= b.y && canvasY <= b.y + b.h
    )
  }

  // Called by the container div when an image is dropped onto the canvas
  function handleDrop(e) {
    e.preventDefault()
    const url = e.dataTransfer.getData('text/plain')
    if (!url) return

    const stage = stageRef.current
    if (!stage) return

    // Convert screen drop position to canvas (paper-pixel) coordinates
    const rect = containerRef.current.getBoundingClientRect()
    const canvasX = (e.clientX - rect.left) / stageScale
    const canvasY = (e.clientY - rect.top) / stageScale

    const target = blockAtPoint(canvasX, canvasY)
    if (target) {
      setBlockImages((prev) => ({ ...prev, [target.id]: url }))
      setSelectedBlockId(target.id)
    }
  }

  function handleRemoveImage(blockId) {
    setBlockImages((prev) => {
      const next = { ...prev }
      delete next[blockId]
      return next
    })
  }

  function handleStageClick(e) {
    // Deselect when clicking the paper background
    if (e.target === e.target.getStage() || e.target.name() === 'paper-bg') {
      setSelectedBlockId(null)
    }
  }

  useImperativeHandle(ref, () => ({
    stageRef,

    // Clears all block images and resets selection.
    // fillMode is reset by the caller (App) since it lives there.
    clearAll() {
      setBlockImages({})
      setSelectedBlockId(null)
    },

    // Shuffles the current effective image for every block (including nulls),
    // then writes the result as explicit overrides so it's independent of fillMode.
    // Empty slots use '' as a sentinel to suppress auto-fill on those blocks.
    shuffle() {
      const { blocks: b, autoUrls: au, blockImages: bi } = renderStateRef.current
      if (b.length === 0) return

      // Collect current effective url per block (null = empty)
      const currentUrls = b.map((block, i) => bi[block.id] ?? au[i] ?? null)
      const shuffled = shuffleArray(currentUrls)

      // Write full override map — '' sentinel means "explicitly empty"
      const next = {}
      b.forEach((block, i) => {
        next[block.id] = shuffled[i] ?? ''
      })
      setBlockImages(next)
      setSelectedBlockId(null)
    },
  }))

  return (
    <div
      ref={containerRef}
      className="w-full"
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
    >
      {containerWidth > 0 && (
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
              // blockImages[block.id] === '' means explicitly empty (e.g. after shuffle)
              // blockImages[block.id] === undefined means no override → fall through to auto-fill
              const override = blockImages[block.id]
              const url = override === undefined ? autoUrls[i] : (override || null)
              return (
                <Block
                  key={block.id}
                  block={block}
                  url={url}
                  blockStyle={blockStyle}
                  isSelected={block.id === selectedBlockId}
                  onSelect={setSelectedBlockId}
                  onRemoveImage={handleRemoveImage}
                />
              )
            })}
          </Layer>
        </Stage>
      )}
    </div>
  )
})

export default CanvasEditor
