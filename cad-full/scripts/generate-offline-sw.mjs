#!/usr/bin/env node
import { readdirSync, statSync, writeFileSync, readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { join, relative, sep } from 'node:path'
const root='dist'
function collect(dir){return readdirSync(dir,{withFileTypes:true}).flatMap(e=>{const p=join(dir,e.name);return e.isDirectory()?collect(p):[p]})}
const files=collect(root).filter(p=>!p.endsWith('sw.js')).map(p=>relative(root,p).split(sep).join('/'))
const total=files.reduce((n,p)=>n+statSync(join(root,p)).size,0)
if(total>150*1024*1024)throw new Error('Offline bundle exceeds 150 MiB; inspect WASM and chunks before shipping')
const hash=createHash('sha256');for(const file of files.sort())hash.update(file).update(readFileSync(join(root,file)))
const cacheName='convertx-cad-full-'+hash.digest('hex').slice(0,16)
const source=`const CACHE=${JSON.stringify(cacheName)};const ASSETS=${JSON.stringify(['./',...files.map(x=>'./'+x)])};
self.addEventListener('install',event=>event.waitUntil((async()=>{const cache=await caches.open(CACHE);for(const asset of ASSETS){const response=await fetch(asset,{cache:'reload'});if(!response.ok)throw Error('offline asset '+asset+' '+response.status);await cache.put(asset,response)}await self.skipWaiting()})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{for(const key of await caches.keys())if(key.startsWith('convertx-cad-full-')&&key!==CACHE)await caches.delete(key);await self.clients.claim()})()));
self.addEventListener('fetch',event=>{if(event.request.method!=='GET'||new URL(event.request.url).origin!==self.location.origin)return;event.respondWith((async()=>{const hit=await caches.match(event.request);return hit||fetch(event.request)})())});`
writeFileSync(join(root,'sw.js'),source)
console.log('Offline manifest:',files.length,'files,',total,'bytes')
