# Web cutover gate

`miku-score-web` may replace the historical combined Web surface in
`../miku-score` only after every gate below is satisfied. Until then the
historical application remains the behavioural reference and no legacy Web
path is removed.

## Current baseline

The Web App is an offline, generated single-file application pinned to the
published `miku-score` `v0.8.0` browser runtime. The following evidence is
already automated locally and in `.github/workflows/verify.yml`:

- runtime tag, release asset, and SHA-256 lock verification, plus Web/Runtime major-minor version alignment;
- verifier acceptance of the versioned public runtime contract, rather than a
  hard-coded runtime API revision;
- format conversion, bounded editing, selection, playback-plan, and
  capability-adapter smoke checks;
- public-runtime parity fixtures for canonical loading, diagnostics, selected
  note editing, configured MIDI, MXL, MuseScore/MSCZ, and VSQX;
- generated-page JSDOM regression, offline/no-external-request validation,
  and Chromium browser flows for conversion, preview, editing, file import,
  downloads, local draft, and browser settings;
- generated HTML synchronization and reproducible current-app screenshot
  capture.

This baseline is necessary evidence, not cutover approval.

The published upstream runtime exposes the formerly missing operations as
`miku-score/runtime-api@2`. The capability-gated Web implementation passes the
full local smoke suite, the v0.7.0 value-parity baseline, and Chromium v2
interaction coverage against the checked-in `v0.8.0` lock. The remote CI run
for this intake remains required.

## Published capability baseline

The v0.8.0 runtime publishes the value-only contracts described in
`docs/UPSTREAM_RUNTIME_GAPS.md`, enabling the corresponding historical behavior
in the Web App:

| Historical behavior | Required runtime capability | Cutover status |
| --- | --- | --- |
| Isolated measure editing, creation, and measure-scoped output | Measure extraction, replacement, and append | Published in v0.8.0; local verification complete |
| Generic ZIP root-entry picker | Archive entry listing and extraction | Published in v0.8.0; local verification complete |
| Source/debug import metadata, MIDI quantization, and VSQX import lyric policy | Format-scoped import options | Published in v0.8.0; local verification complete |
| `mks:meta`, `mks:src`, and `mks:dbg` filtering for every output | Shared MusicXML export metadata policy | Published in v0.8.0; local verification complete |

The Web App must not emulate an unpublished runtime operation by mutating
MusicXML or parsing ZIP values locally. The v2 controls are available when the
checked-in runtime exposes `miku-score/runtime-api@2`.

## Release-by-release procedure

For each upstream runtime release that closes one or more gaps:

1. Add runtime contract tests upstream, including malformed input and
   no-mutation rejection coverage.
2. Publish the versioned browser runtime asset and its checksums.
3. Update `miku-score-web`'s runtime lock, verified asset, and Web package
   major/minor version to match the Runtime using `npm run runtime:fetch`.
   The Web patch version remains independently managed.
4. Implement only the browser interaction layer and add Web-owned UI and
   Chromium coverage for the new capability.
5. Extend public-runtime parity fixtures for the migrated behavior.
6. Run `npm test`, install Chromium when needed, and run `npm run test:browser`.
7. Commit the regenerated `index.html`, then require the remote GitHub Actions
   workflow to pass on the proposed release branch.

## Final removal gate

Before deleting any Web-owned source, HTML, assets, or documentation from
`../miku-score`, all of the following must be true:

- Every row in the blocking-capability table is migrated and covered by a
  published runtime lock in this repository.
- The Web App has representative parity coverage for every historical input,
  editing, preview, playback, download, local-persistence, and diagnostic
  workflow that is being removed upstream.
- `npm test` and `npm run test:browser` pass from a clean dependency install,
  and the remote GitHub Actions workflow passes for the exact commit.
- A human verifies the generated offline `index.html` in a browser against the
  historical application for the migrated workflows.
- The removal patch is separate from the final migration patch, identifies
  each deleted legacy path explicitly, and retains release/tag history needed
  to restore the previous Web App.

After that removal patch lands, keep the Web App runtime lock and parity
fixtures as the regression boundary for future runtime upgrades.
