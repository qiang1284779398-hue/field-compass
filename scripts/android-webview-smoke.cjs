const { chromium } = require("playwright");
const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");

(async () => {
  const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
  const pages = browser.contexts().flatMap(context => context.pages());
  let page = pages.find(candidate => candidate.url().includes("android_asset/index.html"));
  if (!page) {
    for (const candidate of pages) {
      try {
        await candidate.waitForFunction(() => !!document.querySelector("#heading"), { timeout: 8000 });
        page = candidate;
        break;
      } catch (_) {}
    }
  }
  assert.ok(page, "Android WebView page for the installed game was not found");
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.waitForSelector("#heading", { timeout: 20000 });
  assert.match(await page.locator("#heading").innerText(), /新野|主城/, "Android WebView must render the game home screen");

  await page.locator('button[data-p="campaign"]').click();
  await page.locator('button[onclick="startChapter(0)"]').click();
  let steps = 0;
  while (await page.locator('button[onclick="storyNext()"]').count()) {
    await page.locator('button[onclick="storyNext()"]').click();
    steps++;
    assert.ok(steps < 25, "story dialogue did not finish");
  }
  assert.ok(steps > 0, "first chapter should have playable dialogue");
  await page.locator('button[onclick="chapterChoice(0)"]').click();
  await page.locator("#battleScene").waitFor({ state: "visible", timeout: 15000 });
  await page.waitForFunction(() => ["liu-bei","guan-yu","zhang-fei"].every(id => {
    const img = document.querySelector('#battleScene .warrior[data-hero2d="'+id+'"] .hero-portrait');
    return !!img && img.complete && img.naturalWidth > 0;
  }), { timeout: 30000 });
  const status = await page.evaluate(() => ["liu-bei","guan-yu","zhang-fei"].map(id => {
    const img = document.querySelector('#battleScene .warrior[data-hero2d="'+id+'"] .hero-portrait');
    return { id, loaded:!!img && img.complete && img.naturalWidth>0, width:img?.naturalWidth||0, height:img?.naturalHeight||0 };
  }));
  for (const sprite of status) {
    assert.ok(sprite.loaded && sprite.width>=300 && sprite.height>=300, sprite.id+" 2D SVG must load in Android WebView");
  }
  assert.ok(await page.locator("#battleScene .warrior[data-hero2d]").count() >= 3,
    "Android WebView must render all three bespoke 2D generals");
  assert.ok(await page.locator("#battleScene .warrior[data-side=ally]").count() > 0, "friendly army must be visible");
  assert.ok(await page.locator("#battleScene .warrior[data-side=enemy]").count() > 0, "enemy army must be visible");
  assert.match(await page.locator(".skill-panel").innerText(), /目标范围|消耗/,
    "battle skill panel must show usable skill information");
  assert.deepEqual(errors, [], "Android WebView must not throw uncaught JavaScript errors");

  fs.mkdirSync("artifacts", { recursive: true });
  await page.screenshot({ path: path.join("artifacts", "android-webview-battle.png"), fullPage: false });
  fs.writeFileSync(path.join("artifacts", "android-webview-2d-sprite-status.json"),
    JSON.stringify({ url: page.url(), models: status, visible2DUnits: await page.locator("#battleScene .warrior[data-hero2d]").count(), pageErrors: errors }, null, 2));
  console.log("ANDROID_WEBVIEW_2D_BATTLE_TEST_PASSED");
  console.log(JSON.stringify(status, null, 2));
  await browser.close();
})().catch(error => {
  console.error(error);
  process.exit(1);
});
