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
assert.ok(source.includes("function beginTerritoryBattle"), "frontier conquests should use the playable battle engine");
assert.ok(source.includes("function makeTerritoryWave"), "frontier battles should generate staged enemy formations");
assert.ok(source.includes("suppressed=(troop.includes(\"弓\")||troop.includes(\"弩\"))&&Math.random()<.24"), "archers should have a chance to suppress hero energy");
assert.ok(source.includes("enemyFaction")||source.includes("factionForRegion"), "enemy faction data should exist");
assert.ok(source.includes("campRecovery=Math.min(s.wounded||0,4+Math.floor((s.morale||0)/25))"), "daily camp recovery should heal wounded troops based on morale");
assert.ok(source.includes("function applyStatus"), "battle status engine missing");
assert.ok(source.includes("function tickUnitStatuses"), "status turn resolution missing");
for (const effect of ["burn","poison","bleed","armorBreak","slow","disarm","stun"]) assert.ok(source.includes('"'+effect+'"'), "missing status effect: "+effect);
assert.ok(source.includes("function statusText"), "unit status feedback missing");
assert.ok(source.includes("步阵协同") && source.includes("骑兵协同") && source.includes("远程协同"), "troop formation synergy missing");
assert.ok(source.includes("识破破绽，追击重伤目标") && source.includes("掩护己方远程部队"), "enemy tactical behavior missing");
assert.ok(source.includes('name==="青龙偃月"') && source.includes('name==="麒麟奇谋"'), "signature hero skills missing");
assert.ok(source.includes("skillCostReduction"), "strategist skill cost synergy missing");
assert.ok(html.includes("terrain-2:before") && html.includes("terrain-3:before"), "terrain battlefield visuals missing");
assert.ok(source.includes("突袭我军弓弩手"), "enemy cavalry should flank the backline");
assert.ok(source.includes("军心崩溃，弃械溃逃"), "enemy morale collapse and rout missing");
assert.ok(source.includes("异常状态已消退"), "status expiration feedback missing");
assert.ok(source.includes("掩护己方远程部队"), "enemy guard unit protection tactic missing");
assert.ok(source.includes("护盾抵消"), "shield damage feedback missing");

const declaredFunctions = new Set([...source.matchAll(/function\\s+([A-Za-z_$][\\w$]*)\\s*\\(/g)].map(x => x[1]));
const inlineHandlerNames = [...html.matchAll(/onclick="([^"]+)"/g)].map(m => {
  const hit = m[1].match(/^\\s*([A-Za-z_$][\\w$]*)\\s*\\(/);
  return hit && hit[1];
}).filter(Boolean).filter(name => name !== "if");
const missingHandlers = [...new Set(inlineHandlerNames)].filter(name => !declaredFunctions.has(name));
assert.deepEqual(missingHandlers, [], "every static inline button handler must resolve to a game function");


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
const windowMock = {};
const game = new Function("document", "localStorage", "window", "setTimeout", "clearTimeout", "confirm",
  source + "\nreturn {state:()=>s,fight:()=>fight,go,buildings,upgradeBuilding,startChapter,storyNext,chapterChoice,basicAttack,selectActor,selectTarget,chooseTarget,useHeroSkill,defendAction,finishBattle,randomEvent,chooseEvent,tavern,recruitHero,makeItem,heroAtk,heroDef,equipHero,equipItemTo,forge,craftItem,sideQuest,finishSideQuest,trainArmy,claimDaily,costText,worldPage,inspectRegion,exploreRegion,resolveRegionChoice,establishOutpost,abandonOutpost,raidOutpost,resolveOutpostRaid,connectOutposts,nextDay,assaultRegion,resolveTerritoryAssault,prepareSiege,reinforceOutpost,upgradeOutpost,unitEffectiveness,isRegionAdjacent,beginTerritoryBattle,checkBattleEnd,regionTerrain,terrainDefenseMultiplier,terrainAttackMultiplier,terrainSceneClass,sendFactionEnvoy,resolveEnemyWorldTurn,setBattleStance,cityEdicts,setCityEdict,cityOffices,appointCityOfficer,dismissCityOfficer,cityOfficerEffects,cityGovernance,runCityAction,reduceCityTax,settleCityGovernance,ensureHeroPolitics,heroRelationScore,improveHeroRelation,rewardHeroLoyalty,driftHeroLoyalty,prepareFieldTactic,resolvePendingSiege,ensureSpyNetwork,scoutEnemyRegion,sabotageEnemySupply,factionForRegion,enemyCommander,siegeCost};"
)(documentMock, storage, windowMock, fn => 1, () => {}, () => true);

