const verovioAdapter = createBrowserVerovioAdapter();
const vsqxAdapter = createBrowserVsqxAdapter();
const runtime = loadMikuScoreRuntime({
  expectedVersion: version,
  capabilities: {
    ...(verovioAdapter.capability ? { verovio: verovioAdapter.capability } : {}),
    ...(vsqxAdapter.capability ? { vsqxBridge: vsqxAdapter.capability } : {}),
  },
});
const runtimeV2Available = hasRuntimeApiV2(runtime, runtimeApiVersion);
globalThis.__mikuScoreWebRuntime = Object.freeze({
  version,
  runtimeApiVersion,
  embeddedModulePaths,
  verovioAvailable: verovioAdapter.available,
  vsqxAvailable: vsqxAdapter.available,
  v2Available: runtimeV2Available,
});

const abcInput = document.getElementById("abcInput");
const sourceFormat = document.getElementById("sourceFormat");
const sourceInput = document.getElementById("sourceInput");
const builtInSample = document.getElementById("builtInSample");
const musicXmlOutput = document.getElementById("musicXmlOutput");
const status = document.getElementById("status");
const localDraftStatus = document.getElementById("localDraftStatus");
const clearLocalDraft = document.getElementById("clearLocalDraft");
const resetBrowserSettings = document.getElementById("resetBrowserSettings");
const previewMeta = document.getElementById("previewMeta");
const scorePreview = document.getElementById("scorePreview");
const selectedNoteMeta = document.getElementById("selectedNoteMeta");
const newTemplatePianoGrandStaff = document.getElementById("newTemplatePianoGrandStaff");
const newPartCount = document.getElementById("newPartCount");
const newTimeBeats = document.getElementById("newTimeBeats");
const newTimeBeatType = document.getElementById("newTimeBeatType");
const newKeyFifths = document.getElementById("newKeyFifths");
const newPartClefList = document.getElementById("newPartClefList");
const measureSelect = document.getElementById("measureSelect");
const noteSelect = document.getElementById("noteSelect");
const pitchEditor = document.getElementById("pitchEditor");
const pitchStep = document.getElementById("pitchStep");
const pitchAlter = document.getElementById("pitchAlter");
const pitchOctave = document.getElementById("pitchOctave");
const noteDuration = document.getElementById("noteDuration");
const splitNote = document.getElementById("splitNote");
const convertRestToNote = document.getElementById("convertRestToNote");
const deleteNote = document.getElementById("deleteNote");
const selectedMeasureMeta = document.getElementById("selectedMeasureMeta");
const selectedMeasureNotes = document.getElementById("selectedMeasureNotes");
const previousMeasure = document.getElementById("previousMeasure");
const nextMeasure = document.getElementById("nextMeasure");
const previousMeasurePart = document.getElementById("previousMeasurePart");
const nextMeasurePart = document.getElementById("nextMeasurePart");
const playbackWaveform = document.getElementById("playbackWaveform");
const playbackUseMidiLike = document.getElementById("playbackUseMidiLike");
const graceTimingMode = document.getElementById("graceTimingMode");
const metricAccentEnabled = document.getElementById("metricAccentEnabled");
const metricAccentProfile = document.getElementById("metricAccentProfile");
const midiProgram = document.getElementById("midiProgram");
const forceMidiProgramPreset = document.getElementById("forceMidiProgramPreset");
const midiExportProfile = document.getElementById("midiExportProfile");
const keepMidiRoundtripMetadata = document.getElementById("keepMidiRoundtripMetadata");
const vsqxDefaultLyric = document.getElementById("vsqxDefaultLyric");
const vsqxSplitPartStaves = document.getElementById("vsqxSplitPartStaves");
const playScore = document.getElementById("playScore");
const stopPlayback = document.getElementById("stopPlayback");
const playbackStatus = document.getElementById("playbackStatus");
const importFormat = document.getElementById("importFormat");
const scoreFile = document.getElementById("scoreFile");
const zipEntrySelectLabel = document.getElementById("zipEntrySelectLabel");
const zipEntrySelect = document.getElementById("zipEntrySelect");
const exportFormat = document.getElementById("exportFormat");
const exportMusicXmlAsXmlExtension = document.getElementById("exportMusicXmlAsXmlExtension");
const runtimeV2ImportPolicy = document.getElementById("runtimeV2ImportPolicy");
const importSourceMetadata = document.getElementById("importSourceMetadata");
const importDebugMetadata = document.getElementById("importDebugMetadata");
const midiImportQuantizeGrid = document.getElementById("midiImportQuantizeGrid");
const midiImportTripletAware = document.getElementById("midiImportTripletAware");
const vsqxImportDefaultLyric = document.getElementById("vsqxImportDefaultLyric");
const runtimeV2ExportPolicy = document.getElementById("runtimeV2ExportPolicy");
const exportKeepRoundTripMetadata = document.getElementById("exportKeepRoundTripMetadata");
const exportKeepSourceMetadata = document.getElementById("exportKeepSourceMetadata");
const exportKeepDebugMetadata = document.getElementById("exportKeepDebugMetadata");
const measureEditor = document.getElementById("measureEditor");
const measureEditorStatus = document.getElementById("measureEditorStatus");
const measureEditorXml = document.getElementById("measureEditorXml");
const loadMeasureEditor = document.getElementById("loadMeasureEditor");
const applyMeasureEditor = document.getElementById("applyMeasureEditor");
const discardMeasureEditor = document.getElementById("discardMeasureEditor");
const appendMeasure = document.getElementById("appendMeasure");
const downloadMeasureMusicXml = document.getElementById("downloadMeasureMusicXml");
const downloadMeasureMidi = document.getElementById("downloadMeasureMidi");
const playMeasure = document.getElementById("playMeasure");
let svgIdToNodeId = new Map();
let noteInfoByNodeId = new Map();
let selectedNodeId = null;
let pendingSelectedNodeId = null;
let pendingZipArchiveBytes = null;
let pendingZipArchiveName = "";
let measureEditorLocation = null;
let measureEditorInitialXml = "";
const browserSynth = createBrowserSynth({ ticksPerQuarter: 480 });
let isPlaying = false;

