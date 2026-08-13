# TODO

## Runtime-first bootstrap

- [x] Pin and verify `miku-score-runtime-0.8.0.mjs` through a checked-in lock.
- [x] Keep the Web App and pinned Runtime major/minor versions aligned, while allowing Web-owned patch versions, and reject mismatches.
- [x] Build one offline single-file shell with runtime code before Web-owned code.
- [x] Cover the initial ABC input, new-score, MIDI download, and playback-plan paths.
- [x] Inject a Web-owned Verovio capability and render an SVG preview through the runtime facade.
- [x] Cover ready, delayed, and unavailable Verovio adapter states.
- [x] Exercise SVG rendering across the Web adapter and pinned runtime boundary.

## Before upstream cutover

- [x] Complete deterministic SVG click-to-score mapping with embedded IDs and a sequential fallback.
- [x] Move the first bounded editing slice: selected-note pitch and duration changes through the runtime command facade.
- [x] Move selected-note deletion, splitting, and after-note insertion through the runtime command facade.
- [x] Move note and measure selectors that converge on the same selected score node and voice context.
- [x] Preserve the selected node across a successful edit and select the deterministic inserted/split position after MusicXML reserialization.
- [x] Move new-score options (parts, clefs, key, meter, piano grand staff) through the runtime facade.
- [x] Move selected-measure inspection, navigation, and Rest-to-Note through the v0.7.0 runtime contract.
- [x] Pin the published `v0.8.0` runtime and move the remaining measure editor, creation, and measure-scoped controls through its measure API.
  - [x] The capability-gated implementation passes published `runtime-api@2` local smoke and Chromium coverage plus merged-branch GitHub Actions verification.
- [x] Move text source modes for MusicXML, ABC, VSQX, MEI, LilyPond, and MuseScore through the runtime facade.
- [x] Move all six bundled MusicXML samples into Web-owned single-file composition.
- [x] Move local draft persistence, validated restore, and explicit discard as Web-owned browser storage.
- [x] Move browser persistence and reset for published playback, MIDI, VSQX, and filename settings.
- [x] Move playback controls and basic waveform/MIDI-like/grace/metric-accent settings through a Web-owned audio adapter and the runtime playback-plan contract.
- [x] Move all-format ZIP archive export through the runtime conversion and archive-output contracts.
- [x] Move MIDI output policies (program, score-program override, profile, grace/metric, and round-trip metadata) through the runtime export request.
- [x] Align the migrated MIDI/export-playback defaults with the historical combined Web App.
- [x] Move VSQX output policies (default lyric and part-staff split) through the runtime export request.
- [x] Move the MusicXML `.xml`/`.musicxml` filename policy as Web-owned download naming without altering conversion data.
- [x] Represent historical MusicXML/MuseScore compression as explicit MXL/MSCZ output formats, including ZIP export.
- [x] Pin the published `v0.8.0` runtime and move ZIP root-entry selection and the three MusicXML metadata output filters through its archive and export-policy APIs.
- [x] Pin the published `v0.8.0` runtime and move source/debug import-metadata settings, MIDI quantize-grid/triplet-aware settings, and VSQX import default lyric through its format-scoped import options.
  - [x] These v2-only controls pass the published v0.8.0 smoke suite, the v0.7.0 value-parity baseline, Chromium interaction coverage, and merged-branch GitHub Actions verification.
- [x] Move responsive Web-owned CSS for the current single-file application.
- [x] Add reproducible Chromium capture for the current Web-owned screenshot.
- [ ] Move the remaining format-specific controls, `lht-cmn`, and documentation.
- [x] Move generic browser file import and download export for every runtime-supported text and binary format.
- [x] Move a Web-owned VSQX bridge and inject it through the runtime capability contract before first runtime load.
- [x] Add generated-single-file JSDOM UI regression coverage for core Web interactions.
- [x] Add the first checked-in v0.7.0 public-runtime parity fixture for canonical load/state, ABC, configured MIDI, selected-note pitch editing, and invalid MusicXML diagnostics.
- [x] Fix v0.7.0 output/round-trip parity for configured MIDI, MXL, MuseScore/MSCZ, and VSQX.
- [x] Add Chromium real-browser coverage for the generated offline single-file app and its conversion, preview, edit, download, and browser-file import flows.
- [ ] Extend output/diagnostic parity fixtures across remaining combined-Web flows.
- [x] Add CI configuration that fetches the published Release runtime, runs all smoke checks, and verifies generated HTML synchronization.
- [x] Confirm the GitHub Actions run for the merged v0.8.0 runtime intake.
- [ ] Do not delete Web-owned paths from `miku-score` until all preceding checks pass.

See `docs/UPSTREAM_RUNTIME_GAPS.md` for the required value-only API contracts
and `docs/CUTOVER_GATE.md` for the complete removal gate.
