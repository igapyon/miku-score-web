import assert from "node:assert/strict";

import {
  midiOutputOptionsFromValues,
  runtimeExportOptionsForFormat,
  vsqxOutputOptionsFromValues,
} from "../src/js/midi-output-options.mjs";

const defaults = midiOutputOptionsFromValues();
assert.deepEqual(defaults, {
  ticksPerQuarter: 480,
  programPreset: "electric_piano_2",
  forceProgramPreset: false,
  graceTimingMode: "before_beat",
  metricAccentEnabled: true,
  metricAccentProfile: "subtle",
  exportProfile: "musescore_parity",
  keepRoundtripMetadata: true,
});
assert.deepEqual(midiOutputOptionsFromValues({
  metricAccentEnabled: false,
  exportProfile: "safe",
  keepRoundtripMetadata: false,
}), {
  ticksPerQuarter: 480,
  programPreset: "electric_piano_2",
  forceProgramPreset: false,
  graceTimingMode: "before_beat",
  metricAccentEnabled: false,
  metricAccentProfile: "subtle",
  exportProfile: "safe",
  keepRoundtripMetadata: false,
});

const configured = midiOutputOptionsFromValues({
  programPreset: "violin",
  forceProgramPreset: true,
  graceTimingMode: "classical_equal",
  metricAccentEnabled: true,
  metricAccentProfile: "strong",
  exportProfile: "musescore_parity",
  keepRoundtripMetadata: true,
});
assert.deepEqual(configured, {
  ticksPerQuarter: 480,
  programPreset: "violin",
  forceProgramPreset: true,
  graceTimingMode: "classical_equal",
  metricAccentEnabled: true,
  metricAccentProfile: "strong",
  exportProfile: "musescore_parity",
  keepRoundtripMetadata: true,
});
const vsqx = vsqxOutputOptionsFromValues({ defaultLyric: "み", splitPartStaves: true });
assert.deepEqual(vsqx, { musicXml: { defaultLyric: "み" }, splitPartStaves: true });
assert.deepEqual(vsqxOutputOptionsFromValues({ defaultLyric: "  " }), {
  musicXml: { defaultLyric: "ら" },
  splitPartStaves: false,
});
assert.deepEqual(runtimeExportOptionsForFormat("midi", { midi: configured, vsqx }), { midi: configured });
assert.deepEqual(runtimeExportOptionsForFormat("vsqx", { midi: configured, vsqx }), { vsqx });
assert.deepEqual(runtimeExportOptionsForFormat("abc", { midi: configured, vsqx }), {});

console.log("[smoke:midi-output-options] ok normalized MIDI and VSQX export policies");
