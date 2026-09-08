import { chromium } from "playwright";
import { existsSync, mkdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const screenshotsDir = resolve(__dirname, "../docs/screenshots");

if (!existsSync(screenshotsDir)) {
  mkdirSync(screenshotsDir, { recursive: true });
}

async function capture() {
  console.log("Launching Chromium...");
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();

  // 1. Landing page hero
  console.log("Navigating to landing page...");
  await page.goto("https://bhoomi-setu-xi.vercel.app/", { waitUntil: "domcontentloaded" });
  await page.waitForSelector(".hero-container");
  await page.waitForSelector(".globe-canvas");
  await page.waitForSelector(".trust-card");
  await page.waitForTimeout(2500); // allow globe canvas shader to render
  const path1 = resolve(screenshotsDir, "01-landing.png");
  await page.screenshot({ path: path1 });
  console.log(`Saved ${path1}`);

  // 2. Case dashboard
  console.log("Navigating to case dashboard...");
  await page.goto("https://bhoomi-setu-xi.vercel.app/cases/demo-family-001", { waitUntil: "domcontentloaded" });
  await page.waitForSelector(".case-layout");
  await page.waitForSelector(".summary-card");
  await page.waitForSelector(".dashboard-attention");
  await page.waitForTimeout(1500);
  const path2 = resolve(screenshotsDir, "02-dashboard.png");
  await page.screenshot({ path: path2 });
  console.log(`Saved ${path2}`);

  // 3. Verification page with anchoring action
  console.log("Navigating to verification page...");
  await page.goto("https://bhoomi-setu-xi.vercel.app/cases/demo-family-001/verification", { waitUntil: "domcontentloaded" });
  await page.waitForSelector(".case-layout");
  await page.waitForSelector(".anchor-action-bar");
  const anchorButtons = page.locator(".anchor-action-bar button");
  if (await anchorButtons.count() > 0) {
    await anchorButtons.first().scrollIntoViewIfNeeded();
    await page.evaluate(() => window.scrollBy(0, -180));
  } else {
    const anchorBars = page.locator(".anchor-action-bar");
    await anchorBars.first().scrollIntoViewIfNeeded();
  }
  await page.waitForTimeout(1000);
  const path3 = resolve(screenshotsDir, "03-verification.png");
  await page.screenshot({ path: path3 });
  console.log(`Saved ${path3}`);

  // 4. Public verifier page (MATCH state)
  const anchorId = "anc_cfc0d2b9dae74d5d";
  console.log(`Navigating to public verifier for anchor ${anchorId}...`);
  await page.goto(`https://bhoomi-setu-xi.vercel.app/verify/${anchorId}`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector(".banner-match");
  await page.waitForSelector(".verifier-details-card");
  await page.waitForTimeout(1500);
  const path4 = resolve(screenshotsDir, "04-public-verify-match.png");
  await page.screenshot({ path: path4 });
  console.log(`Saved ${path4}`);

  await browser.close();
  console.log("All 4 screenshots captured successfully!");
}

capture().catch((err) => {
  console.error("Screenshot capture failed:", err);
  process.exit(1);
});
