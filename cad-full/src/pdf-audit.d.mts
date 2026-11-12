export interface PdfAuditResult {
  byteLength: number
  version: string
  warnings: string[]
}

export function inspectPdfBytes(input: ArrayBuffer | Uint8Array): PdfAuditResult
