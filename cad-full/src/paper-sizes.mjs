// Paper presets in millimetres. Do not infer CAD drawing units from these sizes.
export const PAPER_SIZES = Object.freeze({
 '4a0':[1682,2378],'2a0':[1189,1682],
 'a0':[841,1189],
 'a1':[594,841],
 'a2':[420,594],
 'a3':[297,420],
 'a4':[210,297],
 'a5':[148,210],
 'a6':[105,148],
 'a7':[74,105],
 'a8':[52,74],
 'a9':[37,52],
 'a10':[26,37],
 'b0':[1000,1414],
 'b1':[707,1000],
 'b2':[500,707],
 'b3':[353,500],
 'b4':[250,353],
 'b5':[176,250],
 'b6':[125,176],
 'b7':[88,125],
 'b8':[62,88],
 'b9':[44,62],
 'b10':[31,44],
 'c0':[917,1297],
 'c1':[648,917],
 'c2':[458,648],
 'c3':[324,458],
 'c4':[229,324],
 'c5':[162,229],
 'c6':[114,162],
 'c7':[81,114],
 'c8':[57,81],
 'c9':[40,57],
 'c10':[28,40],
 'letter':[215.9,279.4],'legal':[215.9,355.6],'tabloid':[279.4,431.8],'executive':[184.15,266.7],
 'ansi-a':[215.9,279.4],'ansi-b':[279.4,431.8],'ansi-c':[431.8,558.8],'ansi-d':[558.8,863.6],'ansi-e':[863.6,1117.6],'ansi-f':[711.2,1016],
 'arch-a':[228.6,304.8],'arch-b':[304.8,457.2],'arch-c':[457.2,609.6],'arch-d':[609.6,914.4],'arch-e':[914.4,1219.2],'arch-e1':[762,1066.8],'arch-e2':[660.4,965.2],'arch-e3':[685.8,990.6],
 'jis-b0':[1030,1456],'jis-b1':[728,1030],'jis-b2':[515,728],'jis-b3':[364,515],'jis-b4':[257,364],'jis-b5':[182,257],'jis-b6':[128,182],'jis-b7':[91,128],'jis-b8':[64,91],'jis-b9':[45,64],'jis-b10':[32,45]
})
export function resolvePaper(value,orientation='portrait',customWidth,customHeight){
 if(value==='extents')return 'extents'
 const dimensions=value==='custom'?[Number(customWidth),Number(customHeight)]:PAPER_SIZES[value]
 if(!dimensions)throw new Error('不支援的紙張規格')
 const [w,h]=dimensions
 if(!Number.isFinite(w)||!Number.isFinite(h)||w<=0||h<=0||w>5000||h>5000)throw new Error('自訂紙張必須為 0–5000 mm 內的有效正數')
 if(!['portrait','landscape'].includes(orientation))throw new Error('不支援的紙張方向')
 return {widthMm:orientation==='landscape'?Math.max(w,h):Math.min(w,h),heightMm:orientation==='landscape'?Math.min(w,h):Math.max(w,h)}
}
