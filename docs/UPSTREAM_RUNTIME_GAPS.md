# Upstream runtime gaps for Web cutover

`miku-score-web` is intentionally limited to the published `miku-score`
`v0.7.0` browser-runtime contract. This document records the value operations
that exist in the historical combined Web App but are not yet public runtime
operations. The Web App must not copy their MusicXML or ZIP semantics merely to
close the UI gap.

## Candidate status

The local upstream candidate now defines these operations as
`miku-score/runtime-api@2`. Its runtime contract rejects malformed values and
validates merged measure edits before success. The capability-gated Web
implementation passes an isolated v0.8.0 full smoke suite, the v0.7.0
value-parity baseline, and Chromium v2 interaction coverage. The candidate is
not a published runtime asset, so this Web App must continue to use its pinned
`v0.7.0` contract until the Release is published and the verified lock is
updated.

## Required before full measure-editor cutover

The Web App can inspect a measure and apply existing note commands through
`state`, but cannot own an isolated measure draft or add a measure. A future
runtime API needs value-only operations equivalent to:

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

## Required before generic ZIP entry selection

The current runtime imports known MXL and MSCZ values, but does not expose the
archive listing/extraction operations used by the historical generic ZIP picker.
A future value-only namespace needs:

```ts
archive.listRootEntryPaths(bytes, { extensions })
  => Promise<RuntimeResult<string[]>>;
archive.extractEntryBytes(bytes, { path })
  => Promise<RuntimeResult<Uint8Array>>;
```

The Web App will keep `File`, picker state, labels, and the selected virtual
file. The runtime must own ZIP parsing, path filtering, and decompression.

## Required before format-specific import-policy controls

The historical Web App controls source and debug metadata for ABC, MEI,
LilyPond, MuseScore, and MIDI imports; MIDI quantize-grid and triplet-aware
options; and the VSQX default lyric. `RuntimeImportRequest` in `v0.7.0` has no
`options` member, so the Web App cannot pass any of these policies through the
public contract. A future request shape needs format-scoped value options such
as:

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

## Required before metadata output-policy parity

`v0.7.0` already accepts MIDI program, score-program override, export profile,
grace/metric timing, and round-trip metadata options. The Web App exposes those
options consistently for individual and ZIP MIDI exports. Its MusicXML
`.xml`/`.musicxml` extension choice is a Web-owned filename policy and does not
affect conversion data. Historical downloads first apply three independent
MusicXML filters, then convert the resulting value for every output format:

- retain/omit round-trip metadata (`mks:meta:*`)
- retain/omit source metadata (`mks:src:*`)
- retain/omit debug metadata (`mks:dbg:*`)

The runtime needs an explicit value-only export option, applied before any
format converter, for example:

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

Do not add a Web-local XML metadata filter. Until this contract is published,
the Web App retains all MusicXML metadata for non-MIDI exports.

## Candidate acceptance evidence

- [x] Runtime contract tests cover success, malformed values, and no-mutation
  rejection for every new operation.
- [x] `miku-score-web` adds browser adapter/UI smoke coverage without importing
  upstream implementation modules.
- [x] The later-runtime parity smoke compares the v0.8.0 candidate with the
  checked-in v0.7.0 value baseline.
- [ ] Web locks the published version, asset, and SHA-256 before enabling the UI.
- [ ] Remote CI and the final human browser comparison pass for the exact
  published-runtime commit.
