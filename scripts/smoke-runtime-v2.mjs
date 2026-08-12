import assert from "node:assert/strict";

import {
  RUNTIME_API_V2,
  hasRuntimeApiV2,
  runtimeV2ImportOptions,
  runtimeV2MusicXmlExportOptions,
  selectedMeasureLocation,
} from "../src/js/runtime-v2.mjs";

const runtime = {
  measure: {
    extractEditorMusicXml: () => undefined,
    replaceEditorMusicXml: () => undefined,
    appendMeasure: () => undefined,
  },
  archive: {
    listRootEntryPaths: () => undefined,
    extractEntryBytes: () => undefined,
  },
};

assert.equal(hasRuntimeApiV2(runtime, RUNTIME_API_V2), true);
assert.equal(hasRuntimeApiV2({ measure: runtime.measure }, RUNTIME_API_V2), false);
assert.equal(hasRuntimeApiV2(runtime, "miku-score/runtime-api@1"), false);
assert.deepEqual(runtimeV2ImportOptions("midi", {
  sourceMetadata: false,
  debugMetadata: false,
  midiQuantizeGrid: "1/32",
  midiTripletAware: false,
}), {
  importMetadata: { source: false, debug: false },
  midi: { quantizeGrid: "1/32", tripletAwareQuantize: false },
});
assert.deepEqual(runtimeV2ImportOptions("vsqx", { vsqxImportDefaultLyric: " み " }), {
  vsqx: { defaultLyric: "み" },
});
assert.equal(runtimeV2ImportOptions("musicxml"), null);
assert.deepEqual(runtimeV2MusicXmlExportOptions({
  keepRoundTripMetadata: false,
  keepSourceMetadata: true,
  keepDebugMetadata: false,
}), {
  metadata: { roundTrip: false, source: true, debug: false },
});
assert.deepEqual(selectedMeasureLocation(new Map([["n1", { partId: "P2", measureNumber: "3" }]]), "n1"), {
  partId: "P2",
  measureNumber: "3",
});
assert.equal(selectedMeasureLocation(new Map(), "missing"), null);

console.log("[smoke:runtime-v2] ok capability gating and public request values");
