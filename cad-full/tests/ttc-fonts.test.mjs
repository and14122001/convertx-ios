import {test} from 'node:test'
import assert from 'node:assert/strict'
import {extractTtcFaces} from '../src/ttc-fonts.mjs'
function fixture(){const b=new ArrayBuffer(80),v=new DataView(b);v.setUint32(0,0x74746366);v.setUint32(4,0x10000);v.setUint32(8,2);v.setUint32(12,20);v.setUint32(16,48);for(const p of [20,48]){v.setUint32(p,0x10000);v.setUint16(p+4,1);v.setUint32(p+12,0x68656164);v.setUint32(p+20,68);v.setUint32(p+24,12)}return b}
test('two TTC faces become independent SFNT buffers with valid total checksums',()=>{
 const b=fixture(),before=new Uint8Array(b).slice(),faces=extractTtcFaces(b)
 assert.equal(faces.length,2);assert.notEqual(faces[0].bytes.buffer,faces[1].bytes.buffer)
 for(const face of faces){const v=new DataView(face.bytes.buffer);let s=0;for(let i=0;i<v.byteLength;i+=4)s=(s+v.getUint32(i))>>>0;assert.equal(s,0xb1b0afba);assert.equal(v.getUint32(20),28)}
 assert.deepEqual(new Uint8Array(b),before)
})
test('invalid signatures, out-of-bounds tables and excessive face counts fail before allocation',()=>{
 assert.throws(()=>extractTtcFaces(new ArrayBuffer(4)),/範圍/)
 const b=fixture(),v=new DataView(b);v.setUint32(8,1000);assert.throws(()=>extractTtcFaces(b),/數量/)
 v.setUint32(8,2);v.setUint32(40,9999);assert.throws(()=>extractTtcFaces(b),/範圍/)
})
