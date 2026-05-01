/**
 * exportUtils.js
 *
 * Export the Konva stage at full paper resolution.
 * pixelRatio = paperWidth / displayedWidth corrects for the preview scale,
 * ensuring the output is always the true DPI resolution regardless of screen size.
 */

import { jsPDF } from 'jspdf'
import { PAPER_SIZES, getPaperDims } from './layoutEngine'

export function exportPNG(stageRef) {
  const stage = stageRef.current
  const pixelRatio = stage.attrs.width / stage.width()
  const dataURL = stage.toDataURL({ pixelRatio, mimeType: 'image/png' })
  const link = document.createElement('a')
  link.download = 'print-layout.png'
  link.href = dataURL
  link.click()
}

export function exportPDF(stageRef, paperKey = 'A4', orientation = 'portrait') {
  const stage = stageRef.current
  const { width: pageW } = getPaperDims(paperKey, orientation)
  const pixelRatio = pageW / stage.width()
  const dataURL = stage.toDataURL({ pixelRatio, mimeType: 'image/png' })

  // jsPDF orientation + format handles mm dimensions automatically
  const pdf = new jsPDF({ orientation, unit: 'mm', format: paperKey.toLowerCase() })
  const [mmW, mmH] = orientation === 'landscape'
    ? [pdf.internal.pageSize.getWidth(), pdf.internal.pageSize.getHeight()]
    : [pdf.internal.pageSize.getWidth(), pdf.internal.pageSize.getHeight()]
  pdf.addImage(dataURL, 'PNG', 0, 0, mmW, mmH)
  pdf.save('print-layout.pdf')
}