status.textContent = `Loaded miku-score runtime ${version}; SVG preview is ${verovioAdapter.available ? "available" : "unavailable"}; VSQX conversion is ${vsqxAdapter.available ? "available" : "unavailable"}; v2 tools are ${runtimeV2Available ? "available" : "unavailable"}.`;

const showFailure = (result) => {
  status.textContent = result.diagnostics
    .map((item) => `${item.code}: ${item.message}`)
    .join(" ");
};

const renderLocalDraftState = () => {
  const draft = readBrowserDraft();
  clearLocalDraft.disabled = !draft;
  localDraftStatus.textContent = draft
    ? `Local draft saved at ${new Date(draft.updatedAt).toLocaleString()}.`
    : "No local draft is saved.";
};

const setCurrentMusicXml = (xml, { persistLocalDraft = true } = {}) => {
  musicXmlOutput.value = xml;
  clearMeasureEditor();
  if (persistLocalDraft) writeBrowserDraft(xml);
  renderLocalDraftState();
};

const loadImportedMusicXml = (imported) => {
  if (!imported.ok) {
    showFailure(imported);
    return null;
  }
  const loaded = runtime.score.loadMusicXml(imported.value);
  if (!loaded.ok) {
    showFailure(loaded);
    return null;
  }
  return {
    xml: loaded.value,
    warningCount: imported.warnings.length + loaded.warnings.length,
  };
};

const playbackPlanOptions = () => ({
  ticksPerQuarter: 480,
  useMidiLikePlayback: playbackUseMidiLike.checked,
  graceTimingMode: graceTimingMode.value,
  metricAccentEnabled: metricAccentEnabled.checked,
  metricAccentProfile: metricAccentProfile.value,
  startFromMeasure: selectedNodeId && noteInfoByNodeId.get(selectedNodeId)
    ? {
      partId: noteInfoByNodeId.get(selectedNodeId).partId,
      measureNumber: noteInfoByNodeId.get(selectedNodeId).measureNumber,
    }
    : null,
});

const midiOutputOptions = () => midiOutputOptionsFromValues({
  programPreset: midiProgram.value,
  forceProgramPreset: forceMidiProgramPreset.checked,
  graceTimingMode: graceTimingMode.value,
  metricAccentEnabled: metricAccentEnabled.checked,
  metricAccentProfile: metricAccentProfile.value,
  exportProfile: midiExportProfile.value,
  keepRoundtripMetadata: keepMidiRoundtripMetadata.checked,
});

const vsqxOutputOptions = () => vsqxOutputOptionsFromValues({
  defaultLyric: vsqxDefaultLyric.value,
  splitPartStaves: vsqxSplitPartStaves.checked,
});

const runtimeV2ImportPolicyValues = () => ({
  sourceMetadata: importSourceMetadata.checked,
  debugMetadata: importDebugMetadata.checked,
  midiQuantizeGrid: midiImportQuantizeGrid.value,
  midiTripletAware: midiImportTripletAware.checked,
  vsqxImportDefaultLyric: vsqxImportDefaultLyric.value,
});

const runtimeV2ExportPolicyValues = () => ({
  keepRoundTripMetadata: exportKeepRoundTripMetadata.checked,
  keepSourceMetadata: exportKeepSourceMetadata.checked,
  keepDebugMetadata: exportKeepDebugMetadata.checked,
});

const runtimeImportRequest = (format, data) => {
  const options = runtimeV2Available ? runtimeV2ImportOptions(format, runtimeV2ImportPolicyValues()) : null;
  return options ? { format, data, options } : { format, data };
};

const currentBrowserSettings = () => ({
  midiProgram: midiProgram.value,
  waveform: playbackWaveform.value,
  useMidiLikePlayback: playbackUseMidiLike.checked,
  graceTimingMode: graceTimingMode.value,
  metricAccentEnabled: metricAccentEnabled.checked,
  metricAccentProfile: metricAccentProfile.value,
  midiExportProfile: midiExportProfile.value,
  forceMidiProgramPreset: forceMidiProgramPreset.checked,
  keepMidiRoundtripMetadata: keepMidiRoundtripMetadata.checked,
  exportMusicXmlAsXmlExtension: exportMusicXmlAsXmlExtension.checked,
  vsqxDefaultLyric: vsqxDefaultLyric.value,
  vsqxSplitPartStaves: vsqxSplitPartStaves.checked,
  importSourceMetadata: importSourceMetadata.checked,
  importDebugMetadata: importDebugMetadata.checked,
  midiImportQuantizeGrid: midiImportQuantizeGrid.value,
  midiImportTripletAware: midiImportTripletAware.checked,
  vsqxImportDefaultLyric: vsqxImportDefaultLyric.value,
  exportKeepRoundTripMetadata: exportKeepRoundTripMetadata.checked,
  exportKeepSourceMetadata: exportKeepSourceMetadata.checked,
  exportKeepDebugMetadata: exportKeepDebugMetadata.checked,
});

const applyBrowserSettings = (settings) => {
  const normalized = normalizeBrowserSettings(settings);
  midiProgram.value = normalized.midiProgram;
  playbackWaveform.value = normalized.waveform;
  playbackUseMidiLike.checked = normalized.useMidiLikePlayback;
  graceTimingMode.value = normalized.graceTimingMode;
  metricAccentEnabled.checked = normalized.metricAccentEnabled;
  metricAccentProfile.value = normalized.metricAccentProfile;
  midiExportProfile.value = normalized.midiExportProfile;
  forceMidiProgramPreset.checked = normalized.forceMidiProgramPreset;
  keepMidiRoundtripMetadata.checked = normalized.keepMidiRoundtripMetadata;
  exportMusicXmlAsXmlExtension.checked = normalized.exportMusicXmlAsXmlExtension;
  vsqxDefaultLyric.value = normalized.vsqxDefaultLyric;
  vsqxSplitPartStaves.checked = normalized.vsqxSplitPartStaves;
  importSourceMetadata.checked = normalized.importSourceMetadata;
  importDebugMetadata.checked = normalized.importDebugMetadata;
  midiImportQuantizeGrid.value = normalized.midiImportQuantizeGrid;
  midiImportTripletAware.checked = normalized.midiImportTripletAware;
  vsqxImportDefaultLyric.value = normalized.vsqxImportDefaultLyric;
  exportKeepRoundTripMetadata.checked = normalized.exportKeepRoundTripMetadata;
  exportKeepSourceMetadata.checked = normalized.exportKeepSourceMetadata;
  exportKeepDebugMetadata.checked = normalized.exportKeepDebugMetadata;
  renderPlaybackControls();
};

