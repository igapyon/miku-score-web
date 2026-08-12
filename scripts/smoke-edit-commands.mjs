import assert from "node:assert/strict";

import { createSelectedNoteCommand } from "../src/js/edit-commands.mjs";

const noteInfo = { voice: "2" };
assert.deepEqual(
  createSelectedNoteCommand("change_to_pitch", "n3", noteInfo, { step: "D", alter: 1, octave: 5 }),
  { ok: true, value: { type: "change_to_pitch", targetNodeId: "n3", voice: "2", pitch: { step: "D", alter: 1, octave: 5 } } },
);
assert.deepEqual(
  createSelectedNoteCommand("change_duration", "n3", noteInfo, { duration: "8" }),
  { ok: true, value: { type: "change_duration", targetNodeId: "n3", voice: "2", duration: 8 } },
);
assert.deepEqual(
  createSelectedNoteCommand("insert_note_after", "n3", noteInfo, { step: "E", alter: 0, octave: 4, duration: 4 }),
  { ok: true, value: { type: "insert_note_after", anchorNodeId: "n3", voice: "2", note: { pitch: { step: "E", alter: 0, octave: 4 }, duration: 4 } } },
);
assert.deepEqual(
  createSelectedNoteCommand("delete_note", "n3", noteInfo),
  { ok: true, value: { type: "delete_note", targetNodeId: "n3", voice: "2" } },
);
assert.deepEqual(
  createSelectedNoteCommand("split_note", "n3", noteInfo),
  { ok: true, value: { type: "split_note", targetNodeId: "n3", voice: "2" } },
);
assert.equal(createSelectedNoteCommand("change_to_pitch", "n3", noteInfo, { step: "H", alter: 0, octave: 4 }).ok, false);
assert.equal(createSelectedNoteCommand("change_duration", "n3", noteInfo, { duration: 0 }).ok, false);
assert.equal(createSelectedNoteCommand("delete_note", "", noteInfo).ok, false);

console.log("[smoke:edit-commands] ok pitch duration insert delete split payloads");
