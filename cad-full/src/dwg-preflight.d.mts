export declare const DWG_VERSIONS: Readonly<Record<string, string>>
export declare function inspectDwgHeader(bytes: ArrayBuffer | Uint8Array): {
  code: string
  version: string | null
  warnings: string[]
}
export declare function parseUnitChoice(value: string): {
  unit: string | null
  warning: string
}