assert.equal(game.state().heroes.length, 3, "new game should start with a complete three-hero formation");
game.go("world");
assert.ok(elements.get("view").innerHTML.includes("天下舆图 · 群雄割据"), "world map should show the exploration layer");
assert.ok(elements.get("view").innerHTML.includes("六方割据"), "world map should show all six rival factions");
assert.equal(game.factionForRegion(3).id, "xiliang", "Luoyang should belong to the Xiliang faction");
assert.equal(game.enemyCommander(3), "董卓", "Xiliang capital region should have a named commander");
assert.ok(game.siegeCost(3).wood > game.siegeCost(2).wood, "major cities should require heavier siege equipment");
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
game.state().gold = 1000;
game.state().day = 10;
const relationBeforeEnvoy = game.state().factionRelations.xiliang;
game.sendFactionEnvoy(3);
assert.ok(game.state().factionRelations.xiliang > relationBeforeEnvoy, "envoy should improve faction relations");
assert.equal(game.state().factionTruces.xiliang, 13, "envoy should grant a three-day truce");
const troopsBeforeEnemyTurn = game.state().enemyGarrisons[1].inf + game.state().enemyGarrisons[1].cav + game.state().enemyGarrisons[1].arch;
game.state().territories[0] = true;
game.state().regionControl[0] = "player";
game.state().territories[1] = true;
game.state().regionControl[1] = "player";
game.state().outpostGarrisons[1] = {inf:0,cav:0,arch:0};
game.state().enemyLastActionDay = null;
game.resolveEnemyWorldTurn(true);
assert.ok(game.state().regionControl[1] === "player" || game.state().regionControl[1] === "enemy", "enemy campaign turn should resolve without corrupting territory control");
assert.ok(game.state().enemyLastActionDay === game.state().day, "enemy should act at most once per game day");
game.state().story = 2;
game.state().explored.push(4);
game.state().enemyGarrisons[4] = { inf: 20, cav: 10, arch: 12, fort: 2 };
game.state().wood = 500;
game.state().iron = 500;
game.state().gold = 500;
game.state().food = 500;
assert.equal(game.regionTerrain(4), "pass", "虎牢关 should use pass terrain");
assert.ok(game.terrainDefenseMultiplier("pass") > game.terrainDefenseMultiplier("plain"), "passes should improve defender terrain protection");
assert.ok(game.terrainAttackMultiplier("river") < game.terrainAttackMultiplier("plain"), "river crossings should reduce attacker effectiveness");
game.prepareSiege(4);
assert.equal(game.state().siegePlans[4], true, "siege preparation should consume resources and persist its plan");
assert.ok(elements.get("modal").innerHTML.includes("攻城器械已备妥"), "prepared siege should be reflected in assault briefing");
game.setBattleStance("defensive");
game.beginTerritoryBattle(4, "cav");
assert.equal(game.fight().stance, "defensive", "selected defensive formation should carry into the battle");
assert.ok(elements.get("view").innerHTML.includes("方圆阵"), "battle header should show the selected formation");
assert.ok(game.fight().allies.every(a => a.def >= game.heroDef(game.state().heroes[a.sourceIndex]) * 1.2 - 1), "defensive formation should increase every deployed hero's defense");
assert.equal(game.fight().mode, "territory", "territory assault should enter the playable battlefield mode");
assert.equal(game.fight().waves, 3, "territory conquest should contain three battle waves");
assert.ok(elements.get("view").innerHTML.includes("battle-shell"), "territory battle should render both battlefield formations");
assert.ok(elements.get("view").innerHTML.includes("terrain-3"), "mountain passes should choose the matching battlefield backdrop");
assert.ok(game.fight().logs.some(x => x.includes("关隘")), "battle report should describe the regional terrain modifier");
assert.ok(game.fight().enemies.length >= 3, "frontier vanguard should contain multiple enemy unit types");
assert.equal(game.state().siegePlans[4], false, "siege plan should be consumed when the battle begins");
game.fight().enemies.forEach(x => { x.alive = false; x.hp = 0; });
game.checkBattleEnd();
assert.equal(game.fight().wave, 2, "clearing the vanguard should deploy the enemy main force");
game.fight().enemies.forEach(x => { x.alive = false; x.hp = 0; });
game.checkBattleEnd();
assert.equal(game.fight().wave, 3, "clearing the main force should trigger the commander wave");
assert.ok(game.fight().enemies.some(x => x.boss), "the final frontier wave should contain an enemy commander");
game.fight().enemies.forEach(x => { x.alive = false; x.hp = 0; });
game.checkBattleEnd();
assert.equal(game.fight().phase, "end", "clearing the commander wave should complete the battle");
assert.equal(game.fight().win, true, "winning all three waves should win the territory battle");
game.finishBattle();
assert.equal(game.state().regionControl[4], "player", "territory victory should capture the target region");
assert.equal(game.state().story, 2, "optional territory battles must not skip main story chapters");
game.state().territories[1] = true;
game.state().army.inf = 300;
game.state().food = 500;
game.reinforceOutpost(1, "inf");
assert.equal(game.state().outpostGarrisons[1].inf, 25, "outpost reinforcement should persist the assigned infantry");
game.state().gold = 10000;
game.setCityEdict("屯田");
assert.equal(game.state().edict.id, "屯田", "city edict should persist its selected policy");
assert.equal(game.state().edict.untilDay, game.state().day + 2, "city edict should last three in-game days");
const edictFoodBefore = game.state().food;
game.nextDay();
assert.equal(game.state().food, edictFoodBefore + game.state().build.farm * 65 + game.state().supplyRoutes.filter(r=>game.state().territories[r[0]]&&game.state().territories[r[1]]).length * 8 + 50 - Math.ceil((game.state().army.inf + game.state().army.cav + game.state().army.arch) * .08) - Math.max(0,Object.keys(game.state().territories||{}).filter(k=>game.state().territories[k]).length*15-game.state().supplyRoutes.filter(r=>game.state().territories[r[0]]&&game.state().territories[r[1]]).length*5), "屯田令 should add fifty food to daily settlement");
game.setCityEdict("通商");
assert.equal(game.state().edict.id, "屯田", "active edict should not be replaced early");
game.state().day = game.state().edict.untilDay + 1;
game.setCityEdict("通商");
assert.equal(game.state().edict.id, "通商", "expired edict should be replaceable");

