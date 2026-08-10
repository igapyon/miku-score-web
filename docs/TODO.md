# TODO

## Runtime-first bootstrap

- [x] Pin and verify `miku-score-runtime-0.7.0.mjs` through a checked-in lock.
- [x] Keep the Web App package version aligned with the pinned runtime and reject mismatches.
- [x] Build one offline single-file shell with runtime code before Web-owned code.
- [x] Cover the initial ABC input, new-score, MIDI download, and playback-plan paths.

## Before upstream cutover

- [ ] Move preview/Verovio capability wiring and SVG selection mapping.
- [ ] Move the full bounded editing UI and its selector/measure workflows.
- [ ] Move all format input/output controls, samples, CSS, `lht-cmn`, screenshots, and browser tests.
- [ ] Add an executable browser/UI suite and output/diagnostic parity comparisons against the combined Web app.
- [ ] Replace the local staging override with the published Release fetch in CI.
- [ ] Do not delete Web-owned paths from `miku-score` until all preceding checks pass.
