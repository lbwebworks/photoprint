import { useState, useRef } from 'react'
import './index.css'
import MenuBar from './components/MenuBar'
import Toolbar from './components/Toolbar'
import CanvasEditor from './components/CanvasEditor'
import ImagePanel from './components/ImagePanel'
import { mmToPx, PAPER_SIZES, getPaperDims } from './utils/layoutEngine'

export default function App() {
  const [images, setImages] = useState([])
  const [paper, setPaper] = useState('A4')
  const [orientation, setOrientation] = useState('portrait')
  const [template, setTemplate] = useState('Grid')
  const [grid, setGrid] = useState({ mode: 'square', slots: 16, cols: 4, rows: 4 })
  const [slotSize, setSlotSize] = useState({ w: mmToPx(35), h: mmToPx(45) })
  const [slotStyle, setSlotStyle] = useState({ borderWidth: 0, borderColor: '#000000', gap: 0 })
  const [theme, setTheme] = useState('light')
  const editorRef = useRef(null)

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
          paper={paper} onPaper={setPaper}
          orientation={orientation} onOrientation={setOrientation}
          template={template} onTemplate={setTemplate}
          grid={grid} onGrid={setGrid}
          slotSize={slotSize} onSlotSize={setSlotSize}
          slotStyle={slotStyle} onSlotStyle={setSlotStyle}
        />

        <main className="flex-1 overflow-y-auto flex flex-col items-center p-6">
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
            />
          </div>
          <p className="mt-4 text-xs" style={{ color: 'var(--text-muted)' }}>
            {`${width} × ${height} px — ${PAPER_SIZES[paper].label} ${orientation} @ 300 DPI`}
          </p>
        </main>

        <ImagePanel images={images} onRemove={handleRemove} onFiles={handleFiles} />
      </div>
    </div>
  )
}
