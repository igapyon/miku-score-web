import assert from "node:assert/strict";

import {
  firstNodeIdForMeasure,
  listMeasureSelections,
  listNoteSelections,
  makeMeasureKey,
} from "../src/js/score-selection.mjs";

const info = new Map([
  ["n1", { partId: "P1", measureNumber: "1" }],
  ["n2", { partId: "P1", measureNumber: "1" }],
  ["n3", { partId: "P1", measureNumber: "2" }],
  ["n4", { partId: "P2", measureNumber: "1" }],
]);
assert.deepEqual(listNoteSelections(info).map((entry) => entry.nodeId), ["n1", "n2", "n3", "n4"]);
assert.deepEqual(listMeasureSelections(info), [
  { key: makeMeasureKey("P1", "1"), partId: "P1", measureNumber: "1", firstNodeId: "n1" },
  { key: makeMeasureKey("P1", "2"), partId: "P1", measureNumber: "2", firstNodeId: "n3" },
  { key: makeMeasureKey("P2", "1"), partId: "P2", measureNumber: "1", firstNodeId: "n4" },
]);
assert.equal(firstNodeIdForMeasure(info, makeMeasureKey("P1", "2")), "n3");
assert.equal(firstNodeIdForMeasure(info, makeMeasureKey("P9", "1")), null);

console.log("[smoke:score-selection] ok note and measure selection");
