// Conservative inventory of the decoded LibreDWG model. A count is NOT proof of rendered PDF fidelity.
// Do not inspect entity payloads beyond type/handle, or infer units/visibility.
const CRITICAL=['INSERT','TEXT','MTEXT','ATTRIB','ATTDEF','SHAPE','DIMENSION','HATCH','LEADER','TOLERANCE','IMAGE','UNDERLAY','ACAD_PROXY_ENTITY']
function typeOfEntity(entity){
 const value=entity?.type
 return typeof value==='string'&&value.trim()?value.trim().toUpperCase():'UNKNOWN'
}
export function inspectDecodedCadEntities(model){
 const counts=Object.create(null),unknown=new Set(),seen=new Set()
 let modelSpaceCount=0,blockDefinitionCount=0,attributeCount=0
 function record(entity,scope){
  if(!entity||typeof entity!=='object')return
  if(seen.has(entity))return
  seen.add(entity)
  const type=typeOfEntity(entity)
  counts[type]=(counts[type]??0)+1
  if(type==='UNKNOWN')unknown.add(type)
  if(scope==='model')modelSpaceCount++
  else if(scope==='block')blockDefinitionCount++
  else attributeCount++
  if(Array.isArray(entity.attribs))for(const child of entity.attribs)record(child,'attribute')
 }
 for(const entity of Array.isArray(model?.entities)?model.entities:[])record(entity,'model')
 for(const block of model?.tables?.BLOCK_RECORD?.entries??[]){
  if(Array.isArray(block?.entities))for(const entity of block.entities)record(entity,'block')
 }
 const presentCritical=CRITICAL.filter(type=>counts[type]>0)
 const warnings=[
  '解析後圖元清單不等於 PDF 可見圖元；尚未驗證圖層可見性、圖塊展開、XREF 與布局',
  ...(unknown.size?['發現未識別圖元類型，可能無法完整匯出']:[]),
  ...(counts.ACAD_PROXY_ENTITY?['發現代理圖元；LibreDWG／PDF 支援尚未確認']:[]),
  ...(counts.IMAGE||counts.UNDERLAY?['圖面包含外部影像或底圖；離線資產與 PDF 內容須另行核對']:[])
 ]
 return {modelSpaceCount,blockDefinitionCount,attributeCount,totalUniqueEntities:seen.size,counts:{...counts},presentCritical,warnings,scope:'decoded model and block definitions only; not a rendered PDF audit'}
}
export function formatDecodedCadAudit(audit){
 const summary=Object.entries(audit.counts).sort((a,b)=>b[1]-a[1]).map(([name,count])=>name+':'+count).join('、')||'無可列舉圖元'
 return 'DWG 解碼圖元盤點：模型 '+audit.modelSpaceCount+'、圖塊定義 '+audit.blockDefinitionCount+'、屬性 '+audit.attributeCount+'；'+summary+'。'+audit.warnings.join('；')
}
