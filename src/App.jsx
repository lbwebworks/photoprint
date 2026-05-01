import { useState, useRef } from 'react'
import './index.css'
import MenuBar from './components/MenuBar'
import Toolbar from './components/Toolbar'
import CanvasEditor from './components/CanvasEditor'
import { mmToPx, PAPER_SIZES, getPaperDims } from './utils/layoutEngine'

export default function App() {
  const [images, setImages] = useState([])
  const [paper, setPaper] = useState('A4')
  const [orientation, setOrientation] = useState('portrait')
  const [template, setTemplate] = useState('Grid')
  const [grid, setGrid] = useState(36)
  const [slotSize, setSlotSize] = useState({ w: mmToPx(35), h: mmToPx(45) })
  const editorRef = useRef(null)

  function handleFiles(e) {
    const urls = Array.from(e.target.files).map((f) => URL.createObjectURL(f))
    setImages((prev) => [...prev, ...urls])
  }

  const { width, height } = getPaperDims(paper, orientation)

  return (
    <div className="h-screen flex flex-col bg-[#1a1a2e] overflow-hidden">
      {/* Top menu bar */}
      <MenuBar onFiles={handleFiles} editorRef={editorRef} paper={paper} orientation={orientation} />

      {/* Sidebar + canvas */}
      <div className="flex flex-1 overflow-hidden">
        <Toolbar
          paper={paper} onPaper={setPaper}
          orientation={orientation} onOrientation={setOrientation}
          template={template} onTemplate={setTemplate}
          grid={grid} onGrid={setGrid}
          slotSize={slotSize} onSlotSize={setSlotSize}
        />

        {/* Canvas area */}
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
            />
          </div>
          <p className="mt-4 text-xs text-gray-500">
            {`${width} × ${height} px — ${PAPER_SIZES[paper].label} ${orientation} @ 300 DPI`}
          </p>
        </main>
      </div>
    </div>
  )
}
