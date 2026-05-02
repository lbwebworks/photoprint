import { useState, useRef } from 'react'
import './index.css'
import MenuBar from './components/MenuBar'
import Toolbar from './components/Toolbar'
import CanvasEditor from './components/CanvasEditor'
import LayoutBuilder from './components/LayoutBuilder'
import ImagePanel from './components/ImagePanel'
import { mmToPx, PAPER_SIZES, getPaperDims } from './utils/layoutEngine'
import { loadLayouts, createLayout, updateLayout, deleteLayout } from './utils/customLayouts'
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
  const [activeLayoutId, setActiveLayoutId] = useState(null)
  const [buildingLayout, setBuildingLayout] = useState(false)
  const [editingLayout, setEditingLayout] = useState(null)

  // User preferences — persisted across visits
  const [theme, setTheme]               = usePersistedState('lk_theme', 'light')
  const [customLayouts, setCustomLayouts] = usePersistedState('lk_custom_layouts', loadLayouts())

  const editorRef = useRef(null)

  // Smart setters — changing paper/orientation/blockStyle deselects active preset
  function handlePaper(v)       { setPaper(v);       setActiveLayoutId(null) }
  function handleOrientation(v) { setOrientation(v); setActiveLayoutId(null) }
  function handleBlockStyle(v)  { setBlockStyle(v);  setActiveLayoutId(null) }

  // Selecting a preset applies its saved settings and switches template
  function handleSelectLayout(id) {
    if (!id) { setActiveLayoutId(null); setTemplate('Grid'); return }
    const layout = customLayouts.find((l) => l.id === id)
    if (!layout) return
    setActiveLayoutId(id)
    setTemplate('Preset')
    if (layout.paper)       setPaper(layout.paper)
    if (layout.orientation) setOrientation(layout.orientation)
    setBlockStyle({
      borderWidth: layout.borderWidth ?? 0,
      borderColor: layout.borderColor ?? '#000000',
      gap:         layout.gap         ?? 0,
    })
  }

  function handleCreateLayout() {
    setEditingLayout(null)
    setBuildingLayout(true)
  }

  function handleSaveLayout(layout) {
    setCustomLayouts((prev) => {
      const next = layout.id ? updateLayout(prev, layout) : createLayout(prev, layout)
      setActiveLayoutId(layout.id ? layout.id : next[next.length - 1].id)
      return next
    })
    setTemplate('Preset')
    setBuildingLayout(false)
    setEditingLayout(null)
  }

  function handleDeleteLayout(id) {
    setCustomLayouts((prev) => {
      const next = deleteLayout(prev, id)
      if (activeLayoutId === id) setActiveLayoutId(next[0]?.id ?? null)
      return next
    })
  }

  function handleEditLayout(id) {
    const layout = customLayouts.find((l) => l.id === id)
    if (!layout) return
    setEditingLayout(layout)
    setActiveLayoutId(id)
    setTemplate('Preset')
    if (layout.paper) setPaper(layout.paper)
    if (layout.orientation) setOrientation(layout.orientation)
    setBlockStyle({
      borderWidth: layout.borderWidth ?? 0,
      borderColor: layout.borderColor ?? '#000000',
      gap: layout.gap ?? 0,
    })
    setBuildingLayout(true)
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
        disabled={buildingLayout}
      />

      <div className="flex flex-1 overflow-hidden">
        <Toolbar
          paper={paper} onPaper={handlePaper}
          orientation={orientation} onOrientation={handleOrientation}
          template={template} onTemplate={setTemplate}
          grid={grid} onGrid={setGrid}
          blockSize={blockSize} onBlockSize={setBlockSize}
          blockStyle={blockStyle} onBlockStyle={handleBlockStyle}
          customLayouts={customLayouts}
          activeLayoutId={activeLayoutId}
          onSelectLayout={handleSelectLayout}
          onCreateLayout={handleCreateLayout}
          onEditLayout={handleEditLayout}
          onDeleteLayout={handleDeleteLayout}
          disabled={buildingLayout}
        />

        <main className="flex-1 overflow-y-auto flex flex-col items-center p-6">
          {buildingLayout ? (
            <LayoutBuilder
              paper={paper}
              orientation={orientation}
              borderWidth={blockStyle.borderWidth}
              borderColor={blockStyle.borderColor}
              gap={blockStyle.gap}
              initialLayout={editingLayout}
              onSave={handleSaveLayout}
              onCancel={() => { setBuildingLayout(false); setEditingLayout(null) }}
            />
          ) : (
            <>
              <div className="w-full max-w-2xl shadow-2xl">
                <CanvasEditor
                  ref={editorRef}
                  images={images}
                  paper={paper}
                  orientation={orientation}
                  template={template}
                  grid={grid}
                  blockSize={blockSize}
                  blockStyle={blockStyle}
                  customLayouts={customLayouts}
                  activeLayoutId={activeLayoutId}
                />
              </div>
              <p className="mt-4 text-xs" style={{ color: 'var(--text-muted)' }}>
                {`${width} × ${height} px — ${PAPER_SIZES[paper].label} ${orientation} @ 300 DPI`}
              </p>
            </>
          )}
        </main>

        <ImagePanel images={images} onRemove={handleRemove} onFiles={handleFiles} disabled={buildingLayout} />
      </div>
    </div>
  )
}
