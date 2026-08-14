import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

import jsdom from "jsdom";
import { readRuntimeLock, runtimeCachePath } from "./lib/runtime-lock.mjs";

const { JSDOM } = jsdom;
const root = process.cwd();
const parityRoot = path.join(root, "fixtures", "parity");
const expected = JSON.parse(fs.readFileSync(path.join(parityRoot, "v2.expected.json"), "utf8"));
const dom = new JSDOM("<!doctype html><html><body></body></html>");
Object.assign(globalThis, {
  document: dom.window.document,
  DOMParser: dom.window.DOMParser,
  XMLSerializer: dom.window.XMLSerializer,
  Element: dom.window.Element,
  Document: dom.window.Document,
  Node: dom.window.Node,
});

const versionParts = (value) => {
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(value);
  assert.ok(match, `runtime version must be semantic: ${value}`);
  return match.slice(1).map(Number);
};
const lock = readRuntimeLock(root);
const currentVersion = versionParts(lock.package_version);
const baselineVersion = versionParts(expected.baseline.runtimeVersion);
const firstVersionDifference = currentVersion.findIndex(
  (value, index) => value !== baselineVersion[index]
);
assert.ok(
  firstVersionDifference === -1 || currentVersion[firstVersionDifference] > baselineVersion[firstVersionDifference],
  `runtime ${lock.package_version} predates v2 parity baseline ${expected.baseline.runtimeVersion}`
);
const runtimeModule = await import(pathToFileURL(runtimeCachePath(root, lock)).href);
const runtime = runtimeModule.loadMikuScoreRuntime({ expectedVersion: lock.package_version });
const sourceXml = fs.readFileSync(path.join(parityRoot, expected.baseline.sourceFixture), "utf8");
const sha256 = (value) => createHash("sha256").update(value).digest("hex");

const extracted = runtime.measure.extractEditorMusicXml(sourceXml, expected.measure.location);
assert.equal(extracted.ok, true);
assert.equal(extracted.value.length, expected.measure.extractedLength);
assert.equal(sha256(extracted.value), expected.measure.extractedSha256);

const replacement = runtime.measure.replaceEditorMusicXml(sourceXml, {
  ...expected.measure.location,
  editorXml: extracted.value.replace(expected.measure.replacement.from, expected.measure.replacement.to),
});
assert.equal(replacement.ok, true);
assert.equal(replacement.value.length, expected.measure.replacement.length);
assert.equal(sha256(replacement.value), expected.measure.replacement.sha256);

const appended = runtime.measure.appendMeasure(sourceXml);
assert.equal(appended.ok, true);
assert.equal(appended.value.length, expected.measure.appendedLength);
assert.equal(sha256(appended.value), expected.measure.appendedSha256);

const invalidReplacement = runtime.measure.replaceEditorMusicXml(sourceXml, {
  ...expected.measure.location,
  editorXml: expected.measure.invalidReplacement.editorXml,
});
assert.equal(invalidReplacement.ok, false);
assert.deepEqual(invalidReplacement.diagnostics, [{
  code: expected.measure.invalidReplacement.code,
  message: expected.measure.invalidReplacement.message,
}]);

const archive = await runtime.output.encodeZipBundle(expected.archive.inputEntries.map((entry) => ({
  path: entry.path,
  data: entry.sourceFixture
    ? fs.readFileSync(path.join(parityRoot, entry.sourceFixture), "utf8")
    : entry.data,
})), { compressed: true });
assert.equal(archive.ok, true);
const rootPaths = await runtime.archive.listRootEntryPaths(archive.value, { extensions: expected.archive.extensions });
assert.equal(rootPaths.ok, true);
assert.deepEqual(rootPaths.value, expected.archive.rootPaths);
const archiveEntry = await runtime.archive.extractEntryBytes(archive.value, { path: expected.archive.entryPath });
assert.equal(archiveEntry.ok, true);
assert.equal(archiveEntry.value.length, expected.archive.entryLength);
assert.equal(sha256(archiveEntry.value), expected.archive.entrySha256);
const invalidExtraction = await runtime.archive.extractEntryBytes(archive.value, {});
assert.equal(invalidExtraction.ok, false);
assert.deepEqual(invalidExtraction.diagnostics, [{
  code: expected.archive.invalidExtraction.code,
  message: expected.archive.invalidExtraction.message,
}]);

const metadataImport = await runtime.convert.importToMusicXml({
  format: expected.metadata.format,
  data: expected.metadata.data,
  options: expected.metadata.importOptions,
});
assert.equal(metadataImport.ok, true);
assert.equal(metadataImport.value.length, expected.metadata.importLength);
assert.equal(sha256(metadataImport.value), expected.metadata.importSha256);
for (const text of expected.metadata.importRequiredText) assert.equal(metadataImport.value.includes(text), true, text);
const metadataExport = await runtime.convert.exportFromMusicXml({
  format: "musicxml",
  xml: metadataImport.value,
  options: expected.metadata.exportOptions,
});
assert.equal(metadataExport.ok, true);
assert.equal(metadataExport.value.length, expected.metadata.exportLength);
assert.equal(sha256(metadataExport.value), expected.metadata.exportSha256);
for (const text of expected.metadata.exportForbiddenText) assert.equal(metadataExport.value.includes(text), false, text);

console.log(`[smoke:runtime-v2-fixtures] ok runtime ${lock.package_version} matches ${expected.baseline.sourceTag} value baseline`);
