import {FontManager} from '@mlightcad/mtext-renderer'
import {mapGlyphStyle,mapInlineFonts} from './font-policy.mjs'
// SPDX-License-Identifier: MIT
// Derived from MLightCAD v1.7.8 c6c14f90; see public/legal/MLIGHTCAD-MIT.txt.
import type {
  AcGiMTextData,
  AcGiShapeData,
  AcGiTextStyle
} from '@mlightcad/data-model'
import { MTextColor } from '@mlightcad/mtext-parser'
import type {
  AcPdfGlyphBox,
  AcPdfGlyphColorGroup,
  AcPdfGlyphColorSettings,
  AcPdfGlyphPrimitives,
  AcPdfGlyphProvider
} from '@mlightcad/pdf-renderer'
import { AcTrMTextRenderer } from '@mlightcad/three-renderer'

import {extractGlyphPrimitives, type SceneNode} from './pdf-glyph-geometry'

/**
 * Turns the viewer's already-initialized mtext renderer into PDF glyph
 * geometry so TEXT/MTEXT are not dropped during export.
 *
 * Geometry is emitted as flat float32 buffers relative to the text's own
 * insertion point. Large drawings carry tens of thousands of MTEXT instances;
 * the previous per-triangle object graphs (`{x, y}` points inside
 * per-primitive arrays) retained ~25 objects per triangle in the renderer's
 * glyph cache and exhausted the tab's heap. Buffers are shared by reference
 * across identical texts, so a drawing's unique text content costs ~24 bytes
 * per triangle.
 */
export function createViewerPdfGlyphProvider(onFailure: (message: string) => void = () => {},mapping:Record<string,string>={},mode='original'): AcPdfGlyphProvider {
  const empty: AcPdfGlyphPrimitives = {
    triangles: new Float32Array(0),
    polylines: new Float32Array(0)
  }
  const emptyBox = { min: { x: 0, y: 0 }, max: { x: 0, y: 0 } }
  return {
    async renderMText(
      data: AcGiMTextData,
      style: AcGiTextStyle,
      colorSettings?: AcPdfGlyphColorSettings
    ) {
      try {
        style=mapGlyphStyle(style,mapping,(name:string)=>FontManager.instance.isFontLoaded(name),mode)
        const mappedData={...data} as AcGiMTextData & {contents?:string}
        for(const key of ['text','contents'] as const)if(typeof mappedData[key]==='string')mappedData[key]=mapInlineFonts(mappedData[key]!,mapping,(name:string)=>FontManager.instance.isFontLoaded(name),mode)
        data=mappedData
        const renderer = AcTrMTextRenderer.getInstance()
        // Vector PDF extracts Mesh/Line BufferGeometry. Scene-level placement
        // mode leaves empty groups — force per-entity merge for this draw only.
        const object = (await renderer.asyncRenderMText(
          // AcGi and mtext-renderer attachment enums are structurally compatible
          // at runtime but diverge in the TypeScript type graph.
          { ...(data as object), meshGlyphOutputMode: 'merge' } as never,
          style as never,
          toMTextColorSettings(colorSettings) as never
        )) as unknown as SceneNode
        const contents =
          (data as { contents?: string }).contents ||
          (data as { text?: string }).text ||
          ''
        const { primitives, colorGroups, box } = extractGlyphPrimitives(
          object,
          data.position?.x ?? 0,
          data.position?.y ?? 0
        )
        if(contents.trim() && !primitives.triangles.length && !primitives.polylines.length)onFailure('非空文字未產生向量字形')
        return { primitives, colorGroups, actualText: contents, box }
      } catch (error) {
        // Keep the source string so PDF ActualText / diagnostics still work
        // when tessellation throws (uninitialized renderer, missing fonts…).
        const contents =
          (data as { contents?: string }).contents ||
          (data as { text?: string }).text ||
          ''
        onFailure('MTEXT 字形產生失敗：' + String(error))
        console.warn(
          '[cad-pdf-plugin] MTEXT glyph render failed; vector geometry omitted',
          error instanceof Error ? error.message : error
        )
        return { primitives: empty, actualText: contents, box: emptyBox }
      }
    },
    async renderShape(shape: AcGiShapeData, style?: AcGiTextStyle) {
      try {
        if(style)style=mapGlyphStyle(style,{},(name:string)=>FontManager.instance.isFontLoaded(name),'original')
        const renderer = AcTrMTextRenderer.getInstance()
        const object = (await renderer.asyncRenderShape(
          shape as never,
          (style ?? {}) as never
        )) as unknown as SceneNode
        const { primitives, box } = extractGlyphPrimitives(
          object,
          shape.position?.x ?? 0,
          shape.position?.y ?? 0
        )
        if(!primitives.triangles.length&&!primitives.polylines.length)onFailure('SHAPE 未產生向量圖形，不能用文字字型替代符號')
        return { primitives, box }
      } catch (error) {
        onFailure('SHAPE 字形產生失敗：' + String(error))
        console.warn(
          '[cad-pdf-plugin] SHAPE glyph render failed; vector geometry omitted',
          error instanceof Error ? error.message : error
        )
        return { primitives: empty, box: emptyBox }
      }
    }
  }
}

function toMTextColorSettings(settings?: AcPdfGlyphColorSettings): {
  color: MTextColor
  byLayerColor: number
  byBlockColor: number
  layer?: string
} | undefined {
  if (!settings) {
    return undefined
  }
  const color = new MTextColor()
  if (settings.entityIsByLayer) {
    color.aci = 256
  } else if (settings.entityIsByBlock) {
    color.aci = 0
  } else if (settings.entityIsForeground) {
    color.aci = 7
  } else if (typeof settings.entityAci === 'number') {
    color.aci = settings.entityAci
  } else if (typeof settings.entityRgb === 'number') {
    color.rgbValue = settings.entityRgb
  } else {
    color.aci = 7
  }
  return {
    color,
    byLayerColor: settings.byLayerColor,
    byBlockColor: settings.byBlockColor,
    layer: settings.layer
  }
}

