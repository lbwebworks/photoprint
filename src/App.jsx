import { useState, useRef } from 'react'
import './index.css'
import MenuBar from './components/MenuBar'
import Toolbar from './components/Toolbar'
import CanvasEditor from './components/CanvasEditor'
import PresetBuilder from './components/PresetBuilder'
import ImagePanel from './components/ImagePanel'
import { mmToPx, PAPER_SIZES, getPaperDims } from './utils/layoutEngine'
import { loadPresets, createPreset, updatePreset, deletePreset } from './utils/presets'
import { usePersistedState } from './utils/usePersistedState'

export default function App() {
  // Session settings — reset on every visit
  const [images, setImages]             = useState([])
  const [paper, setPaper]               = useState('A4')
  const [orientation, setOrientation]   = useState('portrait')
  const [template, setTemplate]         = useState('Grid')
  const [grid, setGrid]                 = useState({ mode: 'square', slots: 16, cols: 4, rows: 4 })
  const [blockSize, setBlockSize]       = useState({ w: mmToPx(35), h: mmToPx(45) })
  const [blockStyle, setBlockStyle]     = useState({ borderWidth: 0, borderColor: '#000000', gap: 0 })
  const [activePresetId, setActivePresetId] = useState(null)
  const [buildingPreset, setBuildingPreset] = useState(false)
  const [editingPreset, setEditingPreset]   = useState(null)
  const [fillMode, setFillMode]             = useState('none')

  // User preferences — persisted across visits
  const [theme, setTheme]             = usePersistedState('lk_theme', 'light')
  const [presets, setPresets]         = usePersistedState('lk_presets', loadPresets())

  const editorRef = useRef(null)

  // Smart setters — changing paper/orientation/blockStyle deselects active preset
  function handlePaper(v)       { setPaper(v);       setActivePresetId(null) }
  function handleOrientation(v) { setOrientation(v); setActivePresetId(null) }
  function handleBlockStyle(v)  { setBlockStyle(v);  setActivePresetId(null) }

  // Selecting a preset applies its saved settings and switches template
  function handleSelectPreset(id) {
    if (!id) { setActivePresetId(null); setTemplate('Grid'); return }
    const preset = presets.find((p) => p.id === id)
    if (!preset) return
    setActivePresetId(id)
    setTemplate('Preset')
    if (preset.paper)       setPaper(preset.paper)
    if (preset.orientation) setOrientation(preset.orientation)
    setBlockStyle({
      borderWidth: preset.borderWidth ?? 0,
      borderColor: preset.borderColor ?? '#000000',
      gap:         preset.gap         ?? 0,
    })
  }

  function handleCreatePreset() {
    setEditingPreset(null)
    setBuildingPreset(true)
  }

  function handleSavePreset(preset) {
    setPresets((prev) => {
      const next = preset.id ? updatePreset(prev, preset) : createPreset(prev, preset)
      setActivePresetId(preset.id ? preset.id : next[next.length - 1].id)
      return next
    })
    setTemplate('Preset')
    setBuildingPreset(false)
    setEditingPreset(null)
  }

  function handleDeletePreset(id) {
    setPresets((prev) => {
      const next = deletePreset(prev, id)
      if (activePresetId === id) setActivePresetId(next[0]?.id ?? null)
      return next
    })
  }

  function handleEditPreset(id) {
    const preset = presets.find((p) => p.id === id)
    if (!preset) return
    setEditingPreset(preset)
    setActivePresetId(id)
    setTemplate('Preset')
    if (preset.paper)       setPaper(preset.paper)
    if (preset.orientation) setOrientation(preset.orientation)
    setBlockStyle({
      borderWidth: preset.borderWidth ?? 0,
      borderColor: preset.borderColor ?? '#000000',
      gap:         preset.gap         ?? 0,
    })
    setBuildingPreset(true)
  }

  function handleFiles(e) {
    const urls = Array.from(e.target.files).map((f) => URL.createObjectURL(f))
    setImages((prev) => [...prev, ...urls])
  }

  function handleRemove(index) {
    setImages((prev) => prev.filter((_, i) => i !== index))
  }

  const { width, height } = getPaperDims(paper, orientation)

  return (
    <div className={`${theme} h-screen flex flex-col overflow-hidden`} style={{ background: 'var(--bg-base)' }}>
      <MenuBar
        editorRef={editorRef}
        paper={paper}
        orientation={orientation}
        theme={theme}
        onTheme={setTheme}
        disabled={buildingPreset}
      />

      <div className="flex flex-1 overflow-hidden">
        <Toolbar
          paper={paper} onPaper={handlePaper}
          orientation={orientation} onOrientation={handleOrientation}
          template={template} onTemplate={setTemplate}
          grid={grid} onGrid={setGrid}
          blockSize={blockSize} onBlockSize={setBlockSize}
          blockStyle={blockStyle} onBlockStyle={handleBlockStyle}
          presets={presets}
          activePresetId={activePresetId}
          onSelectPreset={handleSelectPreset}
          onCreatePreset={handleCreatePreset}
          onEditPreset={handleEditPreset}
          onDeletePreset={handleDeletePreset}
          disabled={buildingPreset}
        />

        <main className="flex-1 overflow-y-auto flex flex-col items-center p-6">
          {buildingPreset ? (
            <PresetBuilder
              paper={paper}
              orientation={orientation}
              borderWidth={blockStyle.borderWidth}
              borderColor={blockStyle.borderColor}
              gap={blockStyle.gap}
              initialPreset={editingPreset}
              onSave={handleSavePreset}
              onCancel={() => { setBuildingPreset(false); setEditingPreset(null) }}
            />
          ) : (
            <>
              {/* Print mode settings bar */}
              <div className="flex items-center gap-3 w-full max-w-2xl mb-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <span style={{ color: 'var(--text-secondary)' }} className="text-xs whitespace-nowrap">Fill Mode</span>
                  <select
                    value={fillMode}
                    onChange={(e) => setFillMode(e.target.value)}
                    style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)', borderColor: 'var(--border)' }}
                    className="text-xs px-2 py-1.5 rounded border focus:outline-none cursor-pointer"
                  >
                    <option value="none">None</option>
                    <option value="autofill">Auto Fill</option>
                    <option value="autofill-all">Auto Fill All</option>
                  </select>
                </div>
                <button
                  onClick={() => { editorRef.current?.clearAll(); setFillMode('none') }}
                  style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)', borderColor: 'var(--border)' }}
                  className="text-xs px-3 py-1.5 rounded border transition hover:opacity-80"
                >
                  Clear All
                </button>
                <button
                  onClick={() => editorRef.current?.shuffle()}
                  style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)', borderColor: 'var(--border)' }}
                  className="text-xs px-3 py-1.5 rounded border transition hover:opacity-80"
                >
                  Shuffle
                </button>
              </div>

              <div className="w-full max-w-2xl shadow-2xl">
                <CanvasEditor
                  ref={editorRef}
                  images={images}
                  fillMode={fillMode}
                  paper={paper}
                  orientation={orientation}
                  template={template}
                  grid={grid}
                  blockSize={blockSize}
                  blockStyle={blockStyle}
                  presets={presets}
                  activePresetId={activePresetId}
                />
              </div>
              <p className="mt-4 text-xs" style={{ color: 'var(--text-muted)' }}>
                {`${width} × ${height} px — ${PAPER_SIZES[paper].label} ${orientation} @ 300 DPI`}
              </p>
            </>
          )}
        </main>

        <ImagePanel images={images} onRemove={handleRemove} onFiles={handleFiles} disabled={buildingPreset} />
      </div>
    </div>
  )
}
