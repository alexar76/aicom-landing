/**
 * LLM routing: Anthropic → DeepSeek (OpenAI-compatible) → OpenAI → Ollama.
 * Uses global fetch (Node 18+). No npm dependencies.
 */

import { LlmConnectionError } from "../lib/generationErrors.mjs";

function stripCodeFence(text) {
  const t = text.trim();
  const m = t.match(/^```(?:json)?\s*([\s\S]*?)```$/i);
  return m ? m[1].trim() : t;
}

/** Drop reasoning blocks and prose before the JSON object (DeepSeek-R1 etc.). */
function normalizeModelText(text) {
  let t = String(text || "").trim();
  if (!t) return t;
  const thinkClose = "</" + "think" + ">";
  const thinkEnd = t.lastIndexOf(thinkClose);
  if (thinkEnd !== -1) {
    t = t.slice(thinkEnd + thinkClose.length).trim();
  }
  const brace = t.indexOf("{");
  if (brace > 0) {
    const before = t.slice(0, brace).trim();
    if (before.length < 500 && !/"[^"]+"\s*:/.test(before)) {
      t = t.slice(brace);
    }
  }
  return t;
}

/** @param {string} slice */
function parseJsonSlice(slice) {
  try {
    return JSON.parse(slice);
  } catch (first) {
    const fixed = slice.replace(/,\s*([}\]])/g, "$1");
    if (fixed !== slice) {
      try {
        return JSON.parse(fixed);
      } catch {
        /* fall through */
      }
    }
    throw first;
  }
}

export function extractJsonObject(text) {
  const cleaned = stripCodeFence(normalizeModelText(text));
  if (!cleaned) throw new Error("Model returned empty output");
  const start = cleaned.indexOf("{");
  if (start === -1) throw new Error("No JSON object found in model output");

  let depth = 0;
  let inString = false;
  let escape = false;
  let end = -1;
  for (let i = start; i < cleaned.length; i++) {
    const ch = cleaned[i];
    if (escape) { escape = false; continue; }
    if (ch === "\\" && inString) { escape = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === "{") depth++;
    else if (ch === "}") { depth--; if (depth === 0) { end = i; break; } }
  }
  if (end === -1) {
    if (depth > 0) {
      throw new Error("JSON object appears truncated in model output");
    }
    throw new Error("No JSON object found in model output");
  }
  return parseJsonSlice(cleaned.slice(start, end + 1));
}

/** Non-empty env string */
function envKey(name) {
  const v = process.env[name];
  return typeof v === "string" && v.trim() ? v.trim() : "";
}

/**
 * @param {unknown} err
 * @returns {{ code?: string, message: string }}
 */
function rootCause(err) {
  let e = err;
  let depth = 0;
  while (e && typeof e === "object" && "cause" in e && e.cause != null && depth < 8) {
    e = /** @type {{ cause?: unknown }} */ (e).cause;
    depth++;
  }
  const code =
    typeof e === "object" && e !== null && "code" in e && typeof e.code === "string"
      ? e.code
      : undefined;
  const message =
    typeof e === "object" && e !== null && "message" in e && typeof e.message === "string"
      ? e.message
      : err instanceof Error
        ? err.message
        : String(err);
  return { code, message };
}

/**
 * @param {unknown} err
 * @param {string} target — human label (host / provider)
 */
function describeFetchFailure(err, target) {
  const { code, message } = rootCause(err);
  const parts = [];
  if (code === "ECONNREFUSED") {
    parts.push(
      `connection refused (${target}) — nothing is listening on that host/port, or the URL is wrong`
    );
  } else if (code === "ENOTFOUND") {
    parts.push(`host not found (${target})`);
  } else if (code === "ETIMEDOUT" || code === "UND_ERR_CONNECT_TIMEOUT") {
    parts.push(`connection timed out (${target})`);
  } else if (code === "UND_ERR_SOCKET" || message.includes("other side closed")) {
    parts.push(
      `connection closed / unreachable (${target}) — service not running or reset the connection`
    );
  } else if (message.includes("fetch failed") || message === "Failed to fetch") {
    parts.push(`network unreachable, TLS, or proxy issue (${target})`);
    if (code) parts.push(`code: ${code}`);
  } else if (message.includes("aborted") || message.includes("AbortError")) {
    parts.push(`request aborted — likely client timeout (${target})`);
  } else {
    parts.push(message);
    if (code) parts.push(`[${code}]`);
  }
  return parts.join(" — ");
}

function fetchRetryLimit() {
  const n = Number(process.env.AICOM_LANDING_FETCH_RETRIES ?? 3);
  return Number.isFinite(n) ? Math.min(5, Math.max(1, Math.floor(n))) : 3;
}

