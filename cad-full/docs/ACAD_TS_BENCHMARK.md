# acad-ts isolated parser benchmark (2026-11-23)

Goal: compare an independent MIT DWG reader against the existing MLightCAD/LibreDWG route, **without replacing production PDF export**.

Source: https://github.com/node-projects/acad-ts ; npm: @node-projects/acad-ts@3.9.0 (MIT). API: DwgReader with configuration and notifications. Upstream claims DWG read/write across AC1009–AC1032, but a version matrix does not guarantee full object fidelity.

## Reproducible steps
1. Checkout this branch, cd cad-full.
2. In a disposable working copy run `npm install --no-save --package-lock=false @node-projects/acad-ts@3.9.0`. Do not commit altered dependency manifests.
3. Run `node scripts/benchmark-acad-ts.mjs /path/to/real-sample.dwg > acad-result.json`.
4. Repeat for at least two independently sourced real DWGs containing LINE, ARC, CIRCLE, LWPOLYLINE, BLOCK/INSERT, TEXT/MTEXT, DIMENSION, HATCH, Chinese fonts, and XREF if available.
5. Use the same input SHA-256 for the existing LibreDWG pipeline and compare parsed object counts, geometry coordinates/bounds, warnings, text encoding, output PDF and paper geometry.
6. Test separately on iPhone Safari and installed PWA, then airplane-mode restart. Record file bytes, load time, peak memory (when measurable), failures, and missing glyphs.

## Acceptance gates
- Missing/unknown entities, XREF, proxy, fonts and exceptions must be reported, never silently accepted.
- Compare geometries and not just total entity counts; do not claim full fidelity on parse success.
- PDF must remain vector, with explicit units and scale; preserve existing auto paper, orientation and 10mm margin rules.
- No CDN or remote file upload. Check complete transitive licenses before production integration.
- No merge into main before real fixtures, browser testing, and PDF fidelity review.

## Status
Research and isolated benchmark harness only. No real DWG benchmark or iPhone test has been run as part of this change. The HANSUN site's exact implementation has not been independently inspected.
