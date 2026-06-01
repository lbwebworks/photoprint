/**
 * tables.js
 *
 * Hard-coded lookup tables for categories, paper sizes, and orientations.
 *
 * Paper size dimensions are stored in portrait orientation at 300 DPI.
 * width  = short edge (px)
 * height = long edge (px)
 * widthMm / heightMm = physical dimensions in mm (or inches for R-series)
 *
 * Use getPaperDims() from layoutEngine when you need orientation-aware dims.
 */

// ─── Categories ───────────────────────────────────────────────────────────────
// Fixed list — no new categories are created at runtime.

export const CATEGORIES = [
  { id: 'basic-id-packages',       label: 'Basic ID Packages',       order: 1 },
  { id: 'mixed-id-packages',       label: 'Mixed ID Packages',       order: 2 },
  { id: 'single-prints',           label: 'Single Prints',           order: 3 },
  { id: 'mini-photo-bundles',      label: 'Mini Photo Bundles',       order: 4 },
  { id: 'standard-photo-bundles',  label: 'Standard Photo Bundles',  order: 5 },
  { id: 'creative-bundles',        label: 'Creative Bundles',        order: 6 },
]

// ─── Paper Sizes ──────────────────────────────────────────────────────────────
// Dimensions stored in portrait orientation at 300 DPI.
// widthIn / heightIn are provided for inch-based sizes; widthMm / heightMm for metric.

export const PAPER_SIZES_TABLE = [
  {
    id:       'A4',
    label:    'A4',
    widthMm:  210,
    heightMm: 297,
    widthPx:  2480,   // Math.round(210 * 300 / 25.4)
    heightPx: 3508,   // Math.round(297 * 300 / 25.4)
  },
  {
    id:       'A5',
    label:    'A5',
    widthMm:  148,
    heightMm: 210,
    widthPx:  1748,   // Math.round(148 * 300 / 25.4)
    heightPx: 2480,   // Math.round(210 * 300 / 25.4)
  },
  {
    id:       '5R',
    label:    '5R',
    widthIn:  5,
    heightIn: 7,
    widthPx:  1500,   // 5 * 300
    heightPx: 2100,   // 7 * 300
  },
  {
    id:       '4R',
    label:    '4R',
    widthIn:  4,
    heightIn: 6,
    widthPx:  1200,   // 4 * 300
    heightPx: 1800,   // 6 * 300
  },
  {
    id:       '3R',
    label:    '3R',
    widthIn:  3.5,
    heightIn: 5,
    widthPx:  1050,   // 3.5 * 300
    heightPx: 1500,   // 5 * 300
  },
  {
    id:       'Long',
    label:    'Long',
    widthIn:  8.5,
    heightIn: 14,
    widthPx:  2550,   // Math.round(8.5 * 300)
    heightPx: 4200,   // 14 * 300
  },
  {
    id:       'Short',
    label:    'Short',
    widthIn:  8.5,
    heightIn: 11,
    widthPx:  2550,   // Math.round(8.5 * 300)
    heightPx: 3300,   // 11 * 300
  },
]

// ─── Orientations ─────────────────────────────────────────────────────────────

export const ORIENTATIONS_TABLE = [
  { id: 'portrait',  label: 'Portrait' },
  { id: 'landscape', label: 'Landscape' },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Look up a paper size entry by id. Returns undefined if not found. */
export function getPaperSize(id) {
  return PAPER_SIZES_TABLE.find((p) => p.id === id)
}

/** Look up a category entry by its label (as stored in presets). */
export function getCategoryByLabel(label) {
  return CATEGORIES.find((c) => c.label === label)
}
