import { useRef, useState, useEffect } from 'react'
import { Stage, Layer, Rect, Transformer, Group, Circle, Text, Line } from 'react-konva'
import { getPaperDims, MARGIN, mmToPx, cmToPx, inchToPx, pxToCm, pxToInch, pxToMm, computeBlocksByGrid } from '../utils/layoutEngine'

const DEFAULT_BLOCK_W = 400
const DEFAULT_BLOCK_H = 400
const SNAP_THRESHOLD  = 10   // paper-px within which a snap fires
const UNIT_OPTIONS = [
  { value: 'px', label: 'px' },
  { value: 'cm', label: 'cm' },
  { value: 'mm', label: 'mm' },
  { value: 'in', label: 'inch' },
]

// ─── Snap helpers ─────────────────────────────────────────────────────────────

/** Collect x and y snap candidates from page edges/center and other blocks */
function getSnapCandidates(blocks, draggingId, pageW, pageH) {
  const cx = [MARGIN, pageW / 2, pageW - MARGIN]
  const cy = [MARGIN, pageH / 2, pageH - MARGIN]
  blocks.forEach((b) => {
    if (b.id === draggingId) return
    cx.push(b.x, b.x + b.w / 2, b.x + b.w)
    cy.push(b.y, b.y + b.h / 2, b.y + b.h)
  })
  return { x: cx, y: cy }
}

function nearestSnap(val, candidates) {
  let best = null, bestDist = SNAP_THRESHOLD
  for (const c of candidates) {
    const d = Math.abs(val - c)
    if (d < bestDist) { bestDist = d; best = c }
  }
  return best
}

/** Snap block position; returns snapped {x,y} and active guide lines */
function snapBlock(x, y, w, h, candidates) {
  const guides = []

  const snapL = nearestSnap(x,         candidates.x)
  const snapC = nearestSnap(x + w / 2, candidates.x)
  const snapR = nearestSnap(x + w,     candidates.x)
  let fx = x
  if      (snapL !== null) { fx = snapL;         guides.push({ axis: 'x', pos: snapL }) }
  else if (snapC !== null) { fx = snapC - w / 2; guides.push({ axis: 'x', pos: snapC }) }
  else if (snapR !== null) { fx = snapR - w;     guides.push({ axis: 'x', pos: snapR }) }

  const snapT = nearestSnap(y,         candidates.y)
  const snapM = nearestSnap(y + h / 2, candidates.y)
  const snapB = nearestSnap(y + h,     candidates.y)
  let fy = y
  if      (snapT !== null) { fy = snapT;         guides.push({ axis: 'y', pos: snapT }) }
  else if (snapM !== null) { fy = snapM - h / 2; guides.push({ axis: 'y', pos: snapM }) }
  else if (snapB !== null) { fy = snapB - h;     guides.push({ axis: 'y', pos: snapB }) }

  return { x: fx, y: fy, guides }
}

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

