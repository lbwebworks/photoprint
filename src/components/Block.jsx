import { useState, useEffect } from 'react'
import { Group, Rect, Image as KonvaImage } from 'react-konva'
import { getFillScale, getFitScale, clampOffset } from '../utils/imageUtils'

function BlockImage({ url, blockW, blockH, interactive, rotation = 0, zoom = 1, offset = { x: 0, y: 0 }, onZoomChange, onOffsetChange, imageFitMode = 'fill' }) {
  const [img, setImg] = useState(null)
  const [rotatedImg, setRotatedImg] = useState(null)
  // Local state for uncontrolled mode (when props not provided)
  const [localZoom, setLocalZoom] = useState(1)
  const [localOffset, setLocalOffset] = useState({ x: 0, y: 0 })

  // Determine if controlled or uncontrolled
  const isControlled = onZoomChange !== undefined && onOffsetChange !== undefined
  const effectiveZoom = isControlled ? zoom : localZoom
  const effectiveOffset = isControlled ? offset : localOffset

  const updateZoom = (z) => {
    if (isControlled && onZoomChange) {
      onZoomChange(z)
    } else {
      setLocalZoom(z)
    }
  }

  const updateOffset = (o) => {
    if (isControlled && onOffsetChange) {
      onOffsetChange(o)
    } else {
      setLocalOffset(o)
    }
  }

  // Load the source image
  useEffect(() => {
    const image = new window.Image()
    image.src = url
    image.onload = () => setImg(image)
  }, [url])

  // Pre-rotate onto an offscreen canvas whenever img or rotation changes
  useEffect(() => {
    if (!img) return
    const rad = (rotation * Math.PI) / 180
    const sin = Math.abs(Math.sin(rad))
    const cos = Math.abs(Math.cos(rad))
    // Rotated canvas dimensions
    const cw = Math.round(img.width * cos + img.height * sin)
    const ch = Math.round(img.width * sin + img.height * cos)
    const canvas = document.createElement('canvas')
    canvas.width  = cw
    canvas.height = ch
    const ctx = canvas.getContext('2d')
    ctx.translate(cw / 2, ch / 2)
    ctx.rotate(rad)
    ctx.drawImage(img, -img.width / 2, -img.height / 2)
    const out = new window.Image()
    out.src = canvas.toDataURL()
    out.onload = () => {
      setRotatedImg(out)
      updateZoom(1)
      updateOffset({ x: 0, y: 0 })
    }
  }, [img, rotation])

  useEffect(() => {
    if (!rotatedImg) return
    updateOffset({ x: 0, y: 0 })
  }, [imageFitMode, rotatedImg])

  if (!rotatedImg) return null

  const baseScale = imageFitMode === 'fit'
    ? getFitScale(rotatedImg.width, rotatedImg.height, blockW, blockH)
    : getFillScale(rotatedImg.width, rotatedImg.height, blockW, blockH)
  const effectiveScale = baseScale * effectiveZoom
  const drawW = rotatedImg.width  * effectiveScale
  const drawH = rotatedImg.height * effectiveScale

  const baseX = (blockW - drawW) / 2
  const baseY = (blockH - drawH) / 2
  const pos = clampOffset(baseX + effectiveOffset.x, baseY + effectiveOffset.y, drawW, drawH, blockW, blockH)

  function handleWheel(e) {
    if (!interactive) return
    e.evt.preventDefault()
    const factor = e.evt.deltaY < 0 ? 1.05 : 0.95
    updateZoom(Math.max(1, effectiveZoom * factor))
  }

  function handleDragMove(e) {
    if (!interactive) return
    const raw = e.target.position()
    const clamped = clampOffset(raw.x, raw.y, drawW, drawH, blockW, blockH)
    e.target.position(clamped)
    updateOffset({ x: clamped.x - baseX, y: clamped.y - baseY })
  }

  return (
    <KonvaImage
      image={rotatedImg}
      x={pos.x} y={pos.y}
      width={drawW} height={drawH}
      draggable={interactive}
      onDragMove={handleDragMove}
      onWheel={handleWheel}
    />
  )
}

export default function Block({ block, url, blockStyle, theme = 'light', isSelected, isDragOver, isEditing, rotation = 0, blockZoom = 1, blockOffset = { x: 0, y: 0 }, imageFitMode = 'fill', onBlockZoomChange, onBlockOffsetChange, onSelect, onRemoveImage }) {
  const { borderWidth = 0, borderColor = '#000000' } = blockStyle || {}

  const normalStroke  = borderWidth > 0 ? borderColor : (theme === 'dark' ? '#9ca3af' : '#c0c8d8')
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
        {/* Background — empty blocks use visible theme fill on screen, export stays white via theme="light" */}
        <Rect
          width={block.w} height={block.h}
          fill={url ? '#fefeff' : (theme === 'dark' ? '#1f2937' : 'white')}
        />
        {url && <BlockImage url={url} blockW={block.w} blockH={block.h} interactive={isEditing} rotation={rotation} zoom={blockZoom} offset={blockOffset} onZoomChange={onBlockZoomChange} onOffsetChange={onBlockOffsetChange} imageFitMode={imageFitMode} />}
        {/* Border — only when block has an image or user set a border width */}
        {(url || borderWidth > 0) && (
          <Rect
            width={block.w} height={block.h}
            fill="transparent"
            stroke={isEditing ? '#f59e0b' : isSelected ? '#6366f1' : (isDragOver ? '#22d3ee' : normalStroke)}
            strokeWidth={isEditing || isSelected || isDragOver ? 3 : normalWidth}
            listening={false}
          />
        )}
        {/* Selection/drag ring on empty blocks — shown in editor only via opacity,
            still captured by export but as a solid indigo/cyan ring which is intentional
            (export deselects first anyway) */}
        {!url && borderWidth === 0 && (isSelected || isDragOver) && (
          <Rect
            width={block.w} height={block.h}
            fill="transparent"
            stroke={isSelected ? '#6366f1' : '#22d3ee'}
            strokeWidth={3}
            listening={false}
          />
        )}
      </Group>
    </Group>
  )
}
