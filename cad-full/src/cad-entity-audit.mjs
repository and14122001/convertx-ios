// Conservative inventory of the decoded LibreDWG model. A count is NOT proof of rendered PDF fidelity.
// Do not inspect entity payloads beyond type/handle, or infer units/visibility.
const CRITICAL=['INSERT','TEXT','MTEXT','ATTRIB','ATTDEF','SHAPE','DIMENSION','HATCH','LEADER','TOLERANCE','IMAGE','UNDERLAY','ACAD_PROXY_ENTITY']
function typeOfEntity(entity){
 const value=entity?.type
 return typeof value==='string'&&value.trim()?value.trim().toUpperCase():'UNKNOWN'
}
export function inspectDecodedCadEntities(model){
 const counts=Object.create(null),unknown=new Set(),seen=new Set()
 const modelAvailable=Array.isArray(model?.entities)
 const blockRecordsAvailable=Array.isArray(model?.tables?.BLOCK_RECORD?.entries)
 const uninspectableBlocks=[]
 let blockRecordCount=0
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
 for(const block of blockRecordsAvailable?model.tables.BLOCK_RECORD.entries:[]){
  blockRecordCount++
  if(Array.isArray(block?.entities)){for(const entity of block.entities)record(entity,'block')}
  else uninspectableBlocks.push(typeof block?.name==='string'?block.name:'未命名圖塊')
 }
 // A decoded INSERT name is only a candidate reference; never assert a missing
 // definition if the block table is unavailable or contains uninspectable entries.
 const definedNames=new Set()
 if(blockRecordsAvailable)for(const block of model.tables.BLOCK_RECORD.entries){
  if(typeof block?.name==='string'&&block.name.trim())definedNames.add(block.name.trim().toUpperCase())
 }
 const unresolvedInsertNames=new Set(),unnamedInsertCount={value:0}
 function inspectInsert(entity){
  if(typeOfEntity(entity)!=='INSERT')return
  const name=typeof entity.name==='string'?entity.name.trim():''
  if(!name){unnamedInsertCount.value++;return}
  if(blockRecordsAvailable&&!definedNames.has(name.toUpperCase()))unresolvedInsertNames.add(name.toUpperCase())
 }
 // Use the same decoded scopes as the entity inventory; no recursive expansion.
 for(const entity of Array.isArray(model?.entities)?model.entities:[])inspectInsert(entity)
 if(blockRecordsAvailable)for(const block of model.tables.BLOCK_RECORD.entries){
  for(const entity of Array.isArray(block?.entities)?block.entities:[])inspectInsert(entity)
 }
 const insertReferenceAudit={
  available:blockRecordsAvailable,
  unresolvedNames:blockRecordsAvailable?[...unresolvedInsertNames].sort():[],
  unnamedCount:unnamedInsertCount.value
 }
 const presentCritical=CRITICAL.filter(type=>counts[type]>0)
 const warnings=[
  '解析後圖元清單不等於 PDF 可見圖元；尚未驗證圖層可見性、圖塊展開、XREF 與布局',
  ...(!modelAvailable?['模型空間圖元清單未提供，無法確認模型空間圖元數量']:[]),
  ...(!blockRecordsAvailable?['圖塊定義表未提供，無法確認 BLOCK／INSERT 定義完整性']:[]),
  ...(uninspectableBlocks.length?['部分圖塊未提供可列舉圖元（'+uninspectableBlocks.length+' 個），不得視為空圖塊']:[]),
  ...(unknown.size?['發現未識別圖元類型，可能無法完整匯出']:[]),
  ...(counts.ACAD_PROXY_ENTITY?['發現代理圖元；LibreDWG／PDF 支援尚未確認']:[]),
  ...(counts.IMAGE||counts.UNDERLAY?['圖面包含外部影像或底圖；離線資產與 PDF 內容須另行核對']:[]),
  ...(counts.INSERT?['發現 INSERT；目前僅盤點定義與屬性，未核實巢狀展開、可見性或 PDF 實際輸出']:[]),
  ...(unnamedInsertCount.value?['有 '+unnamedInsertCount.value+' 個 INSERT 未提供可辨識圖塊名稱，無法核對定義']:[]),
  ...(unresolvedInsertNames.size?['INSERT 參照名稱未在已解碼 BLOCK_RECORD 中找到（'+unresolvedInsertNames.size+' 種）；可能為 XREF、未解碼或外部定義，不能認定圖元已遺失']:[]),
  ...(counts.DIMENSION||counts.HATCH?['發現 DIMENSION／HATCH；必須逐圖核對 PDF 幾何與樣式']:[])
 ]
 return {modelSpaceCount,blockDefinitionCount,attributeCount,totalUniqueEntities:seen.size,modelAvailable,blockRecordsAvailable,blockRecordCount,uninspectableBlockCount:uninspectableBlocks.length,insertReferenceAudit,counts:{...counts},presentCritical,warnings,scope:'decoded model and block definitions only; not a rendered PDF audit'}
}
export function formatDecodedCadAudit(audit){
 const summary=Object.entries(audit.counts).sort((a,b)=>b[1]-a[1]).map(([name,count])=>name+':'+count).join('、')||'無可列舉圖元'
 return 'DWG 解碼圖元盤點：模型 '+(audit.modelAvailable?audit.modelSpaceCount:'未知')+'、圖塊定義 '+(audit.blockRecordsAvailable?audit.blockDefinitionCount:'未知')+'、屬性 '+audit.attributeCount+'；'+summary+'。'+audit.warnings.join('；')
}
