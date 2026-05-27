# Example landings

Pre-generated samples (Architect → Developer, real LLM run). Open any `.html` in a browser — each file is self-contained (CSS + inline SVG in one file).

| File | Style preset | Prompt (summary) | Generation time |
|------|--------------|------------------|-----------------|
| [saas-task-manager.html](./saas-task-manager.html) | `midnight-terminal` | AI task manager SaaS for remote teams, dark command-center UI | ~62 s |
| [fintech-payments.html](./fintech-payments.html) | `luxe-gold-obsidian` | Cross-border payments for freelancers, premium dark UI | ~74 s |
| [green-solar.html](./green-solar.html) | `sage-organic` | Home solar startup, warm organic wellness aesthetic | ~72 s |

**More ready-made prompts:** [`../PROMPTS.md`](../PROMPTS.md) (SaaS, fintech, e-commerce, wellness, AI tools, local business, and more).

Regenerate locally:

```bash
node cli.mjs "Your prompt" --style midnight-terminal --out docs/examples/my-page.html
```
