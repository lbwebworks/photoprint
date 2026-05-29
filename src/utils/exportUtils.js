/**
 * exportUtils.js
 *
 * Export the Konva stage(s) at full paper resolution.
 * pixelRatio = paperWidth / displayedWidth corrects for the preview scale,
 * ensuring the output is always the true DPI resolution regardless of screen size.
 */

import { jsPDF } from 'jspdf'
import { pxToMm, getPaperDims } from './layoutEngine'

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


/** Export all pages as a single multi-page PDF */
export function exportPDF(stageRefs, pageConfigs = [], defaultPaper = 'A4', defaultOrientation = 'portrait') {
  if (!stageRefs.length) return

  const firstConfig = pageConfigs[0] || {}
  const firstPaper = firstConfig.paper || defaultPaper
  const firstOrientation = firstConfig.orientation || defaultOrientation
  const firstDims = getPaperDims(firstPaper, firstOrientation)
  const firstMmW = Number(pxToMm(firstDims.width))
  const firstMmH = Number(pxToMm(firstDims.height))
  const pdf = new jsPDF({ orientation: firstOrientation, unit: 'mm', format: [firstMmW, firstMmH] })

  stageRefs.forEach((stageRef, i) => {
    const config = pageConfigs[i] || {}
    const paperKey = config.paper || defaultPaper
    const orientation = config.orientation || defaultOrientation
    const { width: pageW, height: pageH } = getPaperDims(paperKey, orientation)
    const mmW = Number(pxToMm(pageW))
    const mmH = Number(pxToMm(pageH))
    const pixelRatio = pageW / stageRef.current.width()
    const dataURL = stageRef.current.toDataURL({ pixelRatio, mimeType: 'image/png' })

    if (i > 0) pdf.addPage([mmW, mmH], orientation)
    pdf.addImage(dataURL, 'PNG', 0, 0, mmW, mmH)
  })

  pdf.save('print-layout.pdf')
}
