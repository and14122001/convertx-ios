// Conservative DWG header preflight: header alone never proves entity fidelity or drawing units.
export const DWG_VERSIONS = Object.freeze({
 AC1012:'R13',AC1014:'R14',AC1015:'2000',AC1018:'2004',
 AC1021:'2007',AC1024:'2010',AC1027:'2013',AC1032:'2018'
})
export function inspectDwgHeader(bytes) {
 const data=bytes instanceof Uint8Array?bytes:new Uint8Array(bytes)
 if(data.length<6)throw new Error('DWG 標頭不完整')
 const code=String.fromCharCode(...data.subarray(0,6))
 if(!/^AC10[0-9]{2}$/.test(code))throw new Error('DWG 標頭無效')
 return {code,version:DWG_VERSIONS[code]??null,
  warnings:[
   ...(DWG_VERSIONS[code]?[]:['DWG 版本未列入已知版本表；解析能力待確認']),
   'DWG 標頭無法判定 INSUNITS、圖紙比例、圖元完整性或 XREF/字型缺失；不得據此推定實際單位',
   'PDF 匯出前須核對圖層、BLOCK/INSERT、TEXT/MTEXT、DIMENSION、HATCH 與外部參照'
  ]}
}
export function parseUnitChoice(value) {
 const allowed=['unknown','mm','cm','m','inch','foot']
 if(!allowed.includes(value))throw new Error('無效的單位選項')
 return value==='unknown'?{unit:null,warning:'原圖單位未確認：禁止將 PDF 視為具備可量測比例的工程圖'}:{unit:value,warning:'此為使用者指定單位，尚未核對 DWG INSUNITS 與 PDF 出圖比例'}
}
