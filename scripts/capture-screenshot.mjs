import path from "node:path";
import { pathToFileURL } from "node:url";

import { chromium } from "playwright";

const root = process.cwd();
const outputPath = path.join(root, "screenshots", "miku-score-web.png");
const browser = await chromium.launch({ headless: true });

try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1200 },
    deviceScaleFactor: 1,
  });
  await page.goto(pathToFileURL(path.join(root, "index.html")).href, { waitUntil: "load" });
  await page.waitForFunction(() => Boolean(globalThis.__mikuScoreWebRuntime));
  await page.screenshot({ path: outputPath, fullPage: true });
} finally {
  await browser.close();
}

console.log("[capture:screenshot] wrote screenshots/miku-score-web.png");
