/**
 * Post-process weak hero backgrounds (thin gradients, missing grain/SVG).
 * Injects extra mesh layers using palette hex already present in the page.
 */

/**
 * @param {string} html
 * @returns {string[]}
 */
function extractPalette(html) {
  /** @type {string[]} */
  const out = [];
  const seen = new Set();
  const push = (raw) => {
    const c = raw.toLowerCase();
    if (seen.has(c)) return;
    seen.add(c);
    out.push(c);
  };
  for (const m of html.matchAll(/#[0-9a-fA-F]{3,8}\b/g)) push(m[0]);
  if (out.length >= 3) return out.slice(0, 6);
  return ["#f5e6ef", "#e8c4d8", "#c9a0b8", "#8b5e7c", "#faf0f5", "#2d1b2e"];
}

/**
 * @param {string} html
 */
function heroBlock(html) {
  const m = html.match(/<(?:section|header|div)([^>]*class=["'][^"']*hero[^"']*["'][^>]*)>/i);
  return m ? m[0] : "";
}

/**
 * @param {string} html
 */
function isHeroVisuallyRich(html) {
  const block = heroBlock(html);
  const scope = block + html.slice(0, 120_000);
  const radial = (scope.match(/radial-gradient/gi) || []).length;
  const linear = (scope.match(/linear-gradient/gi) || []).length;
  const hasGrain = /feTurbulence|fractalNoise|hero::after|grain|noise/i.test(scope);
  const hasHeroSvg =
    /<svg[^>]*class=["'][^"']*(?:hero|deco|bg)/i.test(scope) ||
    /<(?:section|div)[^>]*class=["'][^"']*hero[^"']*["'][^>]*>[\s\S]*?<svg/i.test(html);
  return radial >= 3 && linear >= 1 && hasGrain && hasHeroSvg;
}

/**
 * @param {string[]} colors
 */
function boostStylesheet(colors) {
  const [c0, c1, c2, c3] = colors;
  return `<style id="aicom-hero-boost">
.hero { position: relative; overflow: hidden; min-height: max(88vh, 640px); }
.hero .aicom-hero-mesh,
.hero-mesh-boost {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  background:
    radial-gradient(ellipse 55% 45% at 12% 18%, ${c0}99 0%, transparent 58%),
    radial-gradient(ellipse 48% 42% at 88% 22%, ${c1}88 0%, transparent 55%),
    radial-gradient(ellipse 60% 50% at 50% 100%, ${c2}66 0%, transparent 62%),
    linear-gradient(165deg, ${c3}22 0%, transparent 45%, ${c0}18 100%);
  animation: aicomHeroMesh 22s ease-in-out infinite alternate;
}
.hero .aicom-hero-grain,
.hero-grain-boost {
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  opacity: 0.055;
  background: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  mix-blend-mode: soft-light;
}
.hero-inner, .hero-content, .hero-copy { position: relative; z-index: 2; }
@keyframes aicomHeroMesh {
  0% { transform: scale(1) translate(0, 0); }
  100% { transform: scale(1.04) translate(1.5%, -1%); }
}
@media (prefers-reduced-motion: reduce) {
  .hero .aicom-hero-mesh, .hero-mesh-boost { animation: none !important; }
}
</style>`;
}

/**
 * @param {string} html
 * @returns {boolean}
 */
function isGenericSaasSlop(html) {
  const h = html.toLowerCase();
  return h.includes("#3b0764") && (h.includes("#f97316") || h.includes("#6366f1"));
}

export function strengthenHeroBackground(html) {
  if (process.env.AICOM_LANDING_SKIP_HERO_BOOST === "true") return html;
  if (!heroBlock(html)) return html;
  const slop = isGenericSaasSlop(html);
  if (!slop && isHeroVisuallyRich(html)) return html;
  if (/aicom-hero-boost|aicom-hero-mesh/.test(html)) return html;

  const colors = slop
    ? ["#f5e6ef", "#e8c4d8", "#c9a0b8", "#8b5e7c", "#faf0f5", "#2d1b2e"]
    : extractPalette(html);
  const css = boostStylesheet(colors);
  const tag = "div";
  const layers =
    `<${tag} aria-hidden="true" class="aicom-hero-mesh"></${tag}>` +
    `<${tag} aria-hidden="true" class="aicom-hero-grain"></${tag}>`;

  let out = html;
  const heroOpen = out.match(/<(?:section|header|div)([^>]*class=["'][^"']*hero[^"']*["'][^>]*)>/i);
  if (heroOpen) {
    const openTag = heroOpen[0];
    const patched =
      /style=/i.test(openTag) && !/position\s*:\s*relative/i.test(openTag)
        ? openTag.replace(/style=(["'])/i, 'style=$1position:relative;overflow:hidden;')
        : /style=/i.test(openTag)
          ? openTag
          : openTag.replace(/>$/, ' style="position:relative;overflow:hidden">');
    out = out.replace(openTag, `${patched}\n${layers}`);
  }

  if (/<\/head>/i.test(out)) {
    out = out.replace(/<\/head>/i, `${css}\n</head>`);
  } else {
    out = css + out;
  }
  return out;
}
