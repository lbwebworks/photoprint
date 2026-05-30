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

/** Print the active layout or multi-page layout directly from the browser */
export function printLayout(stageRefs, pageConfigs = [], defaultPaper = 'A4', defaultOrientation = 'portrait') {
  if (!stageRefs.length) return

  const pages = stageRefs.map((stageRef, i) => {
    const config = pageConfigs[i] || {}
    const paperKey = config.paper || defaultPaper
    const orientation = config.orientation || defaultOrientation
    const { width: pageW, height: pageH } = getPaperDims(paperKey, orientation)
    const mmW = Number(pxToMm(pageW))
    const mmH = Number(pxToMm(pageH))
    const pixelRatio = pageW / stageRef.current.width()
    const dataURL = stageRef.current.toDataURL({ pixelRatio, mimeType: 'image/png' })

    return { dataURL, mmW, mmH }
  })

  const firstPage = pages[0]
  const content = pages.map((page) => `
      <div class="page" style="width:${page.mmW}mm; height:${page.mmH}mm;">
        <img src="${page.dataURL}" alt="Print preview" />
      </div>
    `).join('')

  const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>Print layout</title>
<style>
  html, body { margin: 0; padding: 0; background: #fff; }
  body { display: flex; flex-direction: column; align-items: center; }
  .page { page-break-after: always; break-after: page; overflow: hidden; }
  .page img { width: 100%; height: 100%; object-fit: contain; display: block; }
  @page { size: ${firstPage.mmW}mm ${firstPage.mmH}mm; margin: 0; }
</style>
</head>
<body>
  ${content}
  <script>
    window.onload = function() {
      setTimeout(function() {
        window.focus();
        window.print();
      }, 50);
    }
  </script>
</body>
</html>`

  const printWindow = window.open('', '_blank')
  if (!printWindow) return
  printWindow.document.write(html)
  printWindow.document.close()
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
