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
 *
 * SAMPLE_PRESETS lives in src/data/presets.json.
 * To publish or delete official presets locally, use publishPreset() / unpublishPreset()
 * which download an updated presets.json — replace the file in your repo and push.
 */

import SAMPLE_PRESETS_DATA from '../data/presets.json'

export const SAMPLE_PRESETS = SAMPLE_PRESETS_DATA

export const IS_LOCAL = window.location.hostname === 'localhost'

export function loadPresets() {
  return SAMPLE_PRESETS
}

export function createPreset(presets, preset) {
  return [...presets, { ...preset, id: `preset-${Date.now()}` }]
}

export function updatePreset(presets, updatedPreset) {
  return presets.map((p) => p.id === updatedPreset.id ? { ...p, ...updatedPreset } : p)
}

export function deletePreset(presets, id) {
  return presets.filter((p) => p.id !== id)
}

/** Downloads an updated presets.json with the preset added/replaced. */
export function publishPreset(currentSamplePresets, preset) {
  const exists = currentSamplePresets.some((p) => p.id === preset.id)
  const updated = exists
    ? currentSamplePresets.map((p) => p.id === preset.id ? preset : p)
    : [...currentSamplePresets, preset]
  downloadJson(updated, 'presets.json')
}

/** Downloads an updated presets.json with the preset removed. */
export function unpublishPreset(currentSamplePresets, id) {
  const updated = currentSamplePresets.filter((p) => p.id !== id)
  downloadJson(updated, 'presets.json')
}

function downloadJson(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
