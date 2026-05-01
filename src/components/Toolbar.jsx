import { GRID_OPTIONS, PAPER_SIZES, ORIENTATIONS, getUsable, mmToPx, pxToMm } from '../utils/layoutEngine'

const LAYOUTS = ['Grid', 'Free Size']
const MIN_PX = mmToPx(10)

const selectCls = "w-full bg-[#2a2a3e] text-white text-sm px-3 py-2 rounded border border-gray-600 focus:outline-none cursor-pointer"

function LabeledSelect({ label, value, onChange, children }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-gray-400 uppercase tracking-wider">{label}</span>
      <select value={value} onChange={onChange} className={selectCls}>
        {children}
      </select>
    </div>
  )
}

function Divider() {
  return <div className="border-t border-gray-700" />
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
      <div className="flex justify-between items-center text-xs text-gray-400">
        <span className="uppercase tracking-wider">{label}</span>
        <div className="flex items-center gap-1">
          <input
            type="number"
            min={minMm}
            max={maxMm}
            step={0.1}
            value={pxToMm(value)}
            onChange={handleTextChange}
            className="w-16 bg-[#1a1a2e] text-white text-xs px-2 py-1 rounded border border-gray-600 focus:outline-none text-right"
          />
          <span className="text-gray-500">mm</span>
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
      <div className="flex justify-between text-xs text-gray-600">
        <span>{pxToMm(MIN_PX)} mm</span>
        <span>{pxToMm(max)} mm</span>
      </div>
    </div>
  )
}

export default function Toolbar({ paper, onPaper, orientation, onOrientation, template, onTemplate, grid, onGrid, slotSize, onSlotSize }) {
  const usable = getUsable(paper, orientation)

  return (
    <aside className="w-[20%] min-w-48 shrink-0 bg-[#1e1e35] border-r border-gray-700 flex flex-col gap-4 p-4 overflow-y-auto">
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
