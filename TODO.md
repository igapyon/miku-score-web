# TODO

## Current checkpoint

- `miku-score` browser runtime `v0.7.0` is published with its manifest and checksums.
- This repository pins `miku-score-runtime-0.7.0.mjs` in `runtime/miku-score-runtime.lock.json`.
- The Web App version is `0.7.0` and must continue to match the pinned runtime package version.
- The initial runtime-first Web bootstrap is committed as `6aa081b` on `devel-tiga0810rfa`.
- That branch is one commit ahead of `origin/devel`; push and PR publication are still pending.
- This handoff document was added after the bootstrap commit and is not included in `6aa081b`.

## Resume here

1. Inspect the branch and local changes.

   ```sh
   git status --short --branch
   ```

2. Fetch the pinned runtime from the published GitHub Release and verify its SHA-256.

   ```sh
   npm run runtime:fetch
   ```

3. Rebuild and run the current offline checks.

   ```sh
   npm test
   ```

4. Include this `TODO.md` in the Web bootstrap PR, then publish the branch and create the PR.

## Completed bootstrap

- [x] Pin a released runtime by tag, package version, asset name, and SHA-256.
- [x] Reject a Web App package version that differs from the pinned runtime version.
- [x] Fetch and verify the public Release asset without a local override.
- [x] Embed the verified runtime before Web-owned code in the generated single-file `index.html`.
- [x] Keep runtime download and cache activity out of the deployed browser.
- [x] Exercise ABC import, new-score creation, raw MIDI download, and playback-plan generation.
- [x] Reject external runtime, script, stylesheet, and media requests in the offline smoke.

## Next migration slice: preview and Verovio

This is the next implementation target after the bootstrap PR is published.

- [ ] Move browser-side Verovio loading and initialization from `../miku-score`.
- [ ] Inject the renderer through the released runtime capability contract; do not add a new global API.
- [ ] Render MusicXML to SVG through the runtime facade.
- [ ] Move SVG presentation, selection state, and click-to-score mapping into Web-owned modules.
- [ ] Show a stable capability-unavailable diagnostic when Verovio cannot initialize.
- [ ] Add automated coverage for successful preview, unavailable capability, and offline single-file behavior.
- [ ] Confirm that the deployed page still performs no runtime network fetch.

Useful upstream references:

- `../miku-score/src/ts/verovio-render.ts`
- `../miku-score/src/ts/verovio-out.ts`
- `../miku-score/src/ts/preview-flow.ts`
- `../miku-score/src/ts/main.ts`
- `../miku-score/docs/browser-runtime.md`

## Later Phase 5 slices

- [ ] Move the bounded editing UI and selector/measure workflows.
- [ ] Move the remaining MusicXML, MXL, ABC, MIDI, MEI, LilyPond, MuseScore, and VSQX browser controls.
- [ ] Move browser file adapters, downloads, samples, CSS, `lht-cmn`, screenshots, and Web-owned documentation.
- [ ] Add an executable browser/UI suite.
- [ ] Compare representative output and diagnostics with the historical combined Web App.
- [ ] Add CI coverage for published-runtime intake, build, tests, and offline checks.

## Ownership boundary

Keep in `miku-score`:

- score semantics and bounded editing operations
- format conversion and diagnostics
- playback-plan generation
- capability-gated rendering and conversion contracts
- CLI and versioned browser runtime publication

Keep in `miku-score-web`:

- DOM and browser event wiring
- file selection and download interaction
- Verovio browser loading and preview presentation
- SVG click mapping and UI state
- CSS, samples, screenshots, single-file composition, and Web publication

## Cutover gate

Do not remove the historical Web surface from `../miku-score` yet. Removal is allowed only after this repository independently passes representative input, editing, preview, playback, download, browser/UI, parity, and offline single-file checks using a published pinned runtime.

The shorter migration checklist remains in `docs/TODO.md`.
