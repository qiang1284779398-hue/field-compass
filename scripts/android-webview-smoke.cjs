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
  await page.locator("#battleScene .hero3d-layer").waitFor({ state: "attached", timeout: 15000 });

  await page.waitForFunction(() => {
    const status = window.__hero3dStatus?.() || [];
    return ["liu-bei", "guan-yu", "zhang-fei"].every(id => status.some(item => item.id === id && item.ready));
  }, { timeout: 120000 });

  const status = await page.evaluate(() => window.__hero3dStatus());
  for (const id of ["liu-bei", "guan-yu", "zhang-fei"]) {
    const model = status.find(item => item.id === id);
    assert.ok(model && model.ready, id + " GLB model must load in Android WebView");
    assert.ok(model.skinnedMeshes > 0 && model.bones >= 20 && model.clips >= 3,
      id + " must have a skinned mesh, humanoid skeleton and animation clips");
  }
  assert.equal(await page.locator("#battleScene canvas.hero3d-layer").count(), 1,
    "Android WebView must attach the real WebGL hero layer");
  assert.ok(await page.locator("#battleScene .warrior.hero3d-ready").count() >= 3,
    "at least three battlefield units must be driven by loaded 3D models");
  assert.ok(await page.locator("#battleScene .warrior[data-side=ally]").count() > 0, "friendly army must be visible");
  assert.ok(await page.locator("#battleScene .warrior[data-side=enemy]").count() > 0, "enemy army must be visible");
  assert.match(await page.locator(".skill-panel").innerText(), /目标范围|消耗/,
    "battle skill panel must show usable skill information");
  assert.deepEqual(errors, [], "Android WebView must not throw uncaught JavaScript errors");

  fs.mkdirSync("artifacts", { recursive: true });
  await page.screenshot({ path: path.join("artifacts", "android-webview-battle.png"), fullPage: false });
  fs.writeFileSync(path.join("artifacts", "android-webview-model-status.json"),
    JSON.stringify({ url: page.url(), models: status, visible3DUnits: await page.locator("#battleScene .warrior.hero3d-ready").count(), pageErrors: errors }, null, 2));
  console.log("ANDROID_WEBVIEW_BATTLE_TEST_PASSED");
  console.log(JSON.stringify(status, null, 2));
  await browser.close();
})().catch(error => {
  console.error(error);
  process.exit(1);
});
