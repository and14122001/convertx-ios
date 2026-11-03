export type CadFileKind='DWG'|'DXF'
export function validateCadFile(filename:string,bytes:ArrayBuffer):CadFileKind {
  if(bytes.byteLength===0)throw new Error('檔案為空')
  const name=filename.toLowerCase()
  if(name.endsWith('.dwg')){
    if(bytes.byteLength<6)throw new Error('DWG 標頭不完整')
    const header=new TextDecoder('ascii').decode(bytes.slice(0,6))
    if(!/^AC10\d{2}$/.test(header))throw new Error('DWG 標頭無效（預期 AC10xx）')
    return 'DWG'
  }
  if(name.endsWith('.dxf')){
    const sample=new Uint8Array(bytes,0,Math.min(bytes.byteLength,64))
    const text=new TextDecoder('ascii').decode(sample)
    if(text.startsWith('AutoCAD Binary DXF'))return 'DXF'
    if(!/^\s*0\s*(?:\r?\n)\s*SECTION\b/.test(text)&&!text.includes('SECTION'))throw new Error('DXF 缺少 SECTION 標頭')
    return 'DXF'
  }
  throw new Error('僅支援 .dwg 或 .dxf')
}