const restoreBrowserSettings = () => {
  const stored = readBrowserSettings();
  if (stored) applyBrowserSettings(stored);
};

const persistBrowserSettings = () => {
  writeBrowserSettings(currentBrowserSettings());
};

const exportRequest = (format, xml = musicXmlOutput.value) => {
  const options = runtimeExportOptionsForFormat(format, {
    midi: midiOutputOptions(),
    vsqx: vsqxOutputOptions(),
  });
  if (runtimeV2Available) {
    options.musicXml = runtimeV2MusicXmlExportOptions(runtimeV2ExportPolicyValues());
  }
  return { format, xml, options };
};

const configuredExportFileDetails = (format, baseName = "miku-score") => {
  const details = exportFileDetails(format, baseName);
  return format === "musicxml" && exportMusicXmlAsXmlExtension.checked
    ? { ...details, fileName: `${baseName}.xml` }
    : details;
};

const renderPlaybackControls = () => {
  playScore.disabled = isPlaying || !musicXmlOutput.value.trim();
  stopPlayback.disabled = !isPlaying;
  playbackWaveform.disabled = isPlaying;
  playbackUseMidiLike.disabled = isPlaying;
  graceTimingMode.disabled = isPlaying;
  metricAccentEnabled.disabled = isPlaying;
  metricAccentProfile.disabled = isPlaying || !metricAccentEnabled.checked;
};

const boundedIntegerInput = (input, fallback, minimum, maximum) => {
  const parsed = Number(input.value);
  const normalized = Number.isFinite(parsed)
    ? Math.max(minimum, Math.min(maximum, Math.round(parsed)))
    : fallback;
  input.value = String(normalized);
  return normalized;
};

const selectedNewPartClefs = () => Array.from(
  newPartClefList.querySelectorAll("select[data-new-part-clef]"),
  (select) => select.value,
);

const renderNewPartClefControls = () => {
  const isPianoGrandStaff = newTemplatePianoGrandStaff.checked;
  newPartCount.disabled = isPianoGrandStaff;
  const previousClefs = selectedNewPartClefs();
  newPartClefList.replaceChildren();
  if (isPianoGrandStaff) {
    newPartClefList.textContent = "Template: one part with treble and bass staves.";
    return;
  }

  const partCount = boundedIntegerInput(newPartCount, 1, 1, 16);
  for (let index = 0; index < partCount; index += 1) {
    const label = document.createElement("label");
    label.textContent = `Part ${index + 1} clef `;
    const select = document.createElement("select");
    select.setAttribute("data-new-part-clef", "true");
    for (const [value, text] of [["treble", "treble"], ["alto", "alto"], ["bass", "bass"]]) {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = text;
      select.appendChild(option);
    }
    select.value = previousClefs[index] ?? "treble";
    label.appendChild(select);
    newPartClefList.appendChild(label);
  }
};

const newScoreCreationOptions = () => {
  const usePianoGrandStaffTemplate = newTemplatePianoGrandStaff.checked;
  const fifths = boundedIntegerInput(newKeyFifths, 0, -7, 7);
  const beats = boundedIntegerInput(newTimeBeats, 4, 1, 16);
  const beatType = Number(newTimeBeatType.value);
  return {
    usePianoGrandStaffTemplate,
    partCount: usePianoGrandStaffTemplate ? 1 : boundedIntegerInput(newPartCount, 1, 1, 16),
    fifths,
    beats,
    beatType: [2, 4, 8, 16].includes(beatType) ? beatType : 4,
    clefs: usePianoGrandStaffTemplate ? ["treble"] : selectedNewPartClefs(),
  };
};

const formatPitch = (pitch) => {
  if (!pitch) return "rest";
  const alter = pitch.alter === -2 ? "bb" : pitch.alter === -1 ? "b" :
    pitch.alter === 1 ? "#" : pitch.alter === 2 ? "##" : "";
  return `${pitch.step}${alter}${pitch.octave}`;
};

const renderSelectionControls = () => {
  noteSelect.replaceChildren();
  measureSelect.replaceChildren();
  const hasNotes = noteInfoByNodeId.size > 0;
  noteSelect.disabled = !hasNotes;
  measureSelect.disabled = !hasNotes;

  const notePlaceholder = document.createElement("option");
  notePlaceholder.value = "";
  notePlaceholder.textContent = hasNotes ? "(Select a note)" : "(Render a score first)";
  noteSelect.appendChild(notePlaceholder);
  for (const { nodeId, noteInfo } of listNoteSelections(noteInfoByNodeId)) {
    const option = document.createElement("option");
    option.value = nodeId;
    option.textContent = `${noteInfo.partId} / measure ${noteInfo.measureNumber} / ${formatPitch(noteInfo.pitch)} / voice ${noteInfo.voice}`;
    noteSelect.appendChild(option);
  }
  noteSelect.value = selectedNodeId ?? "";

  const measurePlaceholder = document.createElement("option");
  measurePlaceholder.value = "";
  measurePlaceholder.textContent = hasNotes ? "(Select a measure)" : "(Render a score first)";
  measureSelect.appendChild(measurePlaceholder);
  for (const measure of listMeasureSelections(noteInfoByNodeId)) {
    const option = document.createElement("option");
    option.value = measure.key;
    option.textContent = `${measure.partId} / measure ${measure.measureNumber}`;
    measureSelect.appendChild(option);
  }
  const selectedInfo = selectedNodeId ? noteInfoByNodeId.get(selectedNodeId) : null;
  measureSelect.value = selectedInfo
    ? makeMeasureKey(selectedInfo.partId, selectedInfo.measureNumber)
    : "";
};

