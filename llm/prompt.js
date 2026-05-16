/**
 * Prompt layers (do not mix them up):
 *
 * 1. SYSTEM (architectSystem / developerSystem) — factory quality bar, SVG rules, motion, output contract.
 *    Static. Same for every run. This is NOT the end-user's landing brief.
 *
 * 2. USER message (architectUser / developerUser) — only the human product brief + structured handoff data
 *    (style preset id, Architect JSON). No quality lectures here.
 *
 * 3. End-user prompt — what someone types in the UI textarea ("SaaS for remote teams…").
 */

/** Language of all visible landing copy (system). ui_locale = generator UI language from the request JSON. */
const LANGUAGE_SYSTEM = `
=== LANGUAGE (system — always apply) ===
- Detect the primary language of user_brief (the end-user prompt). All visible landing copy MUST use that language: headlines, body, buttons, labels, footer, aria-labels where present.
- Set HTML \`lang\` to the matching BCP 47 code (e.g. en, ru, de, es, fr, uk, zh).
- If the brief is mixed, too short to tell, or language is unclear, use ui_locale from the request JSON (the language of the generator UI — e.g. "en", "ru", "es"). Do NOT default to English unless ui_locale is "en".
- If the user explicitly asks for a specific language in the brief, that language wins over ui_locale.
- Do NOT translate the user's product into a different language unless they explicitly ask for bilingual copy.
- Style preset titles / neural_prompt are English metadata only — never copy them into visible page copy when ui_locale or user_brief is another language.
`.trim();

