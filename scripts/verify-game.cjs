const fs = require("node:fs");
const assert = require("node:assert/strict");

const html = fs.readFileSync("app/src/main/assets/index.html", "utf8");
const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>/);
assert.ok(scriptMatch, "game script block missing");
const source = scriptMatch[1];
new Function(source);

const chapterMatch = source.match(/const CHAPTERS=(\[[\s\S]*?\n\]);\nconst EVENTS=/);
assert.ok(chapterMatch, "chapter data missing");
const chapters = new Function("return " + chapterMatch[1])();
assert.equal(chapters.length, 30, "campaign must contain 30 chapters");
assert.ok(chapters.every(c => c.title && c.intro && c.dialog.length >= 3 && c.boss && c.sideText), "each chapter needs complete story, dialogue, boss and side quest");

const eventMatch = source.match(/const EVENTS=(\[[\s\S]*?\n\]);\nfunction fresh/);
assert.ok(eventMatch, "random event data missing");
const events = new Function("return " + eventMatch[1])();
assert.ok(events.length >= 20, "at least 20 distinct random events required");

for (const animation of ["chargeRight", "chargeLeft", "castHero", "bodyHit", "slash", "auraBurst", "bossWave", "damageUp"]) {
  assert.ok(html.includes("@keyframes " + animation), "missing combat animation: " + animation);
}
assert.ok(source.includes("function renderWarrior"), "battlefield unit renderer missing");
assert.ok(source.includes("function animateHit"), "player attack animation missing");
assert.ok(source.includes("function animateEnemyHit"), "enemy attack animation missing");
assert.ok(source.includes("function playBossFx"), "boss skill animation missing");
assert.ok(source.includes("function startMusic"), "offline soundtrack controller missing");
assert.ok(source.includes("function toggleMusic"), "music toggle control missing");
assert.ok(source.includes("function playSfx"), "combat sound effect controller missing");
for (const track of ["theme_plain.ogg", "theme_lost_village.ogg", "theme_dream.ogg", "theme_swamp.ogg", "swing.ogg", "hit.ogg", "critical.ogg"]) assert.ok(html.includes(track), "missing audio asset reference: " + track);

const makeElement = () => ({
  style: {}, dataset: { p: "home" },
  classList: { add() {}, remove() {}, toggle() {} },
  appendChild() {}, remove() {}, setAttribute() {},
  innerHTML: "", textContent: "", value: "0"
});
const elements = new Map();
const documentMock = {
  getElementById(id) { if (!elements.has(id)) elements.set(id, makeElement()); return elements.get(id); },
  querySelectorAll() { return Array.from({ length: 6 }, makeElement); },
  querySelector() { return null; },
  createElement() { return makeElement(); },
  body: makeElement()
};
const memory = new Map();
const storage = {
  getItem(key) { return memory.get(key) || null; },
  setItem(key, value) { memory.set(key, value); },
  removeItem(key) { memory.delete(key); }
};
const game = new Function("document", "localStorage", "window", "setTimeout", "clearTimeout", "confirm",
  source + "\nreturn {state:()=>s,fight:()=>fight,go,buildings,upgradeBuilding,startChapter,storyNext,chapterChoice,basicAttack,selectActor,selectTarget,chooseTarget,useHeroSkill,defendAction,finishBattle,randomEvent,chooseEvent,tavern,recruitHero,makeItem,heroAtk,equipHero,equipItemTo,forge,craftItem,sideQuest,finishSideQuest,trainArmy,claimDaily,costText,worldPage,inspectRegion,exploreRegion,resolveRegionChoice,establishOutpost,abandonOutpost,raidOutpost,resolveOutpostRaid,connectOutposts,nextDay,assaultRegion,resolveTerritoryAssault,prepareSiege,reinforceOutpost,unitEffectiveness,isRegionAdjacent};"
)(documentMock, storage, {}, fn => { fn(); return 1; }, () => {}, () => true);

