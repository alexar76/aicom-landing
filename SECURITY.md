# Security policy

## Supported versions

We address security issues in the **current `main` branch** of this repository.
There are no numbered LTS releases; treat `main` as the supported line.

## Reporting a vulnerability

**Please do not open a public issue** for undisclosed security vulnerabilities.

1. Use **GitHub** → *Security* → **Report a vulnerability** (private advisory),  
   **or**
2. If this repository is hosted on another forge (e.g. Gitea) without advisories,
   contact the repository maintainers through that platform’s private message or
   security contact if one is published on the org’s website.

Include:

- A short description of the issue and its impact
- Steps to reproduce (or a proof-of-concept) if safe to share
- Affected component (e.g. `preview-server.mjs`, `cli.mjs`, `lib/generate.mjs`)

We aim to acknowledge reports within a few business days. Critical issues (e.g.
remote code execution on the server host, secret leakage from the app process)
get priority.

## Out of scope / known design

The following are **intentional trade-offs** for a local / self-hosted lab tool,
not treated as vulnerabilities by themselves:

- **Generated HTML** from the LLM is treated as **untrusted**. The preview UI uses
  iframe `sandbox` and CSP to reduce risk; operators should still not expose the
  server to the open internet without TLS, rate limits, and optional auth (see
  [`docs/DEPLOY.md`](docs/DEPLOY.md)).
- **API keys** belong in server environment variables only; anyone who can call
  `POST /api/generate` on a deployed instance can consume your provider quota —
  protect the deployment accordingly.

## Agent-To-Website mode

When `agent_to_website` is enabled, generated pages may include an **embedded chat
widget** (JavaScript in the static HTML).

| Risk | Mitigation in this repo |
|------|-------------------------|
| LLM emits malicious script (`eval`, exfiltration via `fetch`, etc.) | Post-generation audit in `lib/agentToWebsite.mjs`; unsafe widgets are **replaced** with a audited fallback (default strict mode). See [`docs/AGENT-TO-WEBSITE.md`](docs/AGENT-TO-WEBSITE.md). |
| Visitor types XSS into the chat box | Fallback widget uses `textContent` only; prompts forbid `innerHTML` for user messages. |
| Users assume chat is a live LLM | Default is **demo mode** (browser-only replies). Do not expose static HTML with embedded API keys. |
| Chat data privacy | Demo widget does **not** send messages to `aicom-landing` or to model providers. Real integrations require your own backend. |

**Reporting:** vulnerabilities in the **fallback widget** or bypass of strict replacement
are in scope. “The demo agent gives wrong answers” is not a security issue.

## Safe harbor

If you follow coordinated disclosure and act in good faith, we will not pursue
legal action for accidental, non-destructive research that respects user privacy
and service availability.