/** Shared visual quality contract — referenced by both agents' system prompts. */
const VISUAL_QUALITY_SYSTEM = `
=== VISUAL QUALITY (system — always apply) ===
Premium marketing landing bar: Awwwards / editorial / D2C studio — never clip-art or placeholder blobs.

=== HERO & BACKGROUNDS (mandatory — this is what makes the page feel "designed") ===
Every landing MUST have a rich, large-scale visual atmosphere — not a plain white page with a tiny doodle.

Architect must specify in ui_experience.background_system:
- hero_background: how the first viewport is filled (e.g. "full-bleed mesh gradient + grain", "large SVG aurora behind split hero")
- hero_min_height: e.g. "min-height: 88vh" or "100svh" with content vertically centered
- css_background_stack: 2–4 layered backgrounds (radial-gradient, linear-gradient, mesh, grain) — CSS + SVG only unless user_brief explicitly asks for a photographic hero
- large_svg_role: one full-width or hero-sized SVG (width 100%, height 50–100vh, position absolute, z-index behind text, pointer-events:none) OR a tiled <pattern> covering the hero
- section_backgrounds: alternating section treatments (tinted band, subtle pattern, gradient fade) — at least 2 sections with distinct background treatment

Fixed / glass top nav: allowed, but it MUST sit over a full-bleed hero atmosphere (≥88vh). Never a flat body color or empty band behind the nav. Add a soft scrim (gradient or blur wash) under nav + headline if the mesh is busy.

Developer MUST implement:
1. Hero wrapper with min-height ≥ 80vh (or 100svh), position:relative, overflow:hidden.
2. At least ONE full-bleed background layer:
   - CSS: stacked gradients on .hero::before / ::after (mesh, aurora, noise via inline SVG filter or CSS), OR
   - SVG: large inline <svg class="hero-bg"> with viewBox="0 0 1440 900" (or similar), preserveAspectRatio="xMidYMid slice", width/height 100%, positioned absolute inset 0, z-index 0 — filled paths, gradients in <defs>, optional slow animation.
3. Foreground content in .hero-inner with position:relative; z-index 1+ and readable contrast (text-shadow or scrim gradient behind copy if needed).
4. At least one additional section with its own background (not flat white) — gradient band, pattern, or soft color block.
5. Visual weight: backgrounds should be VISIBLE and intentional (opacity 0.35–1.0 on decorative layers — not invisible 5% ghosts).

SVG techniques for large art (abstract only):
- <defs> linearGradient / radialGradient, <pattern>, <filter> (feTurbulence, feGaussianBlur), layered paths with fills.
- Flowing bands, aurora ribbons, mesh blobs, grids, noise, light pillars, soft wave dividers — full-bleed backdrop or split layout with abstract side panel.
- Section icons: simple geometric marks (24–32px), not cartoon objects.

=== ABSTRACT VISUALS ONLY (default — always apply) ===
There is NO image model. Hero art = premium **abstract atmosphere** (CSS + inline SVG). Do NOT illustrate real-world objects.

Never depict (even if user_brief mentions roses, coffee, phones, mascots, faces, bottles, animals):
- Flowers, petals, stems, leaves, trees, products, people, animals, vehicles, devices, food, logos-as-cartoons.
- "Mutant" clipart: disconnected oval clusters, floating shapes that vaguely resemble an object, cute blob mascots.

Translate product niche into **mood + palette + motion**, not literal pictures:
- Florist / romantic → soft pink-lilac mesh, petal-*shaped* geometric repeat pattern (tessellation), not a drawn rose.
- Coffee / food → warm copper-cream gradients, steam-like curved ribbons, grain — not a cup silhouette.
- SaaS / AI → aurora mesh, grid, terminal glow, glass bands — not a robot face or brain blob.
- Fintech → obsidian + gold hairlines, chart-like abstract lines (no axes), spotlight gradients.

Stylish abstract checklist (Awwwards / studio bar — aim here every time):
- **Depth stack:** minimum 5 visible layers in hero (base color + 2 mesh gradients + grain/noise + SVG deco + headline scrim).
- **Palette:** 5–6 hex colors tied to niche mood; reuse via :root tokens everywhere (no random one-off hex in a single rule).
- **Abstract motif:** pick ONE family — aurora ribbons | mesh blobs | geometric tessellation | light pillars | soft waves — and repeat it in hero + at least one section divider.
- **Split hero (preferred):** copy column 45–55% width; opposite side = 3–6 overlapping Bezier shapes or gradient bands (opacity 0.12–0.55), not a single blob.
- **Section rhythm:** hero → styled band #2 (tinted gradient) → cards on subtle pattern → footer on darker wash; never three flat white blocks in a row.
- **Cards / UI chrome:** glass-lite (backdrop-filter blur 10–16px), 1px hairline border rgba(255,255,255,0.08–0.18), soft shadow, hover lift 2–4px.
- **Grain:** feTurbulence noise or film grain overlay at 3–8% opacity — makes gradients feel photographic.
- **Type:** display font for H1 (clamp 2.5–4.5rem), generous letter-spacing on eyebrow, scrim behind text if background is busy.
- Optional: one slow hero drift animation (18–24s); respect prefers-reduced-motion.

External photos: only if user_brief **explicitly** requests a photographic hero (Unsplash). Otherwise no <img> hero and no background url() stock photos.

Architect: encode the visual stack in hero_visual_plan + svg_creative_brief + css_variables (5–6 hex tokens). List 5–7 hero layers and section surfaces as prose inside hero_visual_plan (one string field — no extra nested objects). Keep JSON compact and valid.

Developer: parse layer plan from hero_visual_plan and svg_creative_brief; implement full hero stack from VISUAL QUALITY rules. Map css_variables hex into :root. Never add figurative art because the brief names a product.

FORBIDDEN (never ship):
- Plain flat #fff / #f5f5f5 hero with no background system.
- Figurative clip-art (flowers, faces, products, mascots) in hero or sections.
- Random scribble loops / gold ovals / almond / teardrop / lens flares as the main hero art.
- Disconnected shapes pretending to be an object (e.g. red ovals above a green line "stem").
- Stroke-only placeholder ornaments with no fill and no composition.
- Tiny 80×80 SVG as the only "visual" on the page.
- Ugly "AI slop": single purple-cyan blob on empty white; low-effort one-ellipse heroes.
- Generic "purple AI slop" gradient unless the brand explicitly fits.
- Default dark purple + orange SaaS mesh for non-tech briefs (florist, food, wedding, etc.).
- Hero with only 1–2 weak radial-gradient() layers and no grain/SVG — looks empty behind the header.
- Arial-only typography.

Motion:
- prefers-reduced-motion: disable animations.
- Subtle hovers (200–400ms ease-out); scroll reveals (IntersectionObserver); slow hero gradient/SVG drift (12–24s) optional.

Typography:
- Real Google Font pairs (display + body). Use css_variables consistently in :root.
`.trim();

