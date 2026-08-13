# TODO

## Current checkpoint

- `miku-score` browser runtime `v0.8.0` is published with its manifest and checksums.
- This repository pins `miku-score-runtime-0.8.0.mjs` in `runtime/miku-score-runtime.lock.json`.
- The Web App version is `0.8.0`; its major/minor version follows the pinned `v0.8.0` runtime package, while its patch version is Web-owned.
- The initial runtime-first Web bootstrap was merged by PR #1 and tagged `v0.7.0`.
- Current development continues on `devel-tiga0810xeg` from the merged `origin/devel`.

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

4. Continue from the first unchecked migration slice below.

## Completed bootstrap

- [x] Pin a released runtime by tag, package version, asset name, and SHA-256.
- [x] Validate stable Web and pinned Runtime versions, and require their major/minor versions to match.
- [x] Fetch and verify the public Release asset without a local override.
- [x] Embed the verified runtime before Web-owned code in the generated single-file `index.html`.
- [x] Keep runtime download and cache activity out of the deployed browser.
- [x] Exercise ABC import, new-score creation, raw MIDI download, and playback-plan generation.
- [x] Reject external runtime, script, stylesheet, and media requests in the offline smoke.

## Next migration slice: preview and Verovio

This is the next implementation target after the bootstrap PR is published.

- [x] Move browser-side Verovio loading and initialization from `../miku-score`.
- [x] Inject the renderer through the released runtime capability contract; do not add a new runtime global API.
- [x] Render MusicXML to SVG through the runtime facade.
- [x] Move SVG presentation and click-selection state into Web-owned modules.
- [x] Complete deterministic SVG click-to-score node mapping.
- [x] Show a stable capability-unavailable diagnostic when Verovio cannot initialize.
- [x] Add automated coverage for ready, delayed, and unavailable adapter states, runtime capability rendering, and offline composition.
- [x] Confirm that the deployed page still performs no runtime network fetch.

Useful upstream references:

- `../miku-score/src/ts/verovio-render.ts`
- `../miku-score/src/ts/verovio-out.ts`
- `../miku-score/src/ts/preview-flow.ts`
- `../miku-score/src/ts/main.ts`
- `../miku-score/docs/browser-runtime.md`

## Later Phase 5 slices

- [x] Move the first bounded editing slice: selected-note pitch and duration changes through the runtime command facade.
- [x] Move selected-note deletion, splitting, and after-note insertion through the runtime command facade.
- [x] Move note and measure selectors that converge on the same selected score node and voice context.
- [x] Preserve the selected node across a successful edit and select the deterministic inserted/split position after MusicXML reserialization.
- [x] Move new-score options (part count, clefs, key, meter, and piano grand staff) through the runtime facade.
- [x] Move Rest-to-Note, selected-measure inspection, and part/measure navigation through the v0.7.0 runtime contract.
- [x] Pin the published `v0.8.0` runtime and move the remaining measure editor, measure creation, and measure-scoped download/play actions through its measure API.
  - [x] The capability-gated UI and adapter implementation passes the published `miku-score/runtime-api@2` local smoke coverage; remote CI remains.
- [x] Move text source-mode controls for MusicXML, ABC, VSQX, MEI, LilyPond, and MuseScore through the runtime facade.
- [x] Move all six bundled MusicXML samples into Web-owned single-file composition.
- [x] Move local draft persistence, validated restore, and explicit discard as Web-owned browser storage.
- [x] Move browser persistence and reset for published playback, MIDI, VSQX, and filename settings.
- [x] Pin the published `v0.8.0` runtime and move ZIP root-entry selection through its archive API.
  - [x] The capability-gated root-entry picker passes local `runtime-api@2` Chromium coverage without Web-local ZIP parsing; remote CI remains.
- [x] Move playback controls and basic waveform/MIDI-like/grace/metric-accent settings; the Web Audio adapter consumes the runtime playback plan without moving audio scheduling upstream.
- [x] Move all-format ZIP archive export through runtime conversion and `output.encodeZipBundle`.
- [x] Move MIDI program, score-program override, export profile, grace/metric, and round-trip metadata policies through the runtime export request for both individual and ZIP downloads.
- [x] Align the migrated MIDI/export-playback defaults with the historical combined Web App.
- [x] Move VSQX default lyric and part-staff split policies through the runtime export request for both individual and ZIP downloads.
- [x] Move the MusicXML `.xml`/`.musicxml` filename policy as Web-owned download naming without altering conversion data.
- [x] Represent historical MusicXML/MuseScore compression as explicit MXL/MSCZ output formats, including ZIP export.
- [x] Pin the published `v0.8.0` runtime and move the three MusicXML metadata filters (`mks:meta`, `mks:src`, `mks:dbg`) through its shared export policy; see `docs/UPSTREAM_RUNTIME_GAPS.md`.
- [x] Pin the published `v0.8.0` runtime and move source/debug import-metadata settings, MIDI quantize-grid/triplet-aware settings, and VSQX import default lyric through its format-scoped import options; see `docs/UPSTREAM_RUNTIME_GAPS.md`.
  - [x] Both policy groups are wired only when `runtime-api@2` is available and pass published v0.8.0 local smoke/browser regressions; remote CI remains.
- [ ] Move the remaining bounded format-specific controls, samples, and advanced options.
- [x] Move generic browser file import and download export for MusicXML, MXL, ABC, MIDI, VSQX, MEI, LilyPond, and MuseScore through the runtime facade.
- [x] Move a Web-owned VSQX bridge, verify its SHA-256 during build, and exercise MusicXML/VSQX round-trip conversion through the runtime facade.
- [x] Move responsive Web-owned CSS for the current single-file application.
- [x] Add reproducible Chromium capture for the current Web-owned screenshot.
- [ ] Move remaining `lht-cmn`-specific controls and Web-owned documentation.
- [x] Add a generated-single-file JSDOM UI regression smoke for conversion, preview, selection/edit, VSQX export, file input, and configured new-score creation.
- [x] Add Chromium real-browser coverage for file-loaded conversion, preview, selected-note editing, configured VSQX/ZIP downloads, browser file import, and no external requests.
- [x] Fix the first v0.7.0 checked-in parity baseline for canonical load/state, ABC, configured MIDI, selected-note pitch editing, and invalid MusicXML diagnostics through the published runtime.
- [x] Extend the checked-in v0.7.0 fixture through configured MIDI, MXL, MuseScore/MSCZ, and VSQX output/round-trip flows.
- [ ] Add further output/diagnostic parity fixtures for remaining editing and browser-facing format flows.
- [x] Add GitHub Actions configuration for published-runtime intake, build, tests, offline checks, and generated-HTML synchronization.
- [ ] Confirm the first remote GitHub Actions run after the next push.

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
- VSQX browser bridge loading and capability injection
- SVG click mapping and UI state
- CSS, samples, screenshots, single-file composition, and Web publication

The v0.8.0 public contracts for measure editing, generic ZIP entry selection,
and output-policy parity are documented in `docs/UPSTREAM_RUNTIME_GAPS.md`.

## Cutover gate

Do not remove the historical Web surface from `../miku-score` yet. Removal is allowed only after this repository independently passes representative input, editing, preview, playback, download, browser/UI, parity, and offline single-file checks using a published pinned runtime.

The complete capability and evidence checklist is `docs/CUTOVER_GATE.md`.

The shorter migration checklist remains in `docs/TODO.md`.
