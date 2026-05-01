import { useRef, useState, useEffect, useCallback } from 'react'
import { Stage, Layer, Rect, Transformer } from 'react-konva'
import { getPaperDims, MARGIN, mmToPx } from '../utils/layoutEngine'

const DEFAULT_SLOT_W = mmToPx(35)
const DEFAULT_SLOT_H = mmToPx(45)

function ResizableSlot({ slot, isSelected, onSelect, onChange, pageW, pageH }) {
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
    const x = Math.min(Math.max(node.x(), MARGIN), pageW - MARGIN - slot.w)
    const y = Math.min(Math.max(node.y(), MARGIN), pageH - MARGIN - slot.h)
    node.position({ x, y })
    onChange({ ...slot, x, y })
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
    onChange({ ...slot, x, y, w, h })
  }

  return (
    <>
      <Rect
        ref={shapeRef}
        x={slot.x}
        y={slot.y}
        width={slot.w}
        height={slot.h}
        fill="#f0f4ff"
        stroke={isSelected ? '#6366f1' : '#a0aec0'}
        strokeWidth={isSelected ? 6 : 3}
        draggable
        onClick={() => onSelect(slot.id)}
        onTap={() => onSelect(slot.id)}
        onDragEnd={handleDragEnd}
        onTransformEnd={handleTransformEnd}
      />
      {isSelected && (
        <Transformer
          ref={trRef}
          rotateEnabled={false}
          boundBoxFunc={(oldBox, newBox) => {
            if (newBox.width < mmToPx(10) || newBox.height < mmToPx(10)) return oldBox
            return newBox
          }}
        />
      )}
    </>
  )
}

export default function LayoutBuilder({ paper, orientation, borderWidth, borderColor, gap, onSave, onCancel }) {
  const containerRef = useRef(null)
  const [containerWidth, setContainerWidth] = useState(0)
  const [slots, setSlots] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [name, setName] = useState('')

  useEffect(() => {
    const observer = new ResizeObserver(([entry]) => setContainerWidth(entry.contentRect.width))
    if (containerRef.current) observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [])

  const { width: pageW, height: pageH } = getPaperDims(paper, orientation)
  const stageScale = containerWidth / pageW

  function addSlot() {
    const id = `slot-${Date.now()}`
    // Place new slot at margin, offset slightly per existing count
    const offset = slots.length * mmToPx(5)
    const x = Math.min(MARGIN + offset, pageW - MARGIN - DEFAULT_SLOT_W)
    const y = Math.min(MARGIN + offset, pageH - MARGIN - DEFAULT_SLOT_H)
    setSlots((prev) => [...prev, { id, x, y, w: DEFAULT_SLOT_W, h: DEFAULT_SLOT_H }])
    setSelectedId(id)
  }

  function removeSelected() {
    setSlots((prev) => prev.filter((s) => s.id !== selectedId))
    setSelectedId(null)
  }

  function handleChange(updated) {
    setSlots((prev) => prev.map((s) => s.id === updated.id ? updated : s))
  }

  function handleSave() {
    if (!name.trim()) { alert('Please enter a layout name.'); return }
    if (slots.length === 0) { alert('Please add at least one slot.'); return }
    onSave({
      name: name.trim(),
      paper, orientation,
      borderWidth, borderColor, gap,
      slots,
      cols: null, rows: null,
    })
  }

  const selected = slots.find((s) => s.id === selectedId)

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
        <button onClick={addSlot}
          className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-1.5 rounded transition">
          + Add Slot
        </button>
        {selectedId && (
          <button onClick={removeSelected}
            className="bg-rose-600 hover:bg-rose-500 text-white text-sm font-medium px-4 py-1.5 rounded transition">
            Remove Slot
          </button>
        )}
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

      {/* Selected slot size controls */}
      {selected && (
        <div className="flex items-center gap-3 flex-wrap justify-center text-xs" style={{ color: 'var(--text-secondary)' }}>
          <span>W:</span>
          <input type="number" min={mmToPx(10)} value={Math.round(selected.w)}
            onChange={(e) => handleChange({ ...selected, w: Math.max(mmToPx(10), Number(e.target.value)) })}
            style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)', borderColor: 'var(--border)' }}
            className="w-20 text-xs px-2 py-1 rounded border focus:outline-none"
          />
          <span>H:</span>
          <input type="number" min={mmToPx(10)} value={Math.round(selected.h)}
            onChange={(e) => handleChange({ ...selected, h: Math.max(mmToPx(10), Number(e.target.value)) })}
            style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)', borderColor: 'var(--border)' }}
            className="w-20 text-xs px-2 py-1 rounded border focus:outline-none"
          />
          <span style={{ color: 'var(--text-muted)' }}>px @ 300 DPI</span>
        </div>
      )}

      {/* Canvas */}
      <div ref={containerRef} className="w-full max-w-2xl shadow-2xl">
        {containerWidth > 0 && (
          <Stage
            width={containerWidth}
            height={pageH * stageScale}
            scaleX={stageScale}
            scaleY={stageScale}
            onMouseDown={(e) => { if (e.target === e.target.getStage()) setSelectedId(null) }}
          >
            <Layer>
              {/* Paper */}
              <Rect x={0} y={0} width={pageW} height={pageH} fill="white" />
              {/* Margin guide */}
              <Rect
                x={MARGIN} y={MARGIN}
                width={pageW - MARGIN * 2} height={pageH - MARGIN * 2}
                fill="transparent" stroke="#e2e8f0" strokeWidth={3} dash={[20, 10]}
              />
              {slots.map((slot) => (
                <ResizableSlot
                  key={slot.id}
                  slot={slot}
                  isSelected={slot.id === selectedId}
                  onSelect={setSelectedId}
                  onChange={handleChange}
                  pageW={pageW}
                  pageH={pageH}
                />
              ))}
            </Layer>
          </Stage>
        )}
      </div>

      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
        Click a slot to select · Drag to move · Drag handles to resize · Dashed line = margin boundary
      </p>
    </div>
  )
}
