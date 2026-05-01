import { useRef, useState, useEffect, forwardRef, useImperativeHandle } from 'react'
import { Stage, Layer, Rect } from 'react-konva'
import Slot from './Slot'
import { PAPER_SIZES, mmToPx, getPaperDims, computeSlots, computeSlotsByGrid, computeSlotsBySize, resolveSlotImages } from '../utils/layoutEngine'

const CanvasEditor = forwardRef(function CanvasEditor(
  { images = [], template = 'Grid', grid = { mode: 'square', slots: 36, cols: 6, rows: 6 }, slotSize = { w: mmToPx(35), h: mmToPx(45) }, paper = 'A4', orientation = 'portrait', slotStyle = { borderWidth: 0, borderColor: '#000000', gap: 0 } },
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

  const slots = template === 'Free Size'
    ? computeSlotsBySize(slotSize.w, slotSize.h, paper, orientation, slotStyle.gap)
    : grid.mode === 'custom'
      ? computeSlotsByGrid(grid.cols, grid.rows, paper, orientation, slotStyle.gap)
      : computeSlots(Math.round(Math.sqrt(grid.slots)), paper, orientation, slotStyle.gap)

  const slotUrls = resolveSlotImages(slots, images)
  // Scale stage to fit container width while preserving paper aspect ratio
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
            {/* Paper background at true resolution */}
            <Rect x={0} y={0} width={pageW} height={pageH} fill="white" />
            {slots.map((slot, i) => (
              <Slot key={slot.id} slot={slot} url={slotUrls[i]} slotStyle={slotStyle} />
            ))}
          </Layer>
        </Stage>
      )}
    </div>
  )
})

export default CanvasEditor
