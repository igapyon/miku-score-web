# Runtime parity fixtures

`base.musicxml` is unchanged from the `miku-score v0.7.0` test fixture of the
same name. Its contents were confirmed identical before copying here.

`base.expected.json` records the output and diagnostic baseline captured from
the published `v0.7.0` browser runtime for value operations used by the
historical combined Web App: canonical load/state summary, MusicXML-to-ABC,
configured MusicXML-to-MIDI, MIDI-like playback-plan schedule and measure
timeline, each browser file format's conversion round-trip (MusicXML, MXL,
ABC, MIDI, VSQX, MEI, LilyPond, MuseScore, and MSCZ), all selected-note edit
commands (pitch, duration, insertion, splitting, and deletion), invalid
edit-command rejection, and invalid MusicXML rejection.

The Web smoke imports only the pinned runtime. It must not import implementation
modules from `../miku-score`. A later pinned runtime may be checked against this
baseline, but every recorded value must remain compatible. Update these
expectations only after a deliberate compatibility decision and a corresponding
historical-Web comparison.

Compressed MXL and MSCZ archive headers are intentionally not hashed: archive
metadata can vary while the score content does not. Their entry names and
uncompressed entry bytes are fixed instead.

`v2.expected.json` records the published `v0.8.0` value baseline for measure
extraction, replacement, and append; generic ZIP root-entry listing and
extraction; and metadata import/export policy, including malformed replacement
and archive-extraction diagnostics. It is separate because these operations
were not public in v0.7.0.
