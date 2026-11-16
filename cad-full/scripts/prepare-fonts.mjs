import {readFile,writeFile,mkdir} from 'node:fs/promises'
import {createHash} from 'node:crypto'
import {fileURLToPath} from 'node:url'
const root=new URL('../public/',import.meta.url)
const url='https://raw.githubusercontent.com/notofonts/noto-cjk/523d033d6cb47f4a80c58a35753646f5c3608a78/Sans/SubsetOTF/TC/NotoSansTC-Regular.otf'
const expected='5bab0cb3c1cf89dde07c4a95a4054b195afbcfe784d69d75c340780712237537'
const destination=new URL('fonts/NotoSansTC-Regular.otf',root)
const digest=bytes=>createHash('sha256').update(bytes).digest('hex')
let bytes
try{bytes=await readFile(destination)}catch{}
if(!bytes||digest(bytes)!==expected){
 const response=await fetch(url,{signal:AbortSignal.timeout(90000)})
 if(!response.ok)throw new Error('Pinned OFL font download failed: '+response.status)
 bytes=Buffer.from(await response.arrayBuffer())
 if(digest(bytes)!==expected)throw new Error('Pinned font SHA256 mismatch; build stopped')
 await mkdir(new URL('fonts/',root),{recursive:true});await writeFile(destination,bytes)
}
const license=await readFile(new URL('legal/NOTO-OFL.txt',root),'utf8')
if(!license.includes('SIL OPEN FONT LICENSE Version 1.1'))throw new Error('OFL license missing')
console.log('PASS pinned Noto Sans TC',bytes.length,'bytes',expected,fileURLToPath(destination))
