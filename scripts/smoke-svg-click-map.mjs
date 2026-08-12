import assert from "node:assert/strict";

import {
  buildFallbackSvgIdMap,
  createSequentialNoteNodeIds,
  prepareRenderedSvgIdMap,
  resolveNodeIdFromCandidateIds,
} from "../src/js/svg-click-map.mjs";

assert.deepEqual(createSequentialNoteNodeIds(3), ["n1", "n2", "n3"]);

const directMap = new Map([["mks-web-n1", "n1"], ["mks-web-n2", "n2"]]);
const direct = prepareRenderedSvgIdMap(
  { noteNodeIds: ["n1", "n2"], svgIdToNodeId: directMap },
  ["mks-web-n1", "mks-web-n2"],
);
assert.equal(direct.mapMode, "direct");
assert.equal(direct.map, directMap);
assert.equal(resolveNodeIdFromCandidateIds(["mks-web-n2", "other"], direct.map), "n2");
assert.equal(resolveNodeIdFromCandidateIds(["mks-web-n2-L1"], direct.map), "n2");

const fallback = prepareRenderedSvgIdMap(
  { noteNodeIds: ["n1", "n2"], svgIdToNodeId: directMap },
  ["note-001", "note-002"],
);
assert.equal(fallback.mapMode, "fallback-seq");
assert.deepEqual([...fallback.map], [["note-001", "n1"], ["note-002", "n2"]]);
assert.deepEqual(
  [...buildFallbackSvgIdMap(["n1"], ["note-001", "note-002"])],
  [["note-001", "n1"]],
);

console.log("[smoke:svg-click-map] ok direct fallback candidate resolution");