const clearMeasureEditor = () => {
  measureEditorLocation = null;
  measureEditorInitialXml = "";
  measureEditorXml.value = "";
  renderMeasureEditorControls();
};

const renderMeasureEditorControls = () => {
  measureEditor.hidden = !runtimeV2Available;
  measureEditor.disabled = !runtimeV2Available;
  if (!runtimeV2Available) return;

  const selectedLocation = selectedMeasureLocation(noteInfoByNodeId, selectedNodeId);
  const editorLoaded = measureEditorLocation !== null && measureEditorXml.value.trim().length > 0;
  loadMeasureEditor.disabled = selectedLocation === null;
  applyMeasureEditor.disabled = !editorLoaded || measureEditorXml.value === measureEditorInitialXml;
  discardMeasureEditor.disabled = !editorLoaded || measureEditorXml.value === measureEditorInitialXml;
  appendMeasure.disabled = !musicXmlOutput.value.trim() || isPlaying;
  downloadMeasureMusicXml.disabled = !editorLoaded;
  downloadMeasureMidi.disabled = !editorLoaded;
  playMeasure.disabled = !editorLoaded || isPlaying;

  if (!editorLoaded) {
    measureEditorStatus.textContent = selectedLocation
      ? `${selectedLocation.partId} / measure ${selectedLocation.measureNumber} is ready to load as isolated MusicXML.`
      : "Render a score, then select a measure to load its isolated MusicXML.";
  }
};

const renderRuntimeV2Controls = () => {
  runtimeV2ImportPolicy.hidden = !runtimeV2Available;
  runtimeV2ImportPolicy.disabled = !runtimeV2Available;
  runtimeV2ExportPolicy.hidden = !runtimeV2Available;
  runtimeV2ExportPolicy.disabled = !runtimeV2Available;
  renderMeasureEditorControls();
};

const renderSelectedMeasure = () => {
  selectedMeasureNotes.replaceChildren();
  const noteInfo = selectedNodeId ? noteInfoByNodeId.get(selectedNodeId) : null;
  for (const [button, direction] of [
    [previousMeasure, "previous"],
    [nextMeasure, "next"],
    [previousMeasurePart, "previous-part"],
    [nextMeasurePart, "next-part"],
  ]) {
    button.disabled = !findMeasureNavigationTarget(noteInfoByNodeId, selectedNodeId, direction);
  }
  if (!noteInfo) {
    selectedMeasureMeta.textContent = "Render the score, then select a measure.";
    renderMeasureEditorControls();
    return;
  }

  const inspected = runtime.state.inspectMeasure(musicXmlOutput.value, noteInfo.measureNumber);
  if (!inspected.ok) {
    selectedMeasureMeta.textContent = inspected.diagnostics
      .map((item) => `${item.code}: ${item.message}`)
      .join(" ");
    renderMeasureEditorControls();
    return;
  }
  const measure = inspected.value.measures.find((candidate) => candidate.part_id === noteInfo.partId);
  if (!measure) {
    selectedMeasureMeta.textContent = `${noteInfo.partId} / measure ${noteInfo.measureNumber} is unavailable.`;
    renderMeasureEditorControls();
    return;
  }

  selectedMeasureMeta.textContent = `${noteInfo.partId} / measure ${noteInfo.measureNumber}: ${measure.note_count} note(s).`;
  for (const note of measure.notes) {
    const item = document.createElement("li");
    item.textContent = `${note.node_id ?? "(unmapped)"}: ${formatPitch(note.pitch)} / duration ${note.duration ?? "?"} / voice ${note.voice ?? "?"}`;
    selectedMeasureNotes.appendChild(item);
  }
  renderMeasureEditorControls();
};

const renderSelectedNote = () => {
  const noteInfo = selectedNodeId ? noteInfoByNodeId.get(selectedNodeId) : null;
  pitchEditor.disabled = !noteInfo;
  renderSelectionControls();
  if (!noteInfo) {
    selectedNoteMeta.textContent = "Render the score, then click a note to edit it.";
    convertRestToNote.disabled = true;
    renderSelectedMeasure();
    return;
  }

  const pitch = noteInfo.pitch ?? { step: "C", alter: 0, octave: 4 };
  pitchStep.value = pitch.step;
  pitchAlter.value = String(pitch.alter);
  pitchOctave.value = String(pitch.octave);
  noteDuration.value = String(noteInfo.duration ?? 1);
  splitNote.disabled = noteInfo.isRest;
  convertRestToNote.disabled = !noteInfo.isRest;
  deleteNote.disabled = noteInfo.isRest;
  selectedNoteMeta.textContent = noteInfo.isRest
    ? `Selected score node ${selectedNodeId} (voice ${noteInfo.voice}; rest).`
    : `Selected score node ${selectedNodeId} (voice ${noteInfo.voice}; ${pitch.step}${pitch.alter || ""}${pitch.octave}).`;
  renderSelectedMeasure();
};

const selectScoreNode = (nodeId) => {
  if (!noteInfoByNodeId.has(nodeId)) return false;
  selectedNodeId = nodeId;
  highlightSvgNode(scorePreview, svgIdToNodeId, selectedNodeId);
  renderSelectedNote();
  return true;
};

const clearPreview = () => {
  scorePreview.replaceChildren();
  svgIdToNodeId = new Map();
  noteInfoByNodeId = new Map();
  selectedNodeId = pendingSelectedNodeId;
  pendingSelectedNodeId = null;
  renderSelectedNote();
  renderPlaybackControls();
};

const invalidatePreview = (message, nextSelectedNodeId = null) => {
  pendingSelectedNodeId = nextSelectedNodeId;
  clearPreview();
  previewMeta.textContent = message;
};

