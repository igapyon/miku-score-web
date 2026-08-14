# v0.7.0 runtime parity fixtures

`base.musicxml` is unchanged from the `miku-score v0.7.0` test fixture of the
same name. Its contents were confirmed identical before copying here.

`base.expected.json` records the output and diagnostic baseline captured from
the published `v0.7.0` browser runtime for value operations used by the
historical combined Web App: canonical load/state summary, MusicXML-to-ABC,
configured MusicXML-to-MIDI, MIDI-like playback-plan schedule and measure
timeline, MXL/MuseScore/MSCZ output, VSQX output and round-trip, a
selected-note pitch command, and invalid MusicXML rejection.

The Web smoke imports only the pinned runtime. It must not import implementation
modules from `../miku-score`. A later pinned runtime may be checked against this
baseline, but every recorded value must remain compatible. Update these
expectations only after a deliberate compatibility decision and a corresponding
historical-Web comparison.

Compressed MXL and MSCZ archive headers are intentionally not hashed: archive
metadata can vary while the score content does not. Their entry names and
uncompressed entry bytes are fixed instead.
