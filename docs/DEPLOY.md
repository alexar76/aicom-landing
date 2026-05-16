# Deploying the landing generator (production)

The preview server is a single Node process (`preview-server.mjs`). **Recommended:** put it on its **own subdomain** at the URL root (no path prefix) — simplest TLS, caching, and no extra env.

## Option A — Subdomain (recommended)

Example: `https://landing.magic-ai-factory.com/` → Node on `127.0.0.1:3847`.

- Do **not** set `AICOM_LANDING_BASE_PATH`.
- Set `AICOM_LANDING_TRUST_PROXY=true` when nginx/Caddy terminates TLS in front of the app.
- Pass LLM keys via env or a secret file mounted into the process (same as local `.env`).

### nginx (TLS)

```nginx
server {
    listen 443 ssl http2;
    server_name landing.magic-ai-factory.com;

    ssl_certificate     /path/to/fullchain.pem;
    ssl_certificate_key /path/to/privkey.pem;

    client_max_body_size 2M;

    location / {
        proxy_pass http://127.0.0.1:3847;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Run the app with `AICOM_LANDING_HOST=127.0.0.1` (only localhost) so it is not reachable except through the proxy.

### systemd (sketch)

`WorkingDirectory=/opt/aicom-landing`, `EnvironmentFile=/opt/aicom-landing/.env`, `ExecStart=/usr/bin/node preview-server.mjs`, plus `AICOM_LANDING_TRUST_PROXY=true` in that env file if you use nginx as above.

## Option B — Path on the main domain

Example: `https://magic-ai-factory.com/landing-page-generation/`.

1. Set **`AICOM_LANDING_BASE_PATH=/landing-page-generation`** (no trailing slash) in the app environment.
2. Configure the reverse proxy in one of these ways:

**B1 — Strip the prefix** (upstream sees `/`, `/api/...`):

Use `^~` so this block wins over a catch-all `location /` that proxies to another app (e.g. Next.js on the same `server_name`).

```nginx
location = /landing-page-generation {
    return 302 /landing-page-generation/;
}
location ^~ /landing-page-generation/ {
    proxy_pass http://127.0.0.1:3847/;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

**B2 — Forward the full URI** (upstream sees `/landing-page-generation/api/...`):

Use `proxy_pass http://127.0.0.1:3847;` **without** a URI suffix on the upstream URL. The server strips `AICOM_LANDING_BASE_PATH` from incoming paths when it matches.

Optional: add `location = /landing-page-generation { return 302 /landing-page-generation/; }` so the bare path redirects with a trailing slash.

## Docker

Same env vars as Node. Bind the container port to `127.0.0.1:3847` only and terminate TLS on the host proxy.

**Persist API keys across container restarts:** store secrets in a **host file** `.env` next to `package.json`, not in the image and not only as inline `-e` flags. Recreating the container re-reads that file.

```bash
cp .env.example .env   # edit: DEEPSEEK_API_KEY=..., AICOM_LANDING_UI_LOCALE=en, etc.
```

### docker compose (recommended)

`docker-compose.yml` mounts `env_file: .env` from the host. `docker compose restart` / `up -d` keeps the same keys until you change `.env` on disk.

```bash
docker compose up -d --build
docker compose logs -f
```

### docker run

```bash
docker build -t aicom-landing .
docker run -d --name aicom-landing \
  -p 127.0.0.1:3847:3847 \
  --env-file .env \
  --restart unless-stopped \
  aicom-landing
```

Do **not** bake `DEEPSEEK_API_KEY` into `Dockerfile` `ENV` — it would be lost on the next image rebuild and is unsafe in layer history.

## Checklist

- TLS in front of the app on the public internet.
- `AICOM_LANDING_TRUST_PROXY=true` behind your own proxy (for rate limits by real client IP).
- API keys only in server env, not in the browser.
- Optional: HTTP basic auth or SSO in nginx if you want to limit who can burn tokens.
