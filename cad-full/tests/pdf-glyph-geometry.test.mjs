import test from 'node:test'
import assert from 'node:assert/strict'
import {extractGlyphPrimitives} from '../src/pdf-glyph-geometry.ts'
function node(points,extra={}){return {geometry:{getAttribute:()=>({count:points.length,getX:i=>points[i][0],getY:i=>points[i][1],getZ:()=>0}),getIndex:()=>null},material:{color:{getHex:()=>0xff0000}},...extra}}
function scene(nodes){return {updateMatrixWorld(){},traverse(fn){nodes.forEach(fn)}}}
test('glyph triangles preserve world transform, insertion offset and inline color',()=>{
 const matrixWorld={elements:[2,0,0,0,0,2,0,0,0,0,1,0,100,50,0,1]}
 const result=extractGlyphPrimitives(scene([node([[0,0],[1,0],[0,1]],{isMesh:true,matrixWorld})]),100,50)
 assert.deepEqual([...result.primitives.triangles],[0,0,2,0,0,2])
 assert.equal(result.colorGroups[0].rgb,0xff0000)
 assert.deepEqual(result.box,{min:{x:0,y:0},max:{x:2,y:2}})
})
test('SHX line segments remain vector polylines, not filled triangles',()=>{
 const result=extractGlyphPrimitives(scene([node([[2,3],[5,7]],{isLine:true,isLineSegments:true})]),2,3)
 assert.deepEqual([...result.primitives.polylines],[2,0,0,3,4])
 assert.equal(result.primitives.triangles.length,0)
})
