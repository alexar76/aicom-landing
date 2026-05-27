# Sample prompts for thematic landings

Copy a prompt into the generator UI (or CLI). **Landing copy language** follows your brief — write in English for English pages, Russian for Russian, etc. The generator UI language is controlled separately via `AICOM_LANDING_UI_LOCALE` (default `en`).

Use **Visual preset → Auto** unless you want a specific look; add `--style <preset-id>` in CLI (`node cli.mjs --list-styles`).

---

## Hero backgrounds & visuals (important)

The generator does **not** call DALL·E or Midjourney. By default heroes are **stylish abstract only** — CSS mesh, aurora, grain, geometric SVG patterns. It does **not** draw roses, cups, faces, or mascots (those tend to look like clip-art “mutants”).

Add to any prompt: `abstract hero only — mesh gradients and patterns, no figurative illustration, no clipart objects`.

**Richer graphics (still one-shot, no extra gates):** ask for depth explicitly — the Architect now plans `visual_recipe` (5–7 hero layers, palette, motif):

```
… Hero: split layout, 6 layers — dark base, dual mesh gradients, film grain, SVG aurora ribbons, scrim behind headline.
Soft glass cards. Section 2 on tinted gradient band with wave divider. Premium typography.
Abstract only — no flower/product illustrations.
```

| Niche | Abstract direction (write in prompt) |
|-------|--------------------------------------|
| Florist / romantic | `soft pink-lilac mesh, geometric petal pattern repeat, grain — no drawn flowers` |
| SaaS / AI | `aurora glass mesh + subtle grid, dark UI` |
| Coffee / food | `warm copper-cream gradients, steam-like curves, no cup illustration` |
| Fintech | `obsidian + gold hairlines, abstract chart lines, no coins` |

**Photo heroes (optional):** only if you explicitly ask, e.g. `photographic Unsplash hero`. Otherwise no stock photos. Broken image URLs are checked server-side and replaced with abstract SVG fallback.

**Example — florist (abstract, stylish):**

```
Florist landing — English. Hero: full-bleed pink-lilac mesh gradient + fine grain + subtle geometric pattern. Abstract only, no flower illustrations. Sections: delivery, weddings, subscription. Preset sage-organic or blossom-pastel.
```

---

## SaaS & productivity

```
SaaS landing for an AI task manager built for remote teams — calm, trustworthy, dark UI with clear pricing and a 14-day trial CTA.
```

```
B2B project management tool for agencies — minimal light UI, social proof, feature grid, integration logos, book-a-demo form.
```

```
Developer platform for API monitoring — technical but approachable, terminal aesthetic, code snippets, uptime stats, start-free tier.
```

---

## Fintech & crypto

```
Fintech app for freelancers receiving cross-border payments — premium dark UI, security badges, fee comparison table, waitlist signup.
```

```
Neobank for Gen Z — bold colors, mobile-first hero, cashback highlights, app store buttons, playful microcopy.
```

```
Crypto portfolio tracker — sleek dark gradient, real-time charts feel, non-custodial trust message, disclaimer footer.
```

---

## E-commerce & consumer

```
Florist / flower delivery — abstract pink-lilac mesh hero, geometric pattern, no flower illustrations. Same-day delivery CTA, wedding and corporate sections.
```

```
DTC skincare brand for sensitive skin — soft organic palette, before/after section, ingredient transparency, subscription box offer.
```

```
Premium coffee subscription — warm editorial layout, origin story, roast tiers, gift option, shipping FAQ.
```

```
Sustainable sneakers brand — streetwear energy, recycled materials story, limited drop countdown, size guide link.
```

---

## Health, wellness & fitness

```
Online yoga studio for busy professionals — zen minimal UI, class schedule, instructor bios, first week free.
```

```
Mental health coaching app — compassionate tone, soft gradients, privacy-first messaging, anonymous chat CTA.
```

```
Home fitness equipment — energetic hero video placeholder, transformation testimonials, warranty block, shop now.
```

---

## Education & courses

```
Online data science bootcamp — credible and modern, curriculum timeline, alumni salaries, apply-now form, FAQ.
```

```
Language learning app for kids — playful illustrations, parent testimonials, COPPA-safe privacy note, free lesson CTA.
```

```
Corporate compliance training — enterprise sober design, LMS integration bullets, request demo, SOC2 mention.
```

---

## AI & developer tools

```
AI writing assistant for marketers — purple dark UI, compare plans, example outputs carousel, start writing free.
```

```
Open-source LLM hosting platform — developer-focused, deploy in 60 seconds, pricing per token, GitHub stars strip.
```

```
No-code automation for small business — friendly SaaS, template gallery, Zapier-style connectors, free tier.
```

---

## Local business & events

```
Artisan bakery in Brooklyn — rustic warm photos, daily menu highlights, catering CTA, map and hours.
```

```
Wedding photographer portfolio — elegant serif, full-bleed gallery, packages, availability calendar link.
```

```
Tech conference 2026 — bold poster aesthetic, speaker grid, ticket tiers, venue and dates, sponsor logos.
```

---

## Creative & agency

```
Branding studio for startups — portfolio grid, case study teasers, process steps, book intro call.
```

```
Freelance motion designer — cinematic dark theme, showreel hero, client logos, hire me CTA.
```

```
Architecture firm — refined white space, project slideshow, awards, sustainable design manifesto.
```

---

## Regenerate an example locally

```bash
node cli.mjs "Your prompt here" --style sage-organic --out docs/examples/my-page.html
```

More finished samples: [`docs/examples/`](examples/README.md).
