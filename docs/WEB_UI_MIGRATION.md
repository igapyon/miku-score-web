# Web UI control migration contracts

This inventory records the DOM contracts that must remain stable while the
single-file Web App replaces remaining hand-written control markup with
Web-owned `lht-*` components.

## Non-negotiable contract

- Every component must create the native control with the existing DOM ID.
- Existing `main.ts` code continues to read the native control directly and
  receives its normal `input` and `change` events.
- Default values, `disabled`, `required`, range, length, and static options
  remain unchanged.
- A component may be introduced only after its option lifecycle is known.
- Each slice regenerates `index.html` and passes the JSDOM, offline, Chromium,
  and screenshot checks.

## Static control queue

| Area | Controls | Web-owned component | Required evidence |
|---|---|---|---|
| Runtime v2 policies | `exportMusicXmlAsXmlExtension`, import/output metadata switches, `midiImportTripletAware` | `lht-switch-help` | settings restore/reset and import/export values |
| Runtime v2 policies | `midiImportQuantizeGrid` | `lht-select-help` | selected default and runtime request value |
| Runtime v2 policies | `vsqxImportDefaultLyric` | `lht-text-field-help` | length limit and VSQX import request value |
| Playback and MIDI | waveform, grace, accent, program, MIDI-like and metric switches | existing select/switch components | playback plan, MIDI export, settings restore/reset |
| New score | template switch, number inputs, static selects | existing text/select/switch components | new-score request values |
| Source/file/export | source, sample, import, and export format selects | `lht-select-help` | conversion and download flows |

## Dynamic control queue

These controls require dedicated compatibility coverage before migration.

| Controls | Dynamic behavior that must be preserved |
|---|---|
| `zipEntrySelect` | Runtime replaces options, toggles `disabled`, and hides/shows `zipEntrySelectLabel`. |
| `noteSelect`, `measureSelect` | Rendering replaces options and restores selection from score-node state. |
| `newPartClefList` | New-score part count rebuilds a variable set of clef controls. |
| `abcInput`, `sourceInput`, `musicXmlOutput`, `measureEditorXml` | Textarea content, spellcheck, and editing/load flows require their own migration contract. |

## Dynamic compatibility decisions

- `zipEntrySelect`, `noteSelect`, and `measureSelect` use `lht-select-help`.
  Each component still exposes its native `select` by the historical DOM ID,
  so existing code can replace options, set `disabled`, restore `value`, and
  dispatch the normal `change` event without an adapter.
- `newPartClefList` builds `lht-select-help` controls. The component copies
  `data-new-part-clef` to each native select, preserving the existing query,
  value, and new-score request path.
- The four textareas use `lht-text-field-help` in textarea mode. It preserves
  each native ID, initial value, spellcheck attribute, and input/load path.

## Current exclusions

Every dynamic migration keeps a focused smoke assertion for option replacement,
disabled state, and event path.
