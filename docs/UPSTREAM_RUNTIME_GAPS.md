# Upstream runtime gaps for Web cutover

`miku-score-web` is pinned to the published `miku-score` `v0.8.0`
browser-runtime contract. This document records the value operations promoted
from the historical combined Web App into the public runtime. The Web App must
use those contracts rather than copy MusicXML or ZIP semantics locally.

## Published release status

The published upstream `v0.8.0` runtime defines these operations as
`miku-score/runtime-api@2`. Its runtime contract rejects malformed values and
validates merged measure edits before success. The capability-gated Web
implementation passes the v0.8.0 full local smoke suite, the v0.7.0
value-parity baseline, and Chromium v2 interaction coverage.

## Published measure-editor contract

The Web App can use the v0.8.0 value-only operations to own an isolated measure
draft or add a measure:

```ts
measure.extractEditorMusicXml(xml, { partId, measureNumber })
  => RuntimeResult<string>;
measure.replaceEditorMusicXml(xml, { partId, measureNumber, editorXml })
  => RuntimeResult<string>;
measure.appendMeasure(xml)
  => RuntimeResult<string>;
```

The replacement operation must validate the merged MusicXML and reject invalid
values structurally without mutating its input. It must not depend on DOM
state, selection state, or a browser global.

The same extraction result can support Web-owned measure-only MusicXML and MIDI
downloads. MIDI remains an ordinary `convert.exportFromMusicXml` call after
the extracted MusicXML is returned.

## Published generic ZIP entry-selection contract

The v0.8.0 runtime exposes the archive listing/extraction operations used by
the historical generic ZIP picker:

```ts
archive.listRootEntryPaths(bytes, { extensions })
  => Promise<RuntimeResult<string[]>>;
archive.extractEntryBytes(bytes, { path })
  => Promise<RuntimeResult<Uint8Array>>;
```

The Web App will keep `File`, picker state, labels, and the selected virtual
file. The runtime must own ZIP parsing, path filtering, and decompression.

## Published format-specific import-policy controls

The historical Web App controls source and debug metadata for ABC, MEI,
LilyPond, MuseScore, and MIDI imports; MIDI quantize-grid and triplet-aware
options; and the VSQX default lyric. `RuntimeImportRequest` in `v0.7.0` had no
`options` member; v0.8.0 adds format-scoped value options such as:

```ts
convert.importToMusicXml({
  format: "midi",
  data,
  options: {
    importMetadata: {
      source: boolean,
      debug: boolean,
    },
    midi: {
      quantizeGrid: "auto" | "1/8" | "1/16" | "1/32" | "1/64",
      tripletAwareQuantize: boolean,
    },
    vsqx: {
      defaultLyric: string,
    },
  },
}) => Promise<RuntimeResult<string>>;
```

The runtime must validate unsupported options with structured diagnostics and
must not make MIDI- or VSQX-specific controls visible for other input formats.
`importMetadata` applies only to importers that already support source/debug
metadata; it is not a request for a Web-local XML rewrite.

## Published metadata output-policy contract

`v0.8.0` accepts MIDI program, score-program override, export profile,
grace/metric timing, and round-trip metadata options. The Web App exposes those
options consistently for individual and ZIP MIDI exports. Its MusicXML
`.xml`/`.musicxml` extension choice is a Web-owned filename policy and does not
affect conversion data. Historical downloads first apply three independent
MusicXML filters, then convert the resulting value for every output format:

- retain/omit round-trip metadata (`mks:meta:*`)
- retain/omit source metadata (`mks:src:*`)
- retain/omit debug metadata (`mks:dbg:*`)

The runtime supplies an explicit value-only export option, applied before any
format converter:

```ts
convert.exportFromMusicXml({
  format,
  xml,
  options: {
    musicXml: {
      metadata: {
        roundTrip: boolean,
        source: boolean,
        debug: boolean,
      },
    },
  },
}) => Promise<RuntimeResult<string | Uint8Array>>;
```

Do not add a Web-local XML metadata filter. The Web App passes the policy to
the v0.8.0 runtime for every supported output format.

## Release intake evidence

- [x] Runtime contract tests cover success, malformed values, and no-mutation
  rejection for every new operation.
- [x] `miku-score-web` adds browser adapter/UI smoke coverage without importing
  upstream implementation modules.
- [x] The v0.8.0 parity smoke compares the published runtime with the
  checked-in v0.7.0 value baseline.
- [x] Web locks the published version, asset, and SHA-256 before enabling the UI.
- [ ] Remote CI and the final human browser comparison pass for the exact
  published-runtime commit.
