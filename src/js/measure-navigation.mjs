const measureKey = (partId, measureNumber) => `${partId}\u0000${measureNumber}`;

const listMeasures = (noteInfoByNodeId) => {
  const measures = new Map();
  for (const [nodeId, noteInfo] of noteInfoByNodeId.entries()) {
    const key = measureKey(noteInfo.partId, noteInfo.measureNumber);
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

const selectedMeasure = (noteInfoByNodeId, selectedNodeId) => {
  const selectedNote = noteInfoByNodeId.get(selectedNodeId);
  if (!selectedNote) return null;
  const key = measureKey(selectedNote.partId, selectedNote.measureNumber);
  return listMeasures(noteInfoByNodeId).find((measure) => measure.key === key) ?? null;
};

export const findMeasureNavigationTarget = (noteInfoByNodeId, selectedNodeId, direction) => {
  const current = selectedMeasure(noteInfoByNodeId, selectedNodeId);
  if (!current) return null;

  const measures = listMeasures(noteInfoByNodeId);
  if (direction === "previous" || direction === "next") {
    const partMeasures = measures.filter((measure) => measure.partId === current.partId);
    const index = partMeasures.findIndex((measure) => measure.key === current.key);
    const delta = direction === "previous" ? -1 : 1;
    return partMeasures[index + delta]?.firstNodeId ?? null;
  }

  if (direction === "previous-part" || direction === "next-part") {
    const partIds = Array.from(new Set(measures.map((measure) => measure.partId)));
    const partIndex = partIds.indexOf(current.partId);
    const delta = direction === "previous-part" ? -1 : 1;
    const targetPartId = partIds[partIndex + delta];
    return measures.find((measure) =>
      measure.partId === targetPartId && measure.measureNumber === current.measureNumber,
    )?.firstNodeId ?? null;
  }

  return null;
};
