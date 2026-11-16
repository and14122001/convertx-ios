# Automatic offline font library validation

Source commit: ad33c2e8c6da2a63771897d102afae267662ecd4
Generated assets commit: 02a7c64008d5dace46235384be365a570e8da99f
GitHub Actions: https://github.com/and14122001/convertx-ios/actions/runs/43887735966 — succeeded, including clean dependency install, checksum-verified font preparation, tests/build, source assembly and generated asset commit.

Local commands:
- `npm --prefix cad-full ci --ignore-scripts --no-audit --no-fund`: succeeded.
- `npm --prefix cad-full run build`: 96 tests / 21 files passed; TypeScript, Vite, offline manifest / check-dist passed.
- `node cad-full/scripts/profile-local-dwg.mjs <local.dwg> --auto-font`: 10 font requirements + 14 unknown styles yielded 24 fallback decisions; DB conversion produced 1273 blocks / 41207 entities. Linux parse 12571 ms, total 13389 ms. LibreDWG code 76 remains; drawing bytes and text were not published.
- Actual pinned Noto Sans TC OTF was loaded by FontManager in Node and triangulated into nonempty glyph geometry for English, digits, Traditional Chinese and ±°Ø. This is not an iPhone or whole-drawing PDF fidelity test.

Default mode is automatic substitution, using original loaded fonts first, then user mapping, then bundled Noto Sans TC. Fonts remain same-origin and are included in the 14-asset offline manifest (~27.56 MB total). SHAPE symbol fonts are excluded from automatic STYLE replacement. Missing glyphs still stop PDF export. Substitute PDF carries a label and filename suffix.

Browser / iPhone airplane-mode, PDF download / reopening and reference-PDF visual comparison remain pending.
