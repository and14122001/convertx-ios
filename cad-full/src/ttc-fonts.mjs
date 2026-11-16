// Extract standalone SFNT faces from local TTC collections. No network or font substitution.
const align=n=>(n+3)&~3
function sum(bytes){const v=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);let n=0;for(let i=0;i<bytes.length;i+=4)n=(n+v.getUint32(i))>>>0;return n}
export function extractTtcFaces(input){
 const bytes=new Uint8Array(input),v=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength)
 const range=(offset,length)=>{if(!Number.isInteger(offset)||offset<0||length<0||offset+length>bytes.length)throw new Error('TTC 字型資料超出檔案範圍')}
 range(0,12)
 if(v.getUint32(0)!==0x74746366)throw new Error('不是 TTC 字型集合')
 if(![0x10000,0x20000].includes(v.getUint32(4)))throw new Error('不支援的 TTC 版本')
 const count=v.getUint32(8);if(count<1||count>32)throw new Error('TTC 字體數量超出限制（1–32）')
 range(12,count*4);let totalBytes=0;const faces=[]
 for(let f=0;f<count;f++){
  const offset=v.getUint32(12+f*4);range(offset,12)
  const type=v.getUint32(offset);if(type!==0x10000&&type!==0x4f54544f)throw new Error('不支援的 SFNT 類型')
  const n=v.getUint16(offset+4);if(n<1||n>256)throw new Error('SFNT table 數量異常')
  range(offset+12,n*16);let size=12+16*n;const entries=[],tags=new Set()
  for(let i=0;i<n;i++){
   const p=offset+12+i*16,tag=v.getUint32(p),start=v.getUint32(p+8),length=v.getUint32(p+12)
   range(start,length);if(tags.has(tag))throw new Error('重複 SFNT table');tags.add(tag)
   // Removing a collection's digital signature avoids presenting a stale signature.
   if(tag===0x44534947)continue
   entries.push({tag,start,length});size+=align(length)
  }
  size=12+entries.length*16+entries.reduce((n,e)=>n+align(e.length),0)
  totalBytes+=size;if(totalBytes>256*1024*1024)throw new Error('TTC 展開超過 256 MiB')
  const out=new Uint8Array(size),w=new DataView(out.buffer),m=entries.length
  w.setUint32(0,type);w.setUint16(4,m);const p2=2**Math.floor(Math.log2(m));w.setUint16(6,p2*16);w.setUint16(8,Math.log2(p2));w.setUint16(10,m*16-p2*16)
  let target=12+m*16,head=-1,name='face-'+(f+1)
  for(let i=0;i<m;i++){
   const e=entries[i],p=12+i*16;out.set(bytes.subarray(e.start,e.start+e.length),target)
   if(e.tag===0x68656164){if(e.length<12)throw new Error('無效 head table');head=target;w.setUint32(head+8,0)}
   if(e.tag===0x6e616d65&&e.length>=6){
    const nv=new DataView(bytes.buffer,bytes.byteOffset+e.start,e.length),records=nv.getUint16(2),strings=nv.getUint16(4)
    if(6+records*12<=e.length)for(let j=0;j<records;j++){
     const q=6+j*12,platform=nv.getUint16(q),id=nv.getUint16(q+6),len=nv.getUint16(q+8),pos=strings+nv.getUint16(q+10)
     if(id===4&&(platform===0||platform===3)&&pos+len<=e.length){name=new TextDecoder('utf-16be').decode(bytes.subarray(e.start+pos,e.start+pos+len));break}
    }
   }
   w.setUint32(p,e.tag);w.setUint32(p+4,sum(out.subarray(target,target+align(e.length))));w.setUint32(p+8,target);w.setUint32(p+12,e.length);target+=align(e.length)
  }
  if(head<0)throw new Error('SFNT 缺少 head table')
  w.setUint32(head+8,(0xb1b0afba-sum(out))>>>0)
  faces.push({name,extension:type===0x4f54544f?'otf':'ttf',bytes:out})
 }
 return faces
}
