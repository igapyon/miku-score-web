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
  assert.match(byId("status").textContent, /MKS_MUSICXML_INVALID/);
  assert.equal(byId("musicXmlOutput").value, validMusicXml);

  byId("builtInSample").value = "1";
  byId("loadBuiltInSample").click();
  assert.match(byId("status").textContent, /Loaded built-in sample 1/);
  assert.match(byId("musicXmlOutput").value, /String Quartet No\.15/);
  byId("abcInput").value = "X:1\nM:4/4\nL:1/4\nK:C\nC D E|";
  byId("convertAbc").click();
  await settle();

  byId("renderScore").click();
  await settle();
  assert.match(byId("scorePreview").innerHTML, /mks-web-n1/);
  assert.equal(byId("noteSelect").disabled, false);

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

  byId("exportFormat").value = "vsqx";
  byId("vsqxDefaultLyric").value = "み";
  byId("vsqxSplitPartStaves").checked = true;
  byId("exportFile").click();
  await settle();
  assert.deepEqual(downloads.at(-1), { href: "blob:miku-score-web-ui", download: "miku-score.vsqx" });
  assert.match(await downloadBlobs.at(-1).text(), /<y>み<\/y>/);

  byId("exportAll").click();
  for (let attempt = 0; attempt < 20 && downloads.at(-1)?.download !== "miku-score-all.zip"; attempt += 1) {
    await settle();
  }
  assert.deepEqual(downloads.at(-1), { href: "blob:miku-score-web-ui", download: "miku-score-all.zip" });
  assert.match(byId("status").textContent, /Downloaded 10 formats as a ZIP archive/);
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

  Object.defineProperty(byId("scoreFile"), "files", {
    configurable: true,
    value: [{ name: "import.abc", text: async () => "X:2\nM:4/4\nL:1/4\nK:C\nG A B c|" }],
  });
  byId("importFormat").value = "auto";
  byId("importFile").click();
  await settle();
  assert.match(byId("status").textContent, /Imported import\.abc as abc/);
  assert.match(byId("musicXmlOutput").value, /<score-partwise\b/);

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
  byId("midiExportProfile").value = "musescore_parity";
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
