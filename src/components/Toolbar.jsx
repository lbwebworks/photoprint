import { GRID_OPTIONS, PAPER_SIZES, ORIENTATIONS, getUsable, mmToPx, pxToMm } from '../utils/layoutEngine'

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

export default function Toolbar({ paper, onPaper, orientation, onOrientation, template, onTemplate, grid, onGrid, slotSize, onSlotSize }) {
  const usable = getUsable(paper, orientation)

  return (
    <aside style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
      className="w-[20%] min-w-48 shrink-0 border-r flex flex-col gap-4 p-4 overflow-y-auto">

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

      <LabeledSelect label="Layout" value={template} onChange={(e) => onTemplate(e.target.value)}>
        {LAYOUTS.map((t) => (
          <option key={t} value={t}>{t}</option>
        ))}
      </LabeledSelect>

      {template === 'Grid' && (
        <LabeledSelect label="Slots" value={grid} onChange={(e) => onGrid(Number(e.target.value))}>
          {GRID_OPTIONS.map((n) => (
            <option key={n} value={n}>{n} slot{n !== 1 ? 's' : ''}</option>
          ))}
        </LabeledSelect>
      )}

      {template === 'Free Size' && (
        <>
          <Divider />
          <SizeSlider label="Width"  value={slotSize.w} max={usable.w} onChange={(v) => onSlotSize({ ...slotSize, w: v })} />
          <SizeSlider label="Height" value={slotSize.h} max={usable.h} onChange={(v) => onSlotSize({ ...slotSize, h: v })} />
        </>
      )}
    </aside>
  )
}
