import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";

import jsdom from "jsdom";
import { readRuntimeLock, runtimeCachePath } from "./lib/runtime-lock.mjs";

const { JSDOM } = jsdom;
const dom = new JSDOM("<!doctype html><html><body></body></html>");
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;
globalThis.Element = dom.window.Element;
globalThis.Document = dom.window.Document;
globalThis.Node = dom.window.Node;

const root = process.cwd();
const lock = readRuntimeLock(root);
const runtimeModule = await import(pathToFileURL(runtimeCachePath(root, lock)).href);
const runtime = runtimeModule.loadMikuScoreRuntime({ expectedVersion: lock.package_version });
const imported = await runtime.convert.importToMusicXml({
  format: "abc",
  data: "X:1\nM:4/4\nL:1/4\nK:C\nC D E F|",
});
assert.equal(imported.ok, true);

for (const format of ["musicxml", "mxl", "abc", "midi", "mei", "lilypond", "musescore", "mscz"]) {
  const exported = await runtime.convert.exportFromMusicXml({ format, xml: imported.value });
  assert.equal(exported.ok, true, format);
  assert.ok(
    typeof exported.value === "string" ? exported.value.length > 0 : exported.value.length > 0,
    format,
  );
  const roundTripped = await runtime.convert.importToMusicXml({
    format,
    data: exported.value,
  });
  assert.equal(roundTripped.ok, true, `${format} roundtrip`);
  assert.match(roundTripped.value, /<score-partwise\b/, `${format} MusicXML`);
}

const unavailableVsqx = await runtime.convert.exportFromMusicXml({ format: "vsqx", xml: imported.value });
assert.equal(unavailableVsqx.ok, false);
assert.equal(unavailableVsqx.diagnostics[0]?.code, "MKS_CAPABILITY_VSQX_UNAVAILABLE");

console.log(`[smoke:runtime-formats] ok ${runtimeModule.version} text binary and VSQX diagnostic`);
