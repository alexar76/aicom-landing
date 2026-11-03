# Changelog

## 0.2.0 — 2026-11-03

### Security

- `/api/generate` refuses prompt-injection attempts before any model call
  (`lib/promptFirewall.mjs`: one critical pattern or two strong ones).
- The external-image repair step no longer fetches private, loopback or link-local
  addresses (`test/image-probe-ssrf.test.mjs`).
- A generated preview opened directly is sandboxed (`sandbox allow-scripts allow-forms`),
  as it is inside the generator's frame, so a model-written script runs in an opaque
  origin rather than as the site that serves it.

### Changed

- Fonts are served from the package (`public/fonts`) instead of Google Fonts, so visitors'
  addresses no longer go to Google.
- Updated interface copy (`lib/journeyCopy.mjs`, `lib/uiLocale.mjs`); README translations
  and example pages ship in `docs/`.

## 0.1.1 — 2026-07-01

First release on npm.
