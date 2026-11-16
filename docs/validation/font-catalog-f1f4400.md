# Same-origin font catalog regression — 2026-11-16

Source: `f1f4400934ad1510eba0c80fea131c81a6188e4f`
Generated preview: `bfa4d4d4eab0472ca7f6804916ffa0e88e6e3095`

Cloud browser displayed source 40cf2ba and reported an initial font-library failure: `/cad-test/fonts.json` returned HTML. Correct catalog location is `/cad-test/fonts/fonts.json`. FontManager baseUrl now uses `./fonts/` before loading cached-font metadata.

Executed after fix: `npm run build` passed 92 Node tests across 20 files, TypeScript, Vite, generated offline manifest (12 files, 21870924 bytes), and distribution checks. `git diff --check` passed. GitHub run 43845701890 locked install, tests/build and assembly passed.

The cloud file-chooser call timed out and its browser session was lost; no TTC-import, actual-DWG-preview, or PDF-download browser success is claimed from that attempt. This is separate from successful local TTC extraction/fontTools checks. iPhone offline fidelity remains pending.
