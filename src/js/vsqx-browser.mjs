const isVsqxBridge = (candidate) => Boolean(
  candidate
  && typeof candidate.convertVsqxToMusicXml === "function"
  && typeof candidate.convertVsqxToMusicXmlWithReport === "function"
  && typeof candidate.convertMusicXmlToVsqx === "function"
);

export const createBrowserVsqxAdapter = (options = {}) => {
  const bridge = Object.prototype.hasOwnProperty.call(options, "vsqxBridge")
    ? options.vsqxBridge
    : globalThis.UtaFormatix3TsPlusMikuscore ?? null;

  if (!isVsqxBridge(bridge)) {
    return Object.freeze({
      available: false,
      capability: null,
    });
  }

  return Object.freeze({
    available: true,
    capability: bridge,
  });
};
