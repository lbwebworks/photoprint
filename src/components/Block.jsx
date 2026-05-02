import { useState, useEffect } from 'react'
import { Group, Rect, Image as KonvaImage } from 'react-konva'
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

export default function Block({ block, url, blockStyle }) {
  const { borderWidth = 0, borderColor = '#000000' } = blockStyle || {}
  return (
    <Group x={block.x} y={block.y} clipX={0} clipY={0} clipWidth={block.w} clipHeight={block.h}>
      <Rect
        width={block.w}
        height={block.h}
        fill={url ? '#fefeff' : '#f5f7fa'}
        stroke={borderWidth > 0 ? borderColor : '#c0c8d8'}
        strokeWidth={borderWidth > 0 ? borderWidth : 2}
      />
      {url && <BlockImage url={url} blockW={block.w} blockH={block.h} />}
    </Group>
  )
}
