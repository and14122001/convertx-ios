import {test} from 'node:test'
import assert from 'node:assert/strict'
import {PAPER_SIZES,resolvePaper} from '../src/paper-sizes.mjs'
test('standard paper dimensions',()=>{
 assert.deepEqual(resolvePaper('a0'),{widthMm:841,heightMm:1189})
 assert.deepEqual(resolvePaper('a4'),{widthMm:210,heightMm:297})
 assert.deepEqual(resolvePaper('ansi-d'),{widthMm:558.8,heightMm:863.6})
 assert.deepEqual(resolvePaper('arch-e'),{widthMm:914.4,heightMm:1219.2})
 assert.deepEqual(resolvePaper('jis-b4'),{widthMm:257,heightMm:364})
 assert.ok(Object.keys(PAPER_SIZES).length>=65)
})
test('orientation and extents',()=>{
 assert.equal(resolvePaper('extents'),'extents')
 assert.deepEqual(resolvePaper('a4','landscape'),{widthMm:297,heightMm:210})
 assert.deepEqual(resolvePaper('custom','landscape',100,200),{widthMm:200,heightMm:100})
})
test('invalid custom sizes and unknown presets rejected',()=>{
 for(const [w,h] of [[0,200],[-1,200],[Infinity,200],[5001,200],['bad',200]])assert.throws(()=>resolvePaper('custom','portrait',w,h))
 assert.throws(()=>resolvePaper('nope'))
 assert.throws(()=>resolvePaper('a4','diagonal'))
})
