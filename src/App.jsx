import { useState, useRef, useCallback } from 'react'
import './index.css'
import MenuBar from './components/MenuBar'
import Toolbar from './components/Toolbar'
import CanvasEditor from './components/CanvasEditor'
import PresetBuilder from './components/PresetBuilder'
import ImagePanel from './components/ImagePanel'
import { mmToPx, PAPER_SIZES, getPaperDims } from './utils/layoutEngine'
import { loadPresets, createPreset, updatePreset, deletePreset } from './utils/presets'
import { usePersistedState } from './utils/usePersistedState'

function makePageId() { return `page-${Date.now()}-${Math.random().toString(36).slice(2, 7)}` }

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
  const [selectedCount, setSelectedCount]   = useState(0)
  const [activePageHasImages, setActivePageHasImages] = useState(false)

  // Multi-page state
  const initialPageId = useRef(makePageId())
  const [pages, setPages]           = useState([{ id: initialPageId.current }])
  const [activePageId, setActivePageId] = useState(initialPageId.current)

  // One ref per page, keyed by page id
  const editorRefs = useRef({})
  const getEditorRef = useCallback((id) => {
    if (!editorRefs.current[id]) editorRefs.current[id] = { current: null }
    return editorRefs.current[id]
  }, [])

  // Active editor ref shorthand
  const activeRef = () => editorRefs.current[activePageId]

  // User preferences — persisted across visits
  const [theme, setTheme]             = usePersistedState('lk_theme', 'light')
  const [presets, setPresets]         = usePersistedState('lk_presets', loadPresets())

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

  function handleRemoveImage(index) {
    setImages((prev) => prev.filter((_, i) => i !== index))
  }

  function handleAddPage() {
    const id = makePageId()
    setPages((prev) => [...prev, { id }])
    setActivePageId(id)
    setActivePageHasImages(false)
    setSelectedCount(0)
  }

  function handleRemovePage(id) {
    setPages((prev) => {
      if (prev.length === 1) return prev
      const next = prev.filter((p) => p.id !== id)
      if (activePageId === id) {
        const removedIndex = prev.findIndex((p) => p.id === id)
        setActivePageId(next[Math.min(removedIndex, next.length - 1)].id)
      }
      // Clean up the ref
      delete editorRefs.current[id]
      return next
    })
  }

  const { width, height } = getPaperDims(paper, orientation)

  // Export helpers — passed to MenuBar
  const exportRef = {
    current: {
      stageRef: activeRef()?.current?.stageRef,
      // For PDF export we need all stage refs in order
      allStageRefs: pages.map((p) => editorRefs.current[p.id]?.current?.stageRef),
    }
  }

  return (
    <div className={`${theme} h-screen flex flex-col overflow-hidden`} style={{ background: 'var(--bg-base)' }}>
      <MenuBar
        editorRef={exportRef}
        pages={pages}
        editorRefs={editorRefs}
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
                  onClick={() => { activeRef()?.current?.clearAll(); setFillMode('none'); setSelectedCount(0) }}
                  disabled={!activePageHasImages}
                  style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)', borderColor: 'var(--border)' }}
                  className="text-xs px-3 py-1.5 rounded border transition hover:opacity-80 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Clear Page
                </button>
                <button
                  disabled={selectedCount === 0}
                  onClick={() => { activeRef()?.current?.clearSelected(); setSelectedCount(0) }}
                  style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)', borderColor: 'var(--border)' }}
                  className="text-xs px-3 py-1.5 rounded border transition hover:opacity-80 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Clear
                </button>
                <button
                  onClick={() => activeRef()?.current?.shuffle()}
                  style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)', borderColor: 'var(--border)' }}
                  className="text-xs px-3 py-1.5 rounded border transition hover:opacity-80"
                >
                  Shuffle
                </button>
                <button
                  onClick={handleAddPage}
                  style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)', borderColor: 'var(--border)' }}
                  className="text-xs px-3 py-1.5 rounded border transition hover:opacity-80 ml-auto"
                >
                  + Add Page
                </button>
              </div>

              {/* Pages */}
              <div className="flex flex-col gap-8 w-full max-w-2xl">
                {pages.map((page, index) => {
                  // Compute how many images preceding pages consume for fill offset
                  const imageOffset = pages.slice(0, index).reduce((sum, p) => {
                    return sum + (editorRefs.current[p.id]?.current?.getBlockCount?.() ?? 0)
                  }, 0)

                  return (
                  <div key={page.id} className="flex flex-col gap-2">
                    {/* Page tab */}
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => {
                          setActivePageId(page.id)
                          setSelectedCount(0)
                          setActivePageHasImages(editorRefs.current[page.id]?.current?.hasImages?.() ?? false)
                        }}
                        className="flex items-center gap-2 text-xs font-medium px-2 py-1 rounded transition"
                        style={{
                          color: activePageId === page.id ? '#6366f1' : 'var(--text-muted)',
                          background: activePageId === page.id ? 'rgba(99,102,241,0.08)' : 'transparent',
                        }}
                      >
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ background: activePageId === page.id ? '#6366f1' : 'var(--border)' }}
                        />
                        Page {index + 1}
                      </button>
                      {pages.length > 1 && (
                        <button
                          onClick={() => handleRemovePage(page.id)}
                          title="Remove page"
                          style={{ color: 'var(--text-muted)' }}
                          className="text-xs w-5 h-5 flex items-center justify-center rounded hover:text-rose-500 transition"
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    {/* Canvas */}
                    <div
                      className="shadow-2xl"
                      style={{ outline: activePageId === page.id ? '2px solid #6366f1' : '2px solid transparent', borderRadius: 2 }}
                      onClick={() => setActivePageId(page.id)}
                    >
                      <CanvasEditor
                        ref={getEditorRef(page.id)}
                        images={images}
                        fillMode={fillMode}
                        imageOffset={imageOffset}
                        paper={paper}
                        orientation={orientation}
                        template={template}
                        grid={grid}
                        blockSize={blockSize}
                        blockStyle={blockStyle}
                        presets={presets}
                        activePresetId={activePresetId}
                        onSelectionChange={(count) => {
                          if (page.id === activePageId) setSelectedCount(count)
                        }}
                        onImagesChange={(has) => {
                          if (page.id === activePageId) setActivePageHasImages(has)
                        }}
                      />
                    </div>
                    <p className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>
                      {`${width} × ${height} px — ${PAPER_SIZES[paper].label} ${orientation} @ 300 DPI`}
                    </p>
                  </div>
                  )
                })}
              </div>
            </>
          )}
        </main>

        <ImagePanel images={images} onRemove={handleRemoveImage} onFiles={handleFiles} disabled={buildingPreset} />
      </div>
    </div>
  )
}
