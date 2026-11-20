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
  source + "\nreturn {state:()=>s,fight:()=>fight,go,buildings,upgradeBuilding,startChapter,storyNext,chapterChoice,basicAttack,selectActor,selectTarget,chooseTarget,useHeroSkill,defendAction,finishBattle,randomEvent,chooseEvent,tavern,recruitHero,makeItem,heroAtk,equipHero,equipItemTo,forge,craftItem,sideQuest,finishSideQuest,trainArmy,claimDaily,costText};"
)(documentMock, storage, {}, fn => { fn(); return 1; }, () => {}, () => true);

assert.equal(game.state().heroes.length, 3, "new game should start with a complete three-hero formation");
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

  game.claimDaily("train", 100);
  assert.ok(game.state().daily.claimed.includes("train"), "daily reward should be claimable once");

  console.log("Game QA passed:", {
    chapters: chapters.length,
    randomEvents: events.length,
    heroes: game.state().heroes.length,
    battleWaves: 3,
    gameHtmlBytes: Buffer.byteLength(html),
    tested: ["startup","city","daily missions","story","battle","skills","events","recruitment","equipment","forging","side quests","rewards"]
  });
})().catch(error => { console.error(error); process.exitCode = 1; });
