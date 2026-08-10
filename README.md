# miku-score Web

`miku-score-web` is the browser application downstream of the released
`miku-score` browser runtime. It owns browser UI, file/download behavior, and
single-file composition; score semantics and format conversion stay upstream.

## Runtime intake

The Web App version follows the checked-in runtime lock, currently `v0.7.0`.
The build rejects a package/runtime version mismatch. Fetch the published and
SHA-256 verified runtime, then build and test the offline single-file app:

```sh
npm run runtime:fetch
npm test
```

For development against an unpublished upstream candidate, pass its local
staging artifact explicitly:

```sh
npm run runtime:fetch -- --runtime ../miku-score/release-assets/miku-score-runtime-0.7.0.mjs
```

The verified runtime is cached under `.cache/`. It is never downloaded by the
deployed page: `npm run build` embeds the verified runtime before Web-owned code
in `index.html`.

## Current migration slice

This bootstrap proves runtime-first initialization with ABC input, new-score
creation, MIDI download, and playback-plan generation. The historical combined
Web application remains authoritative until preview, full edit workflows,
format UI, samples, styles, and browser regression coverage have moved in
behavior-preserving slices.
