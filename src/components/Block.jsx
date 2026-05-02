import { useState, useEffect } from 'react'
import { Group, Rect, Image as KonvaImage, Text } from 'react-konva'
import { getFillScale, clampOffset } from '../utils/imageUtils'

function BlockImage({ url, blockW, blockH }) {
  const [img, setImg] = useState(null)
  // zoom is a multiplier on top of fillScale (min 1 = no zoom-out below fill)
  const [zoom, setZoom] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const image = new window.Image()
    image.src = url
    image.onload = () => {
      setImg(image)
      setZoom(1)
      setOffset({ x: 0, y: 0 })
    }
  }, [url])

  if (!img) return null

  // fillScale: minimum scale so image fully covers the block (no empty space)
  const fillScale = getFillScale(img.width, img.height, blockW, blockH)
  const effectiveScale = fillScale * zoom
  const drawW = img.width * effectiveScale
  const drawH = img.height * effectiveScale

  // Center the image in the block, then apply user drag offset
  const baseX = (blockW - drawW) / 2
  const baseY = (blockH - drawH) / 2
  const pos = clampOffset(baseX + offset.x, baseY + offset.y, drawW, drawH, blockW, blockH)

  function handleWheel(e) {
    e.evt.preventDefault()
    const factor = e.evt.deltaY < 0 ? 1.05 : 0.95
    // Clamp: zoom cannot go below 1 (would break fill coverage)
    setZoom((z) => Math.max(1, z * factor))
  }

  function handleDragMove(e) {
    const raw = e.target.position()
    const clamped = clampOffset(raw.x, raw.y, drawW, drawH, blockW, blockH)
    e.target.position(clamped)
    setOffset({ x: clamped.x - baseX, y: clamped.y - baseY })
  }

  return (
    <KonvaImage
      image={img}
      x={pos.x}
      y={pos.y}
      width={drawW}
      height={drawH}
      draggable
      onDragMove={handleDragMove}
      onWheel={handleWheel}
    />
  )
}

// Semi-transparent Remove button rendered at the bottom-center of the block
function RemoveButton({ blockW, blockH, onRemove }) {
  const BTN_W = 80
  const BTN_H = 24
  const BTN_X = (blockW - BTN_W) / 2
  const BTN_Y = blockH - BTN_H - 10
  const CORNER = 4

  return (
    <Group>
      <Rect
        x={BTN_X} y={BTN_Y}
        width={BTN_W} height={BTN_H}
        cornerRadius={CORNER}
        fill="rgba(220,38,38,0.65)"
        onClick={(e) => { e.cancelBubble = true; onRemove() }}
        onTap={(e) => { e.cancelBubble = true; onRemove() }}
        onMouseEnter={(e) => { e.target.fill('rgba(220,38,38,0.85)'); e.target.getLayer().batchDraw() }}
        onMouseLeave={(e) => { e.target.fill('rgba(220,38,38,0.65)'); e.target.getLayer().batchDraw() }}
      />
      <Text
        x={BTN_X} y={BTN_Y}
        width={BTN_W} height={BTN_H}
        text="Remove" fontSize={11}
        align="center" verticalAlign="middle"
        fill="white" listening={false}
      />
    </Group>
  )
}

export default function Block({ block, url, blockStyle, isSelected, onSelect, onRemoveImage }) {
  const { borderWidth = 0, borderColor = '#000000' } = blockStyle || {}

  return (
    <Group
      x={block.x} y={block.y}
      clipX={0} clipY={0} clipWidth={block.w} clipHeight={block.h}
      onClick={() => onSelect?.(block.id)}
      onTap={() => onSelect?.(block.id)}
    >
      <Rect
        width={block.w}
        height={block.h}
        fill={url ? '#fefeff' : '#f5f7fa'}
        stroke={isSelected ? '#6366f1' : (borderWidth > 0 ? borderColor : '#c0c8d8')}
        strokeWidth={isSelected ? 3 : (borderWidth > 0 ? borderWidth : 2)}
      />
      {url && <BlockImage url={url} blockW={block.w} blockH={block.h} />}
      {isSelected && url && (
        <RemoveButton
          blockW={block.w}
          blockH={block.h}
          onRemove={() => onRemoveImage?.(block.id)}
        />
      )}
    </Group>
  )
}
