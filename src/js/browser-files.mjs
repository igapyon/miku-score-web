const INPUT_FORMATS = Object.freeze({
  musicxml: { extensions: [".musicxml", ".xml"], binary: false },
  mxl: { extensions: [".mxl"], binary: true },
  abc: { extensions: [".abc"], binary: false },
  midi: { extensions: [".mid", ".midi"], binary: true },
  vsqx: { extensions: [".vsqx"], binary: false },
  mei: { extensions: [".mei"], binary: false },
  lilypond: { extensions: [".ly", ".lilypond"], binary: false },
  musescore: { extensions: [".mscx"], binary: false },
  mscz: { extensions: [".mscz"], binary: true },
  zip: { extensions: [".zip"], binary: true },
});

export const runtimeInputExtensions = Object.freeze([
  ".musicxml", ".xml", ".mxl", ".abc", ".mid", ".midi", ".vsqx", ".mei", ".ly", ".lilypond", ".mscx", ".mscz",
]);

const EXPORT_FORMATS = Object.freeze({
  musicxml: { extension: "musicxml", mimeType: "application/vnd.recordare.musicxml+xml" },
  mxl: { extension: "mxl", mimeType: "application/vnd.recordare.musicxml" },
  abc: { extension: "abc", mimeType: "text/vnd.abc;charset=utf-8" },
  midi: { extension: "mid", mimeType: "audio/midi" },
  vsqx: { extension: "vsqx", mimeType: "application/xml" },
  mei: { extension: "mei", mimeType: "application/xml" },
  lilypond: { extension: "ly", mimeType: "text/plain;charset=utf-8" },
  musescore: { extension: "mscx", mimeType: "application/xml" },
  mscz: { extension: "mscz", mimeType: "application/octet-stream" },
  svg: { extension: "svg", mimeType: "image/svg+xml" },
  zip: { extension: "zip", mimeType: "application/zip" },
});

export const inputFormatForFileName = (fileName) => {
  const lowerName = String(fileName ?? "").toLowerCase();
  for (const [format, definition] of Object.entries(INPUT_FORMATS)) {
    if (definition.extensions.some((extension) => lowerName.endsWith(extension))) return format;
  }
  return null;
};

export const isBinaryInputFormat = (format) => INPUT_FORMATS[format]?.binary === true;

export const readBrowserFile = async (file, format) => {
  if (!file) throw new Error("No file was selected.");
  if (isBinaryInputFormat(format)) return new Uint8Array(await file.arrayBuffer());
  return file.text();
};

export const dataForRuntimeInputFormat = (bytes, format) => {
  if (!(bytes instanceof Uint8Array)) throw new TypeError("Runtime input bytes must be a Uint8Array.");
  return isBinaryInputFormat(format) ? bytes : new TextDecoder("utf-8").decode(bytes);
};

export const exportFileDetails = (format, baseName = "miku-score") => {
  const definition = EXPORT_FORMATS[format];
  if (!definition) throw new Error(`Unsupported export format: ${format}`);
  return {
    fileName: `${baseName}.${definition.extension}`,
    mimeType: definition.mimeType,
  };
};

export const downloadBrowserData = (data, details) => {
  const url = URL.createObjectURL(new Blob([data], { type: details.mimeType }));
  try {
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = details.fileName;
    anchor.click();
  } finally {
    URL.revokeObjectURL(url);
  }
};
