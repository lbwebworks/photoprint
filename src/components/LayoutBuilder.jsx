import { useRef, useState, useEffect } from 'react'
import { Stage, Layer, Rect, Transformer } from 'react-konva'
import { getPaperDims, MARGIN, mmToPx, cmToPx, inchToPx, pxToCm, pxToInch, pxToMm, computeBlocksByGrid } from '../utils/layoutEngine'

const DEFAULT_BLOCK_W = 400
const DEFAULT_BLOCK_H = 400
const UNIT_OPTIONS = [
  { value: 'px', label: 'px' },
  { value: 'cm', label: 'cm' },
  { value: 'mm', label: 'mm' },
  { value: 'in', label: 'inch' },
]

function ResizableBlock({ block, isSelected, onSelect, onChange, pageW, pageH, keepRatio = false }) {
  const shapeRef = useRef(null)
  const trRef = useRef(null)

  useEffect(() => {
    if (isSelected && trRef.current && shapeRef.current) {
      trRef.current.nodes([shapeRef.current])
      trRef.current.getLayer().batchDraw()
    }
  }, [isSelected])

  function handleDragEnd(e) {
    const node = e.target
    // Clamp position within paper margins
    const x = Math.min(Math.max(node.x(), MARGIN), pageW - MARGIN - block.w)
    const y = Math.min(Math.max(node.y(), MARGIN), pageH - MARGIN - block.h)
    node.position({ x, y })
    onChange({ ...block, x, y })
  }

  function handleTransformEnd() {
    const node = shapeRef.current
    const scaleX = node.scaleX()
    const scaleY = node.scaleY()
    node.scaleX(1)
    node.scaleY(1)
    const w = Math.max(mmToPx(10), node.width() * scaleX)
    const h = Math.max(mmToPx(10), node.height() * scaleY)
    // Clamp within margins
    const x = Math.min(Math.max(node.x(), MARGIN), pageW - MARGIN - w)
    const y = Math.min(Math.max(node.y(), MARGIN), pageH - MARGIN - h)
    onChange({ ...block, x, y, w, h })
  }

  return (
    <>
      <Rect
        ref={shapeRef}
        x={block.x}
        y={block.y}
        width={block.w}
        height={block.h}
        fill="#f0f4ff"
        stroke={isSelected ? '#6366f1' : '#a0aec0'}
        strokeWidth={isSelected ? 6 : 3}
        draggable
        onClick={() => onSelect(block.id)}
        onTap={() => onSelect(block.id)}
        onDragEnd={handleDragEnd}
        onTransformEnd={handleTransformEnd}
      />
      {isSelected && (
        <Transformer
          ref={trRef}
          rotateEnabled={false}
          keepRatio={keepRatio}
          boundBoxFunc={(oldBox, newBox) => {
            if (newBox.width < mmToPx(10) || newBox.height < mmToPx(10)) return oldBox
            return newBox
          }}
        />
      )}
    </>
  )
}

