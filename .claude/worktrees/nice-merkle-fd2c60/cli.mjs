#!/usr/bin/env node
/**
 * aicom landing CLI — prompt → Architect JSON → Developer HTML → disk
 */
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { detectProviderLabel } from "./llm/provider.js";
import { generateLanding, loadPresets } from "./lib/generate.mjs";
import { loadDotEnv } from "./lib/loadEnv.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));

function parseArgs(argv) {
  const out = { _: [], style: null, outFile: null, listStyles: false, help: false };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--help" || a === "-h") out.help = true;
    else if (a === "--list-styles") out.listStyles = true;
    else if (a === "--style" && argv[i + 1]) {
      out.style = argv[++i];
    } else if (a === "--out" && argv[i + 1]) {
      out.outFile = argv[++i];
    } else if (!a.startsWith("-")) out._.push(a);
  }
  return out;
}

async function main() {
  loadDotEnv(__dirname);
  const args = parseArgs(process.argv);
  if (args.help) {
    console.log(`aicom landing — MIT fast landing generator (2-step: Architect → Developer)

Usage:
  aicom-landing "Your product pitch in natural language" [--style preset-id] [--out path]

Env (first match wins — set in shell or in a file named .env next to package.json):
  ANTHROPIC_API_KEY  (+ optional ANTHROPIC_MODEL)
  DEEPSEEK_API_KEY   (+ optional DEEPSEEK_MODEL, DEEPSEEK_BASE_URL)
  OPENAI_API_KEY     (+ optional OPENAI_MODEL, OPENAI_BASE_URL for compatible APIs)
  or Ollama: OLLAMA_HOST (default http://127.0.0.1:11434), OLLAMA_MODEL

Examples:
  npx aicom-landing "SaaS landing for AI task manager for remote teams"
  npx aicom-landing "Green energy startup" --style sage-organic --out ./dist/page.html
  aicom-landing --list-styles

Preview UI (single page, no admin):
  npm run serve
  # → http://127.0.0.1:3847/

Full product (quality gates, marketplace): https://magic-ai-factory.com/ · source https://github.com/alexar76/aicom
`);
    process.exit(0);
  }

  const presets = await loadPresets(__dirname);
  if (args.listStyles) {
    for (const p of presets) console.log(`${p.id}\t${p.title}`);
    process.exit(0);
  }

  const userPrompt = args._.join(" ").trim();
  if (!userPrompt) {
    console.error("Error: pass a prompt string, e.g. aicom-landing \"AI CRM for dentists\"");
    process.exit(1);
  }

  const outPath = args.outFile || join(__dirname, "output", "index.html");
  const provider = detectProviderLabel();

  const styleLabel = args.style || "(auto from prompt)";
  console.log(`aicom landing — provider: ${provider}, style request: ${styleLabel}`);

  const t0 = Date.now();
  console.log("Generating (Architect → Developer)…");
  const { html, stylePreset } = await generateLanding({
    userPrompt,
    styleId: args.style,
    rootDir: __dirname,
  });
  console.log(`Style used: ${stylePreset.id}`);

  await mkdir(dirname(outPath), { recursive: true });
  await writeFile(outPath, html, "utf8");

  const sec = ((Date.now() - t0) / 1000).toFixed(1);
  console.log(`Done in ${sec}s → ${outPath}`);
  console.log("Tip: open the file in a browser. Need full stack + QA? → https://magic-ai-factory.com/");
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
