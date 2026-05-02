import { exportPNG, exportPDF, exportAllPNG } from '../utils/exportUtils'

export default function MenuBar({ pages, editorRefs, paper, orientation, theme, onTheme, disabled = false }) {
  function getActiveStageRef() {
    // Find the first page ref that has a stageRef (active page)
    for (const page of (pages ?? [])) {
      const r = editorRefs?.current?.[page.id]?.current?.stageRef
      if (r) return r
    }
    return null
  }

  function getAllStageRefs() {
    return (pages ?? [])
      .map((p) => editorRefs?.current?.[p.id]?.current?.stageRef)
      .filter(Boolean)
  }

  function handleExportPNG() {
    if (disabled) return
    const refs = getAllStageRefs()
    if (refs.length === 1) {
      exportPNG(refs[0])
    } else {
      exportAllPNG(refs)
    }
  }

  function handleExportPDF() {
    if (disabled) return
    exportPDF(getAllStageRefs(), paper, orientation)
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
