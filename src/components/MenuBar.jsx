import { exportPNG, exportPDF } from '../utils/exportUtils'

export default function MenuBar({ onFiles, editorRef, paper, orientation }) {
  function handleExportPNG() { exportPNG(editorRef.current.stageRef) }
  function handleExportPDF() { exportPDF(editorRef.current.stageRef, paper, orientation) }

  return (
    <div className="w-full bg-[#12122a] border-b border-gray-700 px-6 py-3 flex items-center justify-between">
      <span className="text-white font-bold text-lg tracking-wide">L&amp;K Printing Service</span>

      <div className="flex items-center gap-2">
        <label className="cursor-pointer bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-1.5 rounded transition">
          Upload Photos
          <input type="file" multiple accept="image/*" className="hidden" onChange={onFiles} />
        </label>
        <button onClick={handleExportPNG} className="bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium px-4 py-1.5 rounded transition">
          Export PNG
        </button>
        <button onClick={handleExportPDF} className="bg-rose-600 hover:bg-rose-500 text-white text-sm font-medium px-4 py-1.5 rounded transition">
          Export PDF
        </button>
      </div>
    </div>
  )
}
