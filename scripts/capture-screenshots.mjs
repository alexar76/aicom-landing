#!/usr/bin/env node
/**
 * Regenerate docs/screenshots/*.png (UI + examples with Agent-To-Website).
 * Requires: npx -p playwright node scripts/capture-screenshots.mjs
 */
import { readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { ensureAgentWidget } from "../lib/agentToWebsite.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const SHOTS = join(ROOT, "docs", "screenshots");
const EXAMPLES = join(ROOT, "docs", "examples");
const PORT = 3847;
const EX_PORT = 9876;

const EXAMPLES_META = [
  {
    file: "saas-task-manager.html",
    shot: "example-saas-task-manager.png",
    prompt: "SaaS AI task manager for remote teams",
    locale: "en",
  },
  {
    file: "fintech-payments.html",
    shot: "example-fintech-payments.png",
    prompt: "Fintech cross-border payments for freelancers",
    locale: "en",
  },
  {
    file: "green-solar.html",
    shot: "example-green-solar.png",
    prompt: "Green energy home solar panels startup",
    locale: "en",
  },
];

async function injectAgentsIntoExamples() {
  for (const { file, prompt, locale } of EXAMPLES_META) {
    const path = join(EXAMPLES, file);
    let html = await readFile(path, "utf8");
    if (!/id=["']aicom-agent["']/i.test(html)) {
      html = ensureAgentWidget(html, { enabled: true, userPrompt: prompt, locale });
      await writeFile(path, html);
      console.log(`[shots] agent widget added → ${file}`);
    }
  }
}

async function main() {
  await injectAgentsIntoExamples();

  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  });

  // Generator UI (agent toggle visible, enabled)
  {
    const page = await ctx.newPage();
    await page.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: "networkidle", timeout: 60_000 });
    await page.locator("label.agent-toggle").click();
    await page.locator("#prompt").fill(
      "SaaS landing with on-page AI agent — helps pick a plan and answers pricing questions."
    );
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(400);
    await page.screenshot({
      path: join(SHOTS, "ui-generator.png"),
      fullPage: true,
    });
    console.log("[shots] ui-generator.png");
    await page.close();
  }

  // Example landings (hero + open agent panel)
  for (const { file, shot } of EXAMPLES_META) {
    const page = await ctx.newPage();
    await page.goto(`http://127.0.0.1:${EX_PORT}/${file}`, {
      waitUntil: "networkidle",
      timeout: 30_000,
    });
    await page.evaluate(() => {
      const badge = document.getElementById("aifactory-powered-badge");
      if (badge) badge.style.display = "none";
      const fab = document.querySelector(".aicom-agent-fab");
      if (fab instanceof HTMLElement) fab.click();
    });
    await page.waitForTimeout(600);
    await page.screenshot({
      path: join(SHOTS, shot),
      fullPage: false,
    });
    console.log(`[shots] ${shot}`);
    await page.close();
  }

  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
