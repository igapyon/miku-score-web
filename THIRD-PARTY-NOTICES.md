# Third-Party Notices

This file records third-party software and materials bundled with or directly
used by `miku-score-web`. It is a practical repository notice file and does
not replace upstream license texts.

## Bundled components

### `verovio.js`

- Usage: browser runtime for MusicXML-to-SVG preview rendering.
- Local files: `vendor/verovio.js`, `vendor/verovio.sha256`
- Keep upstream attribution and license information aligned when updating the
  bundled asset.

### `utaformatix3-ts-plus`

- Usage: browser-global VSQX and MusicXML conversion bridge.
- Local files: `vendor/utaformatix3/utaformatix3-ts-plus.mikuscore.iife.js`,
  `vendor/utaformatix3/utaformatix3.sha256`
- Upstream: <https://github.com/igapyon/utaformatix3-ts-plus>

## Package-managed dependencies

### `jsdom`

- Usage: Node-based smoke-test DOM implementation.
- License: MIT
- Source: `package.json` and `package-lock.json`
- Upstream: <https://github.com/jsdom/jsdom>

## Maintenance

- When updating a vendored asset, update this notice if its origin,
  attribution, or packaging changes.
