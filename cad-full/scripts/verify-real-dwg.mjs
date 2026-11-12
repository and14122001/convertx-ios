#!/usr/bin/env node
// Local-only integration smoke: real DWG -> LibreDWG WASM model -> AcDbDatabase -> PDF bytes.
// Inputs never leave this process; output PDFs stay in a local ignored directory.
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { basename, resolve, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Dwg_File_Type, LibreDwg } from '@mlightcad/libredwg-web'
import { AcDbDatabase, acdbHostApplicationServices } from '@mlightcad/data-model'
import { AcDbLibreDwgConverter } from '@mlightcad/libredwg-converter'
import { exportDatabaseToPdf } from '@mlightcad/pdf-renderer'
import { inspectPdfBytes } from '../src/pdf-audit.mjs'

const inputs = process.argv.slice(2)
if (inputs.length === 0) {
  console.error('Usage: npm run verify:dwg -- /local/path/one.dwg [/local/path/two.dwg ...]')
  process.exit(2)
}

const here = fileURLToPath(new URL('.', import.meta.url))
const wasmDirectory = join(here, '../node_modules/@mlightcad/libredwg-web/wasm/')
const outputDirectory = resolve(process.env.CAD_PDF_OUTPUT_DIR || join(here, '../.local-dwg-validation'))
await mkdir(outputDirectory, { recursive: true })
const libredwg = await LibreDwg.create(wasmDirectory)

for (const inputPath of inputs.map(path => resolve(path))) {
  const source = await readFile(inputPath)
  if (source.length < 6 || !/^AC10[0-9]{2}$/.test(source.toString('ascii', 0, 6))) {
    throw new Error(`Invalid DWG header: ${inputPath}`)
  }
  const data = source.buffer.slice(source.byteOffset, source.byteOffset + source.byteLength)
  const pointer = libredwg.dwg_read_data(data, Dwg_File_Type.DWG)
  if (!pointer) throw new Error(`LibreDWG could not parse: ${inputPath}`)

  try {
    const parsed = libredwg.convertEx(pointer)
    if (!parsed.database) throw new Error(`LibreDWG returned no database: ${inputPath}`)
    const converter = new AcDbLibreDwgConverter()
    // The WASM parse above is real. Inject its parsed model to exercise the exact AcDb
    // materialization pipeline without loading the browser-only GPL worker in Node.
    converter.parse = async () => ({ model: parsed.database, data: parsed.stats })
    const db = new AcDbDatabase()
    acdbHostApplicationServices().workingDatabase = db
    const conversionErrors = []
    const originalConsoleError = console.error
    console.error = (...args) => conversionErrors.push(args.map(String).join(' '))
    try {
      await converter.read(data, db)
    } finally {
      console.error = originalConsoleError
    }

    const countTypes = entities => entities.reduce((counts, entity) => {
      const type = entity.type || entity.dxfTypeName || 'UNKNOWN'
      counts[type] = (counts[type] || 0) + 1
      return counts
    }, {})
    const modelEntities = [...db.tables.blockTable.modelSpace.newIterator()]
    const pdf = await exportDatabaseToPdf(db, {
      title: basename(inputPath),
      paper: { widthMm: 210, heightMm: 297 },
      marginMm: 10,
      fit: 'extents',
      layouts: 'current',
      background: 'none'
    })
    const audit = inspectPdfBytes(pdf)
    const outputPath = join(outputDirectory, basename(inputPath).replace(/\.dwg$/i, '') + '.pdf')
    await writeFile(outputPath, pdf)
    console.log(JSON.stringify({
      inputPath,
      inputBytes: source.length,
      dwgVersion: source.toString('ascii', 0, 6),
      insunitsCode: parsed.database.header.INSUNITS ?? null,
      sourceLayers: parsed.database.tables.LAYER.entries.length,
      sourceBlocks: parsed.database.tables.BLOCK_RECORD.entries.length,
      parsedEntityCount: parsed.database.entities.length,
      parsedEntityTypes: countTypes(parsed.database.entities),
      unknownEntityCount: parsed.stats.unknownEntityCount,
      convertedModelSpaceEntityCount: modelEntities.length,
      convertedModelSpaceTypes: countTypes(modelEntities),
      conversionErrors,
      pdfBytes: audit.byteLength,
      pdfVersion: audit.version,
      pdfOutputPath: outputPath,
      limitations: [
        'No font resolver or glyph provider configured; text and SHX visibility must be checked.',
        'XREF content is not loaded or bound by this smoke test.',
        'Source entity counts and PDF bytes do not prove entity-by-entity visual fidelity.',
        'Export uses A4 extents fit; it does not establish a 1:N engineering scale.'
      ]
    }, null, 2))
  } finally {
    libredwg.dwg_free(pointer)
  }
}