const restoreLocalDraft = () => {
  const draft = readBrowserDraft();
  renderLocalDraftState();
  if (!draft) return;
  const loaded = runtime.score.loadMusicXml(draft.xml);
  if (!loaded.ok) {
    clearBrowserDraft();
    renderLocalDraftState();
    return;
  }
  setCurrentMusicXml(loaded.value, { persistLocalDraft: false });
  status.textContent = "Restored local draft.";
  invalidatePreview("Local draft restored. Render SVG preview to select a note.");
};

clearLocalDraft?.addEventListener("click", () => {
  clearBrowserDraft();
  renderLocalDraftState();
  status.textContent = "Cleared local draft.";
});

resetBrowserSettings?.addEventListener("click", () => {
  applyBrowserSettings(DEFAULT_BROWSER_SETTINGS);
  persistBrowserSettings();
  status.textContent = "Reset browser settings to defaults.";
});

restoreLocalDraft();

document.getElementById("convertAbc")?.addEventListener("click", async () => {
  const converted = await runtime.convert.importToMusicXml(runtimeImportRequest("abc", abcInput.value));
  const loaded = loadImportedMusicXml(converted);
  if (!loaded) return;
  setCurrentMusicXml(loaded.xml);
  status.textContent = `Converted ABC with ${loaded.warningCount} warning(s).`;
  invalidatePreview("Score changed. Render SVG preview to select a note.");
});

document.getElementById("importSource")?.addEventListener("click", async () => {
  const format = sourceFormat.value;
  if (!sourceInput.value.trim()) {
    status.textContent = "MKS_INPUT_INVALID: Enter source text before importing.";
    return;
  }
  const imported = await runtime.convert.importToMusicXml(runtimeImportRequest(format, sourceInput.value));
  const loaded = loadImportedMusicXml(imported);
  if (!loaded) return;
  setCurrentMusicXml(loaded.xml);
  status.textContent = `Imported ${format} text with ${loaded.warningCount} warning(s).`;
  invalidatePreview("Score changed. Render SVG preview to select a note.");
});

document.getElementById("loadBuiltInSample")?.addEventListener("click", () => {
  const sampleId = builtInSample.value;
  const sample = builtInSampleMusicXml(sampleId);
  if (!sample) {
    status.textContent = `MKS_INPUT_INVALID: Built-in sample ${sampleId} is unavailable.`;
    return;
  }
  const loaded = runtime.score.loadMusicXml(sample);
  if (!loaded.ok) return showFailure(loaded);
  setCurrentMusicXml(loaded.value);
  status.textContent = `Loaded built-in sample ${sampleId}.`;
  invalidatePreview("Score changed. Render SVG preview to select a note.");
});

document.getElementById("newScore")?.addEventListener("click", () => {
  const created = runtime.score.createNewMusicXml(newScoreCreationOptions());
  if (!created.ok) return showFailure(created);
  setCurrentMusicXml(created.value);
  status.textContent = "Created a new MusicXML score.";
  invalidatePreview("Score changed. Render SVG preview to select a note.");
});

newPartCount?.addEventListener("input", renderNewPartClefControls);
newPartCount?.addEventListener("change", renderNewPartClefControls);
newTemplatePianoGrandStaff?.addEventListener("change", renderNewPartClefControls);
renderNewPartClefControls();

const resetZipEntrySelection = () => {
  pendingZipArchiveBytes = null;
  pendingZipArchiveName = "";
  zipEntrySelect.replaceChildren();
  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = "(Select a ZIP file first)";
  zipEntrySelect.appendChild(placeholder);
  zipEntrySelect.value = "";
  zipEntrySelect.disabled = true;
  zipEntrySelectLabel.hidden = true;
};

const importZipEntry = async (entryPath) => {
  if (!runtimeV2Available || !pendingZipArchiveBytes || !entryPath) return;
  const format = inputFormatForFileName(entryPath);
  if (!format) {
    status.textContent = `MKS_INPUT_INVALID: ZIP entry ${entryPath} has no supported score extension.`;
    return;
  }
  const extracted = await runtime.archive.extractEntryBytes(pendingZipArchiveBytes, { path: entryPath });
  if (!extracted.ok) return showFailure(extracted);
  const imported = await runtime.convert.importToMusicXml(runtimeImportRequest(
    format,
    dataForRuntimeInputFormat(extracted.value, format),
  ));
  const loaded = loadImportedMusicXml(imported);
  if (!loaded) return;
  setCurrentMusicXml(loaded.xml);
  status.textContent = `Imported ${pendingZipArchiveName} / ${entryPath} as ${format} with ${loaded.warningCount} warning(s).`;
  invalidatePreview("Score changed. Render SVG preview to select a note.");
};

const prepareZipEntrySelection = async (file) => {
  if (!runtimeV2Available) {
    status.textContent = "MKS_INPUT_INVALID: ZIP root-entry selection requires a runtime v2 release.";
    return;
  }
  const bytes = new Uint8Array(await file.arrayBuffer());
  const listed = await runtime.archive.listRootEntryPaths(bytes, { extensions: runtimeInputExtensions });
  if (!listed.ok) return showFailure(listed);
  if (listed.value.length === 0) {
    status.textContent = "MKS_INPUT_INVALID: No supported root-level score files were found in the ZIP archive.";
    return;
  }
  pendingZipArchiveBytes = bytes;
  pendingZipArchiveName = file.name;
  zipEntrySelect.replaceChildren();
  for (const entryPath of listed.value) {
    const option = document.createElement("option");
    option.value = entryPath;
    option.textContent = entryPath;
    zipEntrySelect.appendChild(option);
  }
  zipEntrySelectLabel.hidden = false;
  zipEntrySelect.disabled = false;
  if (listed.value.length === 1) {
    await importZipEntry(listed.value[0]);
    return;
  }
  status.textContent = `Select one of ${listed.value.length} supported root entries from ${file.name}.`;
};

