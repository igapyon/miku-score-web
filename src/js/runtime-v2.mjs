export const RUNTIME_API_V2 = "miku-score/runtime-api@2";

const metadataImportFormats = new Set(["abc", "midi", "mei", "lilypond", "musescore", "mscz"]);

const bool = (value, fallback) => typeof value === "boolean" ? value : fallback;

export const hasRuntimeApiV2 = (runtime, runtimeApiVersion) => (
  runtimeApiVersion === RUNTIME_API_V2 &&
  typeof runtime?.measure?.extractEditorMusicXml === "function" &&
  typeof runtime?.measure?.replaceEditorMusicXml === "function" &&
  typeof runtime?.measure?.appendMeasure === "function" &&
  typeof runtime?.archive?.listRootEntryPaths === "function" &&
  typeof runtime?.archive?.extractEntryBytes === "function"
);

export const runtimeV2ImportOptions = (format, values = {}) => {
  const options = {};
  if (metadataImportFormats.has(format)) {
    options.importMetadata = {
      source: bool(values.sourceMetadata, true),
      debug: bool(values.debugMetadata, true),
    };
  }
  if (format === "midi") {
    options.midi = {
      quantizeGrid: ["auto", "1/8", "1/16", "1/32", "1/64"].includes(values.midiQuantizeGrid)
        ? values.midiQuantizeGrid
        : "1/64",
      tripletAwareQuantize: bool(values.midiTripletAware, true),
    };
  }
  if (format === "vsqx") {
    options.vsqx = { defaultLyric: String(values.vsqxImportDefaultLyric ?? "").trim() || "ら" };
  }
  return Object.keys(options).length > 0 ? options : null;
};

export const runtimeV2MusicXmlExportOptions = (values = {}) => ({
  metadata: {
    roundTrip: bool(values.keepRoundTripMetadata, true),
    source: bool(values.keepSourceMetadata, true),
    debug: bool(values.keepDebugMetadata, true),
  },
});

export const selectedMeasureLocation = (noteInfoByNodeId, selectedNodeId) => {
  const note = noteInfoByNodeId?.get(selectedNodeId);
  return note && typeof note.partId === "string" && typeof note.measureNumber === "string"
    ? { partId: note.partId, measureNumber: note.measureNumber }
    : null;
};
