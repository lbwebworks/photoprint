import { exportPNG, exportPDF } from '../utils/exportUtils'

export default function MenuBar({ editorRef, paper, orientation, theme, onTheme, disabled = false }) {
  function handleExportPNG() { if (disabled) return; exportPNG(editorRef.current.stageRef) }
  function handleExportPDF() { if (disabled) return; exportPDF(editorRef.current.stageRef, paper, orientation) }

  return (
    <div style={{ background: 'var(--bg-menubar)', borderColor: 'var(--border)' }}
      className="w-full border-b px-6 py-3 flex items-center justify-between shrink-0">
      <span className="font-bold text-lg tracking-wide text-white">
        L&amp;K Printing Service
      </span>

      <div className={`flex items-center gap-2 ${disabled ? 'opacity-50' : ''}`}>
        <button
          type="button"
          disabled={disabled}
          onClick={() => !disabled && onTheme(theme === 'dark' ? 'light' : 'dark')}
          style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)', borderColor: 'var(--border)' }}
          className={`border text-sm px-3 py-1.5 rounded transition ${disabled ? 'cursor-not-allowed' : 'hover:opacity-80'}`}
        >
          {theme === 'dark' ? '☀ Light' : '☾ Dark'}
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={handleExportPNG}
          className={`bg-emerald-600 text-white text-sm font-medium px-4 py-1.5 rounded transition ${disabled ? 'cursor-not-allowed' : 'hover:bg-emerald-500'}`}
        >
          Export PNG
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={handleExportPDF}
          className={`bg-rose-600 text-white text-sm font-medium px-4 py-1.5 rounded transition ${disabled ? 'cursor-not-allowed' : 'hover:bg-rose-500'}`}
        >
          Export PDF
        </button>
      </div>
    </div>
  )
}
