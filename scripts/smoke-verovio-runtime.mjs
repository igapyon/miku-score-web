import assert from "node:assert/strict";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { createBrowserVerovioAdapter } from "../src/js/verovio-browser.mjs";
import { readRuntimeLock, runtimeCachePath } from "./lib/runtime-lock.mjs";

const ROOT = process.cwd();
const lock = readRuntimeLock(ROOT);
const runtimePath = runtimeCachePath(ROOT, lock);
const runtimeModule = await import(pathToFileURL(runtimePath).href);

// The released render facade intentionally uses browser DOM APIs. This small
// document double supplies only the parse/clone/query contract needed to test
// capability injection in Node; browser DOM behavior belongs in the UI suite.
class BrowserDocumentDouble {
  constructor(xml = "", documentElement = null) {
    this.xml = xml;
    this.documentElement = documentElement;
    this.implementation = {
      createDocument: () => new BrowserDocumentDouble(),
    };
  }

  querySelector() {
    return null;
  }

  querySelectorAll() {
    return [];
  }

  importNode(node) {
    return { ...node };
  }

  appendChild(node) {
    this.documentElement = node;
    this.xml = node.xml;
    return node;
  }

  toString() {
    return this.xml;
  }
}

globalThis.DOMParser = class DOMParserDouble {
  parseFromString(xml) {
    return new BrowserDocumentDouble(xml, {
      tagName: "score-partwise",
      xml,
      querySelectorAll: () => [],
    });
  }
};

const calls = [];
class MockToolkit {
  setOptions(options) {
    calls.push(["setOptions", options]);
  }

  loadData(xml) {
    calls.push(["loadData", xml]);
    return true;
  }

  getPageCount() {
    return 1;
  }

  renderToSVG(page, options) {
    calls.push(["renderToSVG", page, options]);
    return '<svg data-engine="verovio"><g class="note" id="note-1"></g></svg>';
  }
}

const adapter = createBrowserVerovioAdapter({
  verovioRuntime: {
    module: { calledRun: true, cwrap: () => undefined },
    toolkit: MockToolkit,
  },
  serializeDocument: (documentValue) => String(documentValue),
});
await adapter.initialize();

const runtime = runtimeModule.loadMikuScoreRuntime({
  expectedVersion: lock.package_version,
  capabilities: { verovio: adapter.capability },
});
const musicXml = '<?xml version="1.0"?><score-partwise version="4.0"><part-list/></score-partwise>';
const rendered = runtime.render.renderSvg(musicXml, { scale: 45 });
assert.equal(rendered.ok, true);
assert.match(rendered.value, /data-engine="verovio"/);
assert.equal(calls[0][0], "setOptions");
assert.equal(calls[0][1].scale, 45);
assert.equal(calls[1][0], "loadData");
assert.match(calls[1][1], /<score-partwise\b/);
assert.deepEqual(calls[2], ["renderToSVG", 1, {}]);

console.log(`[smoke:verovio-runtime] ok ${runtimeModule.version} capability render`);