document.getElementById("importFile")?.addEventListener("click", async () => {
  const file = scoreFile.files?.[0];
  const format = importFormat.value === "auto"
    ? inputFormatForFileName(file?.name)
    : importFormat.value;
  if (!file || !format) {
    status.textContent = "MKS_INPUT_INVALID: Select a supported score file or choose its import format.";
    return;
  }

  try {
    if (format === "zip") {
      await prepareZipEntrySelection(file);
      return;
    }
    resetZipEntrySelection();
    const imported = await runtime.convert.importToMusicXml(runtimeImportRequest(
      format,
      await readBrowserFile(file, format),
    ));
    const loaded = loadImportedMusicXml(imported);
    if (!loaded) return;
    setCurrentMusicXml(loaded.xml);
    status.textContent = `Imported ${file.name} as ${format} with ${loaded.warningCount} warning(s).`;
    invalidatePreview("Score changed. Render SVG preview to select a note.");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    status.textContent = `MKS_INPUT_INVALID: ${message}`;
  }
});

zipEntrySelect?.addEventListener("change", () => {
  void importZipEntry(zipEntrySelect.value);
});

document.getElementById("exportFile")?.addEventListener("click", async () => {
  const format = exportFormat.value;
  if (!musicXmlOutput.value.trim()) {
    status.textContent = "MKS_MUSICXML_INVALID: No MusicXML is available to export.";
    return;
  }
  if (format === "svg" && verovioAdapter.capability) {
    try {
      await verovioAdapter.initialize();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      status.textContent = `MKS_CAPABILITY_VEROVIO_UNAVAILABLE: ${message}`;
      return;
    }
  }

  const exported = await runtime.convert.exportFromMusicXml(exportRequest(format));
  if (!exported.ok) return showFailure(exported);
  try {
    downloadBrowserData(exported.value, configuredExportFileDetails(format));
    status.textContent = `Downloaded ${format} file.`;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    status.textContent = `MKS_OUTPUT_FAILED: ${message}`;
  }
});

const exportFormatForArchive = async (format) => {
  if (format === "svg" && verovioAdapter.capability) await verovioAdapter.initialize();
  return runtime.convert.exportFromMusicXml(exportRequest(format));
};

document.getElementById("exportAll")?.addEventListener("click", async () => {
  if (!musicXmlOutput.value.trim()) {
    status.textContent = "MKS_MUSICXML_INVALID: No MusicXML is available to export.";
    return;
  }
  try {
    const entries = [];
    for (const format of ["musicxml", "mxl", "abc", "midi", "vsqx", "mei", "lilypond", "musescore", "mscz", "svg"]) {
      const exported = await exportFormatForArchive(format);
      if (!exported.ok) return showFailure(exported);
      entries.push({ path: configuredExportFileDetails(format).fileName, data: exported.value });
    }
    const archive = await runtime.output.encodeZipBundle(entries, { compressed: true });
    if (!archive.ok) return showFailure(archive);
    downloadBrowserData(archive.value, exportFileDetails("zip", "miku-score-all"));
    status.textContent = `Downloaded ${entries.length} formats as a ZIP archive.`;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    status.textContent = `MKS_OUTPUT_FAILED: ${message}`;
  }
});

document.getElementById("renderScore")?.addEventListener("click", async () => {
  if (!musicXmlOutput.value.trim()) {
    previewMeta.textContent = "MKS_MUSICXML_INVALID: No MusicXML is available to render.";
    clearPreview();
    return;
  }

  previewMeta.textContent = "Initializing Verovio...";
  if (verovioAdapter.capability) {
    try {
      await verovioAdapter.initialize();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      previewMeta.textContent = `MKS_CAPABILITY_VEROVIO_UNAVAILABLE: ${message}`;
      clearPreview();
      return;
    }
  }

  const renderBundle = prepareMusicXmlForSvgClickMap(musicXmlOutput.value);
  if (!renderBundle) {
    previewMeta.textContent = "MKS_MUSICXML_INVALID: Input is not a valid MusicXML document.";
    clearPreview();
    return;
  }

  previewMeta.textContent = "Rendering SVG preview...";
  const rendered = runtime.render.renderSvg(renderBundle.xml, {
    pageWidth: 20000,
    pageHeight: 3000,
    scale: 40,
    breaks: "none",
    mnumInterval: 1,
    adjustPageHeight: 1,
    footer: "none",
    header: "none",
  });
  if (!rendered.ok) {
    previewMeta.textContent = rendered.diagnostics
      .map((item) => `${item.code}: ${item.message}`)
      .join(" ");
    clearPreview();
    return;
  }

  scorePreview.innerHTML = rendered.value;
  const renderedNoteIds = deriveRenderedNoteIds(scorePreview);
  const preparedMap = prepareRenderedSvgIdMap(renderBundle, renderedNoteIds);
  svgIdToNodeId = preparedMap.map;
  noteInfoByNodeId = renderBundle.noteInfoByNodeId;
  if (!selectedNodeId || !noteInfoByNodeId.has(selectedNodeId)) {
    selectedNodeId = null;
  }
  if (selectedNodeId) highlightSvgNode(scorePreview, svgIdToNodeId, selectedNodeId);
  renderSelectedNote();
  previewMeta.textContent = `Rendered SVG preview with ${svgIdToNodeId.size}/${renderBundle.noteCount} mapped note(s); click-map=${preparedMap.mapMode}.`;
});

scorePreview?.addEventListener("click", (event) => {
  const nodeId = resolveNodeIdFromSvgTarget(event.target, svgIdToNodeId);
  if (!nodeId) {
    previewMeta.textContent = "Could not map the clicked SVG element to a score node.";
    return;
  }
  selectScoreNode(nodeId);
  const svgId = highlightSvgNode(scorePreview, svgIdToNodeId, selectedNodeId);
  previewMeta.textContent = `Selected score node ${nodeId}${svgId ? ` via ${svgId}` : ""}.`;
});

noteSelect?.addEventListener("change", () => {
  if (!selectScoreNode(noteSelect.value)) return;
  previewMeta.textContent = `Selected score node ${selectedNodeId} from the note selector.`;
});

