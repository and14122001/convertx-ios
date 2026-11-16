# Font settings validation — 2026-11-16

Source commit: `40cf2ba664c1634bef6812fa57c016462a9b876f`
Generated preview commit: `bd0e1b688bcf104e8985fc83e1ac2e42915ff995`

Executed locally:
- `npm ci --ignore-scripts --no-audit --no-fund`: succeeded with pinned lockfile.
- `npm run build`: all 20 Node test files passed; TypeScript, Vite, offline manifest and distribution checks passed.
- `git diff --check`: passed.
- Two-face TTC made from local DejaVu Sans / ExtraLight; extracted standalone fonts parsed with fontTools, identical cmap, glyph order and hmtx metrics (6253 / 2032 glyphs). No font files committed.

GitHub Actions run `43840113798`: locked install, tests/build and preview/source assembly passed. Pages publication and browser interaction results require separate verification.

The PDF remains vector-based. Explicit substitute mode has a visible per-page label and distinct filename; it is not proof of original text fidelity. Missing glyphs still stop export. Private CAD/font inputs were not committed or sent to a conversion service. iPhone flight-mode restart/download/reopen and reference-PDF visual comparison remain unaccepted.
