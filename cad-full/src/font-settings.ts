import {FontManager} from '@mlightcad/mtext-renderer'
import {cleanMappings} from './font-policy.mjs'
import {fontKey} from './font-preflight.mjs'
const KEY='convertx-font-settings-v1'
export function createFontSettings(onChange:()=>void,notify:(s:string)=>void,isBusy:()=>boolean){
 let mapping:Record<string,string>=Object.create(null)
 try{mapping=cleanMappings(JSON.parse(localStorage.getItem(KEY)||'{}'))}catch{}
 const source=document.getElementById('map-source') as HTMLInputElement
 const target=document.getElementById('map-target') as HTMLSelectElement
 const list=document.getElementById('font-library')!
 const mappings=document.getElementById('font-mappings')!
 const mode=document.getElementById('font-mode') as HTMLSelectElement
 function persist(){try{localStorage.setItem(KEY,JSON.stringify(mapping))}catch{notify('替代設定僅本次有效：瀏覽器無法保存設定')}}
 function paint(){
  mappings.replaceChildren()
  for(const [from,to] of Object.entries(mapping)){
   const row=document.createElement('div'),button=document.createElement('button')
   row.append(document.createTextNode(from+' → '+to+' '));button.textContent='移除此對應'
   button.onclick=()=>{if(isBusy())return;delete mapping[from];persist();paint();onChange()};row.append(button);mappings.append(row)
  }
 }
 async function refresh(){
  FontManager.instance.baseUrl=new URL('./',location.href).href
  const entries=(await FontManager.instance.getAvailableFonts()).filter(e=>e.source==='cache')
  target.replaceChildren();list.replaceChildren()
  const names=new Set<string>()
  for(const entry of entries){
   const row=document.createElement('div');row.textContent=entry.name.join(' / ')+' · '+entry.type+(entry.encoding?' · '+entry.encoding:'');list.append(row)
   for(const name of entry.name)if(!names.has(name)){names.add(name);target.add(new Option(name,name))}
  }
  if(!entries.length)list.textContent='尚無本機字型。請先匯入 SHX／TTF／OTF／WOFF／TTC。'
  paint()
 }
 document.getElementById('map-save')!.onclick=async()=>{
  if(isBusy())return
  const from=fontKey(source.value),to=target.value
  if(!from||!to){notify('請輸入原字型名稱並選擇已匯入的替代字型');return}
  try{
   await FontManager.instance.loadFontsByNames([to])
   if(!FontManager.instance.isFontLoaded(to))throw new Error('替代字型尚未成功載入')
   mapping=cleanMappings({...mapping,[from]:to});persist();paint();onChange()
   notify('已保存對應。請選擇「明確替代字型」模式，再重新開啟 DWG；不同字型可能改變字寬與排版。')
  }catch(e){notify(String(e))}
 }
 let previousMode=mode.value
 mode.onchange=()=>{if(isBusy()){mode.value=previousMode;return}previousMode=mode.value;onChange();notify('輸出模式已變更，請重新開啟 DWG，避免沿用舊字形。')}
 void refresh().catch(e=>notify('無法讀取本機字型庫：'+String(e)))
 return {refresh,get mapping(){return mode.value==='substitute'?mapping:{}},get mode(){return mode.value},suggest(names:string[]){const d=document.getElementById('font-sources')!;d.replaceChildren();for(const n of [...new Set(names)]){const o=document.createElement('option');o.value=n;d.append(o)}}}
}
