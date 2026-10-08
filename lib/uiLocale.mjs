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
export const SUPPORTED_UI_LOCALES = ["en", "ru", "es", "fr", "zh"];

const DEFAULT_UI_LOCALE = "en";

/** @type {Record<string, Record<string, string>>} */
export const UI_STRINGS = {
  en: {
    brandSub: "Architect → Developer · one HTML file",
    pillLocal: "local only",
    pillLive: "Live",
    heroEyebrow: "Instant lab",
    heroTitle: "Ship a landing in one breath.",
    heroLead:
      "Describe the product. We generate a single self-contained page, preview it live, then bundle <code>index.html</code> into <code>landing.zip</code> — no admin, no sandbox runtime.",
    heroKeys:
      'LLM keys live in environment variables. Put a file named <code>.env</code> next to <code>package.json</code> (see <code>.env.example</code>), or export <code>ANTHROPIC_API_KEY</code>, <code>DEEPSEEK_API_KEY</code>, or <code>OPENAI_API_KEY</code> in your shell — then restart <code>npm run serve</code>. Part of <a href="https://magic-ai-factory.com/" target="_blank" rel="noopener noreferrer">AI-Factory</a>.',
    heroKeysPublic:
      'Landing generation uses real LLM calls on the server. API keys stay in the host <code>.env</code> — never in the browser. Part of <a href="https://magic-ai-factory.com/" target="_blank" rel="noopener noreferrer">AI-Factory</a>.',
    labelPrompt: "Prompt",
    promptPlaceholder:
      "e.g. SaaS landing for an AI task manager built for remote teams — calm, trustworthy, dark UI…",
    labelStyle: "Visual preset",
    styleAuto: "Auto — infer style from your prompt",
    labelAgentMode: "Agent-To-Website",
    hintAgentMode: "Embed a working AI chat agent on the page (demo replies, product-aware).",
    hintAgentModePublic:
      "Add an on-page assistant on the generated page (browser-side replies; page generation still uses the server LLM).",
    btnGenerate: "Generate landing",
    btnDownload: "Download ZIP",
    btnDownloading: "Downloading…",
    btnOpenFullPage: "Open full page",
    previewTitle: "Live preview",
    previewNote:
      "Sandboxed iframe: scripts/forms run isolated from this UI (not the parent origin).",
    previewOwnKeyBadge:
      "<strong>Bring your own LLM key.</strong> Architect → Developer agents call <code>DEEPSEEK_API_KEY</code> (or another provider) from <strong>your</strong> server <code>.env</code> — this public page does not run generation without it. <a href=\"https://github.com/alexar76/aicom-landing#quick-start\" target=\"_blank\" rel=\"noopener noreferrer\">Self-host</a>.",
    frameTitle: "Generated landing preview",
    errPrompt: "Please enter a prompt first.",
    errGenerateNetwork:
      "Connection lost before the server answered. Generation often takes 2–4 minutes — if you are on a hosted site, ask ops to raise nginx proxy_read_timeout to at least 600s, then try again.",
    errGenerateTimeout:
      "The gateway timed out while the model was still working. Raise proxy_read_timeout (nginx) to 600s or more, then try again.",
    errGenerateNoLlm:
      "No LLM API key on the server. Add DEEPSEEK_API_KEY to your self-hosted .env and restart — see badge in Preview.",
    errGenerateAuthKey:
      "LLM API key rejected. Update DEEPSEEK_API_KEY in .env on the server and restart the service.",
    errGenerateGeneric: "Generation failed. Tap Generate to try again.",
    statusBusy: "Synthesizing layout & copy…",
    statusBusyElapsed: "Still generating… {seconds}s (usually 1–4 min, do not close the tab)",
    statusReady: "Ready in {seconds}s · preset: {styleId}",
    statusReadyAgent: "Ready in {seconds}s · preset: {styleId} · Agent-To-Website on",
    statusZip: "ZIP downloaded — preview unchanged.",
    pageTitle: "aicom landing — instant page lab",
  },
  ru: {
    brandSub: "Architect → Developer · один HTML-файл",
    pillLocal: "только локально",
    pillLive: "Live",
    heroEyebrow: "Мгновенная лаборатория",
    heroTitle: "Лендинг в одно дыхание.",
    heroLead:
      "Опишите продукт. Мы соберём одну самодостаточную страницу, покажем превью и упакуем <code>index.html</code> в <code>landing.zip</code> — без админки и sandbox.",
    heroKeys:
      'Ключи LLM — в переменных окружения. Файл <code>.env</code> рядом с <code>package.json</code> (см. <code>.env.example</code>) или export <code>ANTHROPIC_API_KEY</code> / <code>DEEPSEEK_API_KEY</code> / <code>OPENAI_API_KEY</code> — затем перезапустите <code>npm run serve</code>. Часть <a href="https://magic-ai-factory.com/" target="_blank" rel="noopener noreferrer">AI-Factory</a>.',
    heroKeysPublic:
      'Генерация — реальные вызовы LLM на сервере. Ключи только в <code>.env</code> на хосте, не в браузере. Часть <a href="https://magic-ai-factory.com/" target="_blank" rel="noopener noreferrer">AI-Factory</a>.',
    labelPrompt: "Промпт",
    promptPlaceholder:
      "например: лендинг SaaS для AI-таскменеджера удалённых команд — спокойный, надёжный, тёмный UI…",
    labelStyle: "Визуальный пресет",
    styleAuto: "Авто — стиль из промпта",
    labelAgentMode: "Agent-To-Website",
    hintAgentMode: "Встроить на страницу AI-чат (демо-ответы по продукту).",
    hintAgentModePublic:
      "Ассистент на сгенерированной странице (ответы в браузере; сам лендинг строит серверный LLM).",
    btnGenerate: "Сгенерировать лендинг",
    btnDownload: "Скачать ZIP",
    btnDownloading: "Скачиваем…",
    btnOpenFullPage: "Открыть на всю страницу",
    previewTitle: "Живое превью",
    previewNote:
      "Изолированный iframe sandbox: скрипты/формы отделены от этого интерфейса.",
    previewOwnKeyBadge:
      "<strong>Свой ключ LLM.</strong> Агенты Architect → Developer берут <code>DEEPSEEK_API_KEY</code> (или другой провайдер) из <strong>вашего</strong> <code>.env</code> на сервере — на этой публичной странице без ключа генерация не запускается. <a href=\"https://github.com/alexar76/aicom-landing#quick-start\" target=\"_blank\" rel=\"noopener noreferrer\">Self-host</a>.",
    frameTitle: "Превью лендинга",
    errPrompt: "Сначала введите промпт.",
    errGenerateNetwork:
      "Соединение оборвалось до ответа сервера. Генерация часто длится 2–4 минуты — на хостинге поднимите nginx proxy_read_timeout минимум до 600 с и попробуйте снова.",
    errGenerateTimeout:
      "Шлюз оборвал запрос, пока модель ещё работала. Увеличьте proxy_read_timeout (nginx) до 600 с и повторите.",
    errGenerateNoLlm:
      "На сервере нет ключа LLM. Добавьте DEEPSEEK_API_KEY в свой .env и перезапустите — см. бейдж в превью.",
    errGenerateAuthKey:
      "Ключ LLM отклонён. Обновите DEEPSEEK_API_KEY в .env на сервере и перезапустите сервис.",
    errGenerateGeneric: "Генерация не удалась. Нажмите «Сгенерировать» и попробуйте снова.",
    statusBusy: "Собираем структуру и тексты…",
    statusBusyElapsed: "Ещё генерируем… {seconds} с (обычно 1–4 мин, не закрывайте вкладку)",
    statusReady: "Готово за {seconds} с · пресет: {styleId}",
    statusReadyAgent: "Готово за {seconds} с · пресет: {styleId} · Agent-To-Website",
    statusZip: "ZIP скачан — превью без изменений.",
    pageTitle: "aicom landing — мгновенный лендинг",
  },
  es: {
    brandSub: "Architect → Developer · un archivo HTML",
    pillLocal: "solo local",
    pillLive: "Live",
    heroEyebrow: "Laboratorio instantáneo",
    heroTitle: "Publica un landing de un solo aliento.",
    heroLead:
      "Describe el producto. Generamos una página autocontenida, la previsualizamos en vivo y empaquetamos <code>index.html</code> en <code>landing.zip</code> — sin panel de admin ni runtime sandbox.",
    heroKeys:
      'Las claves LLM van en variables de entorno. Crea un archivo <code>.env</code> junto a <code>package.json</code> (ver <code>.env.example</code>), o exporta <code>ANTHROPIC_API_KEY</code>, <code>DEEPSEEK_API_KEY</code> u <code>OPENAI_API_KEY</code> en tu shell — luego reinicia <code>npm run serve</code>. Parte de <a href="https://magic-ai-factory.com/" target="_blank" rel="noopener noreferrer">AI-Factory</a>.',
    heroKeysPublic:
      'La generación usa LLM reales en el servidor. Las claves viven en <code>.env</code> del host, no en el navegador. Parte de <a href="https://magic-ai-factory.com/" target="_blank" rel="noopener noreferrer">AI-Factory</a>.',
    labelPrompt: "Prompt",
    promptPlaceholder:
      "p. ej. landing SaaS para un gestor de tareas con IA para equipos remotos — UI oscura, calmada y confiable…",
    labelStyle: "Preset visual",
    styleAuto: "Auto — inferir estilo desde tu prompt",
    labelAgentMode: "Agent-To-Website",
    hintAgentMode: "Incrustar un chat IA funcional en la página (respuestas demo).",
    hintAgentModePublic:
      "Asistente en la página generada (respuestas en el navegador; la generación del landing usa el LLM del servidor).",
    btnGenerate: "Generar landing",
    btnDownload: "Descargar ZIP",
    btnDownloading: "Descargando…",
    btnOpenFullPage: "Abrir página completa",
    previewTitle: "Vista previa en vivo",
    previewNote:
      "Iframe en sandbox: scripts/formularios aislados de esta página.",
    previewOwnKeyBadge:
      "<strong>Tu propia clave LLM.</strong> Los agentes Architect → Developer usan <code>DEEPSEEK_API_KEY</code> (u otro proveedor) en <strong>tu</strong> <code>.env</code> del servidor — esta página pública no genera sin clave. <a href=\"https://github.com/alexar76/aicom-landing#quick-start\" target=\"_blank\" rel=\"noopener noreferrer\">Self-host</a>.",
    frameTitle: "Vista previa del landing generado",
    errPrompt: "Escribe un prompt primero.",
    errGenerateNetwork:
      "Se perdió la conexión antes de que el servidor respondiera. La generación suele tardar 2–4 min — en producción sube proxy_read_timeout de nginx a 600 s o más y vuelve a intentar.",
    errGenerateTimeout:
      "La pasarela cortó la petición mientras el modelo seguía trabajando. Sube proxy_read_timeout (nginx) a 600 s y reintenta.",
    errGenerateNoLlm:
      "No hay clave LLM en el servidor. Añade DEEPSEEK_API_KEY en tu .env self-hosted y reinicia — ver badge en la vista previa.",
    errGenerateAuthKey:
      "Clave LLM rechazada. Actualiza DEEPSEEK_API_KEY en .env del servidor y reinicia el servicio.",
    errGenerateGeneric: "La generación falló. Pulsa Generar para intentarlo de nuevo.",
    statusBusy: "Sintetizando diseño y textos…",
    statusBusyElapsed: "Sigue generando… {seconds} s (suele tardar 1–4 min, no cierres la pestaña)",
    statusReady: "Listo en {seconds} s · preset: {styleId}",
    statusReadyAgent: "Listo en {seconds} s · preset: {styleId} · Agent-To-Website",
    statusZip: "ZIP descargado — la vista previa no cambió.",
    pageTitle: "aicom landing — laboratorio de páginas al instante",
  },
  fr: {
    brandSub: "Architect → Developer · un seul fichier HTML",
    pillLocal: "local uniquement",
    pillLive: "Live",
    heroEyebrow: "Labo instantané",
    heroTitle: "Publiez une landing d'un seul souffle.",
    heroLead:
      "Décrivez le produit. Nous générons une page autonome unique, l'affichons en aperçu en direct, puis empaquetons <code>index.html</code> dans <code>landing.zip</code> — sans admin ni runtime sandbox.",
    heroKeys:
      'Les clés LLM vivent dans des variables d\'environnement. Placez un fichier <code>.env</code> à côté de <code>package.json</code> (voir <code>.env.example</code>), ou exportez <code>ANTHROPIC_API_KEY</code>, <code>DEEPSEEK_API_KEY</code> ou <code>OPENAI_API_KEY</code> dans votre shell — puis relancez <code>npm run serve</code>. Fait partie d\'<a href="https://magic-ai-factory.com/" target="_blank" rel="noopener noreferrer">AI-Factory</a>.',
    heroKeysPublic:
      'La génération effectue de vrais appels LLM sur le serveur. Les clés restent dans le <code>.env</code> de l\'hôte — jamais dans le navigateur. Fait partie d\'<a href="https://magic-ai-factory.com/" target="_blank" rel="noopener noreferrer">AI-Factory</a>.',
    labelPrompt: "Prompt",
    promptPlaceholder:
      "ex. landing SaaS pour un gestionnaire de tâches IA destiné aux équipes distantes — UI sombre, calme et fiable…",
    labelStyle: "Préréglage visuel",
    styleAuto: "Auto — déduire le style depuis votre prompt",
    labelAgentMode: "Agent-To-Website",
    hintAgentMode: "Intégrer un chat IA fonctionnel sur la page (réponses démo, orientées produit).",
    hintAgentModePublic:
      "Ajouter un assistant sur la page générée (réponses côté navigateur ; la génération de la page utilise toujours le LLM du serveur).",
    btnGenerate: "Générer la landing",
    btnDownload: "Télécharger le ZIP",
    btnDownloading: "Téléchargement…",
    btnOpenFullPage: "Ouvrir en pleine page",
    previewTitle: "Aperçu en direct",
    previewNote:
      "Iframe en sandbox : scripts/formulaires isolés de cette interface (pas de l'origine parente).",
    previewOwnKeyBadge:
      "<strong>Votre propre clé LLM.</strong> Les agents Architect → Developer utilisent <code>DEEPSEEK_API_KEY</code> (ou un autre fournisseur) depuis <strong>votre</strong> <code>.env</code> serveur — cette page publique ne génère rien sans clé. <a href=\"https://github.com/alexar76/aicom-landing#quick-start\" target=\"_blank\" rel=\"noopener noreferrer\">Self-host</a>.",
    frameTitle: "Aperçu de la landing générée",
    errPrompt: "Saisissez d'abord un prompt.",
    errGenerateNetwork:
      "Connexion perdue avant la réponse du serveur. La génération prend souvent 2–4 minutes — sur un site hébergé, demandez aux ops d'augmenter proxy_read_timeout de nginx à au moins 600 s, puis réessayez.",
    errGenerateTimeout:
      "La passerelle a expiré alors que le modèle travaillait encore. Augmentez proxy_read_timeout (nginx) à 600 s ou plus, puis réessayez.",
    errGenerateNoLlm:
      "Aucune clé API LLM sur le serveur. Ajoutez DEEPSEEK_API_KEY à votre .env auto-hébergé et redémarrez — voir le badge dans l'aperçu.",
    errGenerateAuthKey:
      "Clé API LLM rejetée. Mettez à jour DEEPSEEK_API_KEY dans le .env du serveur et redémarrez le service.",
    errGenerateGeneric: "La génération a échoué. Appuyez sur Générer pour réessayer.",
    statusBusy: "Synthèse de la mise en page et des textes…",
    statusBusyElapsed: "Génération en cours… {seconds} s (généralement 1–4 min, ne fermez pas l'onglet)",
    statusReady: "Prêt en {seconds} s · préréglage : {styleId}",
    statusReadyAgent: "Prêt en {seconds} s · préréglage : {styleId} · Agent-To-Website activé",
    statusZip: "ZIP téléchargé — aperçu inchangé.",
    pageTitle: "aicom landing — labo de pages instantané",
  },
  zh: {
    brandSub: "Architect → Developer · 单个 HTML 文件",
    pillLocal: "仅本地",
    pillLive: "Live",
    heroEyebrow: "即时工坊",
    heroTitle: "一口气发布一个着陆页。",
    heroLead:
      "描述你的产品。我们生成一个自包含的页面，实时预览，然后把 <code>index.html</code> 打包成 <code>landing.zip</code> — 无需后台管理，无需 sandbox 运行时。",
    heroKeys:
      'LLM 密钥保存在环境变量中。在 <code>package.json</code> 旁放置一个名为 <code>.env</code> 的文件（参见 <code>.env.example</code>），或在 shell 中导出 <code>ANTHROPIC_API_KEY</code>、<code>DEEPSEEK_API_KEY</code> 或 <code>OPENAI_API_KEY</code> — 然后重启 <code>npm run serve</code>。属于 <a href="https://magic-ai-factory.com/" target="_blank" rel="noopener noreferrer">AI-Factory</a> 的一部分。',
    heroKeysPublic:
      '页面生成会在服务器上进行真实的 LLM 调用。密钥保存在主机的 <code>.env</code> 中 — 绝不会出现在浏览器里。属于 <a href="https://magic-ai-factory.com/" target="_blank" rel="noopener noreferrer">AI-Factory</a> 的一部分。',
    labelPrompt: "提示词",
    promptPlaceholder:
      "例如：面向远程团队的 AI 任务管理器 SaaS 着陆页 — 深色、沉稳、可信赖的 UI…",
    labelStyle: "视觉预设",
    styleAuto: "自动 — 根据你的提示词推断风格",
    labelAgentMode: "Agent-To-Website",
    hintAgentMode: "在页面上嵌入一个可用的 AI 聊天智能体（演示回复，了解产品）。",
    hintAgentModePublic:
      "在生成的页面上添加一个助手（浏览器端回复；页面生成仍使用服务器的 LLM）。",
    btnGenerate: "生成着陆页",
    btnDownload: "下载 ZIP",
    btnDownloading: "下载中…",
    btnOpenFullPage: "打开完整页面",
    previewTitle: "实时预览",
    previewNote:
      "沙箱化 iframe：脚本/表单与此界面隔离运行（不属于父源）。",
    previewOwnKeyBadge:
      "<strong>自带 LLM 密钥。</strong> Architect → Developer 智能体会从<strong>你</strong>服务器的 <code>.env</code> 中调用 <code>DEEPSEEK_API_KEY</code>（或其他提供方）— 没有密钥时此公开页面不会运行生成。<a href=\"https://github.com/alexar76/aicom-landing#quick-start\" target=\"_blank\" rel=\"noopener noreferrer\">Self-host</a>。",
    frameTitle: "生成的着陆页预览",
    errPrompt: "请先输入提示词。",
    errGenerateNetwork:
      "服务器响应前连接已中断。生成通常需要 2–4 分钟 — 如果你在托管站点上，请让运维把 nginx 的 proxy_read_timeout 调高到至少 600 秒，然后重试。",
    errGenerateTimeout:
      "模型仍在工作时网关已超时。请把 proxy_read_timeout（nginx）调高到 600 秒或更多，然后重试。",
    errGenerateNoLlm:
      "服务器上没有 LLM API 密钥。请在你的自托管 .env 中添加 DEEPSEEK_API_KEY 并重启 — 参见预览中的徽标。",
    errGenerateAuthKey:
      "LLM API 密钥被拒绝。请在服务器的 .env 中更新 DEEPSEEK_API_KEY 并重启服务。",
    errGenerateGeneric: "生成失败。点击“生成”重试。",
    statusBusy: "正在合成布局与文案…",
    statusBusyElapsed: "仍在生成… {seconds} 秒（通常 1–4 分钟，请勿关闭标签页）",
    statusReady: "{seconds} 秒内完成 · 预设：{styleId}",
    statusReadyAgent: "{seconds} 秒内完成 · 预设：{styleId} · Agent-To-Website 已开启",
    statusZip: "ZIP 已下载 — 预览未改变。",
    pageTitle: "aicom landing — 即时页面工坊",
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
 * @param {{ publicUi?: boolean }} [opts]
 * @returns {Record<string, string>}
 */
export function getUiStrings(locale, opts = {}) {
  const code = normalizeUiLocale(locale);
  const base = { ...(UI_STRINGS[code] || UI_STRINGS[DEFAULT_UI_LOCALE]) };
  if (!opts.publicUi) return base;
  base.pillLocal = base.pillLive || "Live";
  base.heroKeys = base.heroKeysPublic || base.heroKeys;
  base.hintAgentMode = base.hintAgentModePublic || base.hintAgentMode;
  return base;
}
