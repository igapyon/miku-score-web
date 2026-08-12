import assert from "node:assert/strict";

import { createBrowserVsqxAdapter } from "../src/js/vsqx-browser.mjs";

const bridge = {
  convertVsqxToMusicXml: () => "<score-partwise/>",
  convertVsqxToMusicXmlWithReport: () => ({ musicXml: "<score-partwise/>", issues: [] }),
  convertMusicXmlToVsqx: () => "<vsq3/>",
};

const explicitAdapter = createBrowserVsqxAdapter({ vsqxBridge: bridge });
assert.equal(explicitAdapter.available, true);
assert.equal(explicitAdapter.capability, bridge);

const originalBridge = globalThis.UtaFormatix3TsPlusMikuscore;
globalThis.UtaFormatix3TsPlusMikuscore = bridge;
try {
  const globalAdapter = createBrowserVsqxAdapter();
  assert.equal(globalAdapter.available, true);
  assert.equal(globalAdapter.capability, bridge);
} finally {
  if (originalBridge === undefined) delete globalThis.UtaFormatix3TsPlusMikuscore;
  else globalThis.UtaFormatix3TsPlusMikuscore = originalBridge;
}

const unavailableAdapter = createBrowserVsqxAdapter({
  vsqxBridge: { convertMusicXmlToVsqx: () => "<vsq3/>" },
});
assert.equal(unavailableAdapter.available, false);
assert.equal(unavailableAdapter.capability, null);

console.log("[smoke:vsqx-browser] ok explicit global and unavailable bridge states");
