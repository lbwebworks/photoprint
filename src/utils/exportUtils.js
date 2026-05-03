/**
 * exportUtils.js
 *
 * Export the Konva stage(s) at full paper resolution.
 * pixelRatio = paperWidth / displayedWidth corrects for the preview scale,
 * ensuring the output is always the true DPI resolution regardless of screen size.
 */

import { jsPDF } from 'jspdf'
import { getPaperDims } from './layoutEngine'

function stageToDataURL(stageRef) {
  const stage = stageRef.current
  const pixelRatio = stage.attrs.width / stage.width()
  return stage.toDataURL({ pixelRatio, mimeType: 'image/png' })
}

/** Export the active (single) page as PNG */
export function exportPNG(stageRef) {
  const dataURL = stageToDataURL(stageRef)
  const link = document.createElement('a')
  link.download = 'print-layout.png'
  link.href = dataURL
  link.click()
}

/** Export all pages as individual numbered PNGs */
export function exportAllPNG(stageRefs) {
  stageRefs.forEach((stageRef, i) => {
    const dataURL = stageToDataURL(stageRef)
    const link = document.createElement('a')
    link.download = `print-layout-page-${i + 1}.png`
    link.href = dataURL
    link.click()
  })
}

// Map our paper keys to jsPDF format strings
const PDF_FORMAT = {
  A3:    'a3',
  A4:    'a4',
  A5:    'a5',
  A6:    'a6',
  Long:  'legal',
  Short: 'letter',
}

/** Export all pages as a single multi-page PDF */
export function exportPDF(stageRefs, paperKey = 'A4', orientation = 'portrait') {
  if (!stageRefs.length) return

  const format = PDF_FORMAT[paperKey] ?? paperKey.toLowerCase()
  const { width: pageW } = getPaperDims(paperKey, orientation)
  const pdf = new jsPDF({ orientation, unit: 'mm', format })
  const mmW = pdf.internal.pageSize.getWidth()
  const mmH = pdf.internal.pageSize.getHeight()

  stageRefs.forEach((stageRef, i) => {
    const pixelRatio = pageW / stageRef.current.width()
    const dataURL = stageRef.current.toDataURL({ pixelRatio, mimeType: 'image/png' })
    if (i > 0) pdf.addPage(format, orientation)
    pdf.addImage(dataURL, 'PNG', 0, 0, mmW, mmH)
  })

  pdf.save('print-layout.pdf')
}
