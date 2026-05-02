import { exportPNG, exportPDF, exportAllPNG } from '../utils/exportUtils'

export default function MenuBar({ pages, editorRefs, paper, orientation, theme, onTheme, onStartNew, disabled = false }) {
  function getAllEditors() {
    return (pages ?? [])
      .map((p) => editorRefs?.current?.[p.id]?.current)
      .filter(Boolean)
  }

  function getAllStageRefs() {
    return getAllEditors().map((e) => e.stageRef).filter(Boolean)
  }

  function deselectAllPages() {
    getAllEditors().forEach((e) => e.deselectAll?.())
  }

  function handleExportPNG() {
    if (disabled) return
    deselectAllPages()
    // Small timeout to let React re-render the deselected state before capturing
    setTimeout(() => {
      const refs = getAllStageRefs()
      if (refs.length === 1) {
        exportPNG(refs[0])
      } else {
        exportAllPNG(refs)
      }
    }, 50)
  }

  function handleExportPDF() {
    if (disabled) return
    deselectAllPages()
    setTimeout(() => {
      exportPDF(getAllStageRefs(), paper, orientation)
    }, 50)
  }

  return (
    <div style={{ background: 'var(--bg-menubar)', borderColor: 'var(--border)' }}
      className="w-full border-b px-6 py-3 flex items-center justify-between shrink-0">
      <span className="font-bold text-lg tracking-wide text-white">
        L&amp;K Printing Service
      </span>

      <div className={`flex items-center gap-2 ${disabled ? 'opacity-50' : ''}`}>
        <button
          type="button"
          onClick={onStartNew}
          style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)', borderColor: 'var(--border)' }}
          className="border text-sm px-3 py-1.5 rounded transition hover:opacity-80"
        >
          Start New
        </button>
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
