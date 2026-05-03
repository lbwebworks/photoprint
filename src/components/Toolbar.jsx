import { useState } from 'react'
import { GRID_OPTIONS, PAPER_SIZES, getUsable, mmToPx, pxToMm, cmToPx, pxToCm, inchToPx, pxToInch } from '../utils/layoutEngine'
import { IS_LOCAL } from '../utils/presets'

const LAYOUTS = ['Grid', 'Free Size']
const MIN_BLOCK_PX = mmToPx(10)

const UNITS = [
  { value: 'px', label: 'px' },
  { value: 'mm', label: 'mm' },
  { value: 'cm', label: 'cm' },
  { value: 'in', label: 'in' },
]

/** Convert px → display value for the chosen unit */
function toDisplay(px, unit) {
  switch (unit) {
    case 'mm': return parseFloat(pxToMm(px))
    case 'cm': return parseFloat(pxToCm(px))
    case 'in': return parseFloat(pxToInch(px))
    default:   return Math.round(px)
  }
}

/** Convert display value → px */
function fromDisplay(val, unit) {
  const n = parseFloat(val)
  if (isNaN(n)) return 0
  switch (unit) {
    case 'mm': return mmToPx(n)
    case 'cm': return cmToPx(n)
    case 'in': return inchToPx(n)
    default:   return Math.round(n)
  }
}

function stepFor(unit) {
  return unit === 'px' ? 1 : 0.1
}

function LabeledSelect({ label, value, onChange, children }) {
  return (
    <div className="flex flex-col gap-1">
      <span style={{ color: 'var(--text-secondary)' }} className="text-xs">{label}</span>
      <select
        value={value}
        onChange={onChange}
        style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)', borderColor: 'var(--border)' }}
        className="w-full text-sm px-3 py-2 rounded border focus:outline-none cursor-pointer"
      >
        {children}
      </select>
    </div>
  )
}

function Divider() {
  return <div style={{ borderColor: 'var(--border)' }} className="border-t" />
}

/**
 * A numeric input that shows the value in the chosen unit.
 * min/max are in px; value and onChange are in px.
 */
function UnitInput({ label, valuePx, minPx = 0, maxPx, unit, onChange }) {
  const displayVal = toDisplay(valuePx, unit)
  const displayMin = toDisplay(minPx, unit)
  const displayMax = maxPx !== undefined ? toDisplay(maxPx, unit) : undefined

  function handleChange(e) {
    const px = fromDisplay(e.target.value, unit)
    const clamped = Math.max(minPx, maxPx !== undefined ? Math.min(maxPx, px) : px)
    onChange(clamped)
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between items-center text-xs">
        <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
        <input
          type="number"
          min={displayMin}
          max={displayMax}
          step={stepFor(unit)}
          value={displayVal}
          onChange={handleChange}
          style={{ background: 'var(--bg-base)', color: 'var(--text-primary)', borderColor: 'var(--border)' }}
          className="w-16 text-xs px-2 py-1 rounded border focus:outline-none text-right"
        />
      </div>
      <input
        type="range"
        min={minPx}
        max={maxPx ?? 200}
        value={valuePx}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-indigo-500 cursor-pointer"
      />
      {maxPx !== undefined && (
        <div className="flex justify-between text-xs" style={{ color: 'var(--text-muted)' }}>
          <span>{toDisplay(minPx, unit)} {unit}</span>
          <span>{toDisplay(maxPx, unit)} {unit}</span>
        </div>
      )}
    </div>
  )
}

