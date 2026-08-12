const PITCH_STEPS = new Set(["C", "D", "E", "F", "G", "A", "B"]);

const invalid = (message) => ({ ok: false, message });

const validSelection = (nodeId, noteInfo) =>
  typeof nodeId === "string" && nodeId.length > 0 &&
  typeof noteInfo?.voice === "string" && noteInfo.voice.length > 0;

const readPitch = (input) => {
  const step = String(input.step ?? "").trim();
  const alter = Number(input.alter);
  const octave = Number(input.octave);
  if (!PITCH_STEPS.has(step) || !Number.isInteger(alter) || alter < -2 || alter > 2 ||
      !Number.isInteger(octave) || octave < 0 || octave > 9) {
    return null;
  }
  return { step, alter, octave };
};

const readDuration = (input) => {
  const duration = Number(input.duration);
  return Number.isInteger(duration) && duration > 0 ? duration : null;
};

export const createSelectedNoteCommand = (operation, nodeId, noteInfo, input = {}) => {
  if (!validSelection(nodeId, noteInfo)) {
    return invalid("Select a note before editing.");
  }

  switch (operation) {
    case "change_to_pitch": {
      const pitch = readPitch(input);
      return pitch
        ? { ok: true, value: { type: operation, targetNodeId: nodeId, voice: noteInfo.voice, pitch } }
        : invalid("Enter a valid pitch.");
    }
    case "change_duration": {
      const duration = readDuration(input);
      return duration
        ? { ok: true, value: { type: operation, targetNodeId: nodeId, voice: noteInfo.voice, duration } }
        : invalid("Enter a positive integer duration.");
    }
    case "insert_note_after": {
      const pitch = readPitch(input);
      const duration = readDuration(input);
      return pitch && duration
        ? { ok: true, value: { type: operation, anchorNodeId: nodeId, voice: noteInfo.voice, note: { pitch, duration } } }
        : invalid("Enter a valid inserted note pitch and positive integer duration.");
    }
    case "delete_note":
    case "split_note":
      return { ok: true, value: { type: operation, targetNodeId: nodeId, voice: noteInfo.voice } };
    default:
      return invalid(`Unsupported selected-note operation: ${operation}`);
  }
};
