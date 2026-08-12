import assert from "node:assert/strict";

import { createBrowserSynth } from "../src/js/browser-synth.mjs";

const calls = [];
const timers = [];
const context = {
  state: "suspended",
  currentTime: 10,
  destination: {},
  resume: async () => { context.state = "running"; },
  createOscillator: () => ({
    frequency: { setValueAtTime: (...args) => calls.push(["frequency", ...args]) },
    connect: () => calls.push(["oscillator-connect"]),
    start: (at) => calls.push(["start", at]),
    stop: () => calls.push(["stop"]),
    disconnect: () => calls.push(["oscillator-disconnect"]),
  }),
  createGain: () => ({
    gain: {
      setValueAtTime: (...args) => calls.push(["gain-set", ...args]),
      linearRampToValueAtTime: (...args) => calls.push(["gain-ramp", ...args]),
    },
    connect: () => calls.push(["gain-connect"]),
    disconnect: () => calls.push(["gain-disconnect"]),
  }),
};
const synth = createBrowserSynth({
  ticksPerQuarter: 480,
  createAudioContext: () => context,
  setTimeoutFn: (callback) => { timers.push(callback); return timers.length; },
  clearTimeoutFn: () => undefined,
});
let ended = false;
await synth.play({
  tempo: 120,
  events: [{ midiNumber: 69, start: 0, ticks: 480, channel: 1 }],
}, { waveform: "square", onEnded: () => { ended = true; } });
assert.equal(context.state, "running");
assert.deepEqual(calls.find(([name]) => name === "start"), ["start", 10.04]);
assert.equal(calls.some(([name]) => name === "frequency"), true);
timers[0]();
assert.equal(ended, true);
synth.stop();

console.log("[smoke:browser-synth] ok Web Audio scheduling and stop");