export default function Toolbar({
  paper, orientation,
  template, onTemplate,
  grid, onGrid,
  blockSize, onBlockSize,
  blockStyle, onBlockStyle,
  presets, activePresetId,
  onSelectPreset, onCreatePreset, onEditPreset, onDeletePreset,
  multiPage = false, disabled = false,
}) {
  const usable = getUsable(paper, orientation)
  const [presetsOpen, setPresetsOpen] = useState(true)
  const [unit, setUnit] = useState('mm')

  function handlePublish(l) {
    const snippet = `  { id: '${l.id}', name: '${l.name}', cols: ${l.cols}, rows: ${l.rows} },`
    navigator.clipboard.writeText(snippet)
      .then(() => alert(`Copied to clipboard!\n\nPaste into SAMPLE_PRESETS in\nsrc/utils/presets.js\n\n${snippet}`))
  }

  return (
    <aside
      style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
      className={`w-[20%] min-w-48 shrink-0 border-r flex flex-col gap-4 p-4 overflow-y-auto ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
    >

      {/* Presets — collapsible */}
      <div className="flex flex-col gap-1">
        <button
          onClick={() => setPresetsOpen((o) => !o)}
          className="flex items-center justify-between w-full text-xs focus:outline-none"
          style={{ color: 'var(--text-secondary)' }}
        >
          <span>
            Presets{activePresetId && (
              <span style={{ color: 'var(--text-muted)' }}> ({presets.find(p => p.id === activePresetId)?.name})</span>
            )}
          </span>
          <span>{presetsOpen ? '▲' : '▼'}</span>
        </button>

        {presetsOpen && (
          <div className="flex flex-col gap-2 mt-1">
            <div className="grid grid-cols-3 gap-1 overflow-y-auto" style={{ maxHeight: '40vh' }}>

              {/* Create Preset tile */}
              <div
                onClick={onCreatePreset}
                style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
                className="aspect-square rounded border border-dashed cursor-pointer transition flex flex-col items-center justify-center gap-0.5 hover:border-indigo-400 hover:text-indigo-500 hover:bg-[var(--bg-elevated)]"
              >
                <span className="text-lg leading-none">+</span>
                <span className="text-[10px] font-medium leading-tight text-center px-1">Create Preset</span>
              </div>

              {/* None tile */}
              <div
                onClick={() => onSelectPreset(null)}
                style={{
                  background:  !activePresetId ? 'var(--bg-elevated)' : 'var(--bg-base)',
                  borderColor: !activePresetId ? '#6366f1' : 'var(--border)',
                  color:       !activePresetId ? 'var(--text-primary)' : 'var(--text-muted)',
                }}
                className="aspect-square rounded border cursor-pointer transition flex flex-col items-center justify-center gap-0.5 hover:border-indigo-400 hover:bg-[var(--bg-elevated)]"
              >
                <span className="text-xs font-medium leading-tight text-center px-1">None</span>
              </div>

              {presets.map((p) => (
                <div
                  key={p.id}
                  onClick={() => onSelectPreset(p.id)}
                  style={{
                    background:  activePresetId === p.id ? 'var(--bg-elevated)' : 'var(--bg-base)',
                    borderColor: activePresetId === p.id ? '#6366f1' : 'var(--border)',
                    color: 'var(--text-primary)',
                  }}
                  className="aspect-square rounded border cursor-pointer transition flex flex-col items-center justify-center gap-0.5 relative group hover:border-indigo-400 hover:bg-[var(--bg-elevated)]"
                >
                  <span className="text-xs font-medium leading-tight text-center px-1 line-clamp-2">{p.name}</span>
                  <span style={{ color: 'var(--text-muted)' }} className="text-[10px] leading-tight">
                    {p.slots ? `${p.slots.length} blocks` : `${p.cols}×${p.rows}`}
                  </span>
                  {(p.paper || p.orientation) && (
                    <span style={{ color: 'var(--text-muted)' }} className="text-[9px] leading-tight text-center px-1">
                      {[
                        p.paper       ? PAPER_SIZES[p.paper]?.label : null,
                        p.orientation ? p.orientation[0].toUpperCase() + p.orientation.slice(1) : null,
                      ].filter(Boolean).join(' · ')}
                    </span>
                  )}

                  <div className="absolute top-0.5 right-0.5 hidden group-hover:flex gap-0.5">
                    {IS_LOCAL && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handlePublish(p) }}
                        className="text-[12px] px-2 py-1 hover:text-indigo-500 transition leading-none rounded border border-slate-200 bg-white/90 hover:bg-white shadow-sm hover:shadow-lg cursor-pointer"
                        style={{ color: 'var(--text-muted)' }}
                        title="Publish"
                      >↑</button>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); onEditPreset(p.id) }}
                      className="text-[12px] px-2 py-1 hover:text-slate-700 transition leading-none rounded border border-slate-200 bg-white/90 hover:bg-white shadow-sm hover:shadow-lg cursor-pointer"
                      style={{ color: 'var(--text-muted)' }}
                      title="Edit"
                    >✎</button>
                    <button
                      onClick={(e) => { e.stopPropagation(); onDeletePreset(p.id) }}
                      className="text-[12px] px-2 py-1 hover:text-rose-500 transition leading-none rounded border border-slate-200 bg-white/90 hover:bg-white shadow-sm hover:shadow-lg cursor-pointer"
                      style={{ color: 'var(--text-muted)' }}
                      title="Delete"
                    >✕</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <Divider />

      {/* Unit selector — shared across border, gap, and free size */}
      <div className="flex items-center justify-between text-xs">
        <span style={{ color: 'var(--text-secondary)' }}>Unit</span>
        <div className="flex rounded overflow-hidden border" style={{ borderColor: 'var(--border)' }}>
          {UNITS.map((u) => (
            <button
              key={u.value}
              onClick={() => setUnit(u.value)}
              className="px-2 py-1 text-xs transition"
              style={{
                background: unit === u.value ? '#6366f1' : 'var(--bg-elevated)',
                color:      unit === u.value ? 'white'   : 'var(--text-secondary)',
              }}
            >
              {u.label}
            </button>
          ))}
        </div>
      </div>

      <Divider />

      {/* Block style controls */}
      <div className="flex flex-col gap-3">
        <span style={{ color: 'var(--text-secondary)' }} className="text-xs">Border</span>

        <UnitInput
          label="Width"
          valuePx={blockStyle.borderWidth}
          minPx={0}
          maxPx={mmToPx(5)}
          unit={unit}
          onChange={(px) => onBlockStyle({ ...blockStyle, borderWidth: px })}
        />

        <div className="flex flex-col gap-1">
          <span style={{ color: 'var(--text-secondary)' }} className="text-xs">Color</span>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={blockStyle.borderColor}
              onChange={(e) => onBlockStyle({ ...blockStyle, borderColor: e.target.value })}
              className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent"
            />
            <input
              type="text"
              value={blockStyle.borderColor}
              onChange={(e) => onBlockStyle({ ...blockStyle, borderColor: e.target.value })}
              style={{ background: 'var(--bg-base)', color: 'var(--text-primary)', borderColor: 'var(--border)' }}
              className="flex-1 text-xs px-2 py-1 rounded border focus:outline-none"
            />
          </div>
        </div>

        <UnitInput
          label="Gap"
          valuePx={blockStyle.gap}
          minPx={0}
          maxPx={mmToPx(20)}
          unit={unit}
          onChange={(px) => onBlockStyle({ ...blockStyle, gap: px })}
        />
      </div>

      <Divider />

      <LabeledSelect label="Layout" value={template} onChange={(e) => onTemplate(e.target.value)}>
        {LAYOUTS.map((t) => (
          <option key={t} value={t}>{t}</option>
        ))}
      </LabeledSelect>

      {template === 'Grid' && (
        <div className="flex flex-col gap-3">
          <LabeledSelect
            label="Blocks"
            value={grid.mode === 'square' ? grid.slots : 'custom'}
            onChange={(e) => {
              const v = e.target.value
              if (v === 'custom') {
                onGrid({ ...grid, mode: 'custom' })
              } else {
                const n = Number(v)
                const side = Math.round(Math.sqrt(n))
                onGrid({ mode: 'square', slots: n, cols: side, rows: side })
              }
            }}
          >
            <option value="custom">Custom…</option>
            {GRID_OPTIONS.map((n) => (
              <option key={n} value={n}>{n} block{n !== 1 ? 's' : ''}</option>
            ))}
          </LabeledSelect>

          {grid.mode === 'custom' && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <div className="flex flex-col gap-1 flex-1">
                  <span style={{ color: 'var(--text-secondary)' }} className="text-xs">Columns</span>
                  <input
                    type="number" min={1} max={24} value={grid.cols}
                    onChange={(e) => onGrid({ ...grid, cols: Math.max(1, Number(e.target.value)) })}
                    style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)', borderColor: 'var(--border)' }}
                    className="w-full text-sm px-3 py-2 rounded border focus:outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1 flex-1">
                  <span style={{ color: 'var(--text-secondary)' }} className="text-xs">Rows</span>
                  <input
                    type="number" min={1} max={24} value={grid.rows}
                    onChange={(e) => onGrid({ ...grid, rows: Math.max(1, Number(e.target.value)) })}
                    style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)', borderColor: 'var(--border)' }}
                    className="w-full text-sm px-3 py-2 rounded border focus:outline-none"
                  />
                </div>
              </div>
              <span style={{ color: 'var(--text-muted)' }} className="text-xs text-center">
                {grid.cols} × {grid.rows} = {grid.cols * grid.rows} blocks
              </span>
            </div>
          )}
        </div>
      )}

      {template === 'Free Size' && (
        <>
          <Divider />
          <UnitInput
            label="Width"
            valuePx={blockSize.w}
            minPx={MIN_BLOCK_PX}
            maxPx={usable.w}
            unit={unit}
            onChange={(px) => onBlockSize({ ...blockSize, w: px })}
          />
          <UnitInput
            label="Height"
            valuePx={blockSize.h}
            minPx={MIN_BLOCK_PX}
            maxPx={usable.h}
            unit={unit}
            onChange={(px) => onBlockSize({ ...blockSize, h: px })}
          />
        </>
      )}
    </aside>
  )
}
