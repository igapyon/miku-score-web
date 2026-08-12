export const makeMeasureKey = (partId, measureNumber) => `${partId}\u0000${measureNumber}`;

export const listNoteSelections = (noteInfoByNodeId) =>
  Array.from(noteInfoByNodeId.entries()).map(([nodeId, noteInfo]) => ({ nodeId, noteInfo }));

export const listMeasureSelections = (noteInfoByNodeId) => {
  const measures = new Map();
  for (const [nodeId, noteInfo] of noteInfoByNodeId.entries()) {
    const key = makeMeasureKey(noteInfo.partId, noteInfo.measureNumber);
    if (!measures.has(key)) {
      measures.set(key, {
        key,
        partId: noteInfo.partId,
        measureNumber: noteInfo.measureNumber,
        firstNodeId: nodeId,
      });
    }
  }
  return Array.from(measures.values());
};

export const firstNodeIdForMeasure = (noteInfoByNodeId, measureKey) =>
  listMeasureSelections(noteInfoByNodeId)
    .find((measure) => measure.key === measureKey)?.firstNodeId ?? null;
