import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import jsdom from "jsdom";

import { readZipEntries } from "./lib/zip-inspect.mjs";

const { JSDOM } = jsdom;
const root = process.cwd();
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const moduleMatch = html.match(/<script type="module">\s*([\s\S]*?)\s*<\/script>/i);
assert.ok(moduleMatch, "generated Web App must contain its module script");

const dom = new JSDOM(html, { runScripts: "outside-only", url: "https://miku-score-web.test/" });
const originalGlobals = new Map();
const installedGlobals = {
  window: dom.window,
  document: dom.window.document,
  DOMParser: dom.window.DOMParser,
  XMLSerializer: dom.window.XMLSerializer,
  Element: dom.window.Element,
  Document: dom.window.Document,
  Node: dom.window.Node,
  HTMLElement: dom.window.HTMLElement,
  customElements: dom.window.customElements,
  Event: dom.window.Event,
  CustomEvent: dom.window.CustomEvent,
  MouseEvent: dom.window.MouseEvent,
  Blob: globalThis.Blob,
  CSS: { escape: (value) => String(value).replace(/[^A-Za-z0-9_-]/g, "\\$") },
};
for (const [key, value] of Object.entries(installedGlobals)) {
  originalGlobals.set(key, globalThis[key]);
  globalThis[key] = value;
}

const downloads = [];
const downloadBlobs = [];
const originalUrl = globalThis.URL;
globalThis.URL = {
  createObjectURL: (blob) => {
    downloadBlobs.push(blob);
    return "blob:miku-score-web-ui";
  },
  revokeObjectURL: () => undefined,
};
const originalAnchorClick = dom.window.HTMLAnchorElement.prototype.click;
dom.window.HTMLAnchorElement.prototype.click = function click() {
  downloads.push({ href: this.href, download: this.download });
};

class MockToolkit {
  setOptions() {}

  loadData(xml) {
    this.xml = xml;
    return true;
  }

  getPageCount() {
    return 1;
  }

  renderToSVG() {
    const noteIds = [...this.xml.matchAll(/(?:xml:)?id="(mks-web-n[0-9]+)"/g)]
      .map((match) => match[1]);
    return `<svg>${noteIds.map((id) => `<g class="note" id="${id}"><path id="${id}-head"/></g>`).join("")}</svg>`;
  }
}

const originalVerovio = globalThis.verovio;
globalThis.verovio = {
  module: { calledRun: true, cwrap: () => undefined },
  toolkit: MockToolkit,
};

const vsqxVendor = fs.readFileSync(
  path.join(root, "vendor/utaformatix3/utaformatix3-ts-plus.mikuscore.iife.js"),
  "utf8",
);
dom.window.eval(vsqxVendor);
const originalVsqx = globalThis.UtaFormatix3TsPlusMikuscore;
globalThis.UtaFormatix3TsPlusMikuscore = dom.window.UtaFormatix3TsPlusMikuscore;

const settle = async () => {
  await new Promise((resolve) => setTimeout(resolve, 0));
  await new Promise((resolve) => setTimeout(resolve, 0));
};