measureSelect?.addEventListener("change", () => {
  const nodeId = firstNodeIdForMeasure(noteInfoByNodeId, measureSelect.value);
  if (!nodeId || !selectScoreNode(nodeId)) return;
  previewMeta.textContent = `Selected measure; score node ${selectedNodeId} is ready to edit.`;
});

const navigateSelectedMeasure = (direction) => {
  const nodeId = findMeasureNavigationTarget(noteInfoByNodeId, selectedNodeId, direction);
  if (!nodeId || !selectScoreNode(nodeId)) return;
  previewMeta.textContent = `Selected ${direction} measure; score node ${selectedNodeId} is ready to edit.`;
};

previousMeasure?.addEventListener("click", () => navigateSelectedMeasure("previous"));
nextMeasure?.addEventListener("click", () => navigateSelectedMeasure("next"));
previousMeasurePart?.addEventListener("click", () => navigateSelectedMeasure("previous-part"));
nextMeasurePart?.addEventListener("click", () => navigateSelectedMeasure("next-part"));

const loadSelectedMeasureEditor = () => {
  const location = selectedMeasureLocation(noteInfoByNodeId, selectedNodeId);
  if (!runtimeV2Available || !location || !musicXmlOutput.value.trim()) {
    renderMeasureEditorControls();
    return;
  }
  const extracted = runtime.measure.extractEditorMusicXml(musicXmlOutput.value, location);
  if (!extracted.ok) return showFailure(extracted);
  measureEditorLocation = location;
  measureEditorInitialXml = extracted.value;
  measureEditorXml.value = extracted.value;
  measureEditorStatus.textContent = `Loaded isolated MusicXML for ${location.partId} / measure ${location.measureNumber}.`;
  renderMeasureEditorControls();
};

const discardSelectedMeasureEditor = () => {
  if (!measureEditorLocation || !runtimeV2Available) return;
  const extracted = runtime.measure.extractEditorMusicXml(musicXmlOutput.value, measureEditorLocation);
  if (!extracted.ok) return showFailure(extracted);
  measureEditorInitialXml = extracted.value;
  measureEditorXml.value = extracted.value;
  measureEditorStatus.textContent = `Discarded changes to ${measureEditorLocation.partId} / measure ${measureEditorLocation.measureNumber}.`;
  renderMeasureEditorControls();
};

const applySelectedMeasureEditor = () => {
  if (!measureEditorLocation || !runtimeV2Available) return;
  const location = measureEditorLocation;
  const replaced = runtime.measure.replaceEditorMusicXml(musicXmlOutput.value, {
    ...location,
    editorXml: measureEditorXml.value,
  });
  if (!replaced.ok) return showFailure(replaced);
  const loaded = runtime.score.loadMusicXml(replaced.value);
  if (!loaded.ok) return showFailure(loaded);
  setCurrentMusicXml(loaded.value);
  status.textContent = `Applied isolated measure edit for ${location.partId} / measure ${location.measureNumber}.`;
  invalidatePreview("Score changed. Render SVG preview to confirm the measure edit.");
};

const appendScoreMeasure = () => {
  if (!runtimeV2Available || !musicXmlOutput.value.trim()) return;
  const appended = runtime.measure.appendMeasure(musicXmlOutput.value);
  if (!appended.ok) return showFailure(appended);
  const loaded = runtime.score.loadMusicXml(appended.value);
  if (!loaded.ok) return showFailure(loaded);
  setCurrentMusicXml(loaded.value);
  status.textContent = "Appended one full-measure rest to every score part.";
  invalidatePreview("Score changed. Render SVG preview to select a measure.");
};

const currentMeasureEditorXml = () => {
  if (!measureEditorLocation || !measureEditorXml.value.trim()) {
    status.textContent = "MKS_MUSICXML_INVALID: Load an isolated measure before using a measure action.";
    return null;
  }
  return measureEditorXml.value;
};

const measureExportBaseName = () => {
  const location = measureEditorLocation;
  const safePart = String(location?.partId ?? "part").replace(/[^A-Za-z0-9_-]+/g, "-");
  const safeMeasure = String(location?.measureNumber ?? "measure").replace(/[^A-Za-z0-9_-]+/g, "-");
  return `miku-score-${safePart}-measure-${safeMeasure}`;
};

const downloadCurrentMeasure = async (format) => {
  const xml = currentMeasureEditorXml();
  if (!xml) return;
  const exported = await runtime.convert.exportFromMusicXml(exportRequest(format, xml));
  if (!exported.ok) return showFailure(exported);
  try {
    downloadBrowserData(exported.value, configuredExportFileDetails(format, measureExportBaseName()));
    status.textContent = `Downloaded isolated measure ${format}.`;
  } catch (error) {
    status.textContent = `MKS_OUTPUT_FAILED: ${error instanceof Error ? error.message : String(error)}`;
  }
};

const playCurrentMeasure = () => {
  const xml = currentMeasureEditorXml();
  if (!xml || isPlaying) return;
  const plan = runtime.playback.buildPlan(xml, { ...playbackPlanOptions(), startFromMeasure: null });
  if (!plan.ok) return showFailure(plan);
  browserSynth.play(plan.value.schedule, {
    waveform: playbackWaveform.value,
    onEnded: () => {
      isPlaying = false;
      playbackStatus.textContent = "Playback: stopped";
      renderPlaybackControls();
    },
  }).then(() => {
    isPlaying = true;
    playbackStatus.textContent = `Playing isolated measure with ${plan.value.eventCount} event(s).`;
    renderPlaybackControls();
    renderMeasureEditorControls();
  }).catch((error) => {
    playbackStatus.textContent = `Playback failed: ${error instanceof Error ? error.message : String(error)}`;
    renderPlaybackControls();
    renderMeasureEditorControls();
  });
};

