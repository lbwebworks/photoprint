import { useState } from 'react'
import { PAPER_SIZES } from '../utils/layoutEngine'

const ORIENTATIONS = [
  { value: 'portrait',  label: 'Portrait',  icon: '▯' },
  { value: 'landscape', label: 'Landscape', icon: '▭' },
]

export default function SetupScreen({ onSetup }) {
  const [selectedPaper, setSelectedPaper]           = useState(null)
  const [selectedOrientation, setSelectedOrientation] = useState(null)

  const canStart = selectedPaper && selectedOrientation

  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div
        className="flex flex-col items-center gap-8 w-full max-w-sm"
        style={{ color: 'var(--text-primary)' }}
      >
        {/* Title */}
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-1">Set up your print</h2>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Choose a paper size and orientation to get started.
          </p>
        </div>

        {/* Paper size */}
        <div className="w-full flex flex-col gap-2">
          <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Paper Size</span>
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(PAPER_SIZES).map(([key, { label }]) => (
              <button
                key={key}
                onClick={() => setSelectedPaper(key)}
                className="flex flex-col items-center justify-center gap-1 py-4 rounded-lg border-2 transition"
                style={{
                  background:   selectedPaper === key ? 'rgba(99,102,241,0.08)' : 'var(--bg-elevated)',
                  borderColor:  selectedPaper === key ? '#6366f1' : 'var(--border)',
                  color:        selectedPaper === key ? '#6366f1' : 'var(--text-secondary)',
                }}
              >
                {/* Paper icon — proportional rectangle */}
                <span
                  className="block border-2 rounded-sm"
                  style={{
                    width:       key === 'A4' ? 20 : 24,
                    height:      key === 'A4' ? 28 : 20,
                    borderColor: selectedPaper === key ? '#6366f1' : 'var(--border)',
                  }}
                />
                <span className="text-sm font-semibold">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Orientation */}
        <div className="w-full flex flex-col gap-2">
          <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Orientation</span>
          <div className="grid grid-cols-2 gap-3">
            {ORIENTATIONS.map(({ value, label, icon }) => (
              <button
                key={value}
                onClick={() => setSelectedOrientation(value)}
                className="flex flex-col items-center justify-center gap-1 py-4 rounded-lg border-2 transition"
                style={{
                  background:  selectedOrientation === value ? 'rgba(99,102,241,0.08)' : 'var(--bg-elevated)',
                  borderColor: selectedOrientation === value ? '#6366f1' : 'var(--border)',
                  color:       selectedOrientation === value ? '#6366f1' : 'var(--text-secondary)',
                }}
              >
                <span className="text-2xl leading-none">{icon}</span>
                <span className="text-sm font-semibold">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Start button */}
        <button
          disabled={!canStart}
          onClick={() => onSetup(selectedPaper, selectedOrientation)}
          className="w-full py-3 rounded-lg text-sm font-semibold transition disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            background: canStart ? '#6366f1' : 'var(--bg-elevated)',
            color:      canStart ? 'white'   : 'var(--text-muted)',
          }}
        >
          Start
        </button>
      </div>
    </div>
  )
}
