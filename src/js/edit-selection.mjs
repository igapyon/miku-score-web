const noteIndexFromNodeId = (nodeId) => {
  const match = /^n([1-9][0-9]*)$/.exec(nodeId ?? "");
  return match ? Number(match[1]) : null;
};

const nodeIdAtIndex = (index) => index > 0 ? `n${index}` : null;

/**
 * The browser UI regenerates its n1..nN IDs when it reparses serialized
 * MusicXML. Runtime changed_node_ids are valid inside that command execution,
 * but are not serialised. Keep selection by its deterministic note position.
 */
export const chooseSelectedNodeAfterSerializedCommand = (previousNodeId, operation, previousNoteCount) => {
  const index = noteIndexFromNodeId(previousNodeId);
  if (!index || !Number.isInteger(previousNoteCount) || previousNoteCount < index) return null;

  switch (operation) {
    case "change_to_pitch":
    case "change_duration":
      return previousNodeId;
    case "insert_note_after":
    case "split_note":
      return nodeIdAtIndex(index + 1);
    case "delete_note":
      return previousNodeId;
    default:
      return null;
  }
};
