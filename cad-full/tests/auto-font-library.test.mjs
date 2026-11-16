import {test} from 'node:test'
import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
import {createHash} from 'node:crypto'
import {AUTO_FONT,resolveFont,applyStyleMappings,mapInlineFonts} from '../src/font-policy.mjs'

test('automatic fallback preserves originals and manual priority, including path/case aliases',()=>{
 const loaded=n=>[AUTO_FONT,'simplex','manual'].includes(n)
 assert.equal(resolveFont('C:/CAD/SIMPLEX.SHX',{},loaded,'auto'),'simplex')
 assert.equal(resolveFont('romanc.shx',{romanc:'manual'},loaded,'auto'),'manual')
 for(const n of ['simplex1.shx','Microsoft JhengHei Light','danny','UnknownStyle'])assert.equal(resolveFont(n,{},loaded,'auto'),AUTO_FONT)
 assert.throws(()=>resolveFont('danny',{},loaded,'original'),/缺少/)
 assert.throws(()=>resolveFont('danny',{},()=>false,'auto'),/缺少/)
 assert.throws(()=>resolveFont('danny',{danny:'missing'},loaded,'auto'),/缺少/)
 assert.equal(mapInlineFonts('\\fUnknown|b0;文字',{},loaded,'auto'),'\\f'+AUTO_FONT+'|b0;文字')
})
test('automatic mode updates missing primary/bigfont and unresolved style without editing loaded original',()=>{
 const model={tables:{STYLE:{entries:[{name:'known',font:'simplex'},{name:'missing',font:'danny',bigFont:'chineset'},{name:'unresolved',font:''}]}}}
 applyStyleMappings(model,{},n=>[AUTO_FONT,'simplex'].includes(n),'auto')
 assert.equal(model.tables.STYLE.entries[0].font,'simplex')
 assert.equal(model.tables.STYLE.entries[1].font,AUTO_FONT)
 assert.equal(model.tables.STYLE.entries[1].bigFont,AUTO_FONT)
 assert.equal(model.tables.STYLE.entries[2].font,AUTO_FONT)
})
test('pinned bundled font has OFL license and real Latin/Traditional Chinese vector glyphs',async()=>{
 const bytes=await readFile(new URL('../public/fonts/NotoSansTC-Regular.otf',import.meta.url))
 assert.equal(createHash('sha256').update(bytes).digest('hex'),'5bab0cb3c1cf89dde07c4a95a4054b195afbcfe784d69d75c340780712237537')
 const {FontManager}=await import('@mlightcad/mtext-renderer')
 const manager=FontManager.instance;manager.enableFontCache=false
 manager.baseUrl='https://local.test/fonts/'
 const oldFetch=globalThis.fetch
 const oldProgressEvent=globalThis.ProgressEvent
 globalThis.ProgressEvent=class extends Event{constructor(type,init){super(type);Object.assign(this,init)}}
 globalThis.fetch=async url=>{
  const name=new URL(typeof url==='string'?url:url.url).pathname.split('/').pop()
  if(name==='fonts.json')return new Response(await readFile(new URL('../public/fonts/fonts.json',import.meta.url)))
  if(name==='NotoSansTC-Regular.otf')return new Response(bytes)
  throw new Error('Unexpected network access '+url)
 }
 try{
  const result=await manager.loadFontsByNames([AUTO_FONT]);assert.equal(result[0].status,'Success',JSON.stringify(result))
  assert.equal(manager.isFontLoaded(AUTO_FONT),true)
  for(const char of 'ABC123臺灣醫療氣體平面圖±°Ø'){
   const glyph=manager.getCharShape(char,AUTO_FONT,10)
   assert.ok(glyph,'missing glyph '+char)
   assert.ok(glyph.width>0,'empty width '+char)
   assert.ok(glyph.toGeometry().getAttribute('position').count>0,'empty vector glyph '+char)
  }
  assert.deepEqual(manager.unsupportedChars,{})
 }finally{globalThis.fetch=oldFetch;globalThis.ProgressEvent=oldProgressEvent}
 const license=await readFile(new URL('../public/legal/NOTO-OFL.txt',import.meta.url),'utf8')
 assert.match(license,/SIL OPEN FONT LICENSE Version 1.1/)
})

test('automatic replacement never rewrites SHAPE symbol font styles',()=>{
 const style={name:'symbol',font:'custom.shx',standardFlag:1}
 applyStyleMappings({tables:{STYLE:{entries:[style]}}},{},()=>true,'auto')
 assert.equal(style.font,'custom.shx')
})
