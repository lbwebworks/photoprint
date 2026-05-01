/**
 * layoutEngine.js
 *
 * Coordinate system: all values are in pixels at 300 DPI.
 * 1mm = 300/25.4 ≈ 11.81 px
 *
 * Paper sizes at 300 DPI:
 *   A4 = 210 × 297 mm = 2480 × 3508 px
 *   A5 = 148 × 210 mm = 1748 × 2480 px
 *
 * MARGIN = 5mm ≈ 59px — applied on all sides for both paper sizes.
 */

export const mmToPx = (mm) => Math.round(mm * 300 / 25.4)
export const pxToMm = (px) => (px * 25.4 / 300).toFixed(1)

// 5mm margin at 300 DPI
export const MARGIN = mmToPx(5)

export const PAPER_SIZES = {
  A4: { label: 'A4', width: mmToPx(210), height: mmToPx(297) },
  A5: { label: 'A5', width: mmToPx(148), height: mmToPx(210) },
}

// Grid options as slot counts (square numbers 1x1 → 12x12)
export const GRID_OPTIONS = [1, 4, 9, 16, 25, 36, 49, 64, 81, 100, 121, 144]

export const ORIENTATIONS = [
  { value: 'portrait', label: 'Portrait' },
  { value: 'landscape', label: 'Landscape' },
]

/**
 * Returns the paper dimensions respecting orientation.
 * Landscape swaps width and height.
 */
export function getPaperDims(paperKey, orientation) {
  const { width, height } = PAPER_SIZES[paperKey]
  return orientation === 'landscape'
    ? { width: height, height: width }
    : { width, height }
}

/** Returns the usable area (inside margins) for a given paper and orientation */
export function getUsable(paperKey, orientation) {
  const { width, height } = getPaperDims(paperKey, orientation)
  return { w: width - MARGIN * 2, h: height - MARGIN * 2 }
}

/**
 * Template: Grid
 * NxN equal slots that fill the usable area exactly. No gaps.
 */
export function computeSlots(n, paperKey, orientation) {
  const { w: usableW, h: usableH } = getUsable(paperKey, orientation)
  const slotW = usableW / n
  const slotH = usableH / n

  const slots = []
  for (let r = 0; r < n; r++)
    for (let c = 0; c < n; c++)
      slots.push({
        id: `${r}-${c}`,
        x: MARGIN + c * slotW,
        y: MARGIN + r * slotH,
        w: slotW,
        h: slotH,
      })
  return slots
}

/**
 * Template: Custom Size
 * Pack as many slotW × slotH slots as fit in the usable area.
 * Remaining space is split evenly (centered grid).
 * slotW and slotH are in pixels at 300 DPI.
 */
export function computeSlotsBySize(slotW, slotH, paperKey, orientation) {
  const { w: usableW, h: usableH } = getUsable(paperKey, orientation)
  const cols = Math.max(1, Math.floor(usableW / slotW))
  const rows = Math.max(1, Math.floor(usableH / slotH))
  // Center the grid within the usable area
  const offsetX = MARGIN + Math.round((usableW - cols * slotW) / 2)
  const offsetY = MARGIN + Math.round((usableH - rows * slotH) / 2)

  const slots = []
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++)
      slots.push({
        id: `${r}-${c}`,
        x: offsetX + c * slotW,
        y: offsetY + r * slotH,
        w: slotW,
        h: slotH,
      })
  return slots
}

/**
 * Auto-fill logic:
 * - 1 image  → repeated across all slots
 * - N images → assigned sequentially; last image repeats for remaining slots
 */
export function resolveSlotImages(slots, images) {
  if (!images.length) return slots.map(() => null)
  return slots.map((_, i) => images[Math.min(i, images.length - 1)])
}
