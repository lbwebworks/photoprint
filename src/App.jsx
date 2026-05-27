import { useState, useRef, useCallback, useMemo } from 'react'
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

const DEFAULT_PAGE_CONFIG = {
  template:       'Preset',
  customTemplate: 'Grid',  // last-used template in Custom tab
  grid:           { mode: 'square', slots: 16, cols: 4, rows: 4 },
  blockSize:      { w: mmToPx(35), h: mmToPx(45) },
  blockStyle:     { borderWidth: 0, borderColor: '#000000', gap: 0 },
  activePresetId: null,
  rotatedSlots:   null,
}

function makePage(config = {}) {
  return { id: makePageId(), ...DEFAULT_PAGE_CONFIG, ...config }
}

function mergePresets(basePresets, storedPresets) {
  const existingIds = new Set(basePresets.map((preset) => preset.id))
  const extras = Array.isArray(storedPresets)
    ? storedPresets.filter((preset) => preset && preset.id && !existingIds.has(preset.id))
    : []
  return [...basePresets, ...extras]
}

function getInitialPresets() {
  const basePresets = loadPresets()
  try {
    const stored = localStorage.getItem('lk_presets')
    if (!stored) return basePresets
    const parsed = JSON.parse(stored)
    return mergePresets(basePresets, parsed)
  } catch {
    return basePresets
  }
}

