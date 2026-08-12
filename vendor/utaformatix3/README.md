# UtaFormatix3 VSQX browser asset

`utaformatix3-ts-plus.mikuscore.iife.js` is the browser-global bridge used for
VSQX and MusicXML conversion. It is loaded before the published `miku-score`
runtime, then adapted as the runtime's explicit `vsqxBridge` capability.

The asset is copied from `../miku-score/src/vendor/utaformatix3/` while the
repository split is in progress. Its expected SHA-256 is in
`utaformatix3.sha256` and is verified during every Web build. Update both files
together in one reviewed change.

Upstream: <https://github.com/igapyon/utaformatix3-ts-plus>
