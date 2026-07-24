/**
 * Agent-To-Website: ensure generated landings include a working embedded chat widget.
 */

/** @param {string} html */
export function hasAgentWidget(html) {
  return /id=["']aicom-agent["']|class=["'][^"']*aicom-agent\b/i.test(html);
}

/**
 * @param {string} locale
 */
function widgetCopy(locale) {
  const code = (locale || "en").split(/[-_]/)[0];
  if (code === "ru") {
    return {
      fab: "Спросить AI-агента",
      title: "AI-ассистент",
      subtitle: "Ответы по этому продукту",
      placeholder: "Опишите задачу или задайте вопрос…",
      send: "Отправить",
      close: "Закрыть",
      typing: "Печатает…",
      opener:
        "Привет! Я AI-агент на этом лендинге. Расскажу про предложение, помогу с выбором тарифа или следующим шагом.",
      fallback:
        "Спасибо за вопрос. Я демо-агент на лендинге: опишите задачу подробнее, или нажмите «Связаться» / CTA на странице — команда ответит быстрее.",
    };
  }
  if (code === "es") {
    return {
      fab: "Preguntar al agente IA",
      title: "Asistente IA",
      subtitle: "Respuestas sobre este producto",
      placeholder: "Describe tu tarea o pregunta…",
      send: "Enviar",
      close: "Cerrar",
      typing: "Escribiendo…",
      opener:
        "¡Hola! Soy el agente IA de esta landing. Te explico la propuesta, precios y el siguiente paso.",
      fallback:
        "Gracias por tu mensaje. Soy un agente demo en la página: cuéntame más, o usa el CTA principal para hablar con el equipo.",
    };
  }
  if (code === "fr") {
    return {
      fab: "Demander à l'agent IA",
      title: "Assistant IA",
      subtitle: "Réponses sur ce produit",
      placeholder: "Décrivez votre besoin ou posez une question…",
      send: "Envoyer",
      close: "Fermer",
      typing: "En train d'écrire…",
      opener:
        "Bonjour ! Je suis l'agent IA de cette landing. Je peux expliquer l'offre, les tarifs et la prochaine étape.",
      fallback:
        "Merci pour votre message. Je suis un agent démo sur cette page : donnez un peu plus de détails, ou utilisez le CTA principal pour contacter l'équipe.",
    };
  }
  if (code === "zh") {
    return {
      fab: "向 AI 智能体提问",
      title: "AI 助手",
      subtitle: "关于本产品的解答",
      placeholder: "描述你的任务或提出问题…",
      send: "发送",
      close: "关闭",
      typing: "正在输入…",
      opener:
        "你好！我是这个着陆页上的 AI 智能体。我可以介绍这项服务、定价以及下一步该做什么。",
      fallback:
        "感谢你的留言。我是本页面上的演示智能体：请再补充一些细节，或使用主 CTA 联系团队。",
    };
  }
  return {
    fab: "Ask AI agent",
    title: "AI assistant",
    subtitle: "Answers about this offer",
    placeholder: "Describe your task or ask a question…",
    send: "Send",
    close: "Close",
    typing: "Typing…",
    opener:
      "Hi! I'm the embedded AI agent on this landing. I can explain the offer, pricing, and what to do next.",
    fallback:
      "Thanks for your message. I'm a demo agent on this page — add a bit more detail, or use the main CTA to reach the team.",
  };
}

/**
 * @param {string} userPrompt
 * @param {string} locale
 */
function demoReply(userPrompt, locale, text) {
  const t = (text || "").toLowerCase();
  const brief = (userPrompt || "").slice(0, 400);
  const ru = (locale || "en").startsWith("ru");
  const es = (locale || "en").startsWith("es");
  const fr = (locale || "en").startsWith("fr");
  const zh = (locale || "en").startsWith("zh");

  if (/price|pricing|plan|тариф|цена|precio|cost|tarif|prix|价格|定价|套餐/.test(t)) {
    if (ru) return "Тарифы на странице выше — могу подсказать, с какого плана начать под вашу задачу. Что важнее: объём, скорость или поддержка?";
    if (es) return "Los planes están en la sección de precios. ¿Qué priorizas: volumen, velocidad o soporte?";
    if (fr) return "Les tarifs sont dans la section ci-dessus — dites-moi votre priorité (volume, vitesse ou support) et je vous suggère un plan de départ.";
    if (zh) return "定价在上方的部分 — 告诉我你的优先项（用量、速度还是支持），我来推荐一个起步方案。";
    return "Pricing is in the section above — tell me your priority (volume, speed, or support) and I'll suggest a starting plan.";
  }
  if (/demo|trial|start|начать|попроб|prueba|comenzar|démo|essai|commencer|演示|试用|开始/.test(t)) {
    if (ru) return "Лучший следующий шаг — кнопка CTA на странице (демо / заявка). Могу кратко резюмировать ценность перед тем, как вы нажмёте.";
    if (es) return "El siguiente paso es el CTA principal (demo o registro). ¿Quieres un resumen rápido del valor antes?";
    if (fr) return "La meilleure étape suivante : le CTA principal de la page (démo ou inscription). Voulez-vous d'abord un résumé de la valeur en une ligne ?";
    if (zh) return "最好的下一步：使用页面上的主 CTA（演示或注册）。要先看一句话的价值总结吗？";
    return "Best next step: hit the main CTA (demo or signup). Want a one-line value summary first?";
  }
  if (/how|what|как|что|qué|cómo|comment|quoi|如何|怎么|什么/.test(t)) {
    if (ru) return `Коротко по сути: ${brief || "это предложение с этой страницы"}. Уточните, что именно нужно — внедрение, сроки или интеграции.`;
    if (es) return `En resumen: ${brief || "la propuesta de esta página"}. ¿Te interesa implementación, plazos o integraciones?`;
    if (fr) return `En bref : ${brief || "l'offre de cette page"}. Dites-moi si le déploiement, le calendrier ou les intégrations vous intéressent.`;
    if (zh) return `简而言之：${brief || "本页面上的服务"}。告诉我你关心的是上线、时间表还是集成。`;
    return `In short: ${brief || "the offer on this page"}. Tell me if you care about rollout, timeline, or integrations.`;
  }
  return widgetCopy(locale).fallback;
}

/**
 * @param {{ userPrompt: string, locale: string }} opts
 */
function buildAgentMarkup({ userPrompt, locale }) {
  const c = widgetCopy(locale);
  const opener = c.opener.replace(/</g, "\\u003c");
  const brief = JSON.stringify(userPrompt || "").slice(0, 500);
  const loc = JSON.stringify(locale || "en");

  return `<div id="aicom-agent" class="aicom-agent" data-aicom-agent="1">
<style>
.aicom-agent{--aicom-fab:var(--accent,#6366f1);--aicom-fab2:var(--accent2,#a855f7);font-family:var(--font-body,system-ui,sans-serif);position:fixed;bottom:1.25rem;right:1.25rem;z-index:99990}
.aicom-agent-fab{display:flex;align-items:center;gap:.5rem;padding:.65rem 1rem;border:none;border-radius:999px;color:#fff;font-weight:600;font-size:.85rem;cursor:pointer;background:linear-gradient(135deg,var(--aicom-fab),var(--aicom-fab2));box-shadow:0 12px 32px rgba(0,0,0,.35);transition:transform .2s ease}
.aicom-agent-fab:hover{transform:translateY(-2px)}
.aicom-agent-fab svg{width:1.1rem;height:1.1rem;flex-shrink:0}
.aicom-agent-panel{position:absolute;bottom:calc(100% + .75rem);right:0;width:min(380px,calc(100vw - 2rem));max-height:min(520px,70vh);display:flex;flex-direction:column;border-radius:1rem;overflow:hidden;background:rgba(12,12,20,.92);backdrop-filter:blur(16px);border:1px solid rgba(255,255,255,.12);box-shadow:0 24px 64px rgba(0,0,0,.45);opacity:0;visibility:hidden;transform:translateY(8px) scale(.98);transition:opacity .22s ease,transform .22s ease,visibility .22s}
.aicom-agent.is-open .aicom-agent-panel{opacity:1;visibility:visible;transform:translateY(0) scale(1)}
.aicom-agent-head{display:flex;align-items:flex-start;justify-content:space-between;gap:.5rem;padding:.85rem 1rem;border-bottom:1px solid rgba(255,255,255,.08)}
.aicom-agent-head h2{margin:0;font-size:.95rem;color:#f8fafc}
.aicom-agent-head p{margin:.2rem 0 0;font-size:.72rem;color:#94a3b8}
.aicom-agent-close{background:transparent;border:none;color:#94a3b8;cursor:pointer;font-size:1.1rem;line-height:1;padding:.2rem}
.aicom-agent-msgs{flex:1;overflow-y:auto;padding:.75rem 1rem;display:flex;flex-direction:column;gap:.6rem;min-height:180px}
.aicom-agent-msg{max-width:92%;padding:.55rem .75rem;border-radius:.75rem;font-size:.82rem;line-height:1.45}
.aicom-agent-msg--bot{align-self:flex-start;background:rgba(255,255,255,.08);color:#e2e8f0}
.aicom-agent-msg--user{align-self:flex-end;background:linear-gradient(135deg,var(--aicom-fab),var(--aicom-fab2));color:#fff}
.aicom-agent-form{display:flex;gap:.5rem;padding:.75rem;border-top:1px solid rgba(255,255,255,.08)}
.aicom-agent-form input{flex:1;border:1px solid rgba(255,255,255,.15);background:rgba(0,0,0,.25);color:#f1f5f9;border-radius:.5rem;padding:.55rem .65rem;font-size:.82rem}
.aicom-agent-form button{border:none;border-radius:.5rem;padding:.55rem .85rem;font-weight:600;font-size:.78rem;cursor:pointer;color:#fff;background:var(--aicom-fab)}
@media(max-width:480px){.aicom-agent{right:.75rem;bottom:.75rem}.aicom-agent-fab span{display:none}}
</style>
<button type="button" class="aicom-agent-fab" aria-expanded="false" aria-controls="aicom-agent-panel">
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z"/><path d="M5 19h14"/></svg>
<span>${c.fab}</span>
</button>
<div id="aicom-agent-panel" class="aicom-agent-panel" role="dialog" aria-label="${c.title}" hidden>
<div class="aicom-agent-head"><div><h2>${c.title}</h2><p>${c.subtitle}</p></div><button type="button" class="aicom-agent-close" aria-label="${c.close}">×</button></div>
<div class="aicom-agent-msgs" id="aicom-agent-msgs"></div>
<form class="aicom-agent-form" id="aicom-agent-form"><input type="text" id="aicom-agent-input" placeholder="${c.placeholder}" autocomplete="off" maxlength="500" required /><button type="submit">${c.send}</button></form>
</div>
<script>
(function(){
var root=document.getElementById("aicom-agent");
if(!root||root.dataset.aicomInit)return;
root.dataset.aicomInit="1";
var brief=${brief};
var loc=${loc};
var copy=${JSON.stringify(c)};
var fab=root.querySelector(".aicom-agent-fab");
var panel=root.querySelector(".aicom-agent-panel");
var msgs=root.querySelector("#aicom-agent-msgs");
var form=root.querySelector("#aicom-agent-form");
var input=root.querySelector("#aicom-agent-input");
function addMsg(text,who){var d=document.createElement("div");d.className="aicom-agent-msg aicom-agent-msg--"+who;d.textContent=text;msgs.appendChild(d);msgs.scrollTop=msgs.scrollHeight;}
function replyFor(t){
  var s=(t||"").toLowerCase();
  if(/price|pricing|plan|тариф|цена|precio|tarif|prix|价格|定价/.test(s))return loc.startsWith("ru")?"Тарифы выше на странице — напишите приоритет (объём, скорость, поддержка).":loc.startsWith("es")?"Los planes están arriba — ¿volumen, velocidad o soporte?":loc.startsWith("fr")?"Les tarifs sont ci-dessus — indiquez votre priorité (volume, vitesse ou support).":loc.startsWith("zh")?"定价在上方 — 告诉我你的优先项（用量、速度或支持）。":"See pricing above — tell me volume, speed, or support priority.";
  if(/demo|trial|start|начать|prueba|démo|essai|演示|试用/.test(s))return loc.startsWith("ru")?"Следующий шаг — основная CTA на странице.":loc.startsWith("es")?"Siguiente paso: el CTA principal.":loc.startsWith("fr")?"Prochaine étape : le CTA principal de la page.":loc.startsWith("zh")?"下一步：使用页面上的主 CTA。":"Next step: use the main CTA on this page.";
  if(/how|what|как|что|qué|comment|quoi|如何|什么/.test(s))return (loc.startsWith("ru")?"Кратко: ":loc.startsWith("fr")?"En bref : ":loc.startsWith("zh")?"简而言之：":"In short: ")+(brief||"this offer")+(loc.startsWith("ru")?". Уточните задачу.":loc.startsWith("fr")?". Précisez votre objectif.":loc.startsWith("zh")?"。请补充你的目标。":". Add your goal.");
  return copy.fallback;
}
function setOpen(on){root.classList.toggle("is-open",on);panel.hidden=!on;fab.setAttribute("aria-expanded",on?"true":"false");if(on)setTimeout(function(){input.focus();},120);}
fab.addEventListener("click",function(){setOpen(!root.classList.contains("is-open"));});
root.querySelector(".aicom-agent-close").addEventListener("click",function(){setOpen(false);});
addMsg(copy.opener,"bot");
form.addEventListener("submit",function(e){e.preventDefault();var t=input.value.trim();if(!t)return;addMsg(t,"user");input.value="";addMsg(copy.typing,"bot");setTimeout(function(){msgs.lastChild&&msgs.lastChild.remove();addMsg(replyFor(t),"bot");},520+Math.random()*400);});
})();
</script>
</div>`;
}

/** Patterns that must not appear in LLM-generated agent scripts (demo-only widget). */
const RISKY_AGENT_PATTERNS = [
  /\beval\s*\(/i,
  /\bnew\s+Function\s*\(/i,
  /\bfetch\s*\(\s*['"]https?:/i,
  /\bXMLHttpRequest\b/i,
  /\bnavigator\.sendBeacon\s*\(/i,
  /\bdocument\.cookie\b/i,
  /\blocalStorage\s*\.\s*setItem/i,
  /\bsessionStorage\s*\.\s*setItem/i,
  /\bwindow\.open\s*\(/i,
  /<script[^>]+src\s*=\s*['"]https?:/i,
];

/**
 * @param {string} html
 */
export function hasRiskyAgentPatterns(html) {
  if (!hasAgentWidget(html)) return false;
  return RISKY_AGENT_PATTERNS.some((re) => re.test(html));
}

/**
 * @param {string} html
 */
export function stripAgentWidget(html) {
  const start = html.search(/<div[^>]*\bid=["']aicom-agent["']/i);
  if (start === -1) return html;
  const slice = html.slice(start);
  const scriptEnd = slice.lastIndexOf("</script>");
  if (scriptEnd !== -1) {
    const closeDiv = slice.indexOf("</div>", scriptEnd);
    if (closeDiv !== -1) {
      return html.slice(0, start) + html.slice(start + closeDiv + "</div>".length);
    }
  }
  return html.replace(/<div[^>]*\bid=["']aicom-agent["'][^>]*>[\s\S]*?<\/div>/i, "");
}

/**
 * Inject safe fallback, or replace an unsafe LLM-built widget when strict mode is on.
 * @param {string} html
 * @param {{ enabled?: boolean, userPrompt?: string, locale?: string }} opts
 */
export function ensureAgentWidget(html, opts = {}) {
  if (!opts.enabled) return html;

  const strict =
    process.env.AICOM_LANDING_AGENT_STRICT !== "false" &&
    process.env.AICOM_LANDING_AGENT_STRICT !== "0";

  if (hasAgentWidget(html)) {
    if (strict && hasRiskyAgentPatterns(html)) {
      console.warn(
        "[generate] agent widget: unsafe patterns in model HTML — replacing with audited fallback"
      );
      html = stripAgentWidget(html);
    } else {
      return html;
    }
  }

  if (process.env.AICOM_LANDING_SKIP_AGENT_INJECT === "true") {
    console.warn("[generate] agent_to_website requested but AICOM_LANDING_SKIP_AGENT_INJECT=true");
    return html;
  }

  const block = buildAgentMarkup({
    userPrompt: opts.userPrompt || "",
    locale: opts.locale || "en",
  });

  if (/<\/body>/i.test(html)) {
    return html.replace(/<\/body>/i, `${block}\n</body>`);
  }
  return html + block;
}
