import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

import jsdom from "jsdom";
import { createBrowserVsqxAdapter } from "../src/js/vsqx-browser.mjs";
import { readRuntimeLock, runtimeCachePath } from "./lib/runtime-lock.mjs";
import { readZipEntries } from "./lib/zip-inspect.mjs";

const { JSDOM } = jsdom;
const root = process.cwd();
const dom = new JSDOM("<!doctype html><html><body></body></html>", { runScripts: "outside-only" });
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;
globalThis.Element = dom.window.Element;
globalThis.Document = dom.window.Document;
globalThis.Node = dom.window.Node;

const vendorPath = path.join(root, "vendor", "utaformatix3", "utaformatix3-ts-plus.mikuscore.iife.js");
dom.window.eval(fs.readFileSync(vendorPath, "utf8"));
const vsqxAdapter = createBrowserVsqxAdapter({
  vsqxBridge: dom.window.UtaFormatix3TsPlusMikuscore,
});
assert.equal(vsqxAdapter.available, true);
const parityRoot = path.join(root, "fixtures", "parity");
const expected = JSON.parse(fs.readFileSync(path.join(parityRoot, "base.expected.json"), "utf8"));
const xml = fs.readFileSync(path.join(parityRoot, expected.baseline.sourceFixture), "utf8");
const lock = readRuntimeLock(root);
const versionParts = (value) => {
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(value);
  assert.ok(match, `parity runtime version must be semantic: ${value}`);
  return match.slice(1).map(Number);
};
const currentVersion = versionParts(lock.package_version);
const baselineVersion = versionParts(expected.baseline.runtimeVersion);
const firstVersionDifference = currentVersion.findIndex(
  (value, index) => value !== baselineVersion[index]
);
assert.ok(
  firstVersionDifference === -1 ||
    currentVersion[firstVersionDifference] > baselineVersion[firstVersionDifference],
  `runtime ${lock.package_version} predates parity baseline ${expected.baseline.runtimeVersion}`
);
const runtimeModule = await import(pathToFileURL(runtimeCachePath(root, lock)).href);
const runtime = runtimeModule.loadMikuScoreRuntime({
  expectedVersion: lock.package_version,
  capabilities: { vsqxBridge: vsqxAdapter.capability },
});
const sha256 = (value) => createHash("sha256").update(value).digest("hex");

const loaded = runtime.score.loadMusicXml(xml);
assert.equal(loaded.ok, true);
assert.equal(sha256(loaded.value), expected.canonicalMusicXmlSha256);

const summary = runtime.state.summarize(loaded.value);
assert.equal(summary.ok, true);
assert.deepEqual(summary.value, expected.summary);

const abc = await runtime.convert.exportFromMusicXml({ format: "abc", xml: loaded.value });
assert.equal(abc.ok, true);
assert.equal(abc.value, expected.abc.text);
assert.equal(sha256(abc.value), expected.abc.sha256);

const midi = await runtime.convert.exportFromMusicXml({
  format: "midi",
  xml: loaded.value,
  options: { midi: expected.midi.options },
});
assert.equal(midi.ok, true);
assert.equal(midi.value.length, expected.midi.length);
assert.equal(sha256(midi.value), expected.midi.sha256);

const playback = runtime.playback.buildPlan(loaded.value, expected.playback.options);
assert.equal(playback.ok, true);
assert.deepEqual(playback.value, expected.playback.value);
assert.deepEqual(playback.warnings ?? [], []);

for (const [format, formatExpected] of Object.entries(expected.formatExports)) {
  const exported = await runtime.convert.exportFromMusicXml({
    format,
    xml: loaded.value,
    options: formatExpected.options,
  });
  assert.equal(exported.ok, true, format);
  if (formatExpected.archiveEntries) {
    const archiveEntries = readZipEntries(exported.value);
    assert.deepEqual([...archiveEntries.keys()], formatExpected.archiveEntries.map(({ name }) => name), `${format} entries`);
    for (const entryExpected of formatExpected.archiveEntries) {
      const entry = archiveEntries.get(entryExpected.name);
      assert.equal(entry.length, entryExpected.length, `${format} ${entryExpected.name} length`);
      assert.equal(sha256(entry), entryExpected.sha256, `${format} ${entryExpected.name} SHA-256`);
    }
  } else {
    assert.equal(exported.value.length, formatExpected.length, `${format} length`);
    assert.equal(sha256(exported.value), formatExpected.sha256, `${format} SHA-256`);
  }
  if (formatExpected.requiredText) {
    assert.equal(typeof exported.value, "string", `${format} text output`);
    assert.match(exported.value, new RegExp(formatExpected.requiredText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
  const imported = await runtime.convert.importToMusicXml({ format, data: exported.value });
  assert.equal(imported.ok, true, `${format} roundtrip`);
  assert.match(imported.value, /<score-partwise\b/, `${format} roundtrip MusicXML`);
}

const edited = runtime.state.applyCommand(loaded.value, expected.edit.command);
assert.equal(edited.ok, true);
assert.equal(edited.value.ok, true);
assert.deepEqual(edited.value.changed_node_ids, expected.edit.changedNodeIds);
assert.deepEqual(edited.value.affected_measure_numbers, expected.edit.affectedMeasureNumbers);
assert.equal(sha256(edited.value.xml), expected.edit.musicXmlSha256);

const invalid = runtime.score.loadMusicXml(expected.invalidMusicXml.data);
assert.equal(invalid.ok, false);
assert.deepEqual(invalid.diagnostics, [{
  code: expected.invalidMusicXml.code,
  message: expected.invalidMusicXml.message,
}]);

console.log(`[smoke:parity-fixtures] ok runtime ${lock.package_version} matches ${expected.baseline.sourceTag} value baseline`);
