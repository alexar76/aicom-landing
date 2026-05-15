/**
 * LLM routing: Anthropic → DeepSeek (OpenAI-compatible) → OpenAI → Ollama.
 * Uses global fetch (Node 18+). No npm dependencies.
 */

function stripCodeFence(text) {
  const t = text.trim();
  const m = t.match(/^```(?:json)?\s*([\s\S]*?)```$/i);
  return m ? m[1].trim() : t;
}

export function extractJsonObject(text) {
  const cleaned = stripCodeFence(text);
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end <= start) throw new Error("No JSON object found in model output");
  return JSON.parse(cleaned.slice(start, end + 1));
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

async function anthropicComplete({ system, user, model, maxTokens, temperature, timeoutMs }) {
  const key = envKey("ANTHROPIC_API_KEY");
  if (!key) throw new Error("ANTHROPIC_API_KEY is missing or empty");
  const m = model || envKey("ANTHROPIC_MODEL") || "claude-3-5-sonnet-latest";
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs || 120_000);
  const target = "Anthropic api.anthropic.com";
  try {
    let res;
    try {
      res = await fetch("https://api.anthropic.com/v1/messages", {
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
      });
    } catch (e) {
      throw new Error(`${target}: ${describeFetchFailure(e, target)}`);
    }
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
    let res;
    try {
      res = await fetch(url, {
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
      });
    } catch (e) {
      throw new Error(`${target}: ${describeFetchFailure(e, target)}`);
    }
    if (!res.ok) {
      const err = await res.text();
      console.error(`[llm] ${cfg.name} HTTP ${res.status}`, err.slice(0, 8000));
      throw new Error(`${cfg.name} API error (HTTP ${res.status}).`);
    }
    const data = await res.json();
    return data.choices?.[0]?.message?.content ?? "";
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
    let res;
    try {
      res = await fetch(`${base}/api/chat`, {
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
      });
    } catch (e) {
      throw new Error(`${target}: ${describeFetchFailure(e, target)}`);
    }
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
    const msg = e instanceof Error ? e.message : String(e);
    if (hasA || hasD || hasO) throw e instanceof Error ? e : new Error(msg);

    const hint =
      `No ANTHROPIC_API_KEY, DEEPSEEK_API_KEY, or OPENAI_API_KEY — using Ollama only (${ollamaBase}). ` +
      `Set one cloud key in your environment (or .env next to package.json), or start Ollama and tune OLLAMA_HOST / OLLAMA_MODEL. ` +
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
