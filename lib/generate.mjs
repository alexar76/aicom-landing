import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { complete, extractJsonObject } from "../llm/provider.js";
import { architectSystem, architectUser, developerSystem, developerUser } from "../llm/prompt.js";
import { applyBadgeToHtml } from "./badgeConfig.mjs";
import { getDefaultUiLocale, normalizeUiLocale } from "./uiLocale.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
export const PACKAGE_ROOT = join(__dirname, "..");

/** Exhausted JSON retries — safe to show in API/UI (no provider internals). */
export class ModelOutputError extends Error {
  /** @param {string} message */
  constructor(message) {
    super(message);
    this.name = "ModelOutputError";
  }
}

export function hashPickIndex(str, n) {
  const h = createHash("sha256").update(str).digest();
  let x = 0;
  for (let i = 0; i < 4; i++) x = (x << 8) | h[i];
  return Math.abs(x) % n;
}

export async function loadPresets(rootDir = PACKAGE_ROOT) {
  const raw = await readFile(join(rootDir, "styles", "presets.json"), "utf8");
  const list = JSON.parse(raw);
  if (!Array.isArray(list)) throw new Error("presets.json must be an array");
  return list;
}

export function pickPreset(presets, styleId, userPrompt) {
  if (styleId) {
    const p = presets.find((x) => x.id === styleId);
    if (!p) {
      const ids = presets.map((x) => x.id).join(", ");
      throw new Error(`Unknown style id "${styleId}". Known: ${ids}`);
    }
    return p;
  }
  return presets[hashPickIndex(userPrompt || "default", presets.length)];
}

/** Max LLM→JSON parse attempts per stage (Architect / Developer). */
function jsonRetryLimit() {
  const n = Number(process.env.AICOM_LANDING_JSON_RETRIES ?? 3);
  return Number.isFinite(n) ? Math.min(10, Math.max(1, Math.floor(n))) : 3;
}

/**
 * Call `complete`, then `extractJsonObject`; retry on malformed model JSON.
 * @param {Parameters<typeof complete>[0]} completeOpts
 * @param {string} label — log tag (Architect / Developer)
 * @param {(parsed: unknown) => void} [assertParsed] — throw to trigger retry
 */
async function completeParsedJson(completeOpts, label, assertParsed) {
  const max = jsonRetryLimit();
  let lastErr = /** @type {unknown} */ (undefined);
  for (let attempt = 1; attempt <= max; attempt++) {
    try {
      const raw = await complete(completeOpts);
      const parsed = extractJsonObject(raw);
      if (assertParsed) assertParsed(parsed);
      return parsed;
    } catch (e) {
      lastErr = e;
      const msg = e instanceof Error ? e.message : String(e);
      const parseOrShapeFailure =
        e instanceof SyntaxError ||
        /JSON|Unexpected token|position \d+|column \d+|No JSON object|after array element|after property value|Developer output must be JSON/i.test(
          msg
        );

      if (parseOrShapeFailure && attempt < max) {
        console.warn(`[generate] ${label}: invalid JSON/output (attempt ${attempt}/${max}), retrying — ${msg}`);
        continue;
      }

      if (parseOrShapeFailure && attempt === max) {
        console.error(`[generate] ${label}: invalid JSON/output after ${max} attempts`, lastErr);
        throw new ModelOutputError(
          `The model returned invalid JSON ${max} times (${label} stage). Try editing your prompt — shorter and clearer usually works — switch the visual preset, or tap Generate again.`
        );
      }

      throw e;
    }
  }
}

/**
 * @param {{ userPrompt: string, styleId?: string|null, uiLocale?: string|null, rootDir?: string }} opts
 * @returns {Promise<{ html: string, architecture: object, stylePreset: object }>}
 */
export async function generateLanding(opts) {
  const { userPrompt, styleId = null, uiLocale = null, rootDir = PACKAGE_ROOT } = opts;
  const trimmed = (userPrompt || "").trim();
  if (!trimmed) throw new Error("Prompt is empty");
  const locale = normalizeUiLocale(uiLocale ?? getDefaultUiLocale());

  const presets = await loadPresets(rootDir);
  const stylePreset = pickPreset(presets, styleId, trimmed);

  const architecture = await completeParsedJson(
    {
      system: architectSystem(),
      user: architectUser({ userPrompt: trimmed, stylePreset, uiLocale: locale }),
      maxTokens: 2048,
      temperature: 0.55,
      timeoutMs: 90_000,
    },
    "Architect"
  );

  const devParsed = await completeParsedJson(
    {
      system: developerSystem(),
      user: developerUser({ userPrompt: trimmed, architecture, uiLocale: locale }),
      maxTokens: 12000,
      temperature: 0.42,
      timeoutMs: 180_000,
    },
    "Developer",
    (parsed) => {
      if (
        typeof parsed !== "object" ||
        parsed === null ||
        typeof /** @type {{ html?: unknown }} */ (parsed).html !== "string" ||
        !/** @type {{ html: string }} */ (parsed).html.includes("<html")
      ) {
        throw new Error('Developer output must be JSON with string field "html" containing <html');
      }
    }
  );
  let { html } = /** @type {{ html: string }} */ (devParsed);
  html = applyBadgeToHtml(html);

  return { html, architecture, stylePreset };
}
