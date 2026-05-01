import { useState, useRef } from 'react'
import './index.css'
import MenuBar from './components/MenuBar'
import Toolbar from './components/Toolbar'
import CanvasEditor from './components/CanvasEditor'
import LayoutBuilder from './components/LayoutBuilder'
import ImagePanel from './components/ImagePanel'
import { mmToPx, PAPER_SIZES, getPaperDims } from './utils/layoutEngine'
import { loadLayouts, createLayout, deleteLayout } from './utils/customLayouts'
import { usePersistedState } from './utils/usePersistedState'

export default function App() {
  // Session settings — reset on every visit
  const [images, setImages]             = useState([])
  const [paper, setPaper]               = useState('A4')
  const [orientation, setOrientation]   = useState('portrait')
  const [template, setTemplate]         = useState('Grid')
  const [grid, setGrid]                 = useState({ mode: 'square', slots: 16, cols: 4, rows: 4 })
  const [slotSize, setSlotSize]         = useState({ w: mmToPx(35), h: mmToPx(45) })
  const [slotStyle, setSlotStyle]       = useState({ borderWidth: 0, borderColor: '#000000', gap: 0 })
  const [activeLayoutId, setActiveLayoutId] = useState(null)
  const [buildingLayout, setBuildingLayout] = useState(false)

  // User preferences — persisted across visits
  const [theme, setTheme]               = usePersistedState('lk_theme', 'light')
  const [customLayouts, setCustomLayouts] = usePersistedState('lk_custom_layouts', loadLayouts())

  const editorRef = useRef(null)

  // Smart setters — changing paper/orientation/slotStyle deselects active custom layout
  function handlePaper(v)       { setPaper(v);       setActiveLayoutId(null) }
  function handleOrientation(v) { setOrientation(v); setActiveLayoutId(null) }
  function handleSlotStyle(v)   { setSlotStyle(v);   setActiveLayoutId(null) }

  // Selecting a custom layout applies its saved settings and switches template
  function handleSelectLayout(id) {
    if (!id) { setActiveLayoutId(null); setTemplate('Grid'); return }
    const layout = customLayouts.find((l) => l.id === id)
    if (!layout) return
    setActiveLayoutId(id)
    setTemplate('Custom Layout')
    if (layout.paper)       setPaper(layout.paper)
    if (layout.orientation) setOrientation(layout.orientation)
    setSlotStyle({
      borderWidth: layout.borderWidth ?? 0,
      borderColor: layout.borderColor ?? '#000000',
      gap:         layout.gap         ?? 0,
    })
  }

  function handleCreateLayout() {
    setBuildingLayout(true)
  }

  function handleSaveLayout(layout) {
    setCustomLayouts((prev) => {
      const next = createLayout(prev, layout)
      setActiveLayoutId(next[next.length - 1].id)
      return next
    })
    setTemplate('Custom Layout')
    setBuildingLayout(false)
  }

  function handleDeleteLayout(id) {
    setCustomLayouts((prev) => {
      const next = deleteLayout(prev, id)
      if (activeLayoutId === id) setActiveLayoutId(next[0]?.id ?? null)
      return next
    })
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
      />

      <div className="flex flex-1 overflow-hidden">
        <Toolbar
          paper={paper} onPaper={handlePaper}
          orientation={orientation} onOrientation={handleOrientation}
          template={template} onTemplate={setTemplate}
          grid={grid} onGrid={setGrid}
          slotSize={slotSize} onSlotSize={setSlotSize}
          slotStyle={slotStyle} onSlotStyle={handleSlotStyle}
          customLayouts={customLayouts}
          activeLayoutId={activeLayoutId}
          onSelectLayout={handleSelectLayout}
          onCreateLayout={handleCreateLayout}
          onDeleteLayout={handleDeleteLayout}
        />

        <main className="flex-1 overflow-y-auto flex flex-col items-center p-6">
          {buildingLayout ? (
            <LayoutBuilder
              paper={paper}
              orientation={orientation}
              borderWidth={slotStyle.borderWidth}
              borderColor={slotStyle.borderColor}
              gap={slotStyle.gap}
              onSave={handleSaveLayout}
              onCancel={() => setBuildingLayout(false)}
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
                  slotSize={slotSize}
                  slotStyle={slotStyle}
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

        <ImagePanel images={images} onRemove={handleRemove} onFiles={handleFiles} />
      </div>
    </div>
  )
}
