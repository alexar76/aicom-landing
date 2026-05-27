/**
 * Generator UI locale — separate from landing copy language rules in llm/prompt.js.
 *
 * Configure default UI language:
 *   AICOM_LANDING_UI_LOCALE=en   in .env (loaded by preview-server / cli; default en)
 *
 * Override per visit (preview UI only):
 *   http://127.0.0.1:3847/?lang=es
 */

/** @type {readonly string[]} */
export const SUPPORTED_UI_LOCALES = ["en", "ru", "es"];

const DEFAULT_UI_LOCALE = "en";

/** @type {Record<string, Record<string, string>>} */
export const UI_STRINGS = {
  en: {
    brandSub: "Architect → Developer · one HTML file",
    pillLocal: "local only",
    heroEyebrow: "Instant lab",
    heroTitle: "Ship a landing in one breath.",
    heroLead:
      "Describe the product. We generate a single self-contained page, preview it live, then bundle <code>index.html</code> into <code>landing.zip</code> — no admin, no sandbox runtime.",
    heroKeys:
      'LLM keys live in environment variables. Put a file named <code>.env</code> next to <code>package.json</code> (see <code>.env.example</code>), or export <code>ANTHROPIC_API_KEY</code>, <code>DEEPSEEK_API_KEY</code>, or <code>OPENAI_API_KEY</code> in your shell — then restart <code>npm run serve</code>. Part of <a href="https://magic-ai-factory.com/" target="_blank" rel="noopener noreferrer">AI-Factory</a>.',
    labelPrompt: "Prompt",
    promptPlaceholder:
      "e.g. SaaS landing for an AI task manager built for remote teams — calm, trustworthy, dark UI…",
    labelStyle: "Visual preset",
    styleAuto: "Auto — infer style from your prompt",
    btnGenerate: "Generate landing",
    btnDownload: "Download ZIP",
    btnDownloading: "Downloading…",
    btnOpenFullPage: "Open full page",
    previewTitle: "Live preview",
    previewNote:
      "Sandboxed iframe: scripts/forms run isolated from this UI (not the parent origin).",
    frameTitle: "Generated landing preview",
    errPrompt: "Please enter a prompt first.",
    errGenerateNetwork:
      "Connection lost before the server answered. Generation often takes 2–4 minutes — if you are on a hosted site, ask ops to raise nginx proxy_read_timeout to at least 600s, then try again.",
    errGenerateTimeout:
      "The gateway timed out while the model was still working. Raise proxy_read_timeout (nginx) to 600s or more, then try again.",
    errGenerateNoLlm:
      "No LLM API key on the server. Set DEEPSEEK_API_KEY in .env and restart the service.",
    errGenerateGeneric: "Generation failed. Tap Generate to try again.",
    statusBusy: "Synthesizing layout & copy…",
    statusBusyElapsed: "Still generating… {seconds}s (usually 1–4 min, do not close the tab)",
    statusReady: "Ready in {seconds}s · preset: {styleId}",
    statusZip: "ZIP downloaded — preview unchanged.",
    pageTitle: "aicom landing — instant page lab",
  },
  ru: {
    brandSub: "Architect → Developer · один HTML-файл",
    pillLocal: "только локально",
    heroEyebrow: "Мгновенная лаборатория",
    heroTitle: "Лендинг в одно дыхание.",
    heroLead:
      "Опишите продукт. Мы соберём одну самодостаточную страницу, покажем превью и упакуем <code>index.html</code> в <code>landing.zip</code> — без админки и sandbox.",
    heroKeys:
      'Ключи LLM — в переменных окружения. Файл <code>.env</code> рядом с <code>package.json</code> (см. <code>.env.example</code>) или export <code>ANTHROPIC_API_KEY</code> / <code>DEEPSEEK_API_KEY</code> / <code>OPENAI_API_KEY</code> — затем перезапустите <code>npm run serve</code>. Часть <a href="https://magic-ai-factory.com/" target="_blank" rel="noopener noreferrer">AI-Factory</a>.',
    labelPrompt: "Промпт",
    promptPlaceholder:
      "например: лендинг SaaS для AI-таскменеджера удалённых команд — спокойный, надёжный, тёмный UI…",
    labelStyle: "Визуальный пресет",
    styleAuto: "Авто — стиль из промпта",
    btnGenerate: "Сгенерировать лендинг",
    btnDownload: "Скачать ZIP",
    btnDownloading: "Скачиваем…",
    btnOpenFullPage: "Открыть на всю страницу",
    previewTitle: "Живое превью",
    previewNote:
      "Изолированный iframe sandbox: скрипты/формы отделены от этого интерфейса.",
    frameTitle: "Превью лендинга",
    errPrompt: "Сначала введите промпт.",
    errGenerateNetwork:
      "Соединение оборвалось до ответа сервера. Генерация часто длится 2–4 минуты — на хостинге поднимите nginx proxy_read_timeout минимум до 600 с и попробуйте снова.",
    errGenerateTimeout:
      "Шлюз оборвал запрос, пока модель ещё работала. Увеличьте proxy_read_timeout (nginx) до 600 с и повторите.",
    errGenerateNoLlm:
      "На сервере нет ключа LLM. Добавьте DEEPSEEK_API_KEY в .env и перезапустите сервис.",
    errGenerateGeneric: "Генерация не удалась. Нажмите «Сгенерировать» и попробуйте снова.",
    statusBusy: "Собираем структуру и тексты…",
    statusBusyElapsed: "Ещё генерируем… {seconds} с (обычно 1–4 мин, не закрывайте вкладку)",
    statusReady: "Готово за {seconds} с · пресет: {styleId}",
    statusZip: "ZIP скачан — превью без изменений.",
    pageTitle: "aicom landing — мгновенный лендинг",
  },
  es: {
    brandSub: "Architect → Developer · un archivo HTML",
    pillLocal: "solo local",
    heroEyebrow: "Laboratorio instantáneo",
    heroTitle: "Publica un landing de un solo aliento.",
    heroLead:
      "Describe el producto. Generamos una página autocontenida, la previsualizamos en vivo y empaquetamos <code>index.html</code> en <code>landing.zip</code> — sin panel de admin ni runtime sandbox.",
    heroKeys:
      'Las claves LLM van en variables de entorno. Crea un archivo <code>.env</code> junto a <code>package.json</code> (ver <code>.env.example</code>), o exporta <code>ANTHROPIC_API_KEY</code>, <code>DEEPSEEK_API_KEY</code> u <code>OPENAI_API_KEY</code> en tu shell — luego reinicia <code>npm run serve</code>. Parte de <a href="https://magic-ai-factory.com/" target="_blank" rel="noopener noreferrer">AI-Factory</a>.',
    labelPrompt: "Prompt",
    promptPlaceholder:
      "p. ej. landing SaaS para un gestor de tareas con IA para equipos remotos — UI oscura, calmada y confiable…",
    labelStyle: "Preset visual",
    styleAuto: "Auto — inferir estilo desde tu prompt",
    btnGenerate: "Generar landing",
    btnDownload: "Descargar ZIP",
    btnDownloading: "Descargando…",
    btnOpenFullPage: "Abrir página completa",
    previewTitle: "Vista previa en vivo",
    previewNote:
      "Iframe en sandbox: scripts/formularios aislados de esta página.",
    frameTitle: "Vista previa del landing generado",
    errPrompt: "Escribe un prompt primero.",
    errGenerateNetwork:
      "Se perdió la conexión antes de que el servidor respondiera. La generación suele tardar 2–4 min — en producción sube proxy_read_timeout de nginx a 600 s o más y vuelve a intentar.",
    errGenerateTimeout:
      "La pasarela cortó la petición mientras el modelo seguía trabajando. Sube proxy_read_timeout (nginx) a 600 s y reintenta.",
    errGenerateNoLlm:
      "No hay clave LLM en el servidor. Configura DEEPSEEK_API_KEY en .env y reinicia el servicio.",
    errGenerateGeneric: "La generación falló. Pulsa Generar para intentarlo de nuevo.",
    statusBusy: "Sintetizando diseño y textos…",
    statusBusyElapsed: "Sigue generando… {seconds} s (suele tardar 1–4 min, no cierres la pestaña)",
    statusReady: "Listo en {seconds} s · preset: {styleId}",
    statusZip: "ZIP descargado — la vista previa no cambió.",
    pageTitle: "aicom landing — laboratorio de páginas al instante",
  },
};

/**
 * @param {string} [raw]
 * @returns {string}
 */
export function normalizeUiLocale(raw) {
  const code = String(raw || "")
    .trim()
    .toLowerCase()
    .split(/[-_]/)[0];
  if (SUPPORTED_UI_LOCALES.includes(code)) return code;
  return DEFAULT_UI_LOCALE;
}

/** Server default from environment (after loadDotEnv). */
export function getDefaultUiLocale() {
  return normalizeUiLocale(process.env.AICOM_LANDING_UI_LOCALE || DEFAULT_UI_LOCALE);
}

/**
 * @param {string | null | undefined} queryLang ?lang=ru from URL
 * @returns {string}
 */
export function resolveUiLocale(queryLang) {
  if (queryLang != null && String(queryLang).trim()) {
    return normalizeUiLocale(queryLang);
  }
  return getDefaultUiLocale();
}

/**
 * @param {string} locale
 * @returns {Record<string, string>}
 */
export function getUiStrings(locale) {
  const code = normalizeUiLocale(locale);
  return UI_STRINGS[code] || UI_STRINGS[DEFAULT_UI_LOCALE];
}
