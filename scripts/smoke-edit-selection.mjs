import assert from "node:assert/strict";

import { chooseSelectedNodeAfterSerializedCommand } from "../src/js/edit-selection.mjs";

assert.equal(chooseSelectedNodeAfterSerializedCommand("n2", "change_to_pitch", 3), "n2");
assert.equal(chooseSelectedNodeAfterSerializedCommand("n2", "change_duration", 3), "n2");
assert.equal(chooseSelectedNodeAfterSerializedCommand("n2", "insert_note_after", 3), "n3");
assert.equal(chooseSelectedNodeAfterSerializedCommand("n2", "split_note", 3), "n3");
assert.equal(chooseSelectedNodeAfterSerializedCommand("n2", "delete_note", 3), "n2");
assert.equal(chooseSelectedNodeAfterSerializedCommand("n3", "delete_note", 3), "n3");
assert.equal(chooseSelectedNodeAfterSerializedCommand("n1", "delete_note", 1), "n1");
assert.equal(chooseSelectedNodeAfterSerializedCommand("bad", "change_to_pitch", 3), null);

console.log("[smoke:edit-selection] ok serialized score selection transitions");
