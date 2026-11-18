// PDF geometry policy, independent of DOM and CAD units.
// PDF 1.x user-space page size limit is 14,400 points per side.
export const MAX_PDF_PAGE_PT=14400
export function requirePdfPage(widthPt,heightPt,label='PDF'){
 if(!Number.isFinite(widthPt)||!Number.isFinite(heightPt)||widthPt<=0||heightPt<=0)throw new Error(label+' 頁面尺寸無效')
 if(widthPt>MAX_PDF_PAGE_PT||heightPt>MAX_PDF_PAGE_PT)throw new Error(label+' 頁面超過 14400 pt，停止匯出')
 return {widthPt,heightPt}
}
export function requireSinglePage(doc,label='PDF'){
 const count=doc.getPageCount()
 if(count!==1)throw new Error(label+' 目前僅支援單頁（實際 '+count+' 頁），停止匯出')
 const page=doc.getPage(0)
 requirePdfPage(page.getWidth(),page.getHeight(),label)
 return page
}
export function requirePaperMargin(paper,marginMm){
 if(!Number.isFinite(marginMm)||marginMm<0||marginMm>100)throw new Error('留白需為 0–100 mm')
 if(paper==='extents')return
 if(!paper||!Number.isFinite(paper.widthMm)||!Number.isFinite(paper.heightMm)||paper.widthMm<=0||paper.heightMm<=0)throw new Error('紙張尺寸無效')
 if(paper.widthMm<=marginMm*2||paper.heightMm<=marginMm*2)throw new Error('留白超過紙張可用尺寸')
 requirePdfPage(paper.widthMm*72/25.4,paper.heightMm*72/25.4,'指定紙張')
}
