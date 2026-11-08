// Independent PDF byte sanity gate. Not a rendering/fidelity or page-size proof.
export function inspectPdfBytes(input) {
 const bytes=input instanceof Uint8Array?input:new Uint8Array(input)
 if(bytes.length<32)throw new Error('PDF 檔案過短')
 const prefix=new TextDecoder('ascii').decode(bytes.subarray(0,8))
 if(!/^%PDF-1\.[0-7]\b|^%PDF-2\.0\b/.test(prefix))throw new Error('PDF 檔頭無效')
 const tail=new TextDecoder('ascii').decode(bytes.subarray(Math.max(0,bytes.length-2048)))
 if(!/%%EOF\s*$/.test(tail))throw new Error('PDF 結尾標記遺失或檔案遭截斷')
 return {byteLength:bytes.length,version:prefix.slice(5,8),warnings:[
  'PDF 檔頭與 EOF 僅為基本檢查，不能證明頁數、頁面尺寸、圖元保真或可正常開啟',
  '須以 PDF 解析器驗證 MediaBox、頁數、向量內容與實際列印比例'
 ]}
}