function retryDelayMs(attempt) {
  return Math.min(8000, 400 * 2 ** (attempt - 1));
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** @param {number} status */
function isRetryableHttpStatus(status) {
  return status === 429 || status === 502 || status === 503 || status === 504;
}

/**
 * @param {unknown} err
 * @param {number} [httpStatus]
 */
export function isRetryableTransportFailure(err, httpStatus) {
  if (httpStatus != null && isRetryableHttpStatus(httpStatus)) return true;
  const { code, message } = rootCause(err);
  if (
    code === "ECONNRESET" ||
    code === "ECONNREFUSED" ||
    code === "ENOTFOUND" ||
    code === "ETIMEDOUT" ||
    code === "EAI_AGAIN" ||
    code === "UND_ERR_CONNECT_TIMEOUT" ||
    code === "UND_ERR_SOCKET"
  ) {
    return true;
  }
  if (message.includes("fetch failed") || message === "Failed to fetch") return true;
  if (message.includes("other side closed") || message.includes("socket hang up")) return true;
  if (message.includes("aborted") || message.includes("AbortError")) return true;
  return false;
}

/**
 * @param {string} url
 * @param {RequestInit} init
 * @param {{ target: string }} meta
 */
async function llmFetch(url, init, { target }) {
  const max = fetchRetryLimit();
  let lastErr = /** @type {unknown} */ (undefined);
  let lastStatus = /** @type {number | undefined} */ (undefined);

  for (let attempt = 1; attempt <= max; attempt++) {
    try {
      const res = await fetch(url, init);
      if (isRetryableHttpStatus(res.status)) {
        lastStatus = res.status;
        if (attempt < max) {
          console.warn(
            `[llm] ${target}: HTTP ${res.status} (attempt ${attempt}/${max}), retrying in ${retryDelayMs(attempt)}ms…`
          );
          await sleep(retryDelayMs(attempt));
          continue;
        }
        console.error(`[llm] ${target}: HTTP ${res.status} after ${max} attempts`);
        throw new LlmConnectionError(
          `The AI service was temporarily unavailable (${max} attempts). Wait a moment and tap Generate again.`
        );
      }
      return res;
    } catch (e) {
      lastErr = e;
      if (e instanceof LlmConnectionError) throw e;
      if (isRetryableTransportFailure(e) && attempt < max) {
        console.warn(
          `[llm] ${target}: ${describeFetchFailure(e, target)} (attempt ${attempt}/${max}), retrying in ${retryDelayMs(attempt)}ms…`
        );
        await sleep(retryDelayMs(attempt));
        continue;
      }
      console.error(`[llm] ${target}: transport failure`, e);
      if (isRetryableTransportFailure(e, lastStatus)) {
        throw new LlmConnectionError(
          `Could not reach the AI provider after ${max} attempts. Check your network and API keys, then tap Generate again.`
        );
      }
      throw new Error(`${target}: ${describeFetchFailure(e, target)}`);
    }
  }

  console.error(`[llm] ${target}: transport failure after ${max} attempts`, lastErr);
  throw new LlmConnectionError(
    `Could not reach the AI provider after ${max} attempts. Check your network and API keys, then tap Generate again.`
  );
}

async function anthropicComplete({ system, user, model, maxTokens, temperature, timeoutMs }) {
  const key = envKey("ANTHROPIC_API_KEY");
  if (!key) throw new Error("ANTHROPIC_API_KEY is missing or empty");
  const m = model || envKey("ANTHROPIC_MODEL") || "claude-sonnet-4-6";
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs || 120_000);
  const target = "Anthropic api.anthropic.com";
  try {
    const res = await llmFetch(
      "https://api.anthropic.com/v1/messages",
      {
        method: "POST",
        signal: controller.signal,
        headers: {
          "content-type": "application/json",
          "x-api-key": key,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: m,
          max_tokens: maxTokens ?? 4096,
          temperature: temperature ?? 0.65,
          system: system || undefined,
          messages: [{ role: "user", content: user }],
        }),
      },
      { target }
    );
    if (!res.ok) {
      const err = await res.text();
      console.error(`[llm] Anthropic HTTP ${res.status}`, err.slice(0, 8000));
      throw new Error(`Anthropic API error (HTTP ${res.status}).`);
    }
    const data = await res.json();
    const block = (data.content || []).find((c) => c.type === "text");
    return block?.text ?? "";
  } finally {
    clearTimeout(id);
  }
}

/**
 * OpenAI-compatible Chat Completions (OpenAI, DeepSeek, Groq, etc.).
 * @param {{ system?: string, user: string, model?: string, maxTokens?: number, temperature?: number, timeoutMs?: number }} opts
 * @param {{ apiKey: string, baseUrl: string, defaultModel: string, modelEnv: string, name: string }} cfg
 */
