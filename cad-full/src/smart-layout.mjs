import {PAPER_SIZES,resolvePaper} from './paper-sizes.mjs'

// Geometry ratio is obtained from the PDF renderer's actual drawable extents,
// not DWG header EXTMIN/EXTMAX or guessed CAD units.
export function recommendLayout(width,height,marginMm=10){
 if(!Number.isFinite(width)||!Number.isFinite(height)||width<=0||height<=0)throw new Error('無法取得有效的實際圖元邊界')
 if(!Number.isFinite(marginMm)||marginMm<0||marginMm>100)throw new Error('留白超出範圍')
 const ratio=width/height
 const preferred=['a4','a3','a2','a1','a0','letter','legal','tabloid','ansi-c','ansi-d','arch-c','arch-d']
 const candidates=[]
 for(const key of preferred){
  for(const orientation of ['portrait','landscape']){
   const paper=resolvePaper(key,orientation)
   const innerW=paper.widthMm-2*marginMm,innerH=paper.heightMm-2*marginMm
   if(innerW<=0||innerH<=0)continue
   const fit=Math.min(innerW/width,innerH/height)
   const occupancy=(width*fit)*(height*fit)/(innerW*innerH)
   // Prefer high utilization, then standard A4 to avoid arbitrary large paper.
   const score=occupancy-0.025*preferred.indexOf(key)
   candidates.push({key,orientation,paper,fit,occupancy,score})
  }
 }
 candidates.sort((a,b)=>b.score-a.score||preferred.indexOf(a.key)-preferred.indexOf(b.key))
 const best=candidates[0]
 if(!best)throw new Error('找不到可用紙張')
 return {...best,marginMm,ratio}
}
