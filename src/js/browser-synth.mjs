const midiToHz = (midiNumber) => 440 * Math.pow(2, (Number(midiNumber) - 69) / 12);

const normalizedTempoEvents = (schedule) => {
  const raw = schedule.tempoEvents?.length
    ? schedule.tempoEvents
    : [{ startTick: 0, bpm: schedule.tempo }];
  const merged = new Map();
  for (const event of raw) {
    const startTick = Math.max(0, Math.round(Number(event.startTick) || 0));
    const bpm = Math.max(1, Math.round(Number(event.bpm) || Number(schedule.tempo) || 120));
    merged.set(startTick, bpm);
  }
  if (!merged.has(0)) merged.set(0, Math.max(1, Math.round(Number(schedule.tempo) || 120)));
  return Array.from(merged, ([startTick, bpm]) => ({ startTick, bpm }))
    .sort((left, right) => left.startTick - right.startTick);
};

const tickToSeconds = (targetTick, tempoEvents, ticksPerQuarter) => {
  const target = Math.max(0, Number(targetTick) || 0);
  let seconds = 0;
  for (let index = 0; index < tempoEvents.length; index += 1) {
    const current = tempoEvents[index];
    const nextTick = tempoEvents[index + 1]?.startTick ?? target;
    if (target <= current.startTick) break;
    const endTick = Math.min(target, nextTick);
    if (endTick > current.startTick) {
      seconds += (endTick - current.startTick) * 60 / (current.bpm * ticksPerQuarter);
    }
    if (endTick === target) break;
  }
  return seconds;
};

const validWaveform = (waveform) => ["sine", "triangle", "square"].includes(waveform)
  ? waveform
  : "triangle";

export const createBrowserSynth = (options = {}) => {
  const ticksPerQuarter = Math.max(1, Math.round(options.ticksPerQuarter ?? 480));
  const setTimeoutFn = options.setTimeoutFn ?? globalThis.setTimeout.bind(globalThis);
  const clearTimeoutFn = options.clearTimeoutFn ?? globalThis.clearTimeout.bind(globalThis);
  const createAudioContext = options.createAudioContext ?? (() => {
    const constructor = globalThis.AudioContext ?? globalThis.webkitAudioContext;
    if (!constructor) throw new Error("Web Audio API is unavailable.");
    return new constructor();
  });
  let context = null;
  let activeNodes = [];
  let finishTimer = null;

  const stop = () => {
    if (finishTimer !== null) {
      clearTimeoutFn(finishTimer);
      finishTimer = null;
    }
    for (const { oscillator, gain } of activeNodes) {
      try { oscillator.stop(); } catch {}
      try { oscillator.disconnect(); gain.disconnect(); } catch {}
    }
    activeNodes = [];
  };

  const ensureRunningContext = async () => {
    if (!context) context = createAudioContext();
    if (context.state !== "running") await context.resume();
    if (context.state !== "running") throw new Error("Web Audio context did not enter the running state.");
    return context;
  };

  const play = async (schedule, settings = {}) => {
    if (!Array.isArray(schedule?.events) || schedule.events.length === 0) {
      throw new Error("No playable score events are available.");
    }
    const runningContext = await ensureRunningContext();
    stop();
    const waveform = validWaveform(settings.waveform);
    const tempoEvents = normalizedTempoEvents(schedule);
    const baseTime = runningContext.currentTime + 0.04;
    let lastEnd = baseTime;

    for (const event of schedule.events) {
      const startAt = baseTime + tickToSeconds(event.start, tempoEvents, ticksPerQuarter);
      const endAt = baseTime + tickToSeconds(event.start + event.ticks, tempoEvents, ticksPerQuarter);
      const duration = Math.max(0.03, endAt - startAt);
      const oscillator = runningContext.createOscillator();
      const gain = runningContext.createGain();
      oscillator.type = waveform;
      oscillator.frequency.setValueAtTime(midiToHz(event.midiNumber), startAt);
      gain.gain.setValueAtTime(0.0001, startAt);
      gain.gain.linearRampToValueAtTime(event.channel === 10 ? 0.06 : 0.1, startAt + 0.005);
      gain.gain.setValueAtTime(event.channel === 10 ? 0.06 : 0.1, startAt + Math.max(0.01, duration - 0.02));
      gain.gain.linearRampToValueAtTime(0.0001, startAt + duration);
      oscillator.connect(gain);
      gain.connect(runningContext.destination);
      oscillator.start(startAt);
      oscillator.stop(startAt + duration + 0.01);
      activeNodes.push({ oscillator, gain });
      lastEnd = Math.max(lastEnd, startAt + duration + 0.02);
    }

    finishTimer = setTimeoutFn(() => {
      activeNodes = [];
      finishTimer = null;
      settings.onEnded?.();
    }, Math.max(0, Math.ceil((lastEnd - runningContext.currentTime) * 1000)));
  };

  return Object.freeze({ play, stop });
};
