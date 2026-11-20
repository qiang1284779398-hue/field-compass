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

  // Verify real combat outcomes, not just that the buttons can be clicked.
  const readFight = () => page.evaluate(() => eval("({round:fight.round,phase:fight.phase,enemyHp:fight.enemies[0].hp,actor:fight.actor,energy:fight.allies.map(x=>x.energy),shield:fight.allies.map(x=>x.shield),acted:fight.acted.length})"));
  const hpBefore = await page.evaluate(() => eval("fight.enemies[0].hp"));
  await page.locator('.warrior[data-side="enemy"][data-index="0"]').click();
  assert.ok((await page.locator('.warrior[data-side="enemy"][data-index="0"]').getAttribute("class")).includes("targeted"), "clicked enemy should become the selected target");
  await page.locator('button[onclick="basicAttack()"]').click();
  await page.waitForTimeout(900);
  const afterAttack = await readFight();
  assert.ok(afterAttack.enemyHp < hpBefore, "basic attack must reduce the selected enemy HP");

  // A distinct hero skill must spend energy and produce a combat effect.
  await page.locator('button[onclick="selectActor(1)"]').click();
  const skillBefore = await readFight();
  await page.locator('button[onclick="useHeroSkill()"]').click();
  await page.waitForTimeout(1500);
  const afterSkill = await readFight();
  assert.ok(afterSkill.energy[1] < skillBefore.energy[1], "hero skill must consume energy");
  assert.ok(afterSkill.enemyHp < skillBefore.enemyHp, "hero skill must damage or otherwise affect its target");

  // Defensive action must create a shield; completing all three actions must trigger enemy AI.
  await page.locator('button[onclick="selectActor(2)"]').click();
  const shieldBefore = (await readFight()).shield[2];
  await page.locator('button[onclick="defendAction()"]').click();
  const afterDefend = await readFight();
  assert.ok(afterDefend.shield[2] > shieldBefore, "defend action must grant a shield");
  await page.waitForTimeout(4200);
  const afterEnemyTurn = await readFight();
  assert.ok(afterEnemyTurn.round >= 2 || afterEnemyTurn.phase === "end", "enemy phase must resolve and advance the round or end the battle");

  // A battlefield command must apply once, then retreat and loss settlement must return to the campaign.
  if (afterEnemyTurn.phase === "player") {
    await page.locator('button[onclick="tacticAction()"]').click();
    await page.locator('button[onclick="useTactic(1)"]').click();
    assert.equal(await page.evaluate(() => eval("fight.tacticUsed")), true, "battle command should be consumed");
    await page.locator('button[onclick="retreatBattle()"]').click();
  }
  if (await page.locator('button[onclick="finishBattle()"]').count()) {
    await page.locator('button[onclick="finishBattle()"]').click();
    assert.ok((await page.locator("#heading").innerText()).includes("山河志"), "battle settlement should return to the campaign");
  }

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
