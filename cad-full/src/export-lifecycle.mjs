/** Bounds asynchronous export waits. A timeout does not terminate upstream work. */
export class ExportTimeoutError extends Error {}
export async function withDeadline(task,timeoutMs,label){
 let timer
 try{
  return await Promise.race([
   Promise.resolve().then(task),
   new Promise((_,reject)=>{timer=setTimeout(()=>reject(new ExportTimeoutError(label+'逾時；請停止並重新載入，避免背景工作與下一次匯出重疊')),timeoutMs)})
  ])
 }finally{clearTimeout(timer)}
}
export async function requireRenderIdle(view,timeoutMs=60000){
 const idle=await withDeadline(()=>view.waitUntilIdle(timeoutMs),timeoutMs+250,'圖面渲染')
 if(!idle)throw new ExportTimeoutError('圖面文字／圖塊仍在渲染，尚未開始 PDF。請停止並重新載入。')
}
export function missingFontMessage(fonts,characters=[]){
 const names=[...new Set(fonts)]
 if(!names.length&&!characters.length)return ''
 return '停止匯出：缺少字型 '+(names.join(', ')||'無')+'；缺字 '+(characters.join(' ')||'未回報')+'。請載入原圖字型後重新開啟 DWG；選擇 Big5 只設定編碼，不會提供字型。'
}
