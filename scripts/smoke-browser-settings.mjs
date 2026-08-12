import assert from "node:assert/strict";

import {
  BROWSER_SETTINGS_STORAGE_KEY,
  DEFAULT_BROWSER_SETTINGS,
  normalizeBrowserSettings,
  readBrowserSettings,
  writeBrowserSettings,
} from "../src/js/browser-settings.mjs";

const values = new Map();
const storage = {
  getItem: (key) => values.get(key) ?? null,
  setItem: (key, value) => values.set(key, value),
};

assert.equal(readBrowserSettings(storage), null);
assert.deepEqual(normalizeBrowserSettings({
  midiProgram: "violin",
  waveform: "square",
  useMidiLikePlayback: false,
  graceTimingMode: "on_beat",
  metricAccentEnabled: false,
  metricAccentProfile: "strong",
  midiExportProfile: "safe",
  forceMidiProgramPreset: true,
  keepMidiRoundtripMetadata: false,
  exportMusicXmlAsXmlExtension: true,
  vsqxDefaultLyric: " み ",
  vsqxSplitPartStaves: true,
  importSourceMetadata: false,
  importDebugMetadata: false,
  midiImportQuantizeGrid: "1/32",
  midiImportTripletAware: false,
  vsqxImportDefaultLyric: " れ ",
  exportKeepRoundTripMetadata: false,
  exportKeepSourceMetadata: false,
  exportKeepDebugMetadata: false,
}), {
  midiProgram: "violin",
  waveform: "square",
  useMidiLikePlayback: false,
  graceTimingMode: "on_beat",
  metricAccentEnabled: false,
  metricAccentProfile: "strong",
  midiExportProfile: "safe",
  forceMidiProgramPreset: true,
  keepMidiRoundtripMetadata: false,
  exportMusicXmlAsXmlExtension: true,
  vsqxDefaultLyric: "み",
  vsqxSplitPartStaves: true,
  importSourceMetadata: false,
  importDebugMetadata: false,
  midiImportQuantizeGrid: "1/32",
  midiImportTripletAware: false,
  vsqxImportDefaultLyric: "れ",
  exportKeepRoundTripMetadata: false,
  exportKeepSourceMetadata: false,
  exportKeepDebugMetadata: false,
});
assert.deepEqual(normalizeBrowserSettings({ midiProgram: "invalid", waveform: "invalid", vsqxDefaultLyric: " " }), DEFAULT_BROWSER_SETTINGS);
assert.equal(writeBrowserSettings({ midiProgram: "violin", vsqxDefaultLyric: "み" }, storage), true);
assert.equal(readBrowserSettings(storage).midiProgram, "violin");
assert.equal(readBrowserSettings(storage).vsqxDefaultLyric, "み");
values.set(BROWSER_SETTINGS_STORAGE_KEY, "invalid-json");
assert.equal(readBrowserSettings(storage), null);

console.log("[smoke:browser-settings] ok normalized Web-owned browser settings");
