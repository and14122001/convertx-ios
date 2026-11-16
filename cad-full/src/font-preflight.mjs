/** Read only decoded DWG metadata. Never treat a STYLE name as a font file. */
export function fontKey(name){return String(name??'').trim().replace(/\\/g,'/').split('/').pop().replace(/\.(shx|ttf|otf|woff2?)$/i,'').toLowerCase()}
export function inspectFontRequirements(model){
 const styles=model.tables?.STYLE?.entries??[]
 const byName=new Map(styles.map(s=>[s.name?.toLowerCase(),s]))
 const byHandle=new Map(styles.map(s=>[String(s.handle).toUpperCase(),s]))
 const dims=new Map((model.tables?.DIMSTYLE?.entries??[]).map(s=>[s.name?.toLowerCase(),s]))
 const requirements=new Map(),unresolved=new Set(),used=new Set(),seen=new Set(),counts={}
 function addFont(name,style){
  if(!String(name??'').trim())return
  const key=fontKey(name)
  if(!key)return
  let item=requirements.get(key)
  if(!item){item={key,name,styles:new Set()};requirements.set(key,item)}
  item.styles.add(style)
 }
 function addStyle(style,name){
  if(!style){unresolved.add(name||'(未指定樣式)');return}
  used.add(style.name)
  // extendedFont is an alternative when the original primary filename is empty.
  if(!style.font&&!style.extendedFont)unresolved.add(style.name)
  addFont(style.font||style.extendedFont,style.name)
  addFont(style.bigFont,style.name)
 }
 function visit(e){
  const id=e.handle||e
  if(seen.has(id))return
  seen.add(id);counts[e.type]=(counts[e.type]??0)+1
  if(['TEXT','MTEXT','ATTRIB','ATTDEF','SHAPE'].includes(e.type)){
   const name=e.styleName||'STANDARD';addStyle(byName.get(name.toLowerCase()),name)
  }
  if(['DIMENSION','LEADER','TOLERANCE'].includes(e.type)){
   const dim=dims.get((e.styleName||'STANDARD').toLowerCase())
   if(dim?.DIMTXSTY){
    const ref=dim.DIMTXSTY
    const handle=typeof ref==='number'?ref.toString(16).toUpperCase():String(ref).toUpperCase()
    addStyle(byHandle.get(handle)||byName.get(String(ref).toLowerCase()),String(ref))
   }
  }
  // INSERT attributes can be nested rather than separate model.entities entries.
  for(const child of e.attribs??[])visit(child)
 }
 for(const e of model.entities??[])visit(e)
 for(const block of model.tables?.BLOCK_RECORD?.entries??[])for(const e of block.entities??[])visit(e)
 return {requirements:[...requirements.values()].map(x=>({...x,styles:[...x.styles]})),unresolved:[...unresolved],styleCount:styles.length,usedStyleCount:used.size,entityCount:seen.size,counts,scope:'all block definitions; not a visible model-space count'}
}
export function formatFontPreflight(report,missing){
 const lines=missing.map(f=>`${f.name}（${f.styles.length} 個樣式）`)
 return `字型預檢：缺少 ${missing.length} 個原圖字型，已停止於預覽之前。\n${lines.join('、')}\n請載入原圖 SHX／TTF，再重新選取 DWG。未自動替代字型。${report.unresolved.length?'\n另有 '+report.unresolved.length+' 個樣式無法解析字型來源。':''}`
}
/** Same gate used by the browser converter and the local real-DWG regression. */
export async function preflightParsedDrawing(result,loadFonts,isAvailable,onReport){
 if(!result.model)return result
 const report=inspectFontRequirements(result.model)
 await loadFonts(report.requirements.map(f=>f.key))
 const missing=report.requirements.filter(f=>!isAvailable(f.key))
 onReport(report,missing)
 if(missing.length)throw new Error(formatFontPreflight(report,missing))
 return result
}
