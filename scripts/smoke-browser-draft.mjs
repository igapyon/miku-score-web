import assert from "node:assert/strict";

import {
  BROWSER_DRAFT_STORAGE_KEY,
  clearBrowserDraft,
  readBrowserDraft,
  writeBrowserDraft,
} from "../src/js/browser-draft.mjs";

const values = new Map();
const storage = {
  getItem: (key) => values.get(key) ?? null,
  setItem: (key, value) => values.set(key, value),
  removeItem: (key) => values.delete(key),
};

assert.equal(readBrowserDraft(storage), null);
assert.equal(writeBrowserDraft("  <score-partwise/>  ", { storage, now: 1234 }), true);
assert.deepEqual(readBrowserDraft(storage), { xml: "<score-partwise/>", updatedAt: 1234 });
values.set(BROWSER_DRAFT_STORAGE_KEY, "not-json");
assert.equal(readBrowserDraft(storage), null);
assert.equal(writeBrowserDraft("", { storage, now: 1234 }), false);
assert.equal(clearBrowserDraft(storage), true);
assert.equal(readBrowserDraft(storage), null);

console.log("[smoke:browser-draft] ok validated Web-owned local draft storage");
