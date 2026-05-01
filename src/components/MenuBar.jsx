import { exportPNG, exportPDF } from '../utils/exportUtils'

export default function MenuBar({ editorRef, paper, orientation, theme, onTheme }) {
  function handleExportPNG() { exportPNG(editorRef.current.stageRef) }
  function handleExportPDF() { exportPDF(editorRef.current.stageRef, paper, orientation) }

  return (
    <div style={{ background: 'var(--bg-menubar)', borderColor: 'var(--border)' }}
      className="w-full border-b px-6 py-3 flex items-center justify-between shrink-0">
      <span className="font-bold text-lg tracking-wide text-white">
        L&amp;K Printing Service
      </span>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onTheme(theme === 'dark' ? 'light' : 'dark')}
          style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)', borderColor: 'var(--border)' }}
          className="border text-sm px-3 py-1.5 rounded transition hover:opacity-80"
        >
          {theme === 'dark' ? '☀ Light' : '☾ Dark'}
        </button>
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
