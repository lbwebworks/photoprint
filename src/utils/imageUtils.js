/**
 * imageUtils.js
 *
 * Fill scaling: image must always cover the block entirely — no empty space.
 * scale = max(blockW / imgW, blockH / imgH)
 * This is the minimum scale allowed; user zoom multiplies on top of it.
 *
 * Fit scaling: image must fit entirely inside the block — no cropping.
 * scale = min(blockW / imgW, blockH / imgH)
 * This is the maximum scale allowed; user zoom multiplies on top of it.
 *
 * Clamp offset: after scaling, the image may be larger than the block.
 * We restrict the drag offset so no edge of the block is ever exposed.
 */

/**
 * Returns the minimum scale so the image fully covers the slot (cover/fill).
 */
export function getFillScale(imgW, imgH, slotW, slotH) {
  return Math.max(slotW / imgW, slotH / imgH)
}

/**
 * Returns the maximum scale so the image fits inside the slot (contain/fit).
 */
export function getFitScale(imgW, imgH, slotW, slotH) {
  return Math.min(slotW / imgW, slotH / imgH)
}

/**
 * Clamps (ox, oy) so the scaled image never reveals the slot background.
 * ox/oy are the image's top-left position relative to the slot origin.
 */
export function clampOffset(ox, oy, drawW, drawH, slotW, slotH) {
  const clamp = (pos, size, slot) => {
    if (size <= slot) {
      return Math.max(0, Math.min(pos, slot - size))
    }
    return Math.min(0, Math.max(pos, slot - size))
  }

  return {
    x: clamp(ox, drawW, slotW),
    y: clamp(oy, drawH, slotH),
  }
}
