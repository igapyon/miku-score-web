# miku-score Web

`miku-score-web` is the browser application downstream of the released
`miku-score` browser runtime. It owns browser UI, file/download behavior, and
single-file composition; score semantics and format conversion stay upstream.

## Runtime intake

The Web App is currently `0.8.3` and uses the checked-in `v0.8.0` runtime lock.
The Web App's major/minor version (`a.b`) follows the published Runtime's
major/minor version; its patch version (`c`) may be managed independently. The
build validates that relationship alongside the published runtime lock. Fetch the
published and SHA-256 verified runtime, then build and test the offline
single-file app:

```sh
npm run runtime:fetch
npm test
```

Run the Chromium regression separately after installing its test browser:

```sh
npx playwright install chromium
npm run test:browser
```

The checked-in [current browser screenshot](screenshots/miku-score-web.png) is
captured reproducibly from the generated offline app.

For development against an unpublished upstream candidate, pass its local
staging artifact explicitly:

```sh
npm run runtime:fetch -- --runtime ../miku-score/release-assets/miku-score-runtime-0.8.0.mjs
```

The verified runtime is cached under `.cache/`. It is never downloaded by the
deployed page: `npm run build` embeds the verified runtime before Web-owned code
in `index.html`.

## Current migration slice

This bootstrap proves runtime-first initialization with ABC input, new-score
creation, Verovio SVG preview, deterministic SVG click-to-score node mapping,
selected-note pitch/duration changes, MIDI download, and playback-plan generation.
Selected-note insertion, splitting, and deletion are also routed through the
same versioned runtime command facade.
The note and measure selectors use the same in-session score node IDs and
voice context as SVG click selection.
Generic file import and download export cover the pinned runtime's MusicXML,
MXL, ABC, MIDI, VSQX, MEI, LilyPond, and MuseScore conversions. VSQX is
provided by a Web-owned, hash-verified browser bridge that is injected as an
explicit runtime capability before the first runtime load.
`miku-score-web` owns the browser Verovio and VSQX assets and adapts them to
explicit runtime capabilities before the first runtime load. It also owns the
Web Audio adapter that renders the runtime's deterministic playback plan; score
timing and event generation remain upstream. The historical combined Web
application remains authoritative until full edit
workflows, format UI, samples, styles, and browser regression coverage have
moved in behavior-preserving slices.
The current score is stored as a validated local browser draft after successful
imports, new-score creation, and bounded edits; users can clear that Web-owned
draft explicitly. Playback, MIDI, VSQX, and MusicXML filename preferences are
also retained locally and can be reset to their historical defaults.
MIDI export uses one Web-controlled runtime request policy for both individual
and ZIP downloads (program, score-program override, profile, timing/accent,
and round-trip metadata). Its default profile, metric accents, and metadata
retention match the historical combined Web App. The MusicXML
`.xml`/`.musicxml` extension choice is Web-owned and does not change conversion
data.
Web-owned `lht-*` components render native controls with the historical DOM
IDs, so browser event wiring remains direct. Their static/dynamic migration
contract and the explicitly deferred clef-list and textarea controls are
recorded in `docs/WEB_UI_MIGRATION.md`.
`fixtures/parity/` fixes representative v0.7.0 value-operation baselines for
editing, diagnostics, configured MIDI-like playback, and
MIDI/MXL/MuseScore/MSCZ/VSQX format flows without coupling this repository's
tests to upstream implementation modules.
The remaining runtime capabilities and the evidence required before removing
the historical combined Web surface are recorded in
`docs/CUTOVER_GATE.md`.
