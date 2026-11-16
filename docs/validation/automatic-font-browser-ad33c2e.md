# Live automatic-font smoke test

Source ad33c2e8c6da2a63771897d102afae267662ecd4.

Opened https://and14122001.github.io/convertx-ios/cad-test/?v=ad33c2e in the Work cloud Chrome browser. Observed matching build banner, bundled Noto Sans TC catalog entry, automatic substitution selected by default, and complete-build-assets-cached status.

Exercised the mapping UI with disposable source `convertx-test-missing` and bundled target `convertx-noto-tc`. Saving succeeded after the actual FontManager.loadFontsByNames call and isFontLoaded check; this verifies the deployed OTF can be fetched/parsed/registered in that browser. Removed the disposable mapping and cleared the input afterward. Default automatic mode remained selected.

This test did not exercise DWG rendering, PDF export, iPhone Safari, offline browser restart or reference-PDF fidelity. These remain pending; Node regression and local DWG parse/convert results are in automatic-font-library-ad33c2e.md.
