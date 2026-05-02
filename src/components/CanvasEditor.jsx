import { useRef, useState, useEffect, forwardRef, useImperativeHandle } from 'react'
import { Stage, Layer, Rect } from 'react-konva'
import Block from './Block'
import { mmToPx, getPaperDims, computeBlocks, computeBlocksByGrid, computeBlocksBySize, resolveBlockImages } from '../utils/layoutEngine'

const CanvasEditor = forwardRef(function CanvasEditor(
  {
    images = [],
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

  useImperativeHandle(ref, () => ({ stageRef }))

  useEffect(() => {
    const observer = new ResizeObserver(([entry]) => setContainerWidth(entry.contentRect.width))
    if (containerRef.current) observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [])

  const { width: pageW, height: pageH } = getPaperDims(paper, orientation)

  let blocks = []
  if (template === 'Free Size') {
    blocks = computeBlocksBySize(blockSize.w, blockSize.h, paper, orientation, blockStyle.gap)
  } else if (template === 'Preset') {
    const preset = presets.find((p) => p.id === activePresetId)
    if (preset) {
      // Free-form blocks stored directly, or grid-derived if cols/rows set
      blocks = preset.slots
        ? preset.slots
        : computeBlocksByGrid(preset.cols, preset.rows, paper, orientation, blockStyle.gap)
    }
  } else {
    blocks = grid.mode === 'custom'
      ? computeBlocksByGrid(grid.cols, grid.rows, paper, orientation, blockStyle.gap)
      : computeBlocks(Math.round(Math.sqrt(grid.slots)), paper, orientation, blockStyle.gap)
  }

  const blockUrls = resolveBlockImages(blocks, images)
  const stageScale = containerWidth / pageW

  return (
    <div ref={containerRef} className="w-full">
      {containerWidth > 0 && (
        <Stage
          ref={stageRef}
          width={containerWidth}
          height={pageH * stageScale}
          scaleX={stageScale}
          scaleY={stageScale}
        >
          <Layer>
            <Rect x={0} y={0} width={pageW} height={pageH} fill="white" />
            {blocks.map((block, i) => (
              <Block key={block.id} block={block} url={blockUrls[i]} blockStyle={blockStyle} />
            ))}
          </Layer>
        </Stage>
      )}
    </div>
  )
})

export default CanvasEditor
