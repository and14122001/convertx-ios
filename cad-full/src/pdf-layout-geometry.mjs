/** Pure PDF page gate shared by auto and manual exports; dimensions are PDF points. */
export function verifyPdfPageGeometry(widthPt,heightPt,paper,marginMm=0,toleranceMm=0.1){
 if(!Number.isFinite(widthPt)||!Number.isFinite(heightPt)||widthPt<=0||heightPt<=0)throw new Error('PDF 頁面尺寸無效')
 if(!Number.isFinite(marginMm)||marginMm<0||marginMm>100)throw new Error('PDF 留白無效')
 if(paper==='extents')return {widthMm:widthPt*25.4/72,heightMm:heightPt*25.4/72}
 if(!paper||!Number.isFinite(paper.widthMm)||!Number.isFinite(paper.heightMm)||paper.widthMm<=0||paper.heightMm<=0)throw new Error('指定紙張尺寸無效')
 if(paper.widthMm<=2*marginMm||paper.heightMm<=2*marginMm)throw new Error('紙張尺寸不足以容納指定留白')
 const widthMm=widthPt*25.4/72,heightMm=heightPt*25.4/72
 if(Math.abs(widthMm-paper.widthMm)>toleranceMm||Math.abs(heightMm-paper.heightMm)>toleranceMm)throw new Error('PDF MediaBox 紙張尺寸與設定不符，停止下載')
 return {widthMm,heightMm}
}
export function uniformPdfPlacement(sourceWidthPt,sourceHeightPt,paperWidthPt,paperHeightPt,marginMm){
 for(const n of [sourceWidthPt,sourceHeightPt,paperWidthPt,paperHeightPt])if(!Number.isFinite(n)||n<=0)throw new Error('PDF 頁面幾何無效')
 if(!Number.isFinite(marginMm)||marginMm<0||marginMm>100)throw new Error('PDF 留白無效')
 const inset=marginMm*72/25.4
 const factor=Math.min((paperWidthPt-2*inset)/sourceWidthPt,(paperHeightPt-2*inset)/sourceHeightPt)
 if(!Number.isFinite(factor)||factor<=0)throw new Error('留白超過紙張可用尺寸')
 return {x:(paperWidthPt-sourceWidthPt*factor)/2,y:(paperHeightPt-sourceHeightPt*factor)/2,width:sourceWidthPt*factor,height:sourceHeightPt*factor,factor}
}