function ResizableBlock({ block, isSelected, onSelect, onChange, onDragMove, onCopy, onDelete, pageW, pageH, keepRatio, stageScale }) {
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

  function handleDragMove(e) {
    const node = e.target
    onDragMove?.(block.id, node.x(), node.y(), block.w, block.h, node)
  }

  function handleDragEnd(e) {
    const node = e.target
    const x = Math.min(Math.max(node.x(), MARGIN), pageW - MARGIN - block.w)
    const y = Math.min(Math.max(node.y(), MARGIN), pageH - MARGIN - block.h)
    node.position({ x, y })
    onChange({ ...block, x, y })
    onDragMove?.(null, 0, 0, 0, 0, null) // clear guides
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
        onDragMove={handleDragMove}
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

export default function PresetBuilder({ paper, orientation, borderWidth, borderColor, gap, onSave, onCancel, initialPreset = null }) {
  const containerRef = useRef(null)
  const [containerWidth, setContainerWidth] = useState(0)
  const [blocks, setBlocks] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [name, setName] = useState('')
  const [unit, setUnit] = useState('px')
  const [freeForm, setFreeForm] = useState(false)
  const [snapGuides, setSnapGuides] = useState([])
  const [alignOpen, setAlignOpen] = useState(false)

  useEffect(() => {
    if (!initialPreset) {
      setBlocks([])
      setName('')
      setSelectedId(null)
      return
    }

    const layoutBlocks = initialPreset.slots
      ? initialPreset.slots
      : computeBlocksByGrid(initialPreset.cols, initialPreset.rows, paper, orientation, initialPreset.gap ?? gap)

    setBlocks(layoutBlocks)
    setName(initialPreset.name || '')
    setSelectedId(layoutBlocks[0]?.id ?? null)
  }, [initialPreset, paper, orientation, gap])

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

  // ── Snap drag handler ──
  function handleBlockDragMove(draggingId, rawX, rawY, w, h, node) {
    if (!draggingId || !node) { setSnapGuides([]); return }
    const candidates = getSnapCandidates(blocks, draggingId, pageW, pageH)
    const { x, y, guides } = snapBlock(rawX, rawY, w, h, candidates)
    node.position({ x, y })
    setSnapGuides(guides)
  }

  // ── Alignment (relative to usable area inside margins) ──
  const usableX = MARGIN, usableY = MARGIN
  const usableW = pageW - MARGIN * 2, usableH = pageH - MARGIN * 2

  const ALIGN_OPTIONS = [
    { label: 'Top Left',      fn: (b) => ({ ...b, x: usableX,                       y: usableY }) },
    { label: 'Top Center',    fn: (b) => ({ ...b, x: usableX + (usableW - b.w) / 2, y: usableY }) },
    { label: 'Top Right',     fn: (b) => ({ ...b, x: usableX + usableW - b.w,        y: usableY }) },
    { label: 'Middle Left',   fn: (b) => ({ ...b, x: usableX,                       y: usableY + (usableH - b.h) / 2 }) },
    { label: 'Center',        fn: (b) => ({ ...b, x: usableX + (usableW - b.w) / 2, y: usableY + (usableH - b.h) / 2 }) },
    { label: 'Middle Right',  fn: (b) => ({ ...b, x: usableX + usableW - b.w,        y: usableY + (usableH - b.h) / 2 }) },
    { label: 'Bottom Left',   fn: (b) => ({ ...b, x: usableX,                       y: usableY + usableH - b.h }) },
    { label: 'Bottom Center', fn: (b) => ({ ...b, x: usableX + (usableW - b.w) / 2, y: usableY + usableH - b.h }) },
    { label: 'Bottom Right',  fn: (b) => ({ ...b, x: usableX + usableW - b.w,        y: usableY + usableH - b.h }) },
  ]

  function applyAlign(fn) {
    if (!selected) return
    handleChange(fn(selected))
    setAlignOpen(false)
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
    if (!name.trim()) { alert('Please enter a preset name.'); return }
    if (blocks.length === 0) { alert('Please add at least one block.'); return }
    onSave({
      ...(initialPreset?.id ? { id: initialPreset.id } : {}),
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
          placeholder="Preset name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)', borderColor: 'var(--border)' }}
          className="text-sm px-3 py-1.5 rounded border focus:outline-none flex-1 min-w-32"
        />
        <button onClick={addBlock}
          className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-1.5 rounded transition">
          + Add Block
        </button>

        {/* Align dropdown */}
        <div className="relative">
          <button
            disabled={!selected}
            onClick={() => setAlignOpen((o) => !o)}
            style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)', borderColor: 'var(--border)' }}
            className="border text-sm px-3 py-1.5 rounded transition hover:opacity-80 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
          >
            Align <span className="text-xs">{alignOpen ? '▲' : '▼'}</span>
          </button>
          {alignOpen && selected && (
            <div
              className="absolute top-full left-0 mt-1 z-50 rounded shadow-xl border overflow-hidden"
              style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)', minWidth: 140 }}
            >
              {ALIGN_OPTIONS.map((a) => (
                <button key={a.label} onClick={() => applyAlign(a.fn)}
                  style={{ color: 'var(--text-primary)' }}
                  className="w-full text-left text-xs px-3 py-2 hover:bg-indigo-500 hover:text-white transition"
                >
                  {a.label}
                </button>
              ))}
            </div>
          )}
        </div>
        <button onClick={handleSave}
          className="bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium px-4 py-1.5 rounded transition">
          Save Preset
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
                  onDragMove={handleBlockDragMove}
                  onCopy={copyBlock}
                  onDelete={removeBlock}
                  pageW={pageW}
                  pageH={pageH}
                  keepRatio={!freeForm}
                  stageScale={stageScale}
                />
              ))}

              {/* Snap guide lines — red dashed, shown while dragging */}
              {snapGuides.map((g, i) =>
                g.axis === 'x'
                  ? <Line key={i} points={[g.pos, 0, g.pos, pageH]} stroke="#f43f5e" strokeWidth={1} dash={[6, 4]} listening={false} />
                  : <Line key={i} points={[0, g.pos, pageW, g.pos]} stroke="#f43f5e" strokeWidth={1} dash={[6, 4]} listening={false} />
              )}
            </Layer>
          </Stage>
        )}
      </div>

      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
        Click a block to select · Drag to move · Drag handles to resize · Red lines = snap guides · Dashed line = margin boundary
      </p>
    </div>
  )
}
