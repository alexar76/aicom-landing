import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { complete, extractJsonObject } from "../llm/provider.js";
import { architectSystem, architectUser, developerSystem, developerUser } from "../llm/prompt.js";
import { applyBadgeToHtml } from "./badgeConfig.mjs";
import { repairBrokenExternalImages } from "./repairExternalImages.mjs";
import { getDefaultUiLocale, normalizeUiLocale } from "./uiLocale.mjs";
import {
  LlmConnectionError,
  ModelOutputError,
  UserFacingGenerationError,
} from "./generationErrors.mjs";
import { strengthenHeroBackground } from "./strengthenHero.mjs";

export { ModelOutputError, LlmConnectionError, UserFacingGenerationError } from "./generationErrors.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
export const PACKAGE_ROOT = join(__dirname, "..");

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

/** @param {unknown} err */
function isModelJsonParseError(err) {
  if (err instanceof SyntaxError) return true;
  const msg = err instanceof Error ? err.message : String(err);
  return (
    /^No JSON object found in model output/.test(msg) ||
    /Unexpected token.*(in JSON|JSON)/i.test(msg) ||
    /(position|column) \d+/.test(msg) ||
    /after (array element|property value)/i.test(msg) ||
    /Developer output must be JSON/.test(msg)
  );
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
      if (e instanceof UserFacingGenerationError) throw e;
      const msg = e instanceof Error ? e.message : String(e);
      const parseOrShapeFailure = isModelJsonParseError(e);

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

/** @param {unknown} err */
function toUserFacingGenerateError(err) {
  if (err instanceof UserFacingGenerationError) return err;
  const msg = err instanceof Error ? err.message : String(err);
  if (
    /API key is missing|DEEPSEEK_API_KEY is missing|OPENAI_API_KEY is missing|ANTHROPIC_API_KEY is missing|No ANTHROPIC_API_KEY/i.test(
      msg
    )
  ) {
    return new UserFacingGenerationError(
      "No LLM API key on the server. Set DEEPSEEK_API_KEY (or another provider) in .env and restart the service."
    );
  }
  if (err instanceof LlmConnectionError) return err;
  return err instanceof Error ? err : new Error(msg);
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

  try {
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
    html = await repairBrokenExternalImages(html);
    html = strengthenHeroBackground(html);
    html = applyBadgeToHtml(html);

    return { html, architecture, stylePreset };
  } catch (e) {
    throw toUserFacingGenerateError(e);
  }
}
