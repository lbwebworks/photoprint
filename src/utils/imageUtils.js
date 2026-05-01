/**
 * imageUtils.js
 *
 * Fill scaling: image must always cover the slot entirely — no empty space.
 * scale = max(slotW / imgW, slotH / imgH)
 * This is the minimum scale allowed; user zoom multiplies on top of it.
 *
 * Clamp offset: after scaling, the image may be larger than the slot.
 * We restrict the drag offset so no edge of the slot is ever exposed.
 */

/**
 * Returns the minimum scale so the image fully covers the slot (cover/fill).
 */
export function getFillScale(imgW, imgH, slotW, slotH) {
  return Math.max(slotW / imgW, slotH / imgH)
}

/**
 * Clamps (ox, oy) so the scaled image never reveals the slot background.
 * ox/oy are the image's top-left position relative to the slot origin.
 */
export function clampOffset(ox, oy, drawW, drawH, slotW, slotH) {
  return {
    x: Math.min(0, Math.max(ox, slotW - drawW)),
    y: Math.min(0, Math.max(oy, slotH - drawH)),
  }
}