assert.equal(game.state().heroes.length, 3, "new game should start with a complete three-hero formation");
game.go("world");
assert.ok(elements.get("view").innerHTML.includes("天下舆图 · 郡县经营"), "world map should show the exploration layer");
const foodBeforeExplore = game.state().food;
game.inspectRegion(0);
game.exploreRegion(0);
assert.ok(elements.get("modal").innerHTML.includes("探索遭遇"), "exploration should open a narrative encounter");
game.resolveRegionChoice(0);
assert.ok(game.state().explored.includes(0), "region exploration should persist in save state");
assert.equal(game.state().food, foodBeforeExplore - 45 + 100, "rescuing villagers in a bandit encounter should reward grain after travel cost");
assert.ok(elements.get("view").innerHTML.includes("已探索"), "explored regions should be marked on the map");
game.inspectRegion(0);
game.exploreRegion(0);
assert.equal(game.state().explored.length, 1, "a region must not grant its discovery reward twice");
const woodBeforeOutpost = game.state().wood;
const infantryBeforeOutpost = game.state().army.inf;
game.establishOutpost(0);
assert.equal(game.state().territories[0], true, "explored region should become a controlled outpost");
assert.equal(game.state().wood, woodBeforeOutpost - 120, "outpost construction should consume wood");
assert.equal(game.state().army.inf, infantryBeforeOutpost - 100, "outpost construction should assign garrison troops");
const woodBeforeDay = game.state().wood;
game.nextDay();
assert.equal(game.state().wood, woodBeforeDay + 12, "controlled outpost should generate daily wood");
assert.ok(game.state().food >= 0, "outpost upkeep should be included in daily food settlement");
game.state().wall = 3;
game.establishOutpost(0);
const infantryBeforeRaid = game.state().army.inf;
const foodBeforeRaid = game.state().food;
game.raidOutpost(0);
assert.ok(elements.get("modal").innerHTML.includes("敌军来袭"), "controlled outpost should expose a raid encounter");
game.resolveOutpostRaid(0);
assert.equal(game.state().territories[0], true, "strong defenses should repel an outpost raid");
assert.equal(game.state().army.inf, infantryBeforeRaid - 50, "repelling a raid should consume garrison reinforcements");
assert.equal(game.state().food, foodBeforeRaid - 30, "repelling a raid should consume supplies");
game.state().territories[1] = true;
game.state().gold = 500;
game.state().wood = 500;
game.connectOutposts(0, 1);
assert.equal(game.state().supplyRoutes.length, 1, "adjacent controlled outposts should be linkable");
const routeWoodBefore = game.state().wood;
const routeFoodBefore = game.state().food;
game.nextDay();
assert.equal(game.state().wood, routeWoodBefore + 29, "two controlled outposts and one supply line should generate 29 daily wood");
assert.equal(game.state().food, routeFoodBefore + game.state().build.farm * 65 + 8 - Math.ceil((game.state().army.inf + game.state().army.cav + game.state().army.arch) * .08) - 25, "supply line should add food and reduce upkeep by five");
game.abandonOutpost(0);
assert.equal(!!game.state().territories[0], false, "outpost can be abandoned");
assert.equal(game.isRegionAdjacent(0, 2), true, "map road network should include a valid alternate road");
assert.equal(game.isRegionAdjacent(0, 3), false, "map road network should reject non-adjacent regions");
game.state().explored.push(2, 3);
game.state().army = { inf: 1000, cav: 1000, arch: 1000 };
game.state().enemyGarrisons[2] = { inf: 15, cav: 8, arch: 10, fort: 1 };
game.inspectRegion(2);
assert.ok(elements.get("modal").innerHTML.includes("黄巾余部控制"), "unconquered region should identify its hostile faction");
game.assaultRegion(2);
assert.ok(elements.get("modal").innerHTML.includes("步兵主攻"), "frontier assault should expose tactical unit choices");
assert.ok(game.unitEffectiveness("inf", "cav") > game.unitEffectiveness("inf", "arch"), "infantry should counter cavalry");
assert.ok(game.unitEffectiveness("cav", "arch") > game.unitEffectiveness("cav", "inf"), "cavalry should counter archers");
assert.ok(game.unitEffectiveness("arch", "inf") > game.unitEffectiveness("arch", "cav"), "archers should counter infantry");
assert.equal(game.resolveTerritoryAssault(2, "inf"), true, "strong attacking force should capture the frontier region");
assert.equal(game.state().regionControl[2], "player", "victory should transfer regional control");
assert.equal(game.state().enemyGarrisons[2], undefined, "captured region should no longer retain an enemy garrison");
assert.ok(game.state().fame >= 8, "territory victory should award prestige");
game.state().explored.push(4);
game.state().enemyGarrisons[4] = { inf: 20, cav: 10, arch: 12, fort: 2 };
game.state().wood = 500;
game.state().iron = 500;
game.state().gold = 500;
game.state().food = 500;
game.prepareSiege(4);
assert.equal(game.state().siegePlans[4], true, "siege preparation should consume resources and persist its plan");
assert.ok(elements.get("modal").innerHTML.includes("攻城器械已备妥"), "prepared siege should be reflected in assault briefing");
game.resolveTerritoryAssault(4, "cav");
assert.equal(game.state().siegePlans[4], false, "siege plan should be consumed after the assault");
game.state().territories[1] = true;
game.state().army.inf = 300;
game.state().food = 500;
game.reinforceOutpost(1, "inf");
assert.equal(game.state().outpostGarrisons[1].inf, 25, "outpost reinforcement should persist the assigned infantry");

