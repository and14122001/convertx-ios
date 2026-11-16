/** The viewer returns false for some open failures instead of rejecting. */
export async function openVerifiedDocument(manager,name,bytes,options){
 const opened=await manager.openDocument(name,bytes,options)
 if(opened!==true)throw new Error('解析器未成功開啟圖面；禁止匯出先前的圖面')
}
