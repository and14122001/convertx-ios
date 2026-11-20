// Local-only fingerprints for reproducible DWG/PDF comparison.
// A matching digest proves byte identity, NOT drawing fidelity.
export async function sha256Hex(data, subtle=globalThis.crypto?.subtle){
 if(!(data instanceof ArrayBuffer)&&!ArrayBuffer.isView(data))throw new TypeError('SHA-256 需要 ArrayBuffer 或 TypedArray')
 if(!subtle||typeof subtle.digest!=='function')throw new Error('此瀏覽器不支援本機 SHA-256')
 const bytes=data instanceof ArrayBuffer?new Uint8Array(data):new Uint8Array(data.buffer,data.byteOffset,data.byteLength)
 const digest=await subtle.digest('SHA-256',bytes)
 return Array.from(new Uint8Array(digest),x=>x.toString(16).padStart(2,'0')).join('')
}
