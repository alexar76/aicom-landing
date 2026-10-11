#!/usr/bin/env node
/**
 * Record a marketing GIF: prompt → Generate → preview (demo mode, no API key).
 * Requires: npm install && npx playwright install chromium
 *
 *   node scripts/capture-demo-gif.mjs
 */
import { spawn } from "node:child_process";
import { createConnection } from "node:net";
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import sharp from "sharp";
import gifenc from "gifenc";
const { GIFEncoder, quantize, applyPalette } = gifenc;

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const OUT = join(ROOT, "docs", "screenshots", "prompt-to-page.gif");
const PORT = 3847;

function waitForPort(port, host = "127.0.0.1", ms = 30_000) {
  const deadline = Date.now() + ms;
  return new Promise((resolve, reject) => {
    const tryOnce = () => {
      const socket = createConnection({ port, host }, () => {
        socket.end();
        resolve();
      });
      socket.on("error", () => {
        if (Date.now() > deadline) reject(new Error(`port ${port} not ready`));
        else setTimeout(tryOnce, 200);
      });
    };
    tryOnce();
  });
}

async function main() {
  const child = spawn(process.execPath, ["preview-server.mjs"], {
    cwd: ROOT,
    env: {
      ...process.env,
      AICOM_LANDING_DEMO_MODE: "1",
      AICOM_LANDING_HOST: "127.0.0.1",
      AICOM_LANDING_PORT: String(PORT),
    },
    stdio: ["ignore", "pipe", "pipe"],
  });

  child.stderr?.on("data", (d) => process.stderr.write(d));
  await waitForPort(PORT);

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await page.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: "networkidle" });

  const prompt =
    "SaaS landing for an AI task manager built for remote teams — calm, trustworthy, dark UI";
  await page.locator("#prompt").fill(prompt);
  await page.waitForTimeout(400);

  const frames = [];
  const snap = async () => {
    const png = await page.screenshot({ type: "png" });
    const { data, info } = await sharp(png).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    frames.push({ data: new Uint8ClampedArray(data), width: info.width, height: info.height });
  };

  await snap();
  await page.locator("#go").click();
  for (let i = 0; i < 8; i++) {
    await page.waitForTimeout(350);
    await snap();
  }
  await page.waitForFunction(() => {
    const f = document.getElementById("frame");
    return f && f.srcdoc && f.srcdoc.length > 200;
  }, { timeout: 20_000 });
  await page.waitForTimeout(600);
  await snap();
  await page.waitForTimeout(400);
  await snap();

  await browser.close();
  child.kill("SIGTERM");

  const gif = GIFEncoder();
  for (const frame of frames) {
    const palette = quantize(frame.data, 256);
    const index = applyPalette(frame.data, palette);
    gif.writeFrame(index, frame.width, frame.height, { palette, delay: 110 });
  }
  gif.finish();
  writeFileSync(OUT, Buffer.from(gif.bytes()));
  console.log(`Wrote ${OUT} (${frames.length} frames)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
