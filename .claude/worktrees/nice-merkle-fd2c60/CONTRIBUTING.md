# Contributing

Thanks for helping improve **aicom-landing** — a small tool in the
[AI-Factory](https://magic-ai-factory.com/) ecosystem.

## Before you start

- Read [`README.md`](README.md) for scope: one-prompt → one HTML landing, CLI + preview server.
- Prefer **small, focused PRs** (one logical change per pull request).
- Match existing style: ES modules (`.mjs` / `.js`), no new heavy dependencies unless discussed.

## Development

```bash
git clone <your-fork-or-this-repo>
cd aicom-landing
cp .env.example .env   # add at least one LLM API key for real generation
npm run serve          # http://127.0.0.1:3847/
```

CLI smoke test:

```bash
node cli.mjs "Short test pitch for a fake product" --out /tmp/test-landing.html
```

## What we merge

- **Bug fixes** and clear regressions.
- **Docs** corrections and deployment notes ([`docs/DEPLOY.md`](docs/DEPLOY.md)).
- **Small UX** improvements to the preview UI (accessibility, copy, i18n keys in `lib/uiLocale.mjs`).
- **Safe** hardening for the preview server (headers, limits) when behavior stays predictable.

Please avoid large refactors or unrelated formatting-only changes unless agreed in an issue first.

## LLM and security

- **Never** commit API keys, `.env`, or real customer prompts.
- Generated HTML is **untrusted**; changes that weaken iframe sandboxing or CSP need extra scrutiny.

## i18n

UI strings live in `lib/uiLocale.mjs` for `en`, `ru`, `es`. Keep keys in sync across locales when adding copy.

## License

By contributing, you agree your contributions are licensed under the same terms as this project: **MIT** (see [`LICENSE`](LICENSE)).
