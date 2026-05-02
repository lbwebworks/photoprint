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
export const cmToPx = (cm) => Math.round(cm * 300 / 2.54)
export const pxToCm = (px) => (px * 2.54 / 300).toFixed(2)
export const inchToPx = (inch) => Math.round(inch * 300)
export const pxToInch = (px) => (px / 300).toFixed(3)

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
 * Template: Grid (square)
 * NxN equal slots that fill the usable area exactly, with optional gap.
 */
export function computeSlots(n, paperKey, orientation, gap = 0) {
  const { w: usableW, h: usableH } = getUsable(paperKey, orientation)
  const slotW = (usableW - gap * (n - 1)) / n
  const slotH = (usableH - gap * (n - 1)) / n

  const slots = []
  for (let r = 0; r < n; r++)
    for (let c = 0; c < n; c++)
      slots.push({
        id: `${r}-${c}`,
        x: MARGIN + c * (slotW + gap),
        y: MARGIN + r * (slotH + gap),
        w: slotW,
        h: slotH,
      })
  return slots
}

/**
 * Template: Grid (custom cols × rows)
 * Fills the usable area with the given col/row count, with optional gap.
 */
export function computeSlotsByGrid(cols, rows, paperKey, orientation, gap = 0) {
  const { w: usableW, h: usableH } = getUsable(paperKey, orientation)
  const slotW = (usableW - gap * (cols - 1)) / cols
  const slotH = (usableH - gap * (rows - 1)) / rows

  const slots = []
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++)
      slots.push({
        id: `${r}-${c}`,
        x: MARGIN + c * (slotW + gap),
        y: MARGIN + r * (slotH + gap),
        w: slotW,
        h: slotH,
      })
  return slots
}

/**
 * Template: Free Size
 * Pack as many slotW × slotH slots as fit in the usable area, with optional gap.
 * Remaining space is split evenly (centered grid).
 */
export function computeSlotsBySize(slotW, slotH, paperKey, orientation, gap = 0) {
  const { w: usableW, h: usableH } = getUsable(paperKey, orientation)
  const cols = Math.max(1, Math.floor((usableW + gap) / (slotW + gap)))
  const rows = Math.max(1, Math.floor((usableH + gap) / (slotH + gap)))
  const gridW = cols * slotW + (cols - 1) * gap
  const gridH = rows * slotH + (rows - 1) * gap
  const offsetX = MARGIN + Math.round((usableW - gridW) / 2)
  const offsetY = MARGIN + Math.round((usableH - gridH) / 2)

  const slots = []
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++)
      slots.push({
        id: `${r}-${c}`,
        x: offsetX + c * (slotW + gap),
        y: offsetY + r * (slotH + gap),
        w: slotW,
        h: slotH,
      })
  return slots
}

/**
 * Auto-fill logic:
 * - Slots are filled by cycling through images repeatedly until all slots are filled.
 * - e.g. 3 images, 8 slots → [1,2,3,1,2,3,1,2]
 */
export function resolveSlotImages(slots, images) {
  if (!images.length) return slots.map(() => null)
  return slots.map((_, i) => images[i % images.length])
}
