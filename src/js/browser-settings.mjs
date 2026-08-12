export const BROWSER_SETTINGS_STORAGE_KEY = "miku-score-web.settings.v1";

export const DEFAULT_BROWSER_SETTINGS = Object.freeze({
  midiProgram: "electric_piano_2",
  waveform: "triangle",
  useMidiLikePlayback: true,
  graceTimingMode: "before_beat",
  metricAccentEnabled: true,
  metricAccentProfile: "subtle",
  midiExportProfile: "musescore_parity",
  forceMidiProgramPreset: false,
  keepMidiRoundtripMetadata: true,
  exportMusicXmlAsXmlExtension: false,
  vsqxDefaultLyric: "ら",
  vsqxSplitPartStaves: false,
  importSourceMetadata: true,
  importDebugMetadata: true,
  midiImportQuantizeGrid: "1/64",
  midiImportTripletAware: true,
  vsqxImportDefaultLyric: "ら",
  exportKeepRoundTripMetadata: true,
  exportKeepSourceMetadata: true,
  exportKeepDebugMetadata: true,
});

const defaultBrowserSettingsStorage = () => {
  try {
    return globalThis.window?.localStorage ?? null;
  } catch {
    return null;
  }
};

const enumValue = (value, allowed, fallback) => allowed.includes(value) ? value : fallback;
const booleanValue = (value, fallback) => typeof value === "boolean" ? value : fallback;

export const normalizeBrowserSettings = (value) => {
  const raw = value && typeof value === "object" ? value : {};
  return {
    midiProgram: enumValue(raw.midiProgram, [
      "electric_piano_2", "acoustic_grand_piano", "electric_piano_1", "honky_tonk_piano",
      "harpsichord", "clavinet", "drawbar_organ", "acoustic_guitar_nylon", "acoustic_bass",
      "violin", "string_ensemble_1", "synth_brass_1",
    ], DEFAULT_BROWSER_SETTINGS.midiProgram),
    waveform: enumValue(raw.waveform, ["sine", "triangle", "square"], DEFAULT_BROWSER_SETTINGS.waveform),
    useMidiLikePlayback: booleanValue(raw.useMidiLikePlayback, DEFAULT_BROWSER_SETTINGS.useMidiLikePlayback),
    graceTimingMode: enumValue(raw.graceTimingMode, ["before_beat", "on_beat", "classical_equal"], DEFAULT_BROWSER_SETTINGS.graceTimingMode),
    metricAccentEnabled: booleanValue(raw.metricAccentEnabled, DEFAULT_BROWSER_SETTINGS.metricAccentEnabled),
    metricAccentProfile: enumValue(raw.metricAccentProfile, ["subtle", "balanced", "strong"], DEFAULT_BROWSER_SETTINGS.metricAccentProfile),
    midiExportProfile: enumValue(raw.midiExportProfile, ["safe", "musescore_parity"], DEFAULT_BROWSER_SETTINGS.midiExportProfile),
    forceMidiProgramPreset: booleanValue(raw.forceMidiProgramPreset, DEFAULT_BROWSER_SETTINGS.forceMidiProgramPreset),
    keepMidiRoundtripMetadata: booleanValue(raw.keepMidiRoundtripMetadata, DEFAULT_BROWSER_SETTINGS.keepMidiRoundtripMetadata),
    exportMusicXmlAsXmlExtension: booleanValue(raw.exportMusicXmlAsXmlExtension, DEFAULT_BROWSER_SETTINGS.exportMusicXmlAsXmlExtension),
    vsqxDefaultLyric: String(raw.vsqxDefaultLyric ?? "").trim().slice(0, 32) || DEFAULT_BROWSER_SETTINGS.vsqxDefaultLyric,
    vsqxSplitPartStaves: booleanValue(raw.vsqxSplitPartStaves, DEFAULT_BROWSER_SETTINGS.vsqxSplitPartStaves),
    importSourceMetadata: booleanValue(raw.importSourceMetadata, DEFAULT_BROWSER_SETTINGS.importSourceMetadata),
    importDebugMetadata: booleanValue(raw.importDebugMetadata, DEFAULT_BROWSER_SETTINGS.importDebugMetadata),
    midiImportQuantizeGrid: enumValue(raw.midiImportQuantizeGrid, ["auto", "1/8", "1/16", "1/32", "1/64"], DEFAULT_BROWSER_SETTINGS.midiImportQuantizeGrid),
    midiImportTripletAware: booleanValue(raw.midiImportTripletAware, DEFAULT_BROWSER_SETTINGS.midiImportTripletAware),
    vsqxImportDefaultLyric: String(raw.vsqxImportDefaultLyric ?? "").trim().slice(0, 32) || DEFAULT_BROWSER_SETTINGS.vsqxImportDefaultLyric,
    exportKeepRoundTripMetadata: booleanValue(raw.exportKeepRoundTripMetadata, DEFAULT_BROWSER_SETTINGS.exportKeepRoundTripMetadata),
    exportKeepSourceMetadata: booleanValue(raw.exportKeepSourceMetadata, DEFAULT_BROWSER_SETTINGS.exportKeepSourceMetadata),
    exportKeepDebugMetadata: booleanValue(raw.exportKeepDebugMetadata, DEFAULT_BROWSER_SETTINGS.exportKeepDebugMetadata),
  };
};

export const readBrowserSettings = (storage = defaultBrowserSettingsStorage()) => {
  try {
    const raw = storage?.getItem(BROWSER_SETTINGS_STORAGE_KEY);
    return raw ? normalizeBrowserSettings(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
};

export const writeBrowserSettings = (settings, storage = defaultBrowserSettingsStorage()) => {
  try {
    storage?.setItem(BROWSER_SETTINGS_STORAGE_KEY, JSON.stringify(normalizeBrowserSettings(settings)));
    return true;
  } catch {
    return false;
  }
};
