import {fontKey} from './font-preflight.mjs'
export function cleanMappings(value){
 const out=Object.create(null)
 if(!value||typeof value!=='object'||Array.isArray(value))return out
 for(const [source,target] of Object.entries(value)){
  const key=fontKey(source)
  if(key&&typeof target==='string'&&target.trim()&&key!=='__proto__'&&key!=='constructor'&&key!=='prototype')out[key]=target.trim()
 }
 return out
}
export function resolveFont(name,mapping,isLoaded,mode='original'){
 if(!name)return name
 if(isLoaded(name))return name
 const key=fontKey(name)
 if(isLoaded(key))return key
 const target=mode==='substitute'?mapping[key]:undefined
 if(target&&isLoaded(target))return target
 throw new Error('缺少可用字型：'+name+'；請載入原字型或明確指定已載入的替代字型')
}
export function mapGlyphStyle(style,mapping,isLoaded,mode){
 const result={...style}
 for(const key of ['font','bigFont','extendedFont'])if(result[key])result[key]=resolveFont(result[key],mapping,isLoaded,mode)
 return result
}
export function mapInlineFonts(text,mapping,isLoaded,mode){
 return text.replace(/\\([fF])([^;|]+)((?:\|[^;]*)?);/g,(_all,op,name,rest)=>'\\'+op+resolveFont(name,mapping,isLoaded,mode)+rest+';')
}
export function requireMappedFonts(names,mapping,isLoaded,mode){
 return [...new Set(names.filter(Boolean))].map(name=>({source:name,target:resolveFont(name,mapping,isLoaded,mode)}))
}
/** Apply explicit replacements only to this in-memory decoded model; never write the source file. */
export function applyStyleMappings(model,mapping,isLoaded,mode){
 if(mode!=='substitute')return
 for(const style of model.tables?.STYLE?.entries??[]){
  for(const field of ['font','bigFont','extendedFont']){
   const name=style[field],target=mapping[fontKey(name)]
   if(name&&target&&isLoaded(target)&&!isLoaded(name))style[field]=target
  }
  if(!style.font&&!style.extendedFont){const target=mapping[fontKey(style.name)];if(target&&isLoaded(target))style.font=target}
 }
}