async function openaiCompatibleComplete(opts, cfg) {
  const key = cfg.apiKey;
  if (!key) throw new Error(`${cfg.name}: API key is missing`);
  const base = cfg.baseUrl.replace(/\/$/, "");
  const m = opts.model || envKey(cfg.modelEnv) || cfg.defaultModel;
  const tOut = opts.timeoutMs ?? 120_000;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), tOut);
  const target = `${cfg.name} ${base}`;
  const url = `${base}/chat/completions`;
  try {
    const res = await llmFetch(
      url,
      {
        method: "POST",
        signal: controller.signal,
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${key}`,
        },
        body: JSON.stringify({
          model: m,
          max_tokens: opts.maxTokens ?? 4096,
          temperature: opts.temperature ?? 0.65,
          messages: [
            ...(opts.system ? [{ role: "system", content: opts.system }] : []),
            { role: "user", content: opts.user },
          ],
        }),
      },
      { target }
    );
    if (!res.ok) {
      const err = await res.text();
      console.error(`[llm] ${cfg.name} HTTP ${res.status}`, err.slice(0, 8000));
      throw new Error(`${cfg.name} API error (HTTP ${res.status}).`);
    }
    const data = await res.json();
    const choice = data.choices?.[0];
    const content = choice?.message?.content ?? "";
    const finish = choice?.finish_reason;
    if (finish === "length") {
      console.warn(
        `[llm] ${cfg.name} response truncated (finish_reason=length, ${content.length} chars)`
      );
    }
    if (!String(content).trim()) {
      throw new Error(`${cfg.name} returned empty content`);
    }
    return content;
  } finally {
    clearTimeout(id);
  }
}

async function deepseekComplete(opts) {
  const key = envKey("DEEPSEEK_API_KEY");
  if (!key) throw new Error("DEEPSEEK_API_KEY is missing or empty");
  const base = envKey("DEEPSEEK_BASE_URL") || "https://api.deepseek.com/v1";
  return openaiCompatibleComplete(opts, {
    apiKey: key,
    baseUrl: base,
    defaultModel: "deepseek-chat",
    modelEnv: "DEEPSEEK_MODEL",
    name: "DeepSeek",
  });
}

async function openaiComplete(opts) {
  const key = envKey("OPENAI_API_KEY");
  if (!key) throw new Error("OPENAI_API_KEY is missing or empty");
  const base = envKey("OPENAI_BASE_URL") || "https://api.openai.com/v1";
  return openaiCompatibleComplete(opts, {
    apiKey: key,
    baseUrl: base,
    defaultModel: "gpt-4o-mini",
    modelEnv: "OPENAI_MODEL",
    name: "OpenAI",
  });
}

async function ollamaComplete({ system, user, model, maxTokens, temperature, timeoutMs }) {
  const base = (process.env.OLLAMA_HOST || "http://127.0.0.1:11434").replace(/\/$/, "");
  const m = model || envKey("OLLAMA_MODEL") || "llama3.2";
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs || 180_000);
  const target = `Ollama ${base}`;
  try {
    const res = await llmFetch(
      `${base}/api/chat`,
      {
        method: "POST",
        signal: controller.signal,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          model: m,
          stream: false,
          options: { temperature: temperature ?? 0.65, num_predict: maxTokens ?? 4096 },
          messages: [
            ...(system ? [{ role: "system", content: system }] : []),
            { role: "user", content: user },
          ],
        }),
      },
      { target }
    );
    if (!res.ok) {
      const err = await res.text();
      console.error(`[llm] Ollama HTTP ${res.status}`, err.slice(0, 8000));
      throw new Error(`Ollama API error (HTTP ${res.status}).`);
    }
    const data = await res.json();
    return data.message?.content ?? "";
  } finally {
    clearTimeout(id);
  }
}

/**
 * @param {{ system?: string, user: string, model?: string, maxTokens?: number, temperature?: number, timeoutMs?: number }} opts
 */
export async function complete(opts) {
  const hasA = !!envKey("ANTHROPIC_API_KEY");
  const hasD = !!envKey("DEEPSEEK_API_KEY");
  const hasO = !!envKey("OPENAI_API_KEY");
  const ollamaBase = (process.env.OLLAMA_HOST || "http://127.0.0.1:11434").replace(/\/$/, "");

  try {
    if (hasA) return await anthropicComplete(opts);
    if (hasD) return await deepseekComplete(opts);
    if (hasO) return await openaiComplete(opts);
    return await ollamaComplete(opts);
  } catch (e) {
    if (e instanceof LlmConnectionError) throw e;
    const msg = e instanceof Error ? e.message : String(e);
    if (hasA || hasD || hasO) throw e instanceof Error ? e : new Error(msg);

    const hint =
      `No ANTHROPIC_API_KEY, DEEPSEEK_API_KEY, or OPENAI_API_KEY — using Ollama only (${ollamaBase}). ` +
      `Set one cloud key in your environment (or a .env file next to package.json), or start Ollama and tune OLLAMA_HOST / OLLAMA_MODEL. ` +
      `For DeepSeek, use DEEPSEEK_API_KEY (not OPENAI_API_KEY) unless you also set OPENAI_BASE_URL to a DeepSeek-compatible endpoint. `;
    throw new Error(hint + msg);
  }
}

export function detectProviderLabel() {
  if (envKey("ANTHROPIC_API_KEY")) return "anthropic";
  if (envKey("DEEPSEEK_API_KEY")) return "deepseek";
  if (envKey("OPENAI_API_KEY")) return "openai";
  return "ollama";
}