export default function App() {
  const [paper, setPaper]               = useState('A4')
  const [orientation, setOrientation]   = useState('portrait')
  const [images, setImages]             = useState([])
  const [buildingPreset, setBuildingPreset] = useState(false)
  const [editingPreset, setEditingPreset]   = useState(null)
  const [fillMode, setFillMode]             = useState('none')
  const [activePageHasImages, setActivePageHasImages] = useState(false)
  const [lastPresetId, setLastPresetId] = useState(null)

  // Multi-page state — each page carries its own layout config
  const firstPage = useRef(makePage())
  const [pages, setPages]               = useState([firstPage.current])
  const [activePageId, setActivePageId] = useState(firstPage.current.id)

  const editorRefs = useRef({})
  const getEditorRef = useCallback((id) => {
    if (!editorRefs.current[id]) editorRefs.current[id] = { current: null }
    return editorRefs.current[id]
  }, [])

  const activeRef = () => editorRefs.current[activePageId]

  const [theme, setTheme]     = usePersistedState('lk_theme', 'light')
  const [presets, setPresets] = usePersistedState('lk_presets', useMemo(getInitialPresets, []))

  const activePage = pages.find((p) => p.id === activePageId) ?? pages[0]
  const multiPage  = pages.length > 1

  function updateActivePage(patch) {
    setPages((prev) => prev.map((p) => p.id === activePageId ? { ...p, ...patch } : p))
  }

  // Start New — prompt then reset pages only, keep images
  function handleStartNew() {
    const hasContent = pages.some((p) =>
      editorRefs.current[p.id]?.current?.hasImages?.()
    )
    if (hasContent && !window.confirm('Start new? This will clear all pages. Your image library will be kept.')) return
    setPaper(null)
    setOrientation(null)
    setPages([])
    setActivePageId(null)
    setActivePageHasImages(false)
    editorRefs.current = {}
  }

  function handleBlockStyle(v)  { updateActivePage({ blockStyle: v }) }
  function handleTemplate(v)    { updateActivePage({ template: v, customTemplate: v, rotatedSlots: null }) }
  function handleGrid(v)        { updateActivePage({ grid: v }) }
  function handleBlockSize(v)   { updateActivePage({ blockSize: v }) }

  // Called when user clicks the Custom tab — restores the last custom template
  function handleSwitchToCustom() {
    const ct = activePage?.customTemplate ?? 'Grid'
    updateActivePage({ template: ct, activePresetId: null })
  }

  function handleSelectPreset(id) {
    if (id) {
      setLastPresetId(id)
    }
    if (!id) { 
      setPaper("A4")
      setOrientation("portrait")
      updateActivePage({ activePresetId: null }); 
      
      return 
    }
    const preset = presets.find((p) => p.id === id)
    if (!preset) return

    // Apply preset's paper/orientation if set (no prompt — user can rotate freely)
    if (!multiPage) {
      if (preset.paper)       setPaper(preset.paper)
      if (preset.orientation) setOrientation(preset.orientation)
    }

    updateActivePage({
      activePresetId: id,
      template: 'Preset',
      rotatedSlots: null,
      blockStyle: {
        borderWidth: preset.borderWidth ?? 0,
        borderColor: preset.borderColor ?? '#000000',
        gap:         preset.gap         ?? 0,
      },
    })
  }

  function handleCreatePreset() {
    setEditingPreset(null)
    setBuildingPreset(true)
  }

  function handleSavePreset(preset) {
    setPresets((prev) => {
      const next = preset.id ? updatePreset(prev, preset) : createPreset(prev, preset)
      const savedId = preset.id ? preset.id : next[next.length - 1].id
      updateActivePage({ activePresetId: savedId, template: 'Preset', rotatedSlots: null })
      return next
    })
    setBuildingPreset(false)
    setEditingPreset(null)
  }

  function handleDeletePreset(id) {
    setPresets((prev) => {
      const next = deletePreset(prev, id)
      if (activePage?.activePresetId === id) updateActivePage({ activePresetId: next[0]?.id ?? null })
      return next
    })
  }

  function handleEditPreset(id) {
    const preset = presets.find((p) => p.id === id)
    if (!preset) return
    setEditingPreset(preset)
    updateActivePage({
      activePresetId: id,
      template: 'Preset',
      rotatedSlots: null,
      blockStyle: {
        borderWidth: preset.borderWidth ?? 0,
        borderColor: preset.borderColor ?? '#000000',
        gap:         preset.gap         ?? 0,
      },
    })
    setBuildingPreset(true)
  }

  function handleRotate() {
    const newOrientation = orientation === 'portrait' ? 'landscape' : 'portrait'
    const { width: oldW, height: oldH } = getPaperDims(paper, orientation)

    // 90° CW block transform on oldW×oldH paper
    function rotateBlock(b) {
      return { ...b, x: oldH - b.y - b.h, y: b.x, w: b.h, h: b.w }
    }

    // Snapshot current effective urls per page before anything changes
    const snapshots = pages.map((page) => ({
      id:       page.id,
      template: page.template,
      snap:     editorRefs.current[page.id]?.current?.getRotateSnapshot?.() ?? null,
    }))

    // For Preset pages with fixed slots, store rotated slot positions in page config
    setPages((prev) => prev.map((page) => {
      if (page.template !== 'Preset') return page
      const currentSlots = page.rotatedSlots
        ?? presets.find((p) => p.id === page.activePresetId)?.slots
        ?? null
      if (!currentSlots) return page  // grid-derived — recomputes automatically
      return { ...page, rotatedSlots: currentSlots.map(rotateBlock) }
    }))

    // Toggle orientation — triggers re-render with new paper dims + rotated slots
    setOrientation(newOrientation)

    // After re-render, remap block images using rotated block centers
    setTimeout(() => {
      snapshots.forEach(({ id, snap }) => {
        if (!snap || Object.keys(snap.urlMap).length === 0) return
        const editor = editorRefs.current[id]?.current
        if (!editor) return

        const { urlMap, blocks: oldBlocks } = snap
        const newSnap = editor.getRotateSnapshot?.()
        if (!newSnap) return
        const newBlocks = newSnap.blocks

        const newMap = {}
        oldBlocks.forEach((oldBlock) => {
          const url = urlMap[oldBlock.id]
          if (!url) return
          // Rotate this block's center 90° CW to find where it lands on the new paper
          const cx = oldBlock.x + oldBlock.w / 2
          const cy = oldBlock.y + oldBlock.h / 2
          const rotX = oldH - cy   // CW: newX = oldH - oldY
          const rotY = cx           // CW: newY = oldX
          const target = newBlocks.find((b) =>
            rotX >= b.x && rotX <= b.x + b.w &&
            rotY >= b.y && rotY <= b.y + b.h
          )
          if (target) newMap[target.id] = url
        })

        if (Object.keys(newMap).length > 0) editor.restoreBlockImages(newMap)
      })
    }, 50)
  }

  function handleFiles(e) {
    const urls = Array.from(e.target.files).map((f) => URL.createObjectURL(f))
    setImages((prev) => [...prev, ...urls])
  }

  function handleRemoveImage(index) {
    setImages((prev) => prev.filter((_, i) => i !== index))
  }

  function handleAddPage() {
    const newPage = makePage()
    setPages((prev) => [...prev, newPage])
    setActivePageId(newPage.id)
    setActivePageHasImages(false)
  }

  function handleRemovePage(id) {
    setPages((prev) => {
      if (prev.length === 1) return prev
      const next = prev.filter((p) => p.id !== id)
      if (activePageId === id) {
        const removedIndex = prev.findIndex((p) => p.id === id)
        setActivePageId(next[Math.min(removedIndex, next.length - 1)].id)
      }
      delete editorRefs.current[id]
      return next
    })
  }

  function handleEnterPresetMode() {
    if (activePage?.activePresetId) {
      handleSelectPreset(activePage.activePresetId)
    } else if (lastPresetId) {
      handleSelectPreset(lastPresetId)
    } else {
      handleSelectPreset(null)
    }
  }

  const dims = getPaperDims(paper, orientation)

  return (
    <div className={`${theme} h-screen flex flex-col overflow-hidden`} style={{ background: 'var(--bg-base)' }}>
      <MenuBar
        pages={pages}
        editorRefs={editorRefs}
        paper={paper}
        orientation={orientation}
        theme={theme}
        onTheme={setTheme}
        onStartNew={handleStartNew}
        disabled={buildingPreset}
      />

      <div className="flex flex-1 overflow-hidden">
        <Toolbar
          paper={paper}
          orientation={orientation}
          template={activePage?.template ?? DEFAULT_PAGE_CONFIG.template}
          onTemplate={handleTemplate}
          grid={activePage?.grid ?? DEFAULT_PAGE_CONFIG.grid}
          onGrid={handleGrid}
          blockSize={activePage?.blockSize ?? DEFAULT_PAGE_CONFIG.blockSize}
          onBlockSize={handleBlockSize}
          blockStyle={activePage?.blockStyle ?? DEFAULT_PAGE_CONFIG.blockStyle}
          onBlockStyle={handleBlockStyle}
          presets={presets}
          activePresetId={activePage?.activePresetId ?? null}
          onSelectPreset={handleSelectPreset}
          onCreatePreset={handleCreatePreset}
          onEditPreset={handleEditPreset}
          onDeletePreset={handleDeletePreset}
          onPaperChange={setPaper}
          onOrientationChange={setOrientation}
          onSwitchToCustom={handleSwitchToCustom}
          disabled={buildingPreset}
          onEnterPresetMode={handleEnterPresetMode}
        />

        <main className="flex-1 overflow-y-auto flex flex-col items-center p-6">
          {buildingPreset ? (
            <PresetBuilder
              borderWidth={activePage?.blockStyle.borderWidth ?? 0}
              borderColor={activePage?.blockStyle.borderColor ?? '#000000'}
              gap={activePage?.blockStyle.gap ?? 0}
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
                  onClick={() => {
                    // Clear All: wipe every page and reset fill mode
                    pages.forEach((p) => editorRefs.current[p.id]?.current?.clearAll())
                    setFillMode('none')
                    setActivePageHasImages(false)
                  }}
                  style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)', borderColor: 'var(--border)' }}
                  className="text-xs px-3 py-1.5 rounded border transition hover:opacity-80"
                >
                  Clear All
                </button>
                <button
                  disabled={!activePageHasImages}
                  onClick={() => {
                    // Clear Page: wipe only the active page
                    activeRef()?.current?.clearAll()
                  }}
                  style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)', borderColor: 'var(--border)' }}
                  className="text-xs px-3 py-1.5 rounded border transition hover:opacity-80 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Clear Page
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
                <button
                  onClick={handleRotate}
                  title="Rotate paper 90° clockwise"
                  style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)', borderColor: 'var(--border)' }}
                  className="text-xs px-3 py-1.5 rounded border transition hover:opacity-80"
                >
                  ↻ Rotate
                </button>
              </div>

              {/* Pages */}
              <div className="flex flex-col gap-8 w-full max-w-2xl">
                {pages.map((page, index) => {
                  const imageOffset = pages.slice(0, index).reduce((sum, p) => {
                    return sum + (editorRefs.current[p.id]?.current?.getBlockCount?.() ?? 0)
                  }, 0)

                  return (
                    <div key={page.id} className="flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <button
                          onClick={() => {
                            setActivePageId(page.id)
                            setActivePageHasImages(editorRefs.current[page.id]?.current?.hasImages?.() ?? false)
                          }}
                          className="flex items-center gap-2 text-xs font-medium px-2 py-1 rounded transition"
                          style={{
                            color: activePageId === page.id ? '#6366f1' : 'var(--text-muted)',
                            background: activePageId === page.id ? 'rgba(99,102,241,0.08)' : 'transparent',
                          }}
                        >
                          <span className="w-2 h-2 rounded-full" style={{ background: activePageId === page.id ? '#6366f1' : 'var(--border)' }} />
                          Page {index + 1}
                        </button>
                        {pages.length > 1 && (
                          <button
                            onClick={() => handleRemovePage(page.id)}
                            title="Remove page"
                            style={{ color: 'var(--text-muted)' }}
                            className="text-xs w-5 h-5 flex items-center justify-center rounded hover:text-rose-500 transition"
                          >✕</button>
                        )}
                      </div>

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
                          template={page.template}
                          grid={page.grid}
                          blockSize={page.blockSize}
                          blockStyle={page.blockStyle}
                          presets={presets}
                          activePresetId={page.activePresetId}
                          rotatedSlots={page.rotatedSlots ?? null}
                          onImagesChange={(has) => {
                            if (page.id === activePageId) setActivePageHasImages(has)
                          }}
                        />
                      </div>
                      <p className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>
                        {`${dims.width} × ${dims.height} px — ${PAPER_SIZES[paper].label} ${orientation} @ 300 DPI`}
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