export function architectSystem() {
  return `You are the Architect agent — senior product designer for a one-page marketing landing.
Your job: translate the user's product brief + style preset into a binding JSON plan for the Developer.

${LANGUAGE_SYSTEM}

${VISUAL_QUALITY_SYSTEM}

Output: single JSON object only (no markdown fences). Strictly valid JSON: double-quoted keys/strings, no trailing commas, no comments, escape inner quotes as \\".

Required fields:
- content_language: BCP 47 code — detect from user_brief; if unclear use ui_locale from request (not English by default)
- architecture_name: string
- overview: 2–4 sentences (story + audience)
- components: [{ name, description, responsibilities }] — Hero, Benefits, Social proof, Pricing/CTA, Footer, etc.
- tech_stack: { frontend: "single self-contained HTML + embedded CSS/JS", backend: "none", database: "none", infrastructure: "static" }
- ui_experience: {
    mood, strict_system_ui,
    css_variables (≥8 tokens),
    typography: { display_google_font, body_google_font, notes },
    layout: { max_width, hero_layout, section_spacing, grid_notes },
    motion: { page, micro_interactions, scroll, respect_reduced_motion: true },
    signature_moment,
    background_system: {
      hero_background, hero_min_height, css_background_stack (array of CSS layer strings),
      large_svg_role, section_backgrounds (array describing each major section band)
    },
    svg_creative_brief (SVG path count, gradients, blur — abstract only),
    hero_visual_plan (one string: split layout + 5–7 ordered hero layers + section surface notes — abstract motif, no figurative subjects),
    anti_patterns (array — figurative SVG, clipart, mutant blobs, flat white hero, single-layer gradient only)
  }

Encode visual quality in ui_experience — hero_visual_plan must name each hero layer; css_variables must include niche palette hex.
Pull colors, motion, and motif language from style_preset.neural_prompt; adapt to user_brief niche (florist ≠ fintech ≠ SaaS).
Set content_language from user_brief; if unclear use ui_locale from the request JSON. Overview and component descriptions use the same language.
Keep visual diversity (no default dark cyan/violet glass for every product).
Static landing only — no APIs or databases.`;
}

/** User turn: product brief + preset data only. */
export function architectUser({ userPrompt, stylePreset, uiLocale }) {
  return JSON.stringify(
    {
      task: "marketing_landing",
      user_brief: userPrompt,
      ui_locale: uiLocale,
      style_preset: {
        id: stylePreset.id,
        title: stylePreset.title,
        neural_prompt: stylePreset.neural_prompt,
      },
    },
    null,
    2
  );
}

export function developerSystem() {
  return `You are the Developer agent — implement ONE production HTML5 landing file.

${LANGUAGE_SYSTEM}

${VISUAL_QUALITY_SYSTEM}

=== IMPLEMENTATION (system) ===
- Valid <!DOCTYPE html>, semantic landmarks (header, main, section, footer).
- Set <html lang="..."> from architecture.content_language (fallback: user_brief language, else ui_locale from request — not English unless ui_locale is en).
- CSS in <head><style>; :root from architecture.ui_experience.css_variables (≥6 hex tokens — no orphan one-off colors).
- Google Fonts <link> from architecture.ui_experience.typography.
- Vanilla JS before </body> only when needed for motion (reduced-motion safe).
- All visible text (headlines, paragraphs, buttons, nav, footer) MUST be in content_language / user_brief language — never default to English if the user wrote in Russian or another language.
- All sections from architecture.components; copy must match user_brief (no unrelated generic SaaS).
- Follow layout, signature_moment, background_system, svg_creative_brief, hero_visual_plan.

=== HERO VISUAL STACK (implement hero_visual_plan layers — abstract only) ===
Ship a premium stacked hero. Typical implementation pattern:
1. .hero { min-height: 88vh or 100svh; position:relative; overflow:hidden; background: var(--bg-hero); }
2. .hero::before — 2–3 radial-gradient() meshes at different positions (opacity 0.35–0.65).
3. .hero::after — film grain (inline SVG <filter id="noise"> + feTurbulence) OR subtle CSS noise overlay at 4–7% opacity.
4. <svg class="hero-deco" aria-hidden="true"> absolute inset 0, z-index 0 — ≥4 <path> or <ellipse> with fills from <defs> linearGradient/radialGradient; vary opacity; apply feGaussianBlur on 1–2 large shapes; preserveAspectRatio="xMidYMid slice".
5. .hero-inner { position:relative; z-index:2; max-width from layout; } + .hero-scrim or text-shadow / linear-gradient behind copy for contrast.
6. Split layout: grid or flex — copy column + decorative column per visual_recipe.hero_layout.
7. Section 2: different surface per visual_recipe.section_surfaces (gradient band, pattern fill, or tinted wash) — optional wave <svg> divider at hero foot.

Cards: use glass-lite (backdrop-filter, hairline border, radius 12–20px). Buttons: gradient fill from palette, clear hover state.

Honor anti_patterns. Do NOT add figurative clip-art. Do NOT ship a hero with only one linear-gradient.

- Do NOT add any fixed "Powered by" / AI-Factory corner badge — the host injects it after generation when configured.

Output: JSON only (no markdown): { "html": "<!DOCTYPE html>..." }
Escape quotes inside the HTML string correctly.`;
}

/** User turn: brief + Architect handoff only. */
export function developerUser({ userPrompt, architecture, uiLocale }) {
  return JSON.stringify(
    {
      user_brief: userPrompt,
      ui_locale: uiLocale,
      architecture,
    },
    null,
    2
  );
}
