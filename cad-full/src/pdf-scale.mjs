const UNIT_CODES = Object.freeze({ mm: 4, cm: 5, m: 6, inch: 1, foot: 2 })
const POINTS_PER_MM = 72 / 25.4
const DEFAULT_MARGIN_MM = 10
const PAGE_PADDING_FRACTION = 0.02

export function unitCodeForChoice(unit) {
  const code = UNIT_CODES[unit]
  if (!code) throw new Error('請先明確選擇毫米、公分、公尺、英吋或英尺')
  return code
}

/** Build a renderer fit box whose drawing-to-paper scale is exactly 1:N. */
export function makeScaleFitBox(extents, { unit, denominator, widthMm, heightMm, marginMm = DEFAULT_MARGIN_MM }) {
  const unitCode = unitCodeForChoice(unit)
  if (!Number.isFinite(denominator) || denominator < 1) throw new Error('比例分母必須是大於或等於 1 的數字')
  if (![widthMm, heightMm, marginMm].every(Number.isFinite) || widthMm <= 0 || heightMm <= 0 || marginMm < 0) {
    throw new Error('紙張尺寸或邊界設定無效')
  }
  const { min, max } = extents ?? {}
  const values = [min?.x, min?.y, max?.x, max?.y]
  if (!values.every(Number.isFinite) || max.x <= min.x || max.y <= min.y) {
    throw new Error('DWG 模型空間範圍無效；無法保證工程比例')
  }

  // Autodesk INSUNITS: inch=1, foot=2, mm=4, cm=5, m=6.
  const unitMm = ({ mm: 1, cm: 10, m: 1000, inch: 25.4, foot: 304.8 })[unit]
  const pointsPerDrawingUnit = unitMm * POINTS_PER_MM / denominator
  const pageWidthPt = widthMm * POINTS_PER_MM
  const pageHeightPt = heightMm * POINTS_PER_MM
  const marginPt = marginMm * POINTS_PER_MM
  const padX = Math.max(marginPt, (pageWidthPt - 2 * marginPt) * PAGE_PADDING_FRACTION)
  const padY = Math.max(marginPt, (pageHeightPt - 2 * marginPt) * PAGE_PADDING_FRACTION)
  const usableWidth = pageWidthPt - 2 * padX
  const usableHeight = pageHeightPt - 2 * padY
  if (usableWidth <= 0 || usableHeight <= 0) throw new Error('紙張邊界大於可用紙面')

  const availableWidth = usableWidth / pointsPerDrawingUnit
  const availableHeight = usableHeight / pointsPerDrawingUnit
  const drawingWidth = max.x - min.x
  const drawingHeight = max.y - min.y
  const tolerance = Math.max(drawingWidth, drawingHeight) * 1e-10
  if (drawingWidth > availableWidth + tolerance || drawingHeight > availableHeight + tolerance) {
    throw new Error(`整張模型空間無法以 1:${denominator} 放入所選紙張；請改用較小比例分母或較大紙張`)
  }

  const centerX = (min.x + max.x) / 2
  const centerY = (min.y + max.y) / 2
  const boxWidth = Math.max(drawingWidth, availableWidth)
  const boxHeight = Math.max(drawingHeight, availableHeight)
  return {
    unitCode,
    fitBox: {
      min: { x: centerX - boxWidth / 2, y: centerY - boxHeight / 2 },
      max: { x: centerX + boxWidth / 2, y: centerY + boxHeight / 2 }
    },
    pointsPerDrawingUnit,
    availableWidth,
    availableHeight
  }
}
