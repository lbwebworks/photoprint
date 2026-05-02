import { useState, useEffect } from 'react'
import { Group, Rect, Image as KonvaImage } from 'react-konva'
import { getFillScale, clampOffset } from '../utils/imageUtils'

function BlockImage({ url, blockW, blockH, interactive }) {
  const [img, setImg] = useState(null)
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

  const fillScale = getFillScale(img.width, img.height, blockW, blockH)
  const effectiveScale = fillScale * zoom
  const drawW = img.width * effectiveScale
  const drawH = img.height * effectiveScale

  const baseX = (blockW - drawW) / 2
  const baseY = (blockH - drawH) / 2
  const pos = clampOffset(baseX + offset.x, baseY + offset.y, drawW, drawH, blockW, blockH)

  function handleWheel(e) {
    if (!interactive) return
    e.evt.preventDefault()
    const factor = e.evt.deltaY < 0 ? 1.05 : 0.95
    setZoom((z) => Math.max(1, z * factor))
  }

  function handleDragMove(e) {
    if (!interactive) return
    const raw = e.target.position()
    const clamped = clampOffset(raw.x, raw.y, drawW, drawH, blockW, blockH)
    e.target.position(clamped)
    setOffset({ x: clamped.x - baseX, y: clamped.y - baseY })
  }

  return (
    <KonvaImage
      image={img}
      x={pos.x} y={pos.y}
      width={drawW} height={drawH}
      draggable={interactive}
      onDragMove={handleDragMove}
      onWheel={handleWheel}
    />
  )
}

export default function Block({ block, url, blockStyle, isSelected, isDragOver, isEditing, onSelect, onRemoveImage }) {
  const { borderWidth = 0, borderColor = '#000000' } = blockStyle || {}

  const normalStroke  = borderWidth > 0 ? borderColor : '#c0c8d8'
  const normalWidth   = borderWidth > 0 ? borderWidth : 2

  const ringStroke = isEditing ? '#f59e0b' : isSelected ? '#6366f1' : isDragOver ? '#22d3ee' : null

  return (
    <Group
      x={block.x} y={block.y}
      onClick={(e) => { e.cancelBubble = true; if (!isEditing) onSelect?.(block.id, e.evt.shiftKey || e.evt.metaKey || e.evt.ctrlKey) }}
      onTap={() => { if (!isEditing) onSelect?.(block.id, false) }}
    >
      {/* Selection / edit ring */}
      {ringStroke && (
        <Rect
          x={-3} y={-3}
          width={block.w + 6} height={block.h + 6}
          fill="transparent"
          stroke={ringStroke}
          strokeWidth={4}
          cornerRadius={2}
          listening={false}
        />
      )}

      <Group clipX={0} clipY={0} clipWidth={block.w} clipHeight={block.h}>
        {/* Background fill */}
        <Rect
          width={block.w} height={block.h}
          fill={url ? '#fefeff' : '#f5f7fa'}
        />
        {url && <BlockImage url={url} blockW={block.w} blockH={block.h} interactive={isEditing} />}
        {/* Border drawn on top of image so it's always visible */}
        <Rect
          width={block.w} height={block.h}
          fill="transparent"
          stroke={isEditing ? '#f59e0b' : isSelected ? '#6366f1' : (isDragOver ? '#22d3ee' : normalStroke)}
          strokeWidth={isEditing || isSelected || isDragOver ? 3 : normalWidth}
          listening={false}
        />
      </Group>
    </Group>
  )
}