assert.equal(game.costText({ wood: 100, gold: 70 }), "木100 / 金70", "building costs must render correctly");
game.go("daily");
assert.ok(elements.get("view").innerHTML.includes("六项常务"), "daily mission page should open");

game.state().gold = 10000;
game.state().food = 10000;
game.state().wood = 10000;
game.state().iron = 10000;
game.state().jade = 1000;
game.trainArmy();
assert.equal(game.state().daily.progress.train, 1, "training should progress daily command");
game.buildings();
game.upgradeBuilding("farm");
assert.equal(game.state().daily.progress.upgrade, 1, "building upgrade should progress daily command");

game.startChapter(0);
game.storyNext();
game.storyNext();
game.storyNext();
game.chapterChoice(0);
assert.ok(game.fight(), "chapter choice should start combat");
assert.equal(game.fight().waves, 3, "chapter combat should have three waves");
assert.ok(elements.get("view").innerHTML.includes("class=\"body-art\""), "battle should render sprite-based combatants");
assert.ok(elements.get("view").innerHTML.includes("onclick=\"selectTarget("), "enemy units should expose selectable targets");
game.selectTarget(1);
assert.equal(game.chooseTarget(), 1, "single-target attacks should follow the selected enemy");

(async () => {
  await game.basicAttack();
  game.selectActor(1);
  await game.useHeroSkill();
  assert.equal(game.fight().acted.length, 2, "each player action should be recorded once");
  assert.ok(game.fight(), "combat state should remain valid after player actions");

  game.fight().phase = "end";
  game.fight().win = true;
  game.finishBattle();
  assert.equal(game.state().story, 1, "victory should unlock next chapter");
  assert.equal(game.state().daily.progress.battle, 1, "victory should progress daily command");

  game.go("home");
  game.randomEvent();
  game.chooseEvent(1);
  const eventCount = game.state().eventCount;
  game.randomEvent();
  assert.equal(game.state().eventCount, eventCount, "random event should be limited to once per in-game day");
  assert.equal(game.state().daily.progress.event, 1, "event should progress daily command");

  game.tavern();
  game.recruitHero();
  assert.equal(game.state().daily.progress.recruit, 1, "recruitment should progress daily command");

  game.state().items.push(game.makeItem("QA 精钢剑", "weapon", 35));
  const oldAttack = game.heroAtk(game.state().heroes[1]);
  game.equipHero(1);
  game.equipItemTo(2, 1);
  assert.ok(game.heroAtk(game.state().heroes[1]) > oldAttack, "equipped weapon should affect hero attack");

  game.forge();
  game.craftItem("weapon");
  assert.ok(game.state().items.some(x => x.name === "百炼环首刀"), "forging should create an item");

  game.sideQuest();
  game.finishSideQuest();
  assert.equal(game.state().daily.progress.side, 1, "side quest should progress daily command");

  game.claimDaily("side", 150);
  assert.ok(game.state().daily.claimed.includes("side"), "daily reward should be claimable once");

  console.log("Game QA passed:", {
    chapters: chapters.length,
    randomEvents: events.length,
    heroes: game.state().heroes.length,
    battleWaves: 3,
    gameHtmlBytes: Buffer.byteLength(html),
    tested: ["startup","city","daily missions","story","battle","skills","events","region exploration, branching encounter, outpost control and daily economy","recruitment","equipment","forging","side quests","rewards"]
  });
})().catch(error => { console.error(error); process.exitCode = 1; });
