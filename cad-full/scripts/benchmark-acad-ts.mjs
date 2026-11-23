// Isolated acad-ts DWG parser experiment. Run from cad-full after installing
// @node-projects/acad-ts@3.9.0 without changing production dependencies.
// node scripts/benchmark-acad-ts.mjs /absolute/path/to/sample.dwg
import {readFile} from 'node:fs/promises';
import {performance} from 'node:perf_hooks';
import {createHash} from 'node:crypto';
const input=process.argv[2];
if(!input || !/\.dwg$/i.test(input)){console.error('Usage: node scripts/benchmark-acad-ts.mjs sample.dwg');process.exit(2)}
let DwgReader;
try {({DwgReader}=await import('@node-projects/acad-ts'))}
catch(e){console.error('Install @node-projects/acad-ts@3.9.0 in cad-full first:',e.message);process.exit(2)}
const data=await readFile(input);
const magic=data.subarray(0,6).toString('ascii');
if(!/^AC10\d\d$/.test(magic)){console.error('Invalid DWG signature');process.exit(2)}
const notifications=[];
const start=performance.now();
let doc;
try{
 const bytes=data.buffer.slice(data.byteOffset,data.byteOffset+data.byteLength);
 // Fail closed: do not silently skip unreadable objects.
 const reader=new DwgReader(bytes,(_sender,event)=>notifications.push({type:String(event.notificationType),message:String(event.message)}));
 reader.configuration.failsafe=false;
 reader.configuration.keepUnknownEntities=true;
 reader.configuration.keepUnknownNonGraphicalObjects=true;
 doc=reader.read();
}catch(e){
 console.log(JSON.stringify({status:'parse_failed',magic,sizeBytes:data.length,sha256:createHash('sha256').update(data).digest('hex'),durationMs:Math.round(performance.now()-start),error:String(e),notifications},null,2));
 process.exit(1)
}
const counts={};
for(const entity of doc.modelSpace.entities){const kind=entity.constructor?.name??'Unknown';counts[kind]=(counts[kind]??0)+1}
const result={status:'parsed_not_verified',magic,sizeBytes:data.length,sha256:createHash('sha256').update(data).digest('hex'),durationMs:Math.round(performance.now()-start),nodeHeapUsedBytes:process.memoryUsage().heapUsed,entityCounts:counts,modelEntityTotal:Object.values(counts).reduce((a,b)=>a+b,0),notifications,limitations:['No independent geometry comparison','No PDF output validation','No iPhone Safari/PWA memory or offline test','No XREF/font/proxy completeness guarantee']};
console.log(JSON.stringify(result,null,2));
if(notifications.some(n=>/error|unsupported|not implemented|unknown/i.test(n.type+' '+n.message)))process.exitCode=1;
