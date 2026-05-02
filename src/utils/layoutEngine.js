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
 *
 * Terminology: individual photo areas are called "blocks".
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

// Grid options as block counts (square numbers 1x1 → 12x12)
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
 * NxN equal blocks that fill the usable area exactly, with optional gap.
 */
export function computeBlocks(n, paperKey, orientation, gap = 0) {
  const { w: usableW, h: usableH } = getUsable(paperKey, orientation)
  const blockW = (usableW - gap * (n - 1)) / n
  const blockH = (usableH - gap * (n - 1)) / n

  const blocks = []
  for (let r = 0; r < n; r++)
    for (let c = 0; c < n; c++)
      blocks.push({
        id: `${r}-${c}`,
        x: MARGIN + c * (blockW + gap),
        y: MARGIN + r * (blockH + gap),
        w: blockW,
        h: blockH,
      })
  return blocks
}

/**
 * Template: Grid (custom cols × rows)
 * Fills the usable area with the given col/row count, with optional gap.
 */
export function computeBlocksByGrid(cols, rows, paperKey, orientation, gap = 0) {
  const { w: usableW, h: usableH } = getUsable(paperKey, orientation)
  const blockW = (usableW - gap * (cols - 1)) / cols
  const blockH = (usableH - gap * (rows - 1)) / rows

  const blocks = []
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++)
      blocks.push({
        id: `${r}-${c}`,
        x: MARGIN + c * (blockW + gap),
        y: MARGIN + r * (blockH + gap),
        w: blockW,
        h: blockH,
      })
  return blocks
}

/**
 * Template: Free Size
 * Pack as many blockW × blockH blocks as fit in the usable area, with optional gap.
 * Remaining space is split evenly (centered grid).
 */
export function computeBlocksBySize(blockW, blockH, paperKey, orientation, gap = 0) {
  const { w: usableW, h: usableH } = getUsable(paperKey, orientation)
  const cols = Math.max(1, Math.floor((usableW + gap) / (blockW + gap)))
  const rows = Math.max(1, Math.floor((usableH + gap) / (blockH + gap)))
  const gridW = cols * blockW + (cols - 1) * gap
  const gridH = rows * blockH + (rows - 1) * gap
  const offsetX = MARGIN + Math.round((usableW - gridW) / 2)
  const offsetY = MARGIN + Math.round((usableH - gridH) / 2)

  const blocks = []
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++)
      blocks.push({
        id: `${r}-${c}`,
        x: offsetX + c * (blockW + gap),
        y: offsetY + r * (blockH + gap),
        w: blockW,
        h: blockH,
      })
  return blocks
}

/**
 * Auto-fill logic:
 * - Blocks are filled by cycling through images repeatedly until all blocks are filled.
 * - e.g. 3 images, 8 blocks → [1,2,3,1,2,3,1,2]
 */
export function resolveBlockImages(blocks, images) {
  if (!images.length) return blocks.map(() => null)
  return blocks.map((_, i) => images[i % images.length])
}
