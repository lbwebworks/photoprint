import { useRef, useState, useEffect } from 'react'
import { Stage, Layer, Rect, Transformer, Group, Circle, Text } from 'react-konva'
import { getPaperDims, MARGIN, mmToPx, cmToPx, inchToPx, pxToCm, pxToInch, pxToMm, computeBlocksByGrid } from '../utils/layoutEngine'

const DEFAULT_BLOCK_W = 400
const DEFAULT_BLOCK_H = 400
const UNIT_OPTIONS = [
  { value: 'px', label: 'px' },
  { value: 'cm', label: 'cm' },
  { value: 'mm', label: 'mm' },
  { value: 'in', label: 'inch' },
]

// Gear icon rendered as a Konva Group — sits at top-right of the block.
// All sizes are specified in screen pixels; dividing by stageScale converts them
// to paper-pixel space so they appear at a fixed physical size on screen.
function BlockActionButton({ blockW, blockH, stageScale, onToggle, showActions, onCopy, onDelete }) {
  // Fixed screen-pixel sizes (matches the old DOM button)
  const S = 1 / stageScale          // 1 screen-px in paper-px
  const BTN_R  = 14 * S             // gear circle radius
  const PAD    = 6  * S             // padding from block edge
  const BTN_X  = blockW - BTN_R - PAD
  const BTN_Y  = BTN_R + PAD

  // Menu item dimensions in screen px → paper px
  const ITEM_W = 52 * S
  const ITEM_H = 22 * S
  const ITEM_GAP = 4 * S
  const FONT_BTN = 11 * S
  const FONT_GEAR = 13 * S
  const CORNER = 4 * S

  // Position menu to the right of the gear button
  const MENU_X = BTN_X + BTN_R + PAD
  const MENU_Y = BTN_Y - BTN_R

  return (
    <Group>
      {/* Gear circle */}
      <Circle
        x={BTN_X} y={BTN_Y} radius={BTN_R}
        fill="rgba(255,255,255,0.95)" stroke="#cbd5e1" strokeWidth={S}
        shadowColor="black" shadowBlur={4 * S} shadowOpacity={0.12}
        onClick={(e) => { e.cancelBubble = true; onToggle() }}
        onTap={(e) => { e.cancelBubble = true; onToggle() }}
        onMouseEnter={(e) => { e.target.fill('rgba(241,245,249,0.98)'); e.target.getLayer().batchDraw() }}
        onMouseLeave={(e) => { e.target.fill('rgba(255,255,255,0.95)'); e.target.getLayer().batchDraw() }}
      />
      <Text
        x={BTN_X - BTN_R} y={BTN_Y - BTN_R}
        width={BTN_R * 2} height={BTN_R * 2}
        text="⚙" fontSize={FONT_GEAR} align="center" verticalAlign="middle"
        fill="#475569" listening={false}
      />

      {/* Dropdown menu — shown to the left of the gear button */}
      {showActions && (
        <Group x={MENU_X} y={MENU_Y}>
          {/* Copy button */}
          <Rect
            width={ITEM_W} height={ITEM_H} cornerRadius={CORNER}
            fill="#475569"
            onClick={(e) => { e.cancelBubble = true; onCopy() }}
            onTap={(e) => { e.cancelBubble = true; onCopy() }}
            onMouseEnter={(e) => { e.target.fill('#334155'); e.target.getLayer().batchDraw() }}
            onMouseLeave={(e) => { e.target.fill('#475569'); e.target.getLayer().batchDraw() }}
          />
          <Text
            x={0} y={0} width={ITEM_W} height={ITEM_H}
            text="Copy" fontSize={FONT_BTN} align="center" verticalAlign="middle"
            fill="white" listening={false}
          />
          {/* Delete button */}
          <Rect
            y={ITEM_H + ITEM_GAP} width={ITEM_W} height={ITEM_H} cornerRadius={CORNER}
            fill="#e11d48"
            onClick={(e) => { e.cancelBubble = true; onDelete() }}
            onTap={(e) => { e.cancelBubble = true; onDelete() }}
            onMouseEnter={(e) => { e.target.fill('#be123c'); e.target.getLayer().batchDraw() }}
            onMouseLeave={(e) => { e.target.fill('#e11d48'); e.target.getLayer().batchDraw() }}
          />
          <Text
            x={0} y={ITEM_H + ITEM_GAP} width={ITEM_W} height={ITEM_H}
            text="Delete" fontSize={FONT_BTN} align="center" verticalAlign="middle"
            fill="white" listening={false}
          />
        </Group>
      )}
    </Group>
  )
}

