import assert from "node:assert/strict";

import { createBrowserVerovioAdapter } from "../src/js/verovio-browser.mjs";

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
    return '<svg data-engine="verovio"></svg>';
  }
}

const readyAdapter = createBrowserVerovioAdapter({
  verovioRuntime: {
    module: { calledRun: true, cwrap: () => undefined },
    toolkit: MockToolkit,
  },
  serializeDocument: () => "<score-partwise/>",
});
assert.equal(readyAdapter.available, true);
assert.ok(readyAdapter.capability);
await readyAdapter.initialize();
readyAdapter.capability.toolkit.setOptions({ scale: 40 });
assert.equal(readyAdapter.capability.toolkit.loadData("<score-partwise/>"), true);
assert.equal(readyAdapter.capability.toolkit.getPageCount(), 1);
assert.match(readyAdapter.capability.toolkit.renderToSVG(1, {}), /data-engine="verovio"/);
assert.deepEqual(calls.map(([name]) => name), ["setOptions", "loadData", "renderToSVG"]);

const delayedModule = { calledRun: false, cwrap: null, onRuntimeInitialized: null };
const delayedAdapter = createBrowserVerovioAdapter({
  verovioRuntime: { module: delayedModule, toolkit: MockToolkit },
  serializeDocument: () => "<score-partwise/>",
  timeoutMs: 100,
});
const delayedInitialization = delayedAdapter.initialize();
delayedModule.calledRun = true;
delayedModule.cwrap = () => undefined;
delayedModule.onRuntimeInitialized();
await delayedInitialization;
assert.equal(delayedAdapter.capability.toolkit.getPageCount(), 1);

const unavailableAdapter = createBrowserVerovioAdapter({ verovioRuntime: null });
assert.equal(unavailableAdapter.available, false);
assert.equal(unavailableAdapter.capability, null);
await assert.rejects(unavailableAdapter.initialize(), /Verovio browser runtime is unavailable/);

console.log("[smoke:verovio-browser] ok ready delayed unavailable");
