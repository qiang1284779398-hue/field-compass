const { chromium } = require("playwright");
const path = require("node:path");
const fs = require("node:fs");
const http = require("node:http");
const assert = require("node:assert/strict");

(async () => {
  const html = fs.readFileSync(path.resolve("app/src/main/assets/index.html"), "utf8");
  const hero3d = fs.readFileSync(path.resolve("app/src/main/assets/hero3d.js"), "utf8");
  for (const f of ["liu-bei.glb","guan-yu.glb","zhang-fei.glb"]) assert.ok(fs.existsSync(path.resolve("app/src/main/assets/characters",f)), "generated rigged model must exist: "+f);
  for (const f of ["three.min.js","GLTFLoader.js","SkeletonUtils.js"]) assert.ok(fs.existsSync(path.resolve("app/src/main/assets/vendor",f)), "offline 3D runtime must be bundled: "+f);
  assert.ok(hero3d.includes("THREE.GLTFLoader") && hero3d.includes("THREE.SkeletonUtils") && hero3d.includes("AnimationMixer"), "real skinned GLB models use skeleton cloning and animation mixers");
  assert.ok(html.includes("class=\"body-art\""), "battle actors must expose 3D model anchors");
  assert.ok(html.includes("data-hero3d") && html.includes("initHero3D"), "3D rigged hero anchors are integrated");
  assert.ok(html.includes("characters/guan-yu.glb") || html.includes("guan-yu"), "Guan Yu 3D model identity is wired");
  assert.ok(html.includes("zhang-fei"), "Zhang Fei 3D model identity is wired");
  assert.ok(html.includes("hero3d-layer") && html.includes("hero3d-ready"), "3D-only renderer must attach and mark loaded models");
  assert.ok(html.includes("@keyframes weaponSweep"), "battle art upgrade: @keyframes weaponSweep");
  assert.ok(hero3d.includes("AnimationMixer"), "3D actors must use skeletal animation mixers");
  assert.ok(html.includes("hero-guan"), "battle art upgrade: hero-guan");
  assert.ok(html.includes("hero-zhang"), "battle art upgrade: hero-zhang");
  assert.ok(html.includes("hero-liu"), "battle art upgrade: hero-liu");
  const assetRoot = path.resolve("app/src/main/assets");
  const mime = { ".html":"text/html; charset=utf-8", ".js":"text/javascript; charset=utf-8", ".glb":"model/gltf-binary", ".ogg":"audio/ogg" };
  const server = http.createServer((req, res) => {
    const pathname = decodeURIComponent(new URL(req.url, "http://127.0.0.1").pathname);
    const relative = pathname === "/" ? "index.html" : pathname.startsWith("/") ? pathname.slice(1) : pathname;
    const file = path.resolve(assetRoot, relative);
    if (file !== assetRoot && !file.startsWith(assetRoot + path.sep)) { res.writeHead(403); return res.end(); }
    if (!fs.existsSync(file) || !fs.statSync(file).isFile()) { res.writeHead(404); return res.end("not found"); }
    res.writeHead(200, { "content-type": mime[path.extname(file)] || "application/octet-stream" });
    fs.createReadStream(file).pipe(res);
  });
  await new Promise(resolve => server.listen(4173, "127.0.0.1", resolve));
  const browser = await chromium.launch({ headless: true, args: ["--enable-webgl", "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
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
  await page.locator("#battleScene .hero3d-layer").waitFor({ state: "attached", timeout: 5000 });
  await page.waitForFunction(() => document.querySelectorAll("#battleScene .warrior.hero3d-ready").length >= 1, { timeout: 15000 });
  const rigStatus = await page.evaluate(() => window.__hero3dStatus ? window.__hero3dStatus() : []);
  assert.ok(rigStatus.some(x => x.ready && x.skinnedMeshes > 0 && x.bones >= 20 && x.clips >= 3), "loaded heroes must contain real skinned meshes, a humanoid skeleton and multiple animation clips");
  // Save visual evidence while the first battle is actually on screen.
  const evidenceDir = path.resolve("artifacts");
  fs.mkdirSync(evidenceDir, { recursive: true });
  await page.waitForFunction(() => { const a=window.__hero3dStatus?.()||[]; return ["liu-bei","guan-yu","zhang-fei"].every(id=>a.some(x=>x.id===id&&x.ready)); }, { timeout: 90000 });
  await page.waitForTimeout(1200);
  await page.locator("#battleScene").screenshot({ path: path.join(evidenceDir, "battle-scene.png") });
  await page.locator("#battleScene .hero3d-layer").screenshot({ path: path.join(evidenceDir, "battle-3d-layer.png") });
  fs.writeFileSync(path.join(evidenceDir, "battle-model-status.json"), JSON.stringify({
    capturedAt: new Date().toISOString(),
    scene: await page.locator("#battleScene").evaluate(el => ({ width: el.clientWidth, height: el.clientHeight })),
    models: rigStatus,
    visibleReadyWarriors: await page.locator("#battleScene .warrior.hero3d-ready").count(),
    hero3dCanvas: await page.locator("#battleScene canvas.hero3d-layer").count(),
    hero3dCanvasSize: await page.locator("#battleScene canvas.hero3d-layer").evaluate(el => ({width:el.width,height:el.height,webgl:!!(el.getContext("webgl")||el.getContext("webgl2"))}))
  }, null, 2));
  assert.ok(await page.locator("#battleScene canvas.hero3d-layer").count() === 1, "actual WebGL hero canvas must be attached to the battle scene");
  assert.ok(rigStatus.length >= 3 && ["liu-bei","guan-yu","zhang-fei"].every(id => rigStatus.some(x => x.id === id && x.ready && x.skinnedMeshes > 0 && x.bones >= 20 && x.clips >= 3)), "Liu Bei, Guan Yu and Zhang Fei must all finish loading their rigged models");
  assert.ok(await page.locator("#battleScene .warrior.hero3d-ready").count() >= 3, "at least three battlefield warriors must be marked as using loaded 3D models");
  assert.match(await page.locator(".skill-panel").innerText(), /仁德济世|目标范围|消耗/, "battle screen must show the selected hero skill description, energy cost, and target range");
  assert.ok(await page.locator("#battleScene .warrior[data-side=ally]").count() >= 1, "friendly units should appear on battlefield");
  assert.ok(await page.locator("#battleScene .warrior[data-side=enemy]").count() >= 1, "enemy units should appear on battlefield");
  assert.equal(await page.locator("#battleScene canvas.battle-3d-canvas").count(), 1, "2.5D canvas scene must be present");
  const canvasInfo = await page.locator("#battleScene canvas.battle-3d-canvas").evaluate(el => ({width:el.width,height:el.height,context:!!el.getContext("2d"),rendering:getComputedStyle(el).imageRendering}));
  assert.ok(canvasInfo.width>=300 && canvasInfo.height>=250 && canvasInfo.context && canvasInfo.rendering!=="pixelated", "2.5D battlefield must render at device resolution without pixel interpolation");
  const actorMarkup = await page.evaluate(() => ["刘备","关羽","张飞"].map((name,i) => renderWarrior({name,hp:100,max:100,alive:true,troop:"骑兵",status:{}},i,"ally")));
  for (const [index,heroId] of ["liu-bei","guan-yu","zhang-fei"].entries()) {
    assert.ok(actorMarkup[index].includes('data-hero3d="'+heroId+'"'), heroId+" must be connected to its actual GLB model");
    assert.ok(actorMarkup[index].includes('class="body-art" aria-hidden="true"></div>'), heroId+" must not fall back to a paper-doll/vector character");
  }
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
  await page.evaluate(() => { fight.allies[1].alive = true; fight.allies[1].hp = Math.max(1, fight.allies[1].max); fight.allies[1].skill = "魏武雄略"; fight.allies[1].energy = 5; fight.acted = fight.acted.filter(i => i !== 1); fight.enemies[0].alive = true; fight.enemies[0].hp = fight.enemies[0].max; fight.enemies[0].shield = 0; fight.enemies[0].status = {}; fight.target = 0; drawBattle(); });
  const skillBefore = await readFight();
  const skillLockProbe = await page.evaluate(() => { fight.phase = "player"; fight.actionRunning = false; fight.actor = 1; fight.acted = fight.acted.filter(i => i !== 1); fight.allies[1].alive = true; fight.allies[1].hp = Math.max(1, fight.allies[1].max); fight.allies[1].skill = "魏武雄略"; fight.allies[1].energy = 5; const before = { phase: fight.phase, actor: fight.actor, acted: fight.acted.slice(), hero: { alive: fight.allies[1].alive, hp: fight.allies[1].hp, max: fight.allies[1].max, energy: fight.allies[1].energy } }; window.__qaSkillRun = useHeroSkill(); const locked = fight.actionRunning; selectActor(2); return { before, locked, actorAfterAttempt: fight.actor, logs: fight.logs.slice(-2) }; });
  assert.equal(skillLockProbe.locked, true, "skill execution must hold the action lock during its animation: " + JSON.stringify(skillLockProbe));
  assert.equal(skillLockProbe.actorAfterAttempt, 1, "actor switching must be locked in the same task while a skill animation is running");
  await page.evaluate(() => window.__qaSkillRun);
  assert.equal(await page.evaluate(() => fight.actor), 2, "the next living ally should become active after the skill finishes");
  assert.match(await page.locator(".combat-log").innerText(), /魏武雄略/, "skill execution must be written to the combat log");
  const afterSkill = await readFight();
  assert.ok(afterSkill.energy[1] < skillBefore.energy[1], "hero skill must consume energy");

  // Regression: exercise every dedicated skill branch, not only the generic buff skill.
  const skillCases = ["仁德济世","八阵图","赤壁烈焰","魏武雄略","闭月迷魂","燕人咆哮","青龙偃月","麒麟奇谋","七进七出","方天乱舞","百步穿杨","恶来护主","破军斩"];
  for (const skillName of skillCases) {
    const result = await page.evaluate(async (name) => {
      fight.phase = "player"; fight.actionRunning = false; fight.actor = 0; fight.acted = [];
      fight.allies[0].alive = true; fight.allies[0].hp = fight.allies[0].max;
      fight.allies[0].skill = name; fight.allies[0].skillLv = 1; fight.allies[0].energy = 5;
      fight.enemies.forEach(e => { e.alive = true; e.hp = 50000; e.max = 50000; e.shield = 0; e.status = {}; });
      if (name === "青龙偃月" && fight.enemies.length < 2) fight.enemies.push(Object.assign({}, fight.enemies[0], { name: "测试副将", hp: 50000, max: 50000, alive: true, shield: 0, status: {} }));
      fight.target = 0; fight.logs = [];
      const energyBefore = fight.allies[0].energy;
      const enemyHpBefore = fight.enemies.slice(0,2).map(e => e.hp);
      await useHeroSkill();
      if (name === "青龙偃月") {
        if (!fight.skillTargetMode) throw new Error("Qinglong must enter explicit target-selection mode");
        selectTarget(0); selectTarget(1);
        if (fight.skillTargetSelection.length !== 2) throw new Error("Qinglong must allow two independently selected targets");
        await useHeroSkill();
      }
      return { energySpent: energyBefore - fight.allies[0].energy, logs: fight.logs.slice(), actor: fight.actor, phase: fight.phase, actionRunning: fight.actionRunning, acted: fight.acted.slice(), enemyHpBefore, enemyHpAfter: fight.enemies.slice(0,2).map(e => e.hp), skillTargetMode: fight.skillTargetMode };
    }, skillName);
    assert.ok(result.energySpent > 0, skillName + " must spend energy");
    assert.ok(result.logs.some(line => line.includes(skillName)), skillName + " must write a skill-specific combat log: " + JSON.stringify(result));
    assert.equal(result.actionRunning, false, skillName + " must release the action lock");
    assert.equal(result.phase, "player", skillName + " must not unexpectedly leave the player phase");
    assert.ok(result.acted.includes(0), skillName + " must consume the acting hero's action exactly once");
    if (skillName === "青龙偃月") {
      assert.equal(result.skillTargetMode, false, "Qinglong target-selection mode must close after confirmation");
      assert.ok(result.enemyHpAfter[0] < result.enemyHpBefore[0] && result.enemyHpAfter[1] < result.enemyHpBefore[1], "Qinglong must damage both manually selected enemies");
      assert.ok(result.logs.some(line => line.includes("横扫2名指定敌军")), "Qinglong combat log must report two selected targets");
    }
  }
  await page.evaluate(() => { fight.phase = "player"; fight.actionRunning = false; fight.skillTargetMode = false; fight.skillTargetSelection = []; fight.actor = 2; fight.acted = [0,1]; drawBattle(); });

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
