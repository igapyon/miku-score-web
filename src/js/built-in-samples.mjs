const samples = Object.freeze({
  "1": sampleXml1,
  "2": sampleXml2,
  "3": sampleXml3,
  "4": sampleXml4,
  "6": sampleXml6,
  "7": sampleXml7,
});

export const builtInSampleIds = Object.freeze(Object.keys(samples));

export const builtInSampleMusicXml = (sampleId) => samples[String(sampleId)] ?? null;