function ResizableBlock({ block, isSelected, onSelect, onChange, onCopy, onDelete, pageW, pageH, keepRatio, stageScale }) {
  const groupRef = useRef(null)
  const trRef = useRef(null)
  const [showActions, setShowActions] = useState(false)

  useEffect(() => {
    if (isSelected && trRef.current && groupRef.current) {
      trRef.current.nodes([groupRef.current])
      trRef.current.getLayer().batchDraw()
    }
  }, [isSelected])

  // Close action menu when block is deselected
  useEffect(() => {
    if (!isSelected) setShowActions(false)
  }, [isSelected])

  function handleDragEnd(e) {
    const node = e.target
    const x = Math.min(Math.max(node.x(), MARGIN), pageW - MARGIN - block.w)
    const y = Math.min(Math.max(node.y(), MARGIN), pageH - MARGIN - block.h)
    node.position({ x, y })
    onChange({ ...block, x, y })
  }

  function handleTransformEnd() {
    const node = groupRef.current
    const scaleX = node.scaleX()
    const scaleY = node.scaleY()
    node.scaleX(1)
    node.scaleY(1)
    const w = Math.max(mmToPx(10), block.w * scaleX)
    const h = Math.max(mmToPx(10), block.h * scaleY)
    const x = Math.min(Math.max(node.x(), MARGIN), pageW - MARGIN - w)
    const y = Math.min(Math.max(node.y(), MARGIN), pageH - MARGIN - h)
    node.position({ x, y })
    onChange({ ...block, x, y, w, h })
  }

  return (
    <>
      <Group
        ref={groupRef}
        x={block.x}
        y={block.y}
        width={block.w}
        height={block.h}
        draggable
        onClick={() => { onSelect(block.id); setShowActions(false) }}
        onTap={() => { onSelect(block.id); setShowActions(false) }}
        onDragEnd={handleDragEnd}
        onTransformEnd={handleTransformEnd}
      >
        <Rect
          x={0}
          y={0}
          width={block.w}
          height={block.h}
          fill="#f0f4ff"
          stroke={isSelected ? '#6366f1' : '#a0aec0'}
          strokeWidth={isSelected ? 6 : 3}
        />
        {isSelected && (
          <BlockActionButton
            blockW={block.w}
            blockH={block.h}
            stageScale={stageScale}
            showActions={showActions}
            onToggle={() => setShowActions((v) => !v)}
            onCopy={() => { setShowActions(false); onCopy(block.id) }}
            onDelete={() => { setShowActions(false); onDelete(block.id) }}
          />
        )}
      </Group>
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

  function removeBlock(id) {
    setBlocks((prev) => prev.filter((s) => s.id !== id))
    if (selectedId === id) setSelectedId(null)
  }

  function copyBlock(id) {
    const block = blocks.find((s) => s.id === id)
    if (!block) return
    const offset = mmToPx(5)
    const x = Math.min(block.x + offset, pageW - MARGIN - block.w)
    const y = Math.min(block.y + offset, pageH - MARGIN - block.h)
    const copy = { ...block, id: `block-${Date.now()}`, x, y }
    setBlocks((prev) => [...prev, copy])
    setSelectedId(copy.id)
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
                  onCopy={copyBlock}
                  onDelete={removeBlock}
                  pageW={pageW}
                  pageH={pageH}
                  keepRatio={!freeForm}
                  stageScale={stageScale}
                />
              ))}
            </Layer>
          </Stage>
        )}
      </div>

      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
        Click a block to select · Drag to move · Drag handles to resize · Dashed line = margin boundary
      </p>
    </div>
  )
}
