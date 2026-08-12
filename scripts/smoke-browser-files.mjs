import assert from "node:assert/strict";

import {
  downloadBrowserData,
  exportFileDetails,
  inputFormatForFileName,
  isBinaryInputFormat,
  dataForRuntimeInputFormat,
  readBrowserFile,
} from "../src/js/browser-files.mjs";

assert.equal(inputFormatForFileName("score.musicxml"), "musicxml");
assert.equal(inputFormatForFileName("score.XML"), "musicxml");
assert.equal(inputFormatForFileName("score.mxl"), "mxl");
assert.equal(inputFormatForFileName("score.mid"), "midi");
assert.equal(inputFormatForFileName("score.midi"), "midi");
assert.equal(inputFormatForFileName("score.mscz"), "mscz");
assert.equal(inputFormatForFileName("score.zip"), "zip");
assert.equal(inputFormatForFileName("score.unknown"), null);
assert.equal(isBinaryInputFormat("mxl"), true);
assert.equal(isBinaryInputFormat("midi"), true);
assert.equal(isBinaryInputFormat("mscz"), true);
assert.equal(isBinaryInputFormat("abc"), false);
assert.equal(isBinaryInputFormat("zip"), true);
assert.deepEqual(exportFileDetails("mxl"), {
  fileName: "miku-score.mxl",
  mimeType: "application/vnd.recordare.musicxml",
});
assert.deepEqual(exportFileDetails("svg", "edited-score"), {
  fileName: "edited-score.svg",
  mimeType: "image/svg+xml",
});
assert.deepEqual(exportFileDetails("zip", "miku-score-all"), {
  fileName: "miku-score-all.zip",
  mimeType: "application/zip",
});
assert.throws(() => exportFileDetails("unknown"), /Unsupported export format/);

const binary = await readBrowserFile({
  arrayBuffer: async () => new Uint8Array([1, 2, 3]).buffer,
}, "midi");
assert.deepEqual([...binary], [1, 2, 3]);
assert.equal(await readBrowserFile({ text: async () => "X:1" }, "abc"), "X:1");
assert.deepEqual([...dataForRuntimeInputFormat(new Uint8Array([1, 2]), "midi")], [1, 2]);
assert.equal(dataForRuntimeInputFormat(new TextEncoder().encode("X:1"), "abc"), "X:1");

const originalDocument = globalThis.document;
const originalUrl = globalThis.URL;
const createdUrls = [];
const revokedUrls = [];
let downloadAnchor = null;
globalThis.document = {
  createElement: () => {
    downloadAnchor = { click: () => { downloadAnchor.clicked = true; } };
    return downloadAnchor;
  },
};
globalThis.URL = {
  createObjectURL: () => {
    const url = "blob:miku-score-web-test";
    createdUrls.push(url);
    return url;
  },
  revokeObjectURL: (url) => revokedUrls.push(url),
};
try {
  downloadBrowserData("<score/>", exportFileDetails("musicxml"));
} finally {
  globalThis.document = originalDocument;
  globalThis.URL = originalUrl;
}
assert.deepEqual(createdUrls, ["blob:miku-score-web-test"]);
assert.deepEqual(revokedUrls, ["blob:miku-score-web-test"]);
assert.equal(downloadAnchor.download, "miku-score.musicxml");
assert.equal(downloadAnchor.clicked, true);

console.log("[smoke:browser-files] ok format detection file reads and download details");