try {
  await import(`data:text/javascript;base64,${Buffer.from(moduleMatch[1]).toString("base64")}`);
  const document = dom.window.document;
  const byId = (id) => document.getElementById(id);

  assert.equal(globalThis.customElements.get("lht-help-tooltip")?.name, "LhtHelpTooltip");
  const helpTooltip = document.querySelector("lht-help-tooltip");
  assert.ok(helpTooltip?.shadowRoot, "help tooltip must be upgraded in the generated Web App");
  const helpButton = helpTooltip.shadowRoot.querySelector("button");
  assert.equal(helpButton.getAttribute("aria-label"), "About miku-score Web");
  helpButton.click();
  assert.equal(helpTooltip.hasAttribute("open"), true);

  assert.equal(globalThis.customElements.get("lht-file-select")?.name, "LhtFileSelect");
  const fileSelect = document.querySelector("lht-file-select");
  assert.ok(fileSelect, "file select must be upgraded in the generated Web App");
  assert.equal(byId("scoreFile")?.type, "file");
  assert.equal(byId("selectedScoreFileName")?.textContent, "No file selected");
  let beforeOpen = false;
  fileSelect.addEventListener("lht-file-select:before-open", (event) => {
    beforeOpen = true;
    event.preventDefault();
  }, { once: true });
  byId("selectScoreFile").click();
  assert.equal(beforeOpen, true);
  let fileSelection = null;
  fileSelect.addEventListener("lht-file-select:change", (event) => {
    fileSelection = event.detail;
  }, { once: true });
  Object.defineProperty(byId("scoreFile"), "files", {
    configurable: true,
    value: [{ name: "chosen.abc" }],
  });
  byId("scoreFile").dispatchEvent(new dom.window.Event("change", { bubbles: true }));
  assert.equal(byId("selectedScoreFileName").textContent, "chosen.abc");
  assert.deepEqual(fileSelection?.names, ["chosen.abc"]);

  assert.equal(globalThis.customElements.get("lht-select-help")?.name, "LhtSelectHelp");
  const midiExportProfileHelp = document.querySelector("lht-select-help[field-id='midiExportProfile']");
  const midiExportProfile = byId("midiExportProfile");
  assert.ok(midiExportProfileHelp, "MIDI export profile must be upgraded through lht-select-help");
  assert.equal(midiExportProfileHelp.getValue(), "musescore_parity");
  assert.equal(midiExportProfile.value, "musescore_parity");
  assert.equal(midiExportProfile.title, "Choose the MIDI export behavior for individual downloads, ZIP downloads, and MIDI-like playback.");
  midiExportProfileHelp.setValue("safe");
  assert.equal(midiExportProfileHelp.getValue(), "safe");
  midiExportProfileHelp.setOptions([
    { value: "safe", label: "Safe" },
    { value: "musescore_parity", label: "MuseScore parity" },
  ]);
  assert.equal(midiExportProfile.value, "safe");
  midiExportProfileHelp.setValue("musescore_parity");

  assert.equal(globalThis.customElements.get("lht-switch-help")?.name, "LhtSwitchHelp");
  const midiRoundtripMetadataHelp = document.querySelector("lht-switch-help[switch-id='keepMidiRoundtripMetadata']");
  const keepMidiRoundtripMetadata = byId("keepMidiRoundtripMetadata");
  assert.ok(midiRoundtripMetadataHelp, "MIDI round-trip metadata must be upgraded through lht-switch-help");
  assert.equal(keepMidiRoundtripMetadata.checked, true);
  assert.equal(
    midiRoundtripMetadataHelp.querySelector("lht-help-tooltip")?.textContent,
    "Preserve miku-score round-trip metadata in MIDI output.",
  );
  let roundtripChanges = 0;
  keepMidiRoundtripMetadata.addEventListener("change", () => { roundtripChanges += 1; }, { once: true });
  keepMidiRoundtripMetadata.checked = false;
  keepMidiRoundtripMetadata.dispatchEvent(new dom.window.Event("change", { bubbles: true }));
  assert.equal(roundtripChanges, 1);
  assert.equal(midiRoundtripMetadataHelp.checked, false);
  midiRoundtripMetadataHelp.setChecked(true);
  assert.equal(keepMidiRoundtripMetadata.checked, true);
  const forceMidiProgramPresetHelp = document.querySelector("lht-switch-help[switch-id='forceMidiProgramPreset']");
  const forceMidiProgramPreset = byId("forceMidiProgramPreset");
  assert.ok(forceMidiProgramPresetHelp, "MIDI program override must be upgraded through lht-switch-help");
  assert.equal(forceMidiProgramPreset.checked, false);
  assert.equal(
    forceMidiProgramPresetHelp.querySelector("lht-help-tooltip")?.textContent,
    "Force the selected program for every exported MIDI track, even when the score changes programs.",
  );

  assert.equal(globalThis.customElements.get("lht-text-field-help")?.name, "LhtTextFieldHelp");
  const vsqxDefaultLyricHelp = document.querySelector("lht-text-field-help[field-id='vsqxDefaultLyric']");
  const vsqxDefaultLyric = byId("vsqxDefaultLyric");
  assert.ok(vsqxDefaultLyricHelp, "VSQX default lyric must be upgraded through lht-text-field-help");
  assert.equal(vsqxDefaultLyricHelp.getValue(), "ら");
  assert.equal(vsqxDefaultLyric.maxLength, 32);
  assert.equal(vsqxDefaultLyric.title, "Use this lyric when a VSQX export needs a default vocal syllable.");
  vsqxDefaultLyricHelp.setValue("み");
  assert.equal(vsqxDefaultLyric.value, "み");
  vsqxDefaultLyricHelp.setValue("ら");
  const vsqxSplitPartStavesHelp = document.querySelector("lht-switch-help[switch-id='vsqxSplitPartStaves']");
  const vsqxSplitPartStaves = byId("vsqxSplitPartStaves");
  assert.ok(vsqxSplitPartStavesHelp, "VSQX split-part-staves must be upgraded through lht-switch-help");
  assert.equal(vsqxSplitPartStaves.checked, false);
  assert.equal(
    vsqxSplitPartStavesHelp.querySelector("lht-help-tooltip")?.textContent,
    "Render staves from each part separately in the generated VSQX file.",
  );

  const runtimeV2Switches = [
    ["exportMusicXmlAsXmlExtension", false, "Download MusicXML with a .xml extension instead of .musicxml."],
    ["importSourceMetadata", true, "Keep mks:src metadata when importing through Runtime v2."],
    ["importDebugMetadata", true, "Keep mks:dbg metadata when importing through Runtime v2."],
    ["midiImportTripletAware", true, "Recognize triplet timing while Runtime v2 quantizes imported MIDI."],
    ["exportKeepRoundTripMetadata", true, "Keep mks:meta round-trip metadata in Runtime v2 output."],
    ["exportKeepSourceMetadata", true, "Keep mks:src source metadata in Runtime v2 output."],
    ["exportKeepDebugMetadata", true, "Keep mks:dbg debug metadata in Runtime v2 output."],
  ];
  for (const [switchId, checked, helpText] of runtimeV2Switches) {
    const host = document.querySelector(`lht-switch-help[switch-id='${switchId}']`);
    assert.ok(host, `${switchId} must be upgraded through lht-switch-help`);
    assert.equal(byId(switchId).checked, checked);
    assert.equal(host.querySelector("lht-help-tooltip")?.textContent, helpText);
  }
  const midiImportQuantizeHelp = document.querySelector("lht-select-help[field-id='midiImportQuantizeGrid']");
  const midiImportQuantizeGrid = byId("midiImportQuantizeGrid");
  assert.ok(midiImportQuantizeHelp, "MIDI quantize grid must be upgraded through lht-select-help");
  assert.equal(midiImportQuantizeGrid.value, "1/64");
  assert.equal(midiImportQuantizeGrid.title, "Choose the rhythmic grid used when Runtime v2 imports MIDI.");
  const vsqxImportDefaultLyricHelp = document.querySelector("lht-text-field-help[field-id='vsqxImportDefaultLyric']");
  const vsqxImportDefaultLyric = byId("vsqxImportDefaultLyric");
  assert.ok(vsqxImportDefaultLyricHelp, "VSQX import lyric must be upgraded through lht-text-field-help");
  assert.equal(vsqxImportDefaultLyric.value, "ら");
  assert.equal(vsqxImportDefaultLyric.maxLength, 32);
  assert.equal(vsqxImportDefaultLyric.title, "Use this lyric when imported VSQX data needs a default vocal syllable.");

  const playbackAndMidiSelects = [
    ["playbackWaveform", "triangle", "Choose the browser oscillator waveform used for playback."],
    ["graceTimingMode", "before_beat", "Choose how grace-note timing is applied to the playback plan."],
    ["metricAccentProfile", "subtle", "Choose the strength of metric accents in browser playback."],
    ["midiProgram", "electric_piano_2", "Choose the MIDI program preset used for MIDI export and MIDI-like playback."],
  ];
  for (const [fieldId, value, helpText] of playbackAndMidiSelects) {
    const host = document.querySelector(`lht-select-help[field-id='${fieldId}']`);
    assert.ok(host, `${fieldId} must be upgraded through lht-select-help`);
    assert.equal(byId(fieldId).value, value);
    assert.equal(byId(fieldId).title, helpText);
  }
  const playbackSwitches = [
    ["playbackUseMidiLike", "Use the runtime's MIDI-like playback plan instead of direct score timing."],
    ["metricAccentEnabled", "Apply metric accents to browser playback."],
  ];
  for (const [switchId, helpText] of playbackSwitches) {
    const host = document.querySelector(`lht-switch-help[switch-id='${switchId}']`);
    assert.ok(host, `${switchId} must be upgraded through lht-switch-help`);
    assert.equal(byId(switchId).checked, true);
    assert.equal(host.querySelector("lht-help-tooltip")?.textContent, helpText);
  }

  const newScoreSelects = [
    ["newTimeBeatType", "4", "Choose the note value that receives one beat."],
    ["newKeyFifths", "0", "Choose the key signature for the new score."],
  ];
  for (const [fieldId, value, helpText] of newScoreSelects) {
    const host = document.querySelector(`lht-select-help[field-id='${fieldId}']`);
    assert.ok(host, `${fieldId} must be upgraded through lht-select-help`);
    assert.equal(byId(fieldId).value, value);
    assert.equal(byId(fieldId).title, helpText);
  }
  const newScoreTextFields = [
    ["newPartCount", "1", "Choose the number of parts in the new score."],
    ["newTimeBeats", "4", "Choose the number of beats in each new-score measure."],
  ];
  for (const [fieldId, value, helpText] of newScoreTextFields) {
    const host = document.querySelector(`lht-text-field-help[field-id='${fieldId}']`);
    assert.ok(host, `${fieldId} must be upgraded through lht-text-field-help`);
    assert.equal(byId(fieldId).type, "number");
    assert.equal(byId(fieldId).value, value);
    assert.equal(byId(fieldId).min, "1");
    assert.equal(byId(fieldId).max, "16");
    assert.equal(byId(fieldId).step, "1");
    assert.equal(byId(fieldId).title, helpText);
  }
  const pianoGrandStaffHelp = document.querySelector("lht-switch-help[switch-id='newTemplatePianoGrandStaff']");
  assert.ok(pianoGrandStaffHelp, "Piano grand staff must be upgraded through lht-switch-help");
  assert.equal(byId("newTemplatePianoGrandStaff").checked, false);
  assert.equal(pianoGrandStaffHelp.querySelector("lht-help-tooltip")?.textContent, "Create the first part as a piano grand staff.");

  const sourceFileExportSelects = [
    ["sourceFormat", "musicxml", "Choose the format of the source text to import."],
    ["builtInSample", "6", "Choose a bundled MusicXML sample to load."],
    ["importFormat", "auto", "Choose auto detection or the format of the selected score file."],
    ["exportFormat", "musicxml", "Choose the format for the next file download."],
  ];
  for (const [fieldId, value, helpText] of sourceFileExportSelects) {
    const host = document.querySelector(`lht-select-help[field-id='${fieldId}']`);
    assert.ok(host, `${fieldId} must be upgraded through lht-select-help`);
    assert.equal(byId(fieldId).value, value);
    assert.equal(byId(fieldId).title, helpText);
  }
  const dynamicSelects = [
    ["zipEntrySelect", "Choose the root score entry from the imported ZIP archive.", "(Select a ZIP file first)"],
    ["measureSelect", "Choose a rendered measure to inspect or edit.", "(Render a score first)"],
    ["noteSelect", "Choose a rendered note to inspect or edit.", "(Render a score first)"],
  ];
  for (const [fieldId, helpText, placeholder] of dynamicSelects) {
    const host = document.querySelector(`lht-select-help[field-id='${fieldId}']`);
    assert.ok(host, `${fieldId} must be upgraded through lht-select-help`);
    assert.equal(byId(fieldId).disabled, true);
    assert.equal(byId(fieldId).title, helpText);
    assert.equal(byId(fieldId).options[0]?.textContent, placeholder);
  }
  assert.equal(byId("zipEntrySelectLabel").hidden, true);

  assert.equal(globalThis.customElements.get("lht-error-alert")?.name, "LhtErrorAlert");
  const errorAlert = byId("errorAlert");
  assert.equal(errorAlert.isVisible(), false);
  assert.equal(errorAlert.getAttribute("aria-hidden"), "true");
  assert.equal(errorAlert.getAttribute("role"), "alert");
  assert.equal(errorAlert.getAttribute("aria-live"), "assertive");
  const warningAlert = document.createElement("lht-error-alert");
  warningAlert.setAttribute("variant", "warning");
  document.body.appendChild(warningAlert);
  warningAlert.show("warning message");
  assert.equal(warningAlert.isVisible(), true);
  assert.equal(warningAlert.getAttribute("role"), "status");
  assert.equal(warningAlert.getAttribute("aria-live"), "polite");
  warningAlert.setAttribute("variant", "info");
  assert.equal(warningAlert.getAttribute("role"), "status");
  assert.equal(warningAlert.getAttribute("aria-live"), "polite");
  warningAlert.setAttribute("variant", "unexpected");
  assert.equal(warningAlert.getAttribute("variant"), "error");
  warningAlert.clear();
  assert.equal(warningAlert.isVisible(), false);
  warningAlert.remove();

  assert.equal(globalThis.customElements.get("lht-loading-overlay")?.name, "LhtLoadingOverlay");
  const fileLoadOverlay = byId("fileLoadOverlay");
  assert.equal(fileLoadOverlay.isActive(), false);
  assert.equal(fileLoadOverlay.getAttribute("aria-hidden"), "true");
  assert.equal(fileLoadOverlay.getAttribute("role"), "status");
  assert.equal(fileLoadOverlay.getAttribute("aria-live"), "polite");
  assert.equal(byId("fileConversionControls").getAttribute("aria-busy"), "false");
  const loadingBusyTarget = document.createElement("div");
  loadingBusyTarget.id = "loadingBusyTarget";
  const loadingDisabledTarget = document.createElement("button");
  loadingDisabledTarget.id = "loadingDisabledTarget";
  const testOverlay = document.createElement("lht-loading-overlay");
  testOverlay.setAttribute("text", "Reading score...");
  testOverlay.setAttribute("busy-target-id", loadingBusyTarget.id);
  testOverlay.setAttribute("disable-target-ids", loadingDisabledTarget.id);
  document.body.append(loadingBusyTarget, loadingDisabledTarget, testOverlay);
  testOverlay.setActive(true);
  assert.equal(testOverlay.isActive(), true);
  assert.equal(testOverlay.getAttribute("aria-hidden"), "false");
  assert.equal(testOverlay.querySelector(".lht-loading-overlay__text")?.textContent, "Reading score...");
  assert.equal(loadingBusyTarget.getAttribute("aria-busy"), "true");
  assert.equal(loadingDisabledTarget.disabled, true);
  testOverlay.setActive(false);
  assert.equal(loadingBusyTarget.getAttribute("aria-busy"), "false");
  assert.equal(loadingDisabledTarget.disabled, false);
  testOverlay.remove();
  loadingBusyTarget.remove();
  loadingDisabledTarget.remove();

  assert.equal(globalThis.customElements.get("lht-toast")?.name, "LhtToast");
  const toast = byId("toast");
  assert.equal(toast.isVisible(), false);
  assert.equal(toast.getAttribute("aria-hidden"), "true");
  assert.equal(toast.getAttribute("role"), "status");
  assert.equal(toast.getAttribute("aria-live"), "polite");
  assert.equal(toast.getAttribute("aria-atomic"), "true");
  assert.equal(typeof dom.window.showToast, "function");
  dom.window.showToast("Download ready.", 10000);
  assert.equal(toast.isVisible(), true);
  assert.equal(toast.getAttribute("aria-hidden"), "false");
  assert.equal(toast.querySelector(".lht-toast__body")?.textContent, "Download ready.");
  toast.hide();
  assert.equal(toast.isVisible(), false);
  toast.show("Temporary notification.", 1);
  await settle();
  assert.equal(toast.isVisible(), false);

  assert.equal(globalThis.__mikuScoreWebRuntime.vsqxAvailable, true);
  const v2Available = globalThis.__mikuScoreWebRuntime.v2Available === true;
  assert.equal(byId("runtimeV2ImportPolicy").hidden, !v2Available);
  assert.equal(byId("runtimeV2ExportPolicy").hidden, !v2Available);
  assert.equal(byId("measureEditor").hidden, !v2Available);
  byId("abcInput").value = "X:1\nM:4/4\nL:1/4\nK:C\nC D E|";
  byId("convertAbc").click();
  await settle();
  assert.match(byId("musicXmlOutput").value, /<score-partwise\b/);
  assert.match(byId("status").textContent, /Converted ABC/);

  byId("sourceFormat").value = "abc";
  byId("sourceInput").value = "X:2\nM:4/4\nL:1/4\nK:G\nG A B|";
  byId("importSource").click();
  await settle();
  assert.match(byId("status").textContent, /Imported abc text/);
  assert.match(byId("musicXmlOutput").value, /<fifths>1<\/fifths>/);

  const validMusicXml = byId("musicXmlOutput").value;
  byId("sourceFormat").value = "musicxml";
  byId("sourceInput").value = "<not-score/>";
  byId("importSource").click();
  await settle();
  assert.match(errorAlert.textContent, /MKS_MUSICXML_INVALID/);
  assert.equal(errorAlert.isVisible(), true);
  assert.equal(errorAlert.getAttribute("aria-hidden"), "false");
  assert.match(byId("status").textContent, /Imported abc text/);
  assert.equal(byId("musicXmlOutput").value, validMusicXml);

  byId("builtInSample").value = "1";
  byId("loadBuiltInSample").click();
  assert.match(byId("status").textContent, /Loaded built-in sample 1/);
  assert.equal(errorAlert.isVisible(), false);
  assert.equal(errorAlert.textContent, "");
  assert.match(byId("musicXmlOutput").value, /String Quartet No\.15/);
  byId("abcInput").value = "X:1\nM:4/4\nL:1/4\nK:C\nC D E|";
  byId("convertAbc").click();
  await settle();

  byId("renderScore").click();
  await settle();
  assert.match(byId("scorePreview").innerHTML, /mks-web-n1/);
  assert.equal(byId("noteSelect").disabled, false);
  assert.equal(byId("measureSelect").disabled, false);
  assert.ok(byId("noteSelect").options.length > 1);
  assert.ok(byId("measureSelect").options.length > 1);

  byId("scorePreview").querySelector("#mks-web-n1-head").dispatchEvent(
    new dom.window.MouseEvent("click", { bubbles: true }),
  );
  assert.match(byId("selectedNoteMeta").textContent, /n1/);
  assert.equal(byId("pitchEditor").disabled, false);

  byId("pitchStep").value = "D";
  byId("applyPitch").click();
  assert.match(byId("musicXmlOutput").value, /<step>D<\/step>/);
  assert.match(byId("status").textContent, /Changed pitch/);

  byId("renderScore").click();
  await settle();
  assert.match(byId("selectedNoteMeta").textContent, /n1/);

  byId("insertNoteAfter").click();
  assert.match(byId("status").textContent, /Inserted a note/);
  byId("renderScore").click();
  await settle();
  assert.match(byId("selectedNoteMeta").textContent, /n2/);

  byId("exportFormat").value = "musicxml";
  byId("exportMusicXmlAsXmlExtension").checked = true;
  byId("exportFile").click();
  await settle();
  assert.deepEqual(downloads.at(-1), { href: "blob:miku-score-web-ui", download: "miku-score.xml" });
  assert.equal(toast.isVisible(), true);
  assert.match(toast.textContent, /Downloaded musicxml file/);
  toast.hide();

  byId("exportFormat").value = "vsqx";
  byId("vsqxDefaultLyric").value = "み";
  byId("vsqxSplitPartStaves").checked = true;
  byId("exportFile").click();
  await settle();
  assert.deepEqual(downloads.at(-1), { href: "blob:miku-score-web-ui", download: "miku-score.vsqx" });
  assert.match(await downloadBlobs.at(-1).text(), /<y>み<\/y>/);
  assert.match(toast.textContent, /Downloaded vsqx file/);
  toast.hide();

  byId("exportAll").click();
  for (let attempt = 0; attempt < 20 && downloads.at(-1)?.download !== "miku-score-all.zip"; attempt += 1) {
    await settle();
  }
  assert.deepEqual(downloads.at(-1), { href: "blob:miku-score-web-ui", download: "miku-score-all.zip" });
  assert.match(byId("status").textContent, /Downloaded 10 formats as a ZIP archive/);
  assert.match(toast.textContent, /Downloaded 10 formats as a ZIP archive/);
  toast.hide();
  const archiveEntries = readZipEntries(new Uint8Array(await downloadBlobs.at(-1).arrayBuffer()));
  assert.deepEqual([...archiveEntries.keys()].sort(), [
    "miku-score.abc",
    "miku-score.ly",
    "miku-score.mei",
    "miku-score.mid",
    "miku-score.mscx",
    "miku-score.mscz",
    "miku-score.mxl",
    "miku-score.svg",
    "miku-score.vsqx",
    "miku-score.xml",
  ]);
  assert.match(new TextDecoder().decode(archiveEntries.get("miku-score.vsqx")), /<y>み<\/y>/);

  let resolveImportedFileText;
  Object.defineProperty(byId("scoreFile"), "files", {
    configurable: true,
    value: [{
      name: "import.abc",
      text: () => new Promise((resolve) => {
        resolveImportedFileText = resolve;
      }),
    }],
  });
  byId("importFormat").value = "auto";
  byId("importFile").click();
  assert.equal(fileLoadOverlay.isActive(), true);
  assert.equal(fileLoadOverlay.getAttribute("aria-hidden"), "false");
  assert.equal(byId("fileConversionControls").getAttribute("aria-busy"), "true");
  assert.equal(byId("selectScoreFile").disabled, true);
  assert.equal(byId("importFile").disabled, true);
  for (let attempt = 0; attempt < 10 && !resolveImportedFileText; attempt += 1) await settle();
  assert.equal(typeof resolveImportedFileText, "function");
  resolveImportedFileText("X:2\nM:4/4\nL:1/4\nK:C\nG A B c|");
  await settle();
  assert.match(byId("status").textContent, /Imported import\.abc as abc/);
  assert.match(byId("musicXmlOutput").value, /<score-partwise\b/);
  assert.equal(fileLoadOverlay.isActive(), false);
  assert.equal(fileLoadOverlay.getAttribute("aria-hidden"), "true");
  assert.equal(byId("fileConversionControls").getAttribute("aria-busy"), "false");
  assert.equal(byId("selectScoreFile").disabled, false);
  assert.equal(byId("importFile").disabled, false);

  byId("newPartCount").value = "2";
  byId("newPartCount").dispatchEvent(new dom.window.Event("input", { bubbles: true }));
  const newClefs = byId("newPartClefList").querySelectorAll("select[data-new-part-clef]");
  assert.equal(newClefs.length, 2);
  newClefs[0].value = "bass";
  newClefs[1].value = "alto";
  byId("newTimeBeats").value = "3";
  byId("newTimeBeatType").value = "8";
  byId("newKeyFifths").value = "-2";
  byId("newScore").click();
  const configuredScore = new dom.window.DOMParser().parseFromString(byId("musicXmlOutput").value, "application/xml");
  assert.equal(configuredScore.querySelectorAll("part-list > score-part").length, 2);
  assert.equal(configuredScore.querySelector("time > beats")?.textContent, "3");
  assert.equal(configuredScore.querySelector("time > beat-type")?.textContent, "8");
  assert.equal(configuredScore.querySelector("key > fifths")?.textContent, "-2");
  assert.equal(configuredScore.querySelector("part[id='P1'] clef > sign")?.textContent, "F");
  assert.equal(configuredScore.querySelector("part[id='P2'] clef > sign")?.textContent, "C");

  byId("renderScore").click();
  await settle();
  byId("scorePreview").querySelector("#mks-web-n1-head").dispatchEvent(
    new dom.window.MouseEvent("click", { bubbles: true }),
  );
  assert.match(byId("selectedMeasureMeta").textContent, /P1 \/ measure 1: 1 note/);
  assert.equal(byId("selectedMeasureNotes").children.length, 1);
  assert.equal(byId("previousMeasure").disabled, true);
  assert.equal(byId("nextMeasure").disabled, false);
  byId("nextMeasure").click();
  assert.match(byId("selectedMeasureMeta").textContent, /P1 \/ measure 2: 1 note/);
  byId("nextMeasurePart").click();
  assert.match(byId("selectedMeasureMeta").textContent, /P2 \/ measure 2: 1 note/);
  assert.equal(byId("convertRestToNote").disabled, false);
  byId("convertRestToNote").click();
  assert.match(byId("status").textContent, /Converted rest/);
  assert.match(byId("musicXmlOutput").value, /<pitch>/);

  byId("playbackWaveform").value = "square";
  byId("playbackUseMidiLike").checked = false;
  byId("graceTimingMode").value = "on_beat";
  byId("metricAccentEnabled").checked = true;
  byId("metricAccentEnabled").dispatchEvent(new dom.window.Event("change", { bubbles: true }));
  byId("metricAccentProfile").value = "strong";
  byId("midiProgram").value = "violin";
  byId("forceMidiProgramPreset").checked = true;
  midiExportProfile.value = "musescore_parity";
  byId("keepMidiRoundtripMetadata").checked = true;
  byId("downloadMidi").click();
  await settle();
  assert.deepEqual(downloads.at(-1), { href: "blob:miku-score-web-ui", download: "miku-score.mid" });
  byId("buildPlaybackPlan").click();
  assert.match(byId("status").textContent, /Playback plan has/);
  assert.equal(byId("metricAccentProfile").disabled, false);

  byId("newTemplatePianoGrandStaff").checked = true;
  byId("newTemplatePianoGrandStaff").dispatchEvent(new dom.window.Event("change", { bubbles: true }));
  assert.equal(byId("newPartCount").disabled, true);
  byId("newScore").click();
  const pianoScore = new dom.window.DOMParser().parseFromString(byId("musicXmlOutput").value, "application/xml");
  assert.equal(pianoScore.querySelectorAll("part-list > score-part").length, 1);
  assert.equal(pianoScore.querySelector("attributes > staves")?.textContent, "2");
} finally {
  dom.window.HTMLAnchorElement.prototype.click = originalAnchorClick;
  globalThis.URL = originalUrl;
  if (originalVerovio === undefined) delete globalThis.verovio;
  else globalThis.verovio = originalVerovio;
  if (originalVsqx === undefined) delete globalThis.UtaFormatix3TsPlusMikuscore;
  else globalThis.UtaFormatix3TsPlusMikuscore = originalVsqx;
  for (const [key, value] of originalGlobals.entries()) {
    if (value === undefined) delete globalThis[key];
    else globalThis[key] = value;
  }
}

console.log("[smoke:ui] ok generated Web UI source conversion preview edit inspection navigation export, ZIP policy, and import paths");