export default function LayoutBuilder({ paper, orientation, borderWidth, borderColor, gap, onSave, onCancel, initialLayout = null }) {
  const containerRef = useRef(null)
  const [containerWidth, setContainerWidth] = useState(0)
  const [blocks, setBlocks] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [name, setName] = useState('')
  const [unit, setUnit] = useState('px')
  const [freeForm, setFreeForm] = useState(false)
  const [showBlockActions, setShowBlockActions] = useState(false)

  useEffect(() => {
    if (!initialLayout) {
      setBlocks([])
      setName('')
      setSelectedId(null)
      return
    }

    const layoutBlocks = initialLayout.slots
      ? initialLayout.slots
      : computeBlocksByGrid(initialLayout.cols, initialLayout.rows, paper, orientation, initialLayout.gap ?? gap)

    setBlocks(layoutBlocks)
    setName(initialLayout.name || '')
    setSelectedId(layoutBlocks[0]?.id ?? null)
  }, [initialLayout, paper, orientation, gap])

  const formatDisplayValue = (px) => {
    switch (unit) {
      case 'mm': return parseFloat(pxToMm(px))
      case 'cm': return parseFloat(pxToCm(px))
      case 'in': return parseFloat(pxToInch(px))
      default: return px
    }
  }

  const convertToPx = (value) => {
    const numeric = Number(value)
    if (Number.isNaN(numeric)) return 0
    switch (unit) {
      case 'mm': return mmToPx(numeric)
      case 'cm': return cmToPx(numeric)
      case 'in': return inchToPx(numeric)
      default: return Math.round(numeric)
    }
  }

  useEffect(() => {
    const observer = new ResizeObserver(([entry]) => setContainerWidth(entry.contentRect.width))
    if (containerRef.current) observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [])

  const { width: pageW, height: pageH } = getPaperDims(paper, orientation)
  const stageScale = containerWidth / pageW

  function addBlock() {
    const id = `block-${Date.now()}`
    // Place new block at margin, offset slightly per existing count
    const offset = blocks.length * mmToPx(5)
    const x = Math.min(MARGIN + offset, pageW - MARGIN - DEFAULT_BLOCK_W)
    const y = Math.min(MARGIN + offset, pageH - MARGIN - DEFAULT_BLOCK_H)
    setBlocks((prev) => [...prev, { id, x, y, w: DEFAULT_BLOCK_W, h: DEFAULT_BLOCK_H }])
    setSelectedId(id)
  }

  function removeSelected() {
    setBlocks((prev) => prev.filter((s) => s.id !== selectedId))
    setSelectedId(null)
    setShowBlockActions(false)
  }

  function copySelected() {
    const block = blocks.find((s) => s.id === selectedId)
    if (!block) return
    const offset = mmToPx(5)
    const x = Math.min(block.x + offset, pageW - MARGIN - block.w)
    const y = Math.min(block.y + offset, pageH - MARGIN - block.h)
    const copy = { ...block, id: `block-${Date.now()}`, x, y }
    setBlocks((prev) => [...prev, copy])
    setSelectedId(copy.id)
    setShowBlockActions(false)
  }

  function handleChange(updated) {
    setBlocks((prev) => prev.map((s) => s.id === updated.id ? updated : s))
  }

  function handleSelectedDimensionChange(field, rawValue) {
    if (!selected) return
    const px = Math.max(convertToPx(rawValue), mmToPx(10))

    if (freeForm) {
      handleChange({ ...selected, [field]: px })
      return
    }

    const ratio = selected.w / selected.h || 1
    if (field === 'w') {
      const newW = px
      const newH = Math.max(Math.round(newW / ratio), mmToPx(10))
      handleChange({ ...selected, w: newW, h: newH })
    } else {
      const newH = px
      const newW = Math.max(Math.round(newH * ratio), mmToPx(10))
      handleChange({ ...selected, w: newW, h: newH })
    }
  }

  function handleSave() {
    if (!name.trim()) { alert('Please enter a layout name.'); return }
    if (blocks.length === 0) { alert('Please add at least one block.'); return }
    onSave({
      ...(initialLayout?.id ? { id: initialLayout.id } : {}),
      name: name.trim(),
      paper, orientation,
      borderWidth, borderColor, gap,
      slots: blocks,
      cols: null, rows: null,
    })
  }

  const selected = blocks.find((s) => s.id === selectedId)

  useEffect(() => {
    setShowBlockActions(false)
  }, [selectedId])

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      {/* Toolbar row */}
      <div className="flex items-center gap-2 flex-wrap justify-center w-full max-w-2xl">
        <input
          type="text"
          placeholder="Layout name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)', borderColor: 'var(--border)' }}
          className="text-sm px-3 py-1.5 rounded border focus:outline-none flex-1 min-w-32"
        />
        <button onClick={addBlock}
          className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-1.5 rounded transition">
          + Add Block
        </button>
        <button onClick={handleSave}
          className="bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium px-4 py-1.5 rounded transition">
          Save Layout
        </button>
        <button onClick={onCancel}
          style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)', borderColor: 'var(--border)' }}
          className="border text-sm px-4 py-1.5 rounded transition hover:opacity-80">
          Cancel
        </button>
      </div>

      {/* Selected block size controls */}
      <div className="flex justify-between items-center gap-3 text-xs w-full max-w-2xl" style={{ color: 'var(--text-secondary)' }}>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={freeForm}
              onChange={(e) => setFreeForm(e.target.checked)}
              disabled={!selected}
              className="accent-indigo-500"
            />
            <span>Free form</span>
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-2 justify-end">
          <div className="flex items-center gap-2">
            <span>Unit:</span>
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              disabled={!selected}
              style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)', borderColor: 'var(--border)' }}
              className="text-xs px-2 py-1 rounded border focus:outline-none"
            >
              {UNIT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
          <span>W:</span>
          <input type="number" min={unit === 'px' ? 10 : 0.1} step={unit === 'px' ? 1 : 0.1} value={selected ? formatDisplayValue(selected.w) : ''}
            onChange={(e) => selected && handleSelectedDimensionChange('w', e.target.value)}
            disabled={!selected}
            style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)', borderColor: 'var(--border)' }}
            className="w-24 text-xs px-2 py-1 rounded border focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed"
          />
          <span>H:</span>
          <input type="number" min={unit === 'px' ? 10 : 0.1} step={unit === 'px' ? 1 : 0.1} value={selected ? formatDisplayValue(selected.h) : ''}
            onChange={(e) => selected && handleSelectedDimensionChange('h', e.target.value)}
            disabled={!selected}
            style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)', borderColor: 'var(--border)' }}
            className="w-24 text-xs px-2 py-1 rounded border focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed"
          />
          <span style={{ color: 'var(--text-muted)' }}>{unit.toUpperCase()}</span>
        </div>
      </div>

      {/* Canvas */}
      <div ref={containerRef} className="relative w-full max-w-2xl shadow-2xl">
        {containerWidth > 0 && (
          <Stage
            width={containerWidth}
            height={pageH * stageScale}
            scaleX={stageScale}
            scaleY={stageScale}
            onMouseDown={(e) => {
              if (e.target === e.target.getStage()) {
                setSelectedId(null)
              }
            }}
          >
            <Layer>
              {/* Paper */}
              <Rect
                name="background"
                x={0}
                y={0}
                width={pageW}
                height={pageH}
                fill="white"
                onMouseDown={() => setSelectedId(null)}
              />
              {/* Margin guide */}
              <Rect
                listening={false}
                x={MARGIN} y={MARGIN}
                width={pageW - MARGIN * 2} height={pageH - MARGIN * 2}
                fill="transparent" stroke="#e2e8f0" strokeWidth={3} dash={[20, 10]}
              />
              {blocks.map((block) => (
                <ResizableBlock
                  key={block.id}
                  block={block}
                  isSelected={block.id === selectedId}
                  onSelect={setSelectedId}
                  onChange={handleChange}
                  pageW={pageW}
                  pageH={pageH}
                  keepRatio={!freeForm}
                />
              ))}
            </Layer>
          </Stage>
        )}

        {selected && (
          <div
            onMouseDown={(e) => e.stopPropagation()}
            className="absolute z-10 flex flex-col items-end"
            style={{
              left: Math.max(Math.min((selected.x + selected.w) * stageScale - 40, containerWidth - 40), 0),
              top: Math.max(selected.y * stageScale + 8, 8),
            }}
          >
            <button
              type="button"
              onMouseDown={(e) => { e.stopPropagation(); }}
              onClick={(e) => { e.stopPropagation(); setShowBlockActions((prev) => !prev) }}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/95 border border-slate-300 text-slate-700 shadow transition hover:bg-slate-100"
              aria-label="Block actions"
            >
              ⚙
            </button>
            {showBlockActions && (
              <div
                onMouseDown={(e) => { e.stopPropagation(); }}
                className="absolute left-full top-0 ml-2 flex flex-col gap-2 rounded bg-white/95 border border-slate-300 p-2 shadow-lg"
              >
                <button
                  type="button"
                  onClick={copySelected}
                  className="bg-slate-600 hover:bg-slate-500 text-white text-xs font-medium px-3 py-1 rounded transition"
                >
                  Copy
                </button>
                <button
                  type="button"
                  onClick={removeSelected}
                  className="bg-rose-600 hover:bg-rose-500 text-white text-xs font-medium px-3 py-1 rounded transition"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
        Click a block to select · Drag to move · Drag handles to resize · Dashed line = margin boundary
      </p>
    </div>
  )
}
