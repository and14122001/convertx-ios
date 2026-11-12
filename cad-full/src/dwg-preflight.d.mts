export const DWG_VERSIONS: Readonly<Record<string, string>>

export interface DwgPreflightResult {
  code: string
  version: string | null
  warnings: string[]
}

export function inspectDwgHeader(bytes: ArrayBuffer | Uint8Array): DwgPreflightResult
export function parseUnitChoice(value: string): {
  unit: string | null
  warning: string
}