loadMeasureEditor?.addEventListener("click", loadSelectedMeasureEditor);
applyMeasureEditor?.addEventListener("click", applySelectedMeasureEditor);
discardMeasureEditor?.addEventListener("click", discardSelectedMeasureEditor);
appendMeasure?.addEventListener("click", appendScoreMeasure);
downloadMeasureMusicXml?.addEventListener("click", () => { void downloadCurrentMeasure("musicxml"); });
downloadMeasureMidi?.addEventListener("click", () => { void downloadCurrentMeasure("midi"); });
playMeasure?.addEventListener("click", playCurrentMeasure);
measureEditorXml?.addEventListener("input", renderMeasureEditorControls);

const applySelectedCommand = (command, successMessage) => {
  const applied = runtime.state.applyCommand(musicXmlOutput.value, command);
  if (!applied.ok) return showFailure(applied);
  if (!applied.value.ok) {
    status.textContent = applied.value.diagnostics
      .map((item) => `${item.code}: ${item.message}`)
      .join(" ");
    return;
  }

  setCurrentMusicXml(applied.value.xml);
  status.textContent = successMessage;
  const nextSelectedNodeId = chooseSelectedNodeAfterSerializedCommand(
    selectedNodeId,
    command.type,
    noteInfoByNodeId.size,
  );
  invalidatePreview("Score changed. Render SVG preview to confirm the edit.", nextSelectedNodeId);
};

const runSelectedEdit = (operation, input, successMessage) => {
  const noteInfo = selectedNodeId ? noteInfoByNodeId.get(selectedNodeId) : null;
  const command = createSelectedNoteCommand(operation, selectedNodeId, noteInfo, input);
  if (!command.ok) {
    status.textContent = `MVP_INVALID_COMMAND_PAYLOAD: ${command.message}`;
    return;
  }
  applySelectedCommand(command.value, successMessage);
};

const selectedPitchInput = () => ({
  step: pitchStep.value,
  alter: pitchAlter.value,
  octave: pitchOctave.value,
});

document.getElementById("applyPitch")?.addEventListener("click", () => {
  runSelectedEdit("change_to_pitch", selectedPitchInput(), `Changed pitch for score node ${selectedNodeId}.`);
});

document.getElementById("applyDuration")?.addEventListener("click", () => {
  runSelectedEdit("change_duration", { duration: noteDuration.value }, `Changed duration for score node ${selectedNodeId}.`);
});

document.getElementById("insertNoteAfter")?.addEventListener("click", () => {
  runSelectedEdit("insert_note_after", {
    ...selectedPitchInput(),
    duration: noteDuration.value,
  }, `Inserted a note after score node ${selectedNodeId}.`);
});

splitNote?.addEventListener("click", () => {
  runSelectedEdit("split_note", {}, `Split score node ${selectedNodeId}.`);
});

convertRestToNote?.addEventListener("click", () => {
  runSelectedEdit("change_to_pitch", selectedPitchInput(), `Converted rest at score node ${selectedNodeId} to a note.`);
});

deleteNote?.addEventListener("click", () => {
  runSelectedEdit("delete_note", {}, `Deleted score node ${selectedNodeId}.`);
});

document.getElementById("downloadMidi")?.addEventListener("click", async () => {
  const exported = await runtime.convert.exportFromMusicXml(exportRequest("midi"));
  if (!exported.ok) return showFailure(exported);
  const bytes = exported.value;
  if (!(bytes instanceof Uint8Array)) {
    status.textContent = "MIDI export returned an unexpected non-binary value.";
    return;
  }
  const url = URL.createObjectURL(new Blob([bytes], { type: "audio/midi" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "miku-score.mid";
  anchor.click();
  URL.revokeObjectURL(url);
  status.textContent = "Downloaded MIDI.";
});

document.getElementById("buildPlaybackPlan")?.addEventListener("click", () => {
  const plan = runtime.playback.buildPlan(musicXmlOutput.value, playbackPlanOptions());
  if (!plan.ok) return showFailure(plan);
  status.textContent = `Playback plan has ${plan.value.eventCount} event(s).`;
});

playScore?.addEventListener("click", () => {
  if (isPlaying) return;
  const plan = runtime.playback.buildPlan(musicXmlOutput.value, playbackPlanOptions());
  if (!plan.ok) return showFailure(plan);
  browserSynth.play(plan.value.schedule, {
    waveform: playbackWaveform.value,
    onEnded: () => {
      isPlaying = false;
      playbackStatus.textContent = "Playback: stopped";
      renderPlaybackControls();
      renderMeasureEditorControls();
    },
  }).then(() => {
    isPlaying = true;
    playbackStatus.textContent = `Playing ${plan.value.eventCount} event(s) from ${plan.value.initialLocation?.measureNumber ?? "start"}.`;
    renderPlaybackControls();
    renderMeasureEditorControls();
  }).catch((error) => {
    playbackStatus.textContent = `Playback failed: ${error instanceof Error ? error.message : String(error)}`;
    renderPlaybackControls();
    renderMeasureEditorControls();
  });
});

stopPlayback?.addEventListener("click", () => {
  browserSynth.stop();
  isPlaying = false;
  playbackStatus.textContent = "Playback: stopped";
  renderPlaybackControls();
  renderMeasureEditorControls();
});

metricAccentEnabled?.addEventListener("change", renderPlaybackControls);
for (const input of [
  midiProgram,
  playbackWaveform,
  playbackUseMidiLike,
  graceTimingMode,
  metricAccentEnabled,
  metricAccentProfile,
  midiExportProfile,
  forceMidiProgramPreset,
  keepMidiRoundtripMetadata,
  exportMusicXmlAsXmlExtension,
  vsqxDefaultLyric,
  vsqxSplitPartStaves,
  importSourceMetadata,
  importDebugMetadata,
  midiImportQuantizeGrid,
  midiImportTripletAware,
  vsqxImportDefaultLyric,
  exportKeepRoundTripMetadata,
  exportKeepSourceMetadata,
  exportKeepDebugMetadata,
]) {
  input?.addEventListener("change", persistBrowserSettings);
  input?.addEventListener("input", persistBrowserSettings);
}
restoreBrowserSettings();
renderPlaybackControls();
resetZipEntrySelection();
renderRuntimeV2Controls();
renderLocalDraftState();
