/**
 * presets.js
 *
 * Preset schema:
 * {
 *   id, name,
 *   paper, orientation,
 *   borderWidth, borderColor, gap,
 *   slots: [{ id, x, y, w, h }]  — absolute px positions at 300 DPI
 * }
 */

export const SAMPLE_PRESETS = [
  {
    id: 'sample-1', name: '4 × 4 Grid',
    paper: 'A4', orientation: 'portrait',
    borderWidth: 0, borderColor: '#000000', gap: 0,
    slots: null, cols: 4, rows: 4, // null slots = use computeBlocksByGrid
  },
  {
    id: 'sample-2', name: '4 × 5 Grid',
    paper: 'A4', orientation: 'portrait',
    borderWidth: 0, borderColor: '#000000', gap: 0,
    slots: null, cols: 4, rows: 5,
  },
  {
    id: 'sample-3', name: '2 × 2 Grid',
    paper: 'A4', orientation: 'portrait',
    borderWidth: 0, borderColor: '#000000', gap: 0,
    slots: null, cols: 2, rows: 2,
  },
]

export const IS_LOCAL = window.location.hostname === 'localhost'

export function loadPresets() {
  return SAMPLE_PRESETS
}

export function createPreset(presets, preset) {
  const next = [...presets, { ...preset, id: `preset-${Date.now()}` }]
  return next
}

export function updatePreset(presets, updatedPreset) {
  return presets.map((preset) => preset.id === updatedPreset.id ? { ...preset, ...updatedPreset } : preset)
}

export function deletePreset(presets, id) {
  return presets.filter((p) => p.id !== id)
}
