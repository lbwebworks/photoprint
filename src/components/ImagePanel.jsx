export default function ImagePanel({ images, onRemove, onFiles, disabled = false }) {
  function handleDragStart(e, url) {
    e.dataTransfer.setData('text/plain', url)
    e.dataTransfer.effectAllowed = 'copy'
  }

  return (
    <aside style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
      className={`w-[15%] min-w-40 shrink-0 border-l flex flex-col overflow-hidden ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>

      {/* Header */}
      <div style={{ borderColor: 'var(--border)' }} className="px-3 py-3 border-b flex flex-col gap-2">
        <span style={{ color: 'var(--text-primary)' }} className="text-sm font-semibold">
          Image Library {images.length > 0 && (
            <span style={{ color: 'var(--text-muted)' }} className="text-xs font-normal">({images.length})</span>
          )}
        </span>
        <label style={{ borderColor: 'var(--border)' }}
          className="cursor-pointer w-full text-center bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium px-2 py-1.5 rounded transition">
          Upload Photos
          <input type="file" multiple accept="image/*" className="hidden" onChange={onFiles} disabled={disabled} />
        </label>
      </div>

      {/* Image list */}
      {images.length === 0 ? (
        <div className="flex-1 flex items-center justify-center p-4">
          <p style={{ color: 'var(--text-muted)' }} className="text-xs text-center">No images uploaded yet</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-2 grid grid-cols-2 gap-2 content-start">
          {images.map((url, i) => (
            <div
              key={url}
              draggable
              onDragStart={(e) => handleDragStart(e, url)}
              style={{ borderColor: 'var(--border)' }}
              className="relative group rounded overflow-hidden border cursor-grab active:cursor-grabbing"
            >
              <img src={url} alt={`Image ${i + 1}`} className="w-full aspect-square object-cover pointer-events-none" />
              <span className="absolute bottom-1 left-1 bg-black/60 text-white text-xs px-1 rounded">
                {i + 1}
              </span>
              <button
                onClick={() => onRemove(i)}
                className="absolute top-1 right-1 bg-black/60 hover:bg-rose-600 text-white text-xs w-5 h-5 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                title="Remove"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </aside>
  )
}
