const runtime = loadMikuScoreRuntime({ expectedVersion: version });
globalThis.__mikuScoreWebRuntime = Object.freeze({
  version,
  runtimeApiVersion,
  embeddedModulePaths,
});

const abcInput = document.getElementById("abcInput");
const musicXmlOutput = document.getElementById("musicXmlOutput");
const status = document.getElementById("status");

const showFailure = (result) => {
  status.textContent = result.diagnostics.map((item) => item.message).join(" ");
};

document.getElementById("convertAbc")?.addEventListener("click", async () => {
  const converted = await runtime.convert.importToMusicXml({ format: "abc", data: abcInput.value });
  if (!converted.ok) return showFailure(converted);
  musicXmlOutput.value = converted.value;
  status.textContent = `Converted ABC with ${converted.warnings.length} warning(s).`;
});

document.getElementById("newScore")?.addEventListener("click", () => {
  const created = runtime.score.createNewMusicXml();
  if (!created.ok) return showFailure(created);
  musicXmlOutput.value = created.value;
  status.textContent = "Created a new MusicXML score.";
});

document.getElementById("downloadMidi")?.addEventListener("click", async () => {
  const exported = await runtime.convert.exportFromMusicXml({ format: "midi", xml: musicXmlOutput.value });
  if (!exported.ok) return showFailure(exported);
  const bytes = exported.value;
  if (!(bytes instanceof Uint8Array)) {
    status.textContent = "MIDI export returned an unexpected non-binary value.";
    return;
  }
  const url = URL.createObjectURL(new Blob([bytes], { type: "audio/midi" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "miku-score.mid";
  anchor.click();
  URL.revokeObjectURL(url);
  status.textContent = "Downloaded MIDI.";
});

document.getElementById("buildPlaybackPlan")?.addEventListener("click", () => {
  const plan = runtime.playback.buildPlan(musicXmlOutput.value, {
    ticksPerQuarter: 480,
    useMidiLikePlayback: false,
    graceTimingMode: "before_beat",
    metricAccentEnabled: false,
    metricAccentProfile: "subtle",
  });
  if (!plan.ok) return showFailure(plan);
  status.textContent = `Playback plan has ${plan.value.eventCount} event(s).`;
});
