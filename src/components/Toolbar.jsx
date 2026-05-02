import { useState } from 'react'
import { GRID_OPTIONS, PAPER_SIZES, ORIENTATIONS, getUsable, mmToPx, pxToMm } from '../utils/layoutEngine'
import { IS_LOCAL } from '../utils/customLayouts'

const LAYOUTS = ['Grid', 'Free Size']
const MIN_PX = mmToPx(10)

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

function SizeSlider({ label, value, max, onChange }) {
  const minMm = parseFloat(pxToMm(MIN_PX))
  const maxMm = parseFloat(pxToMm(max))

  function handleTextChange(e) {
    const mm = parseFloat(e.target.value)
    if (isNaN(mm)) return
    onChange(mmToPx(Math.min(maxMm, Math.max(minMm, mm))))
  }

  return (
    <div className="flex flex-col gap-1 w-full">
      <div className="flex justify-between items-center text-xs">
        <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
        <div className="flex items-center gap-1">
          <input
            type="number"
            min={minMm}
            max={maxMm}
            step={0.1}
            value={pxToMm(value)}
            onChange={handleTextChange}
            style={{ background: 'var(--bg-base)', color: 'var(--text-primary)', borderColor: 'var(--border)' }}
            className="w-16 text-xs px-2 py-1 rounded border focus:outline-none text-right"
          />
          <span style={{ color: 'var(--text-muted)' }}>mm</span>
        </div>
      </div>
      <input
        type="range"
        min={MIN_PX}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-indigo-500 cursor-pointer"
      />
      <div className="flex justify-between text-xs" style={{ color: 'var(--text-muted)' }}>
        <span>{pxToMm(MIN_PX)} mm</span>
        <span>{pxToMm(max)} mm</span>
      </div>
    </div>
  )
}