game.appointCityOfficer("governor", "liu");
game.appointCityOfficer("quartermaster", "guan");
game.appointCityOfficer("drillmaster", "zhang");
assert.deepEqual(game.state().cityPosts, {governor:"liu",quartermaster:"guan",drillmaster:"zhang"}, "three city offices should persist their appointed officers");
const officerEffects = game.cityOfficerEffects();
const governor = game.state().heroes.find(x => x.id === "liu");
const quartermaster = game.state().heroes.find(x => x.id === "guan");
const drillmaster = game.state().heroes.find(x => x.id === "zhang");
assert.equal(officerEffects.gold, 10 + governor.lv * 2 + governor.rarity * 5, "governor tax bonus should scale with level and rarity");
assert.equal(officerEffects.food, 15 + quartermaster.lv * 3 + quartermaster.rarity * 3, "quartermaster grain bonus should scale with level and rarity");
assert.equal(officerEffects.morale, 2 + Math.floor(drillmaster.lv / 10), "drillmaster should improve daily morale");
assert.equal(officerEffects.heal, 1 + Math.floor(drillmaster.lv / 20), "drillmaster should heal wounded soldiers each day");
game.appointCityOfficer("governor", "guan");
assert.equal(game.state().cityPosts.governor, "liu", "a hero already appointed elsewhere cannot hold a second office");
game.dismissCityOfficer("drillmaster");
assert.equal(game.state().cityPosts.drillmaster, null, "city office can be vacated");
game.state().wood = 10000;
game.state().iron = 10000;
game.state().food = 10000;
const facilityFoodBefore = game.state().food;
game.upgradeOutpost(1, "granary");
assert.equal(game.state().outpostFacilities[1].granary, 1, "granary upgrade should persist at the outpost");
game.nextDay();
const facilityOutposts = Object.keys(game.state().territories).filter(k => game.state().territories[k]).length;
const facilityRoutes = game.state().supplyRoutes.filter(r => game.state().territories[r[0]] && game.state().territories[r[1]]).length;
const expectedFacilityFood = facilityFoodBefore + game.state().build.farm * 65 + facilityRoutes * 8 + 8 + game.cityOfficerEffects().food - Math.ceil((game.state().army.inf + game.state().army.cav + game.state().army.arch) * .08) - Math.max(0, facilityOutposts * 15 - facilityRoutes * 5);
assert.equal(game.state().food, expectedFacilityFood, "granary should add eight daily food alongside farm income and upkeep");
game.upgradeOutpost(1, "wall");
assert.equal(game.state().outpostFacilities[1].wall, 1, "defensive wall upgrade should persist");
game.upgradeOutpost(1, "beacon");
assert.equal(game.state().outpostFacilities[1].beacon, 1, "beacon upgrade should persist");
game.state().day = 2;
const intelBeforeBeacon = game.state().intel;
game.nextDay();
assert.ok(game.state().intel > intelBeforeBeacon, "beacon should produce intelligence on every third day");

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

