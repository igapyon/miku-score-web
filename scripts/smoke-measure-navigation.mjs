import assert from "node:assert/strict";

import { findMeasureNavigationTarget } from "../src/js/measure-navigation.mjs";

const info = new Map([
  ["n1", { partId: "P1", measureNumber: "1" }],
  ["n2", { partId: "P1", measureNumber: "2" }],
  ["n3", { partId: "P2", measureNumber: "1" }],
  ["n4", { partId: "P2", measureNumber: "2" }],
]);

assert.equal(findMeasureNavigationTarget(info, "n2", "previous"), "n1");
assert.equal(findMeasureNavigationTarget(info, "n1", "next"), "n2");
assert.equal(findMeasureNavigationTarget(info, "n2", "next"), null);
assert.equal(findMeasureNavigationTarget(info, "n2", "next-part"), "n4");
assert.equal(findMeasureNavigationTarget(info, "n3", "previous-part"), "n1");
assert.equal(findMeasureNavigationTarget(info, "n1", "previous-part"), null);
assert.equal(findMeasureNavigationTarget(info, "missing", "next"), null);

console.log("[smoke:measure-navigation] ok part and measure navigation");
