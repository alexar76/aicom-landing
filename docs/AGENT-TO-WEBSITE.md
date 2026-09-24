# Agent-To-Website

**Опиши задачу → получи лендинг со встроенным AI-агентом** (чат-виджет на странице).

Режим включается в UI переключателем рядом с **Generate landing**, в API полем `agent_to_website`, в CLI — флагом `--agent`.

---

## Что получается на выходе

| Элемент | Описание |
|--------|----------|
| Лендинг | Обычный pipeline Architect → Developer (секции, hero, CTA) |
| Виджет `#aicom-agent` | FAB внизу справа → панель чата |
| Поведение по умолчанию | **Demo mode** — ответы считаются в браузере, **без запросов на сервер** и без внешних LLM API |
| Язык | Строки агента в языке лендинга (`content_language` / промпт) |

Если модель не добавила виджет, хост **вставляет проверенный fallback** (`lib/agentToWebsite.mjs`), если не задано `AICOM_LANDING_SKIP_AGENT_INJECT=true`.

---

## Использование

### Web UI

1. Введите промпт продукта.
2. Включите **Agent-To-Website**.
3. **Generate landing** → в превью откройте чат (кнопка в углу).

### API

```http
POST /api/generate
Content-Type: application/json
Origin: https://your-host.example

{
  "prompt": "Лендинг доставки роз — консультант помогает выбрать букет",
  "style": "blossom-pastel",
  "ui_locale": "ru",
  "agent_to_website": true
}
```

Ответ: `{ "id", "styleId", "agent_to_website": true, "seconds" }`.

### CLI

```bash
npx aicom-landing "AI coach for founders" --agent --out ./dist/index.html
```

---

## Архитектура

```
user prompt + agent_to_website
        │
        ▼
Architect (+ agent_widget в JSON)
        │
        ▼
Developer (вёрстка + JS чата)
        │
        ▼
ensureAgentWidget()  ──► fallback / замена небезопасного кода
        │
        ▼
applyBadgeToHtml()   ──► «Powered by AI-Factory» (смещён влево от FAB)
        │
        ▼
index.html в ZIP / preview
```

Промпты: блок `AGENT_TO_WEBSITE` в `llm/prompt.js`.

---

## Безопасность

### Модель угроз

| Угроза | Контекст | Митигация |
|--------|----------|-----------|
| **XSS в чате** | Пользователь сайта вводит текст в виджет | Fallback: только `textContent`. В промпте: запрет `innerHTML` для user input |
| **Вредоносный JS от LLM** | Developer вставил `fetch`, `eval`, куки | Аудит `hasRiskyAgentPatterns()`; при совпадении — **замена на fallback** (по умолчанию strict включён) |
| **Утечка данных чата** | Ожидание «настоящего» AI | Demo mode: данные **не уходят** с страницы; в UI и доке это явно |
| **Фишинг / ложные обещания** | Агент «живой ChatGPT» | Промпт: не заявлять live API без явного запроса в brief |
| **Preview / ZIP** | Тот же HTML, что и на проде | iframe `sandbox` без `allow-same-origin`; CSP на `/preview/:id` — см. [SECURITY.md](../SECURITY.md) |
| **Расход API ключей** | `POST /api/generate` | Rate limit, auth на деплое; режим agent **не** добавляет второй LLM-вызов на сообщения чата |

### Что делает fallback-виджет

- Ответы — keyword-логика + краткий `user_brief` в closure (JSON-экранирование).
- Нет `fetch`, `eval`, storage, cookie.
- `input maxlength="500"`.
- Сообщения пользователя в DOM через `textContent`.

### Что делает strict-режим (по умолчанию)

Если в HTML есть `#aicom-agent` и обнаружены, например:

- `eval(`, `new Function(`
- `fetch("https://...")`, `XMLHttpRequest`
- `document.cookie`, `localStorage.setItem`
- внешний `<script src="https://...">`

→ виджет модели **удаляется**, подставляется **аудированный fallback**, в лог сервера пишется предупреждение.

Отключить замену (только на свой риск, для отладки):

```bash
AICOM_LANDING_AGENT_STRICT=false
```

Полностью отключить вставку fallback:

```bash
AICOM_LANDING_SKIP_AGENT_INJECT=true
```

### Деплой на публичный интернет

1. TLS + rate limit + по возможности auth перед `/api/generate`.
2. Считайте **весь сгенерированный HTML недоверенным** — не только виджет.
3. Для **реального** LLM в чате (не demo) нужна **отдельная** backend-интеграция с ключами на сервере, CORS, лимитами и политикой данных — это **вне scope** этого генератора; не вставляйте API keys в статический HTML.

### Sandbox превью

Генератор открывает лендинг в iframe:

```html
sandbox="allow-scripts allow-forms"
```

Без `allow-same-origin` скрипт превью **не читает** cookies/DOM родительской страницы. Виджет агента в превью работает **внутри изолированного документа** — как у посетителя отдельной вкладки.

---

## Переменные окружения

| Variable | Default | Purpose |
|----------|---------|---------|
| `AICOM_LANDING_AGENT_STRICT` | *(on)* | `false` / `0` — не заменять LLM-виджет при risky-паттернах |
| `AICOM_LANDING_SKIP_AGENT_INJECT` | *(off)* | `true` — не вставлять fallback, даже если виджета нет |

---

## Бейдж AI-Factory и FAB

После генерации хост добавляет фиксированный бейдж (`lib/badgeConfig.mjs`), не полагаясь на LLM.

| Режим | Позиция бейджа |
|-------|----------------|
| Обычный лендинг | `bottom: 16px`, `right: 16px` |
| Есть `#aicom-agent` | `bottom: 0.625rem`, `right: 5.85rem` — **слева от кнопки чата**, чтобы не перекрывать FAB |

Настройка: `AICOM_LANDING_BADGE_ENABLED`, `AICOM_LANDING_BADGE_URL`, `AICOM_LANDING_BADGE_LABEL` (см. [README](../README.md#configuration)).

## Токены и JSON на этапе Architect

Agent-To-Website расширяет JSON-план (`ui_experience.agent_widget`). При низком лимите ответ модели **обрывается посередине JSON** → ошибка Architect.

| Стадия | Лимит output tokens (текущий код) |
|--------|-----------------------------------|
| Architect | **8192** |
| Developer | **16384** |

При обрезке или пустом ответе — до **3** повторов (`AICOM_LANDING_JSON_RETRIES`), с напоминанием «только JSON». Подробнее: [DEPLOY.md — invalid JSON](./DEPLOY.md#troubleshooting-invalid-json-architect--developer).

## Ограничения

- Demo-агент **не** заменяет продакшен-support bot с RAG, auth и логированием.
- Качество ответов ограничено эвристикой; для продакшена подключайте свой backend.
- Дополнительные токены LLM только на этапе генерации страницы (Architect + Developer), не на каждое сообщение в чате.

---

## См. также

- [SECURITY.md](../SECURITY.md) — общая политика
- [DEPLOY.md](./DEPLOY.md) — nginx, Docker, таймауты
- [PROMPTS.md](./PROMPTS.md) — примеры промптов
