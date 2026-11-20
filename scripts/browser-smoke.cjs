const { chromium } = require("playwright");
const path = require("node:path");
const fs = require("node:fs");
const http = require("node:http");
const assert = require("node:assert/strict");

(async () => {
  const html = fs.readFileSync(path.resolve("app/src/main/assets/index.html"), "utf8");
  const server = http.createServer((req, res) => { res.writeHead(200, { "content-type": "text/html; charset=utf-8" }); res.end(html); });
  await new Promise(resolve => server.listen(4173, "127.0.0.1", resolve));
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  const pageErrors = [];
  page.on("pageerror", error => pageErrors.push(error.message));
  await page.goto("http://127.0.0.1:4173/");
  await page.locator("#heading").waitFor();
  assert.match(await page.locator("#heading").innerText(), /新野|主城/, "home screen should render");

  // Every primary navigation entry must respond and render a non-empty page.
  for (const tab of ["campaign", "heroes", "army", "world", "bag", "home"]) {
    await page.locator('button[data-p="' + tab + '"]').click();
    assert.ok((await page.locator("#view").innerText()).trim().length > 20, tab + " page should render content");
  }

  // Enter the first story chapter, advance all dialogue, make a choice, and enter battle.
  await page.locator('button[data-p="campaign"]').click();
  await page.locator('button[onclick="startChapter(0)"]').click();
  let dialogueSteps = 0;
  while (await page.locator('button[onclick="storyNext()"]').count()) {
    await page.locator('button[onclick="storyNext()"]').click();
    dialogueSteps++;
    assert.ok(dialogueSteps < 20, "story dialogue must not loop forever");
  }
  assert.ok(dialogueSteps > 0, "chapter should contain playable dialogue");
  await page.locator('button[onclick="chapterChoice(0)"]').click();
  await page.locator("#battleScene").waitFor({ state: "visible", timeout: 5000 });
  assert.ok(await page.locator("#battleScene .warrior[data-side=ally]").count() >= 1, "friendly units should appear on battlefield");
  assert.ok(await page.locator("#battleScene .warrior[data-side=enemy]").count() >= 1, "enemy units should appear on battlefield");

  // A basic attack must resolve and leave the battle UI responsive.
  await page.locator('button[onclick="basicAttack()"]').click();
  await page.waitForTimeout(1800);
  assert.ok((await page.locator("#view").innerText()).includes("战"), "battle view should remain rendered after an action");

  // The local save should be written and survive a browser reload.
  const saved = await page.evaluate(() => localStorage.getItem("hxsg_save_v4"));
  assert.ok(saved, "game should persist a local save");
  await page.reload();
  await page.waitForTimeout(500);
  const restored = await page.evaluate(() => ({ heading: document.querySelector("#heading")?.innerText, view: document.querySelector("#view")?.innerText, save: localStorage.getItem("hxsg_save_v4")?.length || 0 }));
  console.log("RESTORE_DIAGNOSTIC", JSON.stringify({ ...restored, pageErrors }));
  assert.ok(restored.heading && restored.view && restored.view.trim().length > 20, "game should recover after reload");
  assert.deepEqual(pageErrors, [], "browser runtime must not throw uncaught JavaScript errors");

  console.log(JSON.stringify({ result: "PASS", navigationTabs: 6, storyDialogueSteps: dialogueSteps, battle: "entered; both sides rendered; basic attack clicked", saveReload: "PASS", pageErrors }, null, 2));
  await browser.close();
  await new Promise(resolve => server.close(resolve));
})().catch(error => { console.error(error); process.exit(1); });