game.state().story = 0;
const battleProgressBeforeStory = game.state().daily.progress.battle || 0;
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
  assert.equal(game.state().daily.progress.battle, battleProgressBeforeStory + 1, "chapter victory should progress the daily battle command");

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

  game.ensureHeroPolitics();
  assert.ok(game.state().heroes.every(h=>h.loyalty===75),"legacy heroes should receive default loyalty");
  const firstHero=game.state().heroes[0],secondHero=game.state().heroes[1];game.state().gold=1000;
  const beforeRelation=game.heroRelationScore(firstHero.id,secondHero.id);game.improveHeroRelation(firstHero.id,secondHero.id);
  assert.equal(game.heroRelationScore(firstHero.id,secondHero.id),beforeRelation+12,"bonding should improve pair relation");
  const beforeLoyalty=firstHero.loyalty;game.rewardHeroLoyalty(0);
  assert.equal(firstHero.loyalty,beforeLoyalty+10,"stipend should raise loyalty");
  game.state().territories={"1":true};game.state().regionControl["1"]="player";game.state().outpostGarrisons={"1":{inf:50,cav:20,arch:20}};
  game.state().day=4;game.state().enemyLastActionDay=0;game.state().enemyGarrisons["0"]={inf:160,cav:70,arch:70,fort:2};
  const siegeReport=game.resolveEnemyWorldTurn(false);assert.ok(siegeReport.includes("围攻"),"enemy attack should create a siege decision");
  assert.ok(game.state().pendingSiege,"enemy attack should persist pending siege data");game.resolvePendingSiege("retreat");
  assert.equal(!!game.state().territories["1"],false,"retreat decision should relinquish the outpost");
  assert.ok(game.state().army.inf>=100,"retreat should return garrison troops to the army");
  game.state().territories={"1":true};game.state().regionControl["1"]="player";game.state().outpostGarrisons={"1":{inf:80,cav:30,arch:30}};
  game.state().pendingSiege={target:1,attackerIndex:0,factionId:"yellow",threat:10,defense:100,region:"测试关",day:game.state().day};
  game.resolvePendingSiege("defend");assert.ok(game.state().territories["1"],"successful defense should retain the outpost");
  game.state().gold=500;game.state().iron=100;game.state().food=300;game.state().fieldPlans={};game.prepareFieldTactic(1,"sabotage");
  assert.equal(game.state().fieldPlans["1"],"sabotage","sabotage should be stored for the next battle");
  game.state().gold=500;game.state().food=500;game.state().explored=[3];game.state().regionControl[3]="enemy";game.state().day=10;game.state().spyCooldowns={};game.state().spyReports={};
  game.ensureSpyNetwork();const enemyBeforeScout=Object.assign({},game.state().enemyGarrisons[3]);
  game.scoutEnemyRegion(3);assert.ok(game.state().spyReports[3],"scouting should save an enemy force report");
  assert.equal(game.state().spyReports[3].inf,enemyBeforeScout.inf,"scouting report should record the enemy infantry count");
  assert.equal(game.state().intel,Math.min(20,(game.state().intel||0)+2),"scouting should increase strategic intel");
  const goldAfterScout=game.state().gold;game.sabotageEnemySupply(3);
  const enemyAfterSabotage=game.state().enemyGarrisons[3];
  assert.ok(enemyAfterSabotage.inf+enemyAfterSabotage.cav+enemyAfterSabotage.arch<enemyBeforeScout.inf+enemyBeforeScout.cav+enemyBeforeScout.arch,"sabotage should permanently reduce enemy garrison strength");
  assert.equal(game.state().spyCooldowns[3],game.state().day+3,"sabotage should impose a three-day cooldown");
  const troopsAfterSabotage=enemyAfterSabotage.inf+enemyAfterSabotage.cav+enemyAfterSabotage.arch;
  game.sabotageEnemySupply(3);assert.equal(enemyAfterSabotage.inf+enemyAfterSabotage.cav+enemyAfterSabotage.arch,troopsAfterSabotage,"cooldown should prevent repeated sabotage");
  game.inspectRegion(3);assert.ok(elements.get("modal").innerHTML.includes("斥候情报"),"region detail should show spy intelligence");
  game.state().publicOrder=40; game.state().peopleMorale=38; game.state().gold=500; game.state().food=500; game.state().wood=100;
  game.cityGovernance();
  assert.ok(elements.get("modal").innerHTML.includes("治安"), "city governance should display public order");
  const orderBeforePatrol=game.state().publicOrder;
  game.runCityAction("patrol");
  assert.equal(game.state().publicOrder, Math.min(100,orderBeforePatrol+14), "patrol should improve public order");
  const peopleBeforeRelief=game.state().peopleMorale;
  game.runCityAction("relief");
  assert.equal(game.state().peopleMorale, Math.min(100,peopleBeforeRelief+14), "relief should improve public morale");
  game.reduceCityTax();
  assert.equal(game.state().taxReliefUntil,game.state().day+2,"tax relief should last three in-game days");
  game.state().publicOrder=20; game.state().peopleMorale=20; game.state().gold=300; game.state().day+=1;
  const unrestGold=game.state().gold;
  const unrest=game.settleCityGovernance();
  assert.ok(unrest.includes("骚乱"),"low public order and morale should trigger unrest");
  assert.ok(game.state().gold<unrestGold,"unrest should impose a real treasury penalty");
  game.go("home");
  assert.ok(elements.get("view").innerHTML.includes("民心治安"), "home screen should expose city governance");
  game.go("home");
  assert.ok(elements.get("view").innerHTML.includes("颁布政令"), "home screen should expose the city edict system");
  assert.ok(elements.get("view").innerHTML.includes("内政任命"), "home screen should expose city officer appointments");


  // Exercise the remaining core progression and inventory controls with sufficient resources.
  game.state().gold=100000;game.state().food=100000;game.state().wood=100000;game.state().iron=100000;game.state().jade=100000;
  const heroLevelBefore=game.state().heroes[0].lv;game.levelHero(0);
  assert.equal(game.state().heroes[0].lv,heroLevelBefore+1,"hero level-up should increase level");
  const skillLevelBefore=game.state().heroes[0].skillLv;game.state().tech=10;game.upgradeSkill(0);
  assert.equal(game.state().heroes[0].skillLv,skillLevelBefore+1,"skill upgrade should increase skill rank");
  const bondBefore=game.state().bond[game.state().heroes[0].id]||0;game.bondHero(0);
  assert.equal(game.state().bond[game.state().heroes[0].id],bondBefore+5,"hero bonding should increase bond");
  game.formation();elements.get("slot0").value="0";elements.get("slot1").value="1";elements.get("slot2").value="2";game.saveFormation();
  assert.deepEqual(game.state().formation,[0,1,2],"formation editor should save three distinct positions");
  const troopBefore=game.state().army.inf;game.recruitTroops("inf");
  assert.equal(game.state().army.inf,troopBefore+60,"infantry recruitment should add the stated troop count");
  game.state().wounded=80;const woundedBefore=game.state().wounded;game.healArmy();
  assert.equal(game.state().wounded,woundedBefore-60,"field hospital should heal up to sixty wounded");
  const techBefore=game.state().tech;game.research();
  assert.equal(game.state().tech,techBefore+3,"research should grant three technology points");
  const foodBeforeRations=game.state().food;game.rations();game.buyRations(250,100);
  assert.equal(game.state().food,foodBeforeRations+250,"ration purchase should add the purchased grain");
  const potionBefore=game.state().potions;game.craftPotion();
  assert.equal(game.state().potions,potionBefore+1,"potion crafting should add one potion");
  const salvage=game.makeItem("QA 拆解测试装备","weapon",20);game.state().items.push(salvage);
  const ironBeforeSalvage=game.state().iron;const salvageIndex=game.state().items.indexOf(salvage);game.salvageItem(salvageIndex);
  assert.ok(game.state().iron>ironBeforeSalvage,"salvaging an unequipped item should return iron");

  // Test both choices for every random event, not just one randomly selected event.
  let eventBranchesTested=0;
  for(const event of game.events()){
    for(const choice of [0,1]){
      const st=game.state();st.gold=100000;st.food=100000;st.wood=100000;st.iron=100000;st.jade=100000;
      st.eventDay=null;st.day++;windowMock.currentEvent=event;
      const count=st.eventCount||0;game.chooseEvent(choice);
      assert.equal(st.eventCount,count+1,"each random-event choice should resolve exactly once: "+event.name+" choice "+choice);
      eventBranchesTested++;
    }
  }
  assert.equal(eventBranchesTested,events.length*2,"both branches of every random event should be exercised");

  console.log("Game QA passed:", {
    chapters: chapters.length,
    randomEvents: events.length,\n    randomEventBranches: eventBranchesTested,\n    inlineButtonHandlers: new Set(inlineHandlerNames).size,
    heroes: game.state().heroes.length,
    battleWaves: 3,
    gameHtmlBytes: Buffer.byteLength(html),
    tested: ["startup","city","daily missions","story","battle","skills","events","region exploration, branching encounter, outpost control and daily economy","recruitment","equipment","forging","side quests","rewards"]
  });
})().catch(error => { console.error(error); process.exitCode = 1; });
