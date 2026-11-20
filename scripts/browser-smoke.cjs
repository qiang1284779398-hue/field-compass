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
  const pageMarkers = { campaign: "三十章山河史诗", heroes: "名将录", army: "军团编制", world: "天下舆图", bag: "军府库藏", home: "山河未定" };
  for (const tab of ["campaign", "heroes", "army", "world", "bag", "home"]) {
    await page.locator('button[data-p="' + tab + '"]').click();
    const pageText = (await page.locator("#view").innerText()).trim();
    assert.ok(pageText.length > 20, tab + " page should render content");
    assert.ok(pageText.includes(pageMarkers[tab]), tab + " page should render its expected feature section");
    if (tab === "world") assert.match(pageText, /敌对|戒备|中立|友善/, "world page should show readable faction diplomacy tiers");
  }

  // Exercise the main-city feature tiles and verify each opens a usable panel.
  await page.locator('button[data-p="home"]').click();
  const homePanels = ["城池经营","颁布政令","内政任命","民心治安","招贤馆","巡城奇遇","本章支线","铁匠工坊","密探机关"];
  for (const label of homePanels) {
    await page.getByRole("button", { name: new RegExp(label) }).click();
    await page.locator("#backdrop").waitFor({ state: "visible", timeout: 3000 });
    assert.ok((await page.locator("#modal").innerText()).trim().length > 10, label + " should show actionable content");
    await page.evaluate(() => closeModal());
    await page.locator("#backdrop").waitFor({ state: "hidden" });
  }

  // Exercise the persistent intelligence bureau in a real mobile browser session.
  await page.getByRole("button", { name: /密探机关/ }).click();
  await page.locator("#backdrop").waitFor({ state: "visible", timeout: 3000 });
  await page.getByRole("button", { name: /招募密探/ }).click();
  await page.locator(".spy-agent").waitFor({ state: "visible", timeout: 3000 });
  assert.equal(await page.locator(".spy-agent").count(), 1, "recruitment should create a persistent spy agent");
  await page.getByRole("button", { name: /训练一名密探/ }).click();
  assert.match(await page.locator(".spy-agent").innerText(), /技能 2\/5/, "training should increase spy skill");
  await page.getByRole("button", { name: /反间布防/ }).click();
  assert.match(await page.locator("#modal").innerText(), /戒备中|四日内/, "counter-intelligence should activate");
  await page.evaluate(() => closeModal());
  await page.locator("#backdrop").waitFor({ state: "hidden" });

  // Recruitment must consume exactly one recruitment token; repeated calls cannot bypass it.
  await page.evaluate(() => { s.gold = 100000; s.recruitTokens = 0; save(); tavern(); });
  const recruitButton = page.locator('button[onclick="recruitHero()"]');
  assert.equal(await recruitButton.isDisabled(), true, "recruitment must be disabled without a recruitment token even with abundant gold");
  const heroesBeforeBlockedRecruit = await page.evaluate(() => s.heroes.length);
  await page.evaluate(() => recruitHero());
  assert.equal(await page.evaluate(() => s.heroes.length), heroesBeforeBlockedRecruit, "a tokenless recruitment attempt must not add a hero");
  await page.evaluate(() => { s.recruitTokens = 1; save(); tavern(); });
  await page.locator('button[onclick="recruitHero()"]').click();
  assert.equal(await page.evaluate(() => s.heroes.length), heroesBeforeBlockedRecruit + 1, "one recruitment token should recruit exactly one hero");
  assert.equal(await page.evaluate(() => s.recruitTokens), 0, "successful recruitment must consume exactly one token");
  await page.evaluate(() => recruitHero());
  assert.equal(await page.evaluate(() => s.heroes.length), heroesBeforeBlockedRecruit + 1, "a repeated tokenless call must not recruit another hero");

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
  const relationBeforeChoice = await page.evaluate(() => s.factionRelations.yellow);
  await page.locator('button[onclick="chapterChoice(0)"]').click();
  assert.equal(await page.evaluate(() => s.factionRelations.yellow), Math.min(50, relationBeforeChoice + 3), "humanitarian choice should improve the local faction relation");
  await page.locator("#battleScene").waitFor({ state: "visible", timeout: 5000 });
  assert.ok(await page.locator("#battleScene .warrior[data-side=ally]").count() >= 1, "friendly units should appear on battlefield");
  assert.ok(await page.locator("#battleScene .warrior[data-side=enemy]").count() >= 1, "enemy units should appear on battlefield");
  const vectorModels = await page.locator("#battleScene .warrior .unit-figure").evaluateAll(nodes => nodes.map(n => ({ width: n.getBoundingClientRect().width, height: n.getBoundingClientRect().height, paths: n.querySelectorAll("path").length })));
  assert.ok(vectorModels.length >= 2 && vectorModels.every(v => v.width >= 35 && v.height >= 55 && v.paths >= 8), "both armies must display visible full-body vector character models, not blank sprite placeholders");
  // A dead middle slot must not corrupt actor indices or strand the player turn.
  await page.evaluate(() => { fight.allies[1].alive = false; fight.allies[1].hp = 0; fight.acted = [0]; fight.actor = 0; continueTurn(); });
  assert.equal(await page.evaluate(() => fight.actor), 2, "turn selection must skip a dead ally using original formation indices");
  assert.equal(await page.evaluate(() => fight.phase), "player", "remaining allies must retain control after a middle ally falls");
  await page.evaluate(() => { fight.allies[1].alive = true; fight.allies[1].hp = Math.max(1, Math.floor(fight.allies[1].max * .8)); fight.acted = []; fight.actor = 0; drawBattle(); });

  assert.match(await page.locator(".battle-top").innerText(), /晴朗|暴雨|浓雾|烈风/, "battle HUD should display current weather");
  await page.evaluate(() => { fight.wave = 3; makeWave(); drawBattle(); startMusic(); });
  await page.locator("#battleScene.boss-arrival .boss-title").waitFor({ state: "visible", timeout: 3000 });
  assert.match(await page.locator(".boss-title").innerText(), /首领压阵/, "boss wave should show its dedicated entrance title");

  // Verify real combat outcomes, not just that the buttons can be clicked.
  const readFight = () => page.evaluate(() => eval("({round:fight.round,phase:fight.phase,enemyHp:fight.enemies[0].hp,actor:fight.actor,energy:fight.allies.map(x=>x.energy),shield:fight.allies.map(x=>x.shield),acted:fight.acted.length})"));
  const hpBefore = await page.evaluate(() => eval("fight.enemies[0].hp"));
  await page.locator('.warrior[data-side="enemy"][data-index="0"]').click();
  assert.ok((await page.locator('.warrior[data-side="enemy"][data-index="0"]').getAttribute("class")).includes("targeted"), "clicked enemy should become the selected target");
  await page.locator('button[onclick="basicAttack()"]').click();
  await page.locator(".impact-burst").waitFor({state:"visible",timeout:2000});
  await page.waitForTimeout(900);
  const afterAttack = await readFight();
  assert.ok(afterAttack.enemyHp < hpBefore, "basic attack must reduce the selected enemy HP");

  // A distinct hero skill must spend energy and produce a combat effect.
  await page.locator('button[onclick="selectActor(1)"]').click();
  await page.evaluate(() => { fight.allies[1].skill = "麒麟奇谋"; fight.allies[1].energy = 5; drawBattle(); });
  const skillBefore = await readFight();
  await page.evaluate(() => { document.querySelector('button[onclick="useHeroSkill()"]').click(); selectActor(2); });
  assert.equal(await page.evaluate(() => fight.actor), 1, "actor switching must be locked while a skill animation is running");
  await page.waitForTimeout(1500);
  assert.equal(await page.evaluate(() => fight.actor), 2, "the next living ally should become active after the skill finishes");
  assert.match(await page.locator(".combat-log").innerText(), /麒麟奇谋/, "skill execution must be written to the combat log");
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
  assert.ok(await page.evaluate(() => fight.logs.some(x => /攻击|强攻|破阵杀招/.test(x))) || afterEnemyTurn.phase === "end", "when all player action points are spent, enemy AI must actually attack or the battle must end");
  const markedEnemyTarget = await page.locator(".warrior.ai-targeted").count();
  assert.ok(markedEnemyTarget >= 1 || afterEnemyTurn.phase === "end", "enemy AI should visibly mark the ally it has selected as its target");
  if (markedEnemyTarget) {
    const telegraph = await page.locator(".warrior.ai-targeted").first().evaluate(el => ({ content: getComputedStyle(el, "::before").content, animation: getComputedStyle(el, "::before").animationName }));
    assert.notEqual(telegraph.content, "none", "enemy target should render a visible telegraph ring");
    assert.equal(telegraph.animation, "enemyLockRing", "enemy target ring should use its dedicated animation");
  }

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


  // Exercise real home-screen service buttons and confirm their modals/actions work.
  await page.evaluate(() => closeModal());
  await page.locator('button[data-p="home"]').click();
  await page.evaluate(() => eval("s.gold=100000;s.food=100000;s.wood=100000;s.iron=100000;s.eventDay=null"));
  for (const [handler, heading] of [
    ["cityGovernance()", "民心与治安"],
    ["cityEdicts()", "新野政令"],
    ["cityOffices()", "内政任命"],
    ["tavern()", "招贤馆"],
    ["forge()", "百炼工坊"],
    ["sideQuest()", "支线委托"]
  ]) {
    const control = page.locator('button[onclick="' + handler + '"]');
    assert.equal(await control.count(), 1, "home service button should exist: " + handler);
    await control.click();
    assert.ok((await page.locator("#modal").innerText()).includes(heading), "service should open the correct modal: " + handler);
    await page.evaluate(() => closeModal());
  }

  // Rations are located in troop management, not on the home page.
  await page.locator('button[data-p="army"]').click();
  await page.locator('button[onclick="rations()"]').click();
  assert.ok((await page.locator("#modal").innerText()).includes("军粮制度"), "army page should expose the rations panel");
  await page.evaluate(() => { closeModal(); go("home"); });
  await page.locator('button.tile[onclick="randomEvent()"]').waitFor({ state: "visible", timeout: 3000 });

  // Resolve a random event through its visible choice button and verify persistent state.
  await page.locator('button.tile[onclick="randomEvent()"]').click();
  assert.ok((await page.locator("#modal").innerText()).includes("城中奇遇"), "random event should open from home");
  const eventCountBefore = await page.evaluate(() => eval("s.eventCount||0"));
  await page.locator('button[onclick="chooseEvent(0)"]').click();
  assert.equal(await page.evaluate(() => eval("s.eventCount")), eventCountBefore + 1, "visible event choice should resolve and update event count");

  // Check the mobile viewport does not introduce horizontal page overflow.
  const mobileLayout = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    content: document.documentElement.scrollWidth
  }));
  assert.ok(mobileLayout.content <= mobileLayout.viewport + 2, "mobile layout should not overflow horizontally: " + JSON.stringify(mobileLayout));

  // The local save should be written and survive a browser reload.
  const saved = await page.evaluate(() => localStorage.getItem("hxsg_save_v4"));
  assert.ok(saved, "game should persist a local save");
  await page.reload();
  await page.waitForTimeout(500);
  const restored = await page.evaluate(() => ({ heading: document.querySelector("#heading")?.innerText, view: document.querySelector("#view")?.innerText, save: localStorage.getItem("hxsg_save_v4")?.length || 0 }));
  console.log("RESTORE_DIAGNOSTIC", JSON.stringify({ ...restored, pageErrors }));
  assert.ok(restored.heading && restored.view && restored.view.trim().length > 20, "game should recover after reload");
  assert.deepEqual(pageErrors, [], "browser runtime must not throw uncaught JavaScript errors");

  console.log(JSON.stringify({ result: "PASS", navigationTabs: 6, storyDialogueSteps: dialogueSteps, homeServicesTested: 9, randomEventChoice: "PASS", mobileLayout: "PASS", battle: { bothSidesRendered: true, targetSelection: "PASS", basicAttackDamage: hpBefore - afterAttack.enemyHp, skillEnergySpent: skillBefore.energy[1] - afterSkill.energy[1], defendShieldAdded: afterDefend.shield[2] - shieldBefore, enemyTurn: afterEnemyTurn.phase === "end" ? "battle-ended" : "round-" + afterEnemyTurn.round }, saveReload: "PASS", pageErrors }, null, 2));
  await browser.close();
  await new Promise(resolve => server.close(resolve));
})().catch(error => { console.error(error); process.exit(1); });
