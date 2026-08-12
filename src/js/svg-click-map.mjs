const MIKU_SCORE_SVG_ID_PREFIX = "mks-web";

const directChildText = (element, localName) => {
  const child = Array.from(element.children).find((candidate) =>
    (candidate.localName || candidate.tagName).toLowerCase() === localName,
  );
  return child?.textContent?.trim() ?? "";
};

const noteInfoFromElement = (note) => {
  const measure = note.closest("measure");
  const part = note.closest("part");
  const pitch = note.querySelector(":scope > pitch");
  const step = pitch ? directChildText(pitch, "step") : "";
  const octave = pitch ? Number(directChildText(pitch, "octave")) : NaN;
  const alter = pitch ? Number(directChildText(pitch, "alter") || "0") : 0;
  const duration = Number(directChildText(note, "duration"));
  return {
    partId: part?.getAttribute("id")?.trim() || "(unnamed part)",
    measureNumber: measure?.getAttribute("number")?.trim() || "(unnumbered measure)",
    voice: directChildText(note, "voice") || "1",
    isRest: note.querySelector(":scope > rest") !== null,
    pitch: step && Number.isInteger(octave) && Number.isInteger(alter)
      ? { step, alter, octave }
      : null,
    duration: Number.isInteger(duration) && duration > 0 ? duration : null,
  };
};

const isMappedSvgId = (candidate, svgIdToNodeId) => {
  for (const svgId of svgIdToNodeId.keys()) {
    if (candidate === svgId || candidate.startsWith(`${svgId}-`) || svgId.startsWith(`${candidate}-`)) {
      return true;
    }
  }
  return false;
};

export const createSequentialNoteNodeIds = (noteCount) =>
  Array.from({ length: noteCount }, (_, index) => `n${index + 1}`);

export const buildFallbackSvgIdMap = (noteNodeIds, renderedNoteIds) => {
  const map = new Map();
  const count = Math.min(noteNodeIds.length, renderedNoteIds.length);
  for (let index = 0; index < count; index += 1) {
    map.set(renderedNoteIds[index], noteNodeIds[index]);
  }
  return map;
};

export const prepareRenderedSvgIdMap = (renderBundle, renderedNoteIds) => {
  if (renderedNoteIds.length === 0 || renderedNoteIds.some((id) => isMappedSvgId(id, renderBundle.svgIdToNodeId))) {
    return { map: renderBundle.svgIdToNodeId, mapMode: "direct" };
  }
  return {
    map: buildFallbackSvgIdMap(renderBundle.noteNodeIds, renderedNoteIds),
    mapMode: "fallback-seq",
  };
};

export const prepareMusicXmlForSvgClickMap = (xml, options = {}) => {
  const sourceDocument = new DOMParser().parseFromString(xml, "application/xml");
  if (sourceDocument.querySelector("parsererror")) return null;

  const renderDocument = sourceDocument.implementation.createDocument("", "", null);
  renderDocument.appendChild(renderDocument.importNode(sourceDocument.documentElement, true));
  const notes = Array.from(renderDocument.querySelectorAll("note"));
  const noteNodeIds = createSequentialNoteNodeIds(notes.length);
  const idPrefix = options.idPrefix ?? MIKU_SCORE_SVG_ID_PREFIX;
  const svgIdToNodeId = new Map();
  const noteInfoByNodeId = new Map();

  for (const [index, note] of notes.entries()) {
    const nodeId = noteNodeIds[index];
    const svgId = `${idPrefix}-${nodeId}`;
    note.setAttribute("xml:id", svgId);
    note.setAttribute("id", svgId);
    svgIdToNodeId.set(svgId, nodeId);
    noteInfoByNodeId.set(nodeId, noteInfoFromElement(note));
  }

  return {
    xml: new XMLSerializer().serializeToString(renderDocument),
    noteNodeIds,
    svgIdToNodeId,
    noteInfoByNodeId,
    noteCount: notes.length,
  };
};

export const deriveRenderedNoteIds = (root) => {
  const direct = Array.from(root.querySelectorAll(`[id^="${MIKU_SCORE_SVG_ID_PREFIX}-"]`))
    .map((element) => element.id)
    .filter(Boolean);
  if (direct.length > 0) return Array.from(new Set(direct));

  const fallback = Array.from(root.querySelectorAll("[id]"))
    .filter((element) => {
      const className = element.getAttribute("class") ?? "";
      return element.id.startsWith("note-") || /\bnote\b/.test(className);
    })
    .map((element) => element.id)
    .filter(Boolean);
  return Array.from(new Set(fallback));
};

export const resolveNodeIdFromCandidateIds = (candidateIds, svgIdToNodeId) => {
  for (const candidate of candidateIds) {
    const nodeId = svgIdToNodeId.get(candidate);
    if (nodeId) return nodeId;
  }
  for (const candidate of candidateIds) {
    for (const [svgId, nodeId] of svgIdToNodeId.entries()) {
      if (candidate.startsWith(`${svgId}-`) || svgId.startsWith(`${candidate}-`)) return nodeId;
    }
  }
  return null;
};

const collectCandidateIdsFromElement = (element) => {
  const candidateIds = [];
  const push = (value) => {
    if (!value) return;
    const id = value.startsWith("#") ? value.slice(1) : value;
    if (id && !candidateIds.includes(id)) candidateIds.push(id);
  };

  let cursor = element;
  for (let depth = 0; cursor && depth < 16; depth += 1) {
    push(cursor.getAttribute("id"));
    push(cursor.getAttribute("href"));
    push(cursor.getAttribute("xlink:href"));
    cursor = cursor.parentElement;
  }
  return candidateIds;
};

export const resolveNodeIdFromSvgTarget = (target, svgIdToNodeId) => {
  if (!(target instanceof Element)) return null;
  return resolveNodeIdFromCandidateIds(collectCandidateIdsFromElement(target), svgIdToNodeId);
};

export const highlightSvgNode = (root, svgIdToNodeId, nodeId) => {
  root.querySelectorAll(".mks-selected").forEach((element) => element.classList.remove("mks-selected"));
  for (const [svgId, mappedNodeId] of svgIdToNodeId.entries()) {
    if (mappedNodeId !== nodeId) continue;
    const element = root.querySelector(`#${CSS.escape(svgId)}`);
    if (!element) continue;
    element.classList.add("mks-selected");
    element.closest("g")?.classList.add("mks-selected");
    return svgId;
  }
  return null;
};
