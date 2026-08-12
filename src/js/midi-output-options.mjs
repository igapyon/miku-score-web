const mikuScoreWebMidiProgramPresets = new Set([
  "electric_piano_2",
  "acoustic_grand_piano",
  "electric_piano_1",
  "honky_tonk_piano",
  "harpsichord",
  "clavinet",
  "drawbar_organ",
  "acoustic_guitar_nylon",
  "acoustic_bass",
  "violin",
  "string_ensemble_1",
  "synth_brass_1",
]);

const normalizeWebMidiProgramPreset = (value) => (
  mikuScoreWebMidiProgramPresets.has(value) ? value : "electric_piano_2"
);

const normalizeWebGraceTimingMode = (value) => (
  value === "on_beat" || value === "classical_equal" ? value : "before_beat"
);

const normalizeWebMetricAccentProfile = (value) => (
  value === "balanced" || value === "strong" ? value : "subtle"
);

export const midiOutputOptionsFromValues = ({
  programPreset,
  forceProgramPreset,
  graceTimingMode,
  metricAccentEnabled,
  metricAccentProfile,
  exportProfile,
  keepRoundtripMetadata,
} = {}) => ({
  ticksPerQuarter: 480,
  programPreset: normalizeWebMidiProgramPreset(programPreset),
  forceProgramPreset: forceProgramPreset === true,
  graceTimingMode: normalizeWebGraceTimingMode(graceTimingMode),
  metricAccentEnabled: metricAccentEnabled !== false,
  metricAccentProfile: normalizeWebMetricAccentProfile(metricAccentProfile),
  exportProfile: exportProfile === "safe" ? "safe" : "musescore_parity",
  keepRoundtripMetadata: keepRoundtripMetadata !== false,
});

export const vsqxOutputOptionsFromValues = ({ defaultLyric, splitPartStaves } = {}) => ({
  musicXml: { defaultLyric: String(defaultLyric ?? "").trim() || "ら" },
  splitPartStaves: splitPartStaves === true,
});

export const runtimeExportOptionsForFormat = (format, { midi, vsqx } = {}) => {
  if (format === "midi") return { midi };
  if (format === "vsqx") return { vsqx };
  return {};
};