export default function Toolbar({ paper, onPaper, orientation, onOrientation, template, onTemplate, grid, onGrid, blockSize, onBlockSize, blockStyle, onBlockStyle, customLayouts, activeLayoutId, onSelectLayout, onCreateLayout, onEditLayout, onDeleteLayout, disabled = false }) {
  const usable = getUsable(paper, orientation)
  const [presetsOpen, setPresetsOpen] = useState(false)

  function handleCreate() {
    onCreateLayout()
  }

  function handlePublish(l) {
    const snippet = `  { id: '${l.id}', name: '${l.name}', cols: ${l.cols}, rows: ${l.rows} },`
    navigator.clipboard.writeText(snippet)
      .then(() => alert(`Copied to clipboard!\n\nPaste into SAMPLE_LAYOUTS in\nsrc/utils/customLayouts.js\n\n${snippet}`))
  }

  return (
    <aside style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
      className={`w-[20%] min-w-48 shrink-0 border-r flex flex-col gap-4 p-4 overflow-y-auto ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>

      {/* Presets — collapsible, drives all controls below */}
      <div className="flex flex-col gap-1">
        <button
          onClick={() => setPresetsOpen((o) => !o)}
          className="flex items-center justify-between w-full text-xs focus:outline-none"
          style={{ color: 'var(--text-secondary)' }}
        >
          <span>Presets {activeLayoutId && <span style={{ color: 'var(--text-muted)' }}>({customLayouts.find(l => l.id === activeLayoutId)?.name})</span>}</span>
          <span>{presetsOpen ? '▲' : '▼'}</span>
        </button>

        {presetsOpen && (
          <div className="flex flex-col gap-2 mt-1">
            {/* Scrollable tile grid */}
            <div className="grid grid-cols-3 gap-1 overflow-y-auto" style={{ maxHeight: '200px' }}>

              {/* None tile */}
              <div
                onClick={() => onSelectLayout(null)}
                style={{
                  background: !activeLayoutId ? 'var(--bg-elevated)' : 'var(--bg-base)',
                  borderColor: !activeLayoutId ? '#6366f1' : 'var(--border)',
                  color: !activeLayoutId ? 'var(--text-primary)' : 'var(--text-muted)',
                }}
                className="aspect-square rounded border cursor-pointer transition flex flex-col items-center justify-center gap-0.5 hover:border-indigo-400 hover:bg-[var(--bg-elevated)]"
              >
                <span className="text-xs font-medium leading-tight text-center px-1">None</span>
              </div>

              {customLayouts.map((l) => (
                <div
                  key={l.id}
                  onClick={() => onSelectLayout(l.id)}
                  style={{
                    background: activeLayoutId === l.id ? 'var(--bg-elevated)' : 'var(--bg-base)',
                    borderColor: activeLayoutId === l.id ? '#6366f1' : 'var(--border)',
                    color: 'var(--text-primary)',
                  }}
                  className="aspect-square rounded border cursor-pointer transition flex flex-col items-center justify-center gap-0.5 relative group hover:border-indigo-400 hover:bg-[var(--bg-elevated)]"
                >
                  <span className="text-xs font-medium leading-tight text-center px-1 line-clamp-2">{l.name}</span>
                  <span style={{ color: 'var(--text-muted)' }} className="text-[10px] leading-tight">
                    {l.slots ? `${l.slots.length} blocks` : `${l.cols}×${l.rows}`}
                  </span>

                  {/* Action buttons — visible on hover */}
                  <div className="absolute top-0.5 right-0.5 hidden group-hover:flex gap-0.5">
                    {IS_LOCAL && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handlePublish(l) }}
                        className="text-[12px] px-2 py-1 hover:text-indigo-500 transition leading-none rounded border border-slate-200 bg-white/90 hover:bg-white shadow-sm hover:shadow-lg cursor-pointer"
                        style={{ color: 'var(--text-muted)' }}
                        title="Publish"
                      >↑</button>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); onEditLayout(l.id) }}
                      className="text-[12px] px-2 py-1 hover:text-slate-700 transition leading-none rounded border border-slate-200 bg-white/90 hover:bg-white shadow-sm hover:shadow-lg cursor-pointer"
                      style={{ color: 'var(--text-muted)' }}
                      title="Edit"
                    >✎</button>
                    <button
                      onClick={(e) => { e.stopPropagation(); onDeleteLayout(l.id) }}
                      className="text-[12px] px-2 py-1 hover:text-rose-500 transition leading-none rounded border border-slate-200 bg-white/90 hover:bg-white shadow-sm hover:shadow-lg cursor-pointer"
                      style={{ color: 'var(--text-muted)' }}
                      title="Delete"
                    >✕</button>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={handleCreate}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium py-1.5 rounded transition"
            >
              + Create Layout
            </button>
          </div>
        )}
      </div>

      <Divider />

      <LabeledSelect label="Paper" value={paper} onChange={(e) => onPaper(e.target.value)}>
        {Object.keys(PAPER_SIZES).map((key) => (
          <option key={key} value={key}>{PAPER_SIZES[key].label}</option>
        ))}
      </LabeledSelect>

      <LabeledSelect label="Orientation" value={orientation} onChange={(e) => onOrientation(e.target.value)}>
        {ORIENTATIONS.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </LabeledSelect>

      <Divider />

      {/* Block style controls */}
      <div className="flex flex-col gap-3">
        <span style={{ color: 'var(--text-secondary)' }} className="text-xs">Border</span>

        <div className="flex flex-col gap-1">
          <div className="flex justify-between items-center text-xs">
            <span style={{ color: 'var(--text-secondary)' }}>Width</span>
            <div className="flex items-center gap-1">
              <input
                type="number"
                min={0}
                max={20}
                value={blockStyle.borderWidth}
                onChange={(e) => onBlockStyle({ ...blockStyle, borderWidth: Math.max(0, Number(e.target.value)) })}
                style={{ background: 'var(--bg-base)', color: 'var(--text-primary)', borderColor: 'var(--border)' }}
                className="w-14 text-xs px-2 py-1 rounded border focus:outline-none text-right"
              />
              <span style={{ color: 'var(--text-muted)' }}>px</span>
            </div>
          </div>
          <input
            type="range" min={0} max={20} value={blockStyle.borderWidth}
            onChange={(e) => onBlockStyle({ ...blockStyle, borderWidth: Number(e.target.value) })}
            className="w-full accent-indigo-500 cursor-pointer"
          />
        </div>

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

        <div className="flex flex-col gap-1">
          <div className="flex justify-between items-center text-xs">
            <span style={{ color: 'var(--text-secondary)' }}>Gap</span>
            <div className="flex items-center gap-1">
              <input
                type="number"
                min={0}
                max={200}
                value={blockStyle.gap}
                onChange={(e) => onBlockStyle({ ...blockStyle, gap: Math.max(0, Number(e.target.value)) })}
                style={{ background: 'var(--bg-base)', color: 'var(--text-primary)', borderColor: 'var(--border)' }}
                className="w-14 text-xs px-2 py-1 rounded border focus:outline-none text-right"
              />
              <span style={{ color: 'var(--text-muted)' }}>px</span>
            </div>
          </div>
          <input
            type="range" min={0} max={200} value={blockStyle.gap}
            onChange={(e) => onBlockStyle({ ...blockStyle, gap: Number(e.target.value) })}
            className="w-full accent-indigo-500 cursor-pointer"
          />
        </div>
      </div>

      <Divider />

      <LabeledSelect label="Layout" value={template} onChange={(e) => onTemplate(e.target.value)}>
        {LAYOUTS.map((t) => (
          <option key={t} value={t}>{t}</option>
        ))}
      </LabeledSelect>

      {template === 'Grid' && (
        <div className="flex flex-col gap-3">
          {/* Square presets dropdown */}
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

          {/* Custom cols × rows inputs */}
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
          <SizeSlider label="Width"  value={blockSize.w} max={usable.w} onChange={(v) => onBlockSize({ ...blockSize, w: v })} />
          <SizeSlider label="Height" value={blockSize.h} max={usable.h} onChange={(v) => onBlockSize({ ...blockSize, h: v })} />
        </>
      )}
    </aside>
  )
}
