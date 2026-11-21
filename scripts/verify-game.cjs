const fs = require("node:fs");
const assert = require("node:assert/strict");

const html = fs.readFileSync("app/src/main/assets/index.html", "utf8");
const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>/);
assert.ok(scriptMatch, "game script block missing");
const source = scriptMatch[1];
new Function(source);

// Non-regression contract: established systems must remain present on every pass.
const rosterManifest=JSON.parse(fs.readFileSync("app/src/main/assets/characters/2d/roster-manifest.json","utf8"));
assert.equal(rosterManifest.total,50,"the expanded roster must contain fifty generals");
assert.equal(rosterManifest.heroes.length,50,"the roster manifest must list all fifty generals");
assert.equal(rosterManifest.male,41,"the roster must contain forty-one male generals");
assert.equal(rosterManifest.female,9,"the roster must contain nine female generals");
for(const hero of rosterManifest.heroes){
  const root="app/src/main/assets/characters/2d/";
  assert.ok(fs.existsSync(root+hero.art+".svg"),hero.id+" full-body art missing");
  assert.ok(fs.existsSync(root+"portraits/"+hero.art+".svg"),hero.id+" portrait art missing");
  assert.ok(fs.existsSync(root+"animations/"+hero.art+"-attack.svg"),hero.id+" weapon attack frames missing");
  assert.ok(fs.existsSync(root+"animations/"+hero.art+"-skill.svg"),hero.id+" unique skill frames missing");
}
for (const id of ["liu-bei","guan-yu","zhang-fei","zhao-yun","zhuge-liang","huang-zhong","diaochan","cao-cao","zhou-yu","lv-bu","dian-wei","jiang-wei"]) {
  assert.ok(fs.existsSync("app/src/main/assets/characters/2d/"+id+".svg"), id+" full-body SVG is missing");
  assert.ok(fs.existsSync("app/src/main/assets/characters/2d/portraits/"+id+".svg"), id+" portrait SVG is missing");
}
assert.ok(source.includes("data-hero2d") && source.includes('class="hero-portrait"') && source.includes("characters/2d/"), "all Three Kingdoms generals must use bundled 2D hero art");
assert.ok(source.includes("function generalPortrait") && source.includes("characters/2d/portraits/"), "the roster must use the custom general portraits");
assert.ok(source.includes('data-hero3d="liu-bei"') && source.includes('initHero3D($("battleScene"))'), "Liu Bei must use the new Q-style 3D battlefield renderer");
assert.ok(html.includes('vendor/three.min.js') && fs.existsSync("app/src/main/assets/vendor/three.min.js"), "offline Three.js runtime must be bundled for browser and APK use");
assert.ok(fs.existsSync("app/src/main/assets/hero3d.js"), "procedural Q-style Liu Bei 3D model runtime is missing");
const hero3dSource=fs.readFileSync("app/src/main/assets/hero3d.js","utf8");
for(const marker of ["createLiuBei","createSword","MeshStandardMaterial","__hero3dStatus","attack","skill","hurt","dead"]) assert.ok(hero3dSource.includes(marker), "Q-style Liu Bei model runtime is missing: "+marker);
assert.ok(source.includes("function initBattleRenderer") && source.includes("battle-3d-canvas") && source.includes('getContext("2d"'), "combat scene must use the offline 2.5D canvas renderer");
const preservationContracts = [
  ["30-chapter campaign", "const CHAPTERS="],
  ["story choice application", "function applyChapterChoiceOutcome"],
  ["story progression", "function storyNext()"],
  ["three-wave battle start", "waves:3"],
  ["enemy battle phase", "async function enemyPhase()"],
  ["battle completion", "function checkBattleEnd"],
  ["troop counter resolution", "function typeMultiplier"],
  ["status application", "function applyStatus"],
  ["status turn resolution", "function tickUnitStatuses"],
  ["six faction doctrine", "function factionDoctrine"],
  ["spy missions", "function spyMission"],
  ["diplomatic relations", "function factionRelationTier"],
  ["local save writer", "function save(){localStorage.setItem(KEY,JSON.stringify(s))"],
  ["current save key", 'const KEY="hxsg_save_v4"'],
  ["legacy v3 save migration", 'localStorage.getItem("hxsg_save_v3")']
];
for (const [label, marker] of preservationContracts) {
  assert.ok(source.includes(marker), "non-regression contract failed: " + label + " was removed or renamed without updating the migration/tests");
}

const chapterMatch = source.match(/const CHAPTERS=(\[[\s\S]*?\n\]);\nconst EVENTS=/);
assert.ok(chapterMatch, "chapter data missing");
const chapters = new Function("return " + chapterMatch[1])();
assert.equal(chapters.length, 30, "campaign must contain 30 chapters");
assert.ok(chapters.every(c => c.title && c.intro && c.dialog.length >= 3 && c.boss && c.sideText), "each chapter needs complete story, dialogue, boss and side quest");

const eventMatch = source.match(/const EVENTS=(\[[\s\S]*?\n\]);\nfunction fresh/);
assert.ok(eventMatch, "random event data missing");
const events = new Function("return " + eventMatch[1])();
assert.ok(events.length >= 20, "at least 20 distinct random events required");

assert.ok(source.includes("function normalizeRecruitState()") && source.includes("if(s.recruitTokens<1)return toast(\"招贤令不足") && source.includes("s.recruitTokens-=1;s.heroes.push") && source.includes("s.heroes.some(x=>x.id===h.id)"), "hero recruitment must normalize and consume one token and reject duplicate heroes");
assert.ok(source.includes('s.recruitTokens<1?\'disabled\':\'\'') && source.includes("招贤令不足，暂不可寻访"), "recruitment UI must disable the action when no token is available");
assert.ok(source.includes("active.find(i=>!fight.acted.includes(i))") && source.includes('fight.phase!=="player"') && source.includes("fight.phase=\"enemy\";enemyPhase()") && source.includes("fight.enemyPhaseRunning") && source.includes("finally{if(fight===battleRef)fight.enemyPhaseRunning=false}"), "turn progression must enter enemy phase once and always release the enemy-phase lock");
assert.ok(source.includes("playSkillFx(i,skillFxKind(a.skill,a),a.skill)") && source.includes("hero&&hero.skillFx") && source.includes("发动专属战技") && source.includes("function skillFxKind"), "every hero skill must log its use and receive its own metadata-driven skill animation");
assert.ok(source.includes("async function playSkillFx") && source.includes('finally{if(a&&a.classList)a.classList.remove("cast","swinging")}') && source.includes("Hit feedback failed") && source.includes("const finish=()=>{if(done)return;done=true"), "motion-only skill and hit feedback must fail safely without leaving the action lock stuck");
assert.ok(source.includes("function skillProfile(hero)") && source.includes("目标范围：") && source.includes("青龙偃月") && source.includes("fight.skillTargetMode") && source.includes("skillTargets.map(index=>fight.enemies[index])") && source.includes("横扫"+'"+ordered.length+"名指定敌军'), "battle skills must display descriptions/ranges and Qinglong must resolve two explicitly selected targets");
assert.ok(source.includes("fight.actionRunning=true") && source.includes("fight.actionRunning=false") && source.includes("fight.actionRunning)return"), "player input must be locked during asynchronous combat animations and always released");
assert.ok(!source.includes("spawnImpact(") && !html.includes("skill-aura") && !html.includes("impact-burst") && !html.includes("slash-fx") && !html.includes("fx-flash"), "hero attacks and skills must not create decorative overlay effects");
for (const animation of ["chargeRight", "chargeLeft", "castHero", "bodyHit", "bossWave", "damageUp"]) {
  assert.ok(html.includes("@keyframes " + animation), "missing retained combat movement/feedback animation: " + animation);
}
assert.ok(source.includes("function renderWarrior") && source.includes("data-hero2d") && source.includes("hero-portrait") && source.includes("characters/2d/") , "battlefield must render the original 2D hero sprites");
assert.ok(source.includes("function animateHit"), "player attack animation missing");
assert.ok(source.includes("function animateEnemyHit"), "enemy attack animation missing");
assert.ok(source.includes("function playBossFx"), "boss skill animation missing");
assert.ok(source.includes('function playBossFx(){playSfx("critical")') && source.includes("a.volume=fight&&fight.wave===3?.34:.26"), "boss combat should trigger a distinct impact cue and stronger boss soundtrack mix");
assert.ok(source.includes("function startMusic"), "offline soundtrack controller missing");
assert.ok(source.includes('fight.wave===3?3:(fight.mode==="territory"'), "boss wave should switch to a dedicated existing soundtrack track");
assert.ok(source.includes("function factionRelationTier") && source.includes("factionRelationTier(s.factionRelations[f.id]||0)"), "diplomacy should expose readable relationship tiers");
assert.ok(source.includes("factionRelations[attacker.f.id]||-20))*.002"), "diplomatic relations should affect enemy siege pressure");
assert.ok(source.includes("function applyChapterChoiceOutcome") && source.includes("s.enemyMoraleByRegion[i]=Math.max(10"), "story choices should persistently alter local faction relations or enemy readiness");
assert.ok(html.includes(".boss-arrival") && html.includes("@keyframes bossHeroIn") && html.includes(".boss-title"), "boss entry needs a visible animated entrance");
assert.ok(source.includes("function toggleMusic"), "music toggle control missing");
assert.ok(source.includes("function playSfx"), "combat sound effect controller missing");
assert.ok(source.includes("function beginTerritoryBattle"), "frontier conquests should use the playable battle engine");
assert.ok(source.includes("function makeTerritoryWave"), "frontier battles should generate staged enemy formations");
assert.ok(source.includes("doctrine=factionDoctrine(f)") && source.includes("((doctrine[d.key]||1)-1)*.18") && source.includes("((doctrine[d.key]||1)-1)*.10"), "faction doctrine must modify actual enemy troop attack and defense in regional battles");
assert.ok(source.includes('施展"+doctrine.name+"：'), "regional battle logs should identify the enemy faction doctrine");
assert.ok(source.includes("function applyFactionBattleTactic"), "six faction battlefield tactic resolver missing");
assert.ok(source.includes("doctrineChargeRound===fight.round") && source.includes("doctrineVolleyRound===fight.round"), "cavalry charge and crossbow suppression must affect actual enemy attacks");
assert.ok(html.includes("doctrine-chip") && html.includes("doctrine-jingwu") && html.includes("doctrine-xiliang"), "faction tactics need visible battlefield feedback");
assert.ok(source.includes("suppressed=(troop.includes(\"弓\")||troop.includes(\"弩\"))&&(fight.doctrineVolleyRound===fight.round||Math.random()<.24)"), "Jingwu doctrine should guarantee ranged suppression on its volley round");
assert.ok(source.includes("enemyFaction")||source.includes("factionForRegion"), "enemy faction data should exist");
assert.ok(source.includes("campRecovery=Math.min(s.wounded||0,4+Math.floor((s.morale||0)/25))"), "daily camp recovery should heal wounded troops based on morale");
assert.ok(source.includes("function battlefieldAttackMultiplier"), "weather and terrain combat modifier engine missing");
assert.ok(source.includes("function battlefieldDefenseMultiplier"), "weather and garrison terrain defense engine missing");
assert.ok(source.includes("terrainDefenseMultiplier(terrain)"), "territory garrisons should receive terrain defense bonuses");
assert.ok(source.includes("w.arch") && source.includes('w.id==="rain"') && source.includes('w.id==="fog"'), "weather should change ranged and cavalry combat");
assert.ok(source.includes("if(focus===key)m*=1.12"), "selected territory assault troop should gain its focus bonus");
assert.ok(source.includes('["mountain","pass","forest"].includes(terrain)'), "cavalry should be penalized in difficult terrain");
assert.ok(source.includes("function applyStatus"), "battle status engine missing");
assert.ok(source.includes("function tickUnitStatuses"), "status turn resolution missing");
for (const effect of ["burn","poison","bleed","armorBreak","slow","disarm","stun"]) assert.ok(source.includes('"'+effect+'"'), "missing status effect: "+effect);
assert.ok(source.includes("function statusText"), "unit status feedback missing");
assert.ok(source.includes("function spyMission"), "persistent spy operations missing");
assert.ok(source.includes("function recruitSpy") && source.includes("function trainSpy"), "spy recruitment and training missing");
assert.ok(source.includes("function recoverSpyAgents"), "captured agents must recover through daily turns");
assert.ok(source.includes("function storyEcho") && source.includes("function campaignLegacy"), "campaign choices must feed back into later narrative and battle rules");
assert.ok(source.includes("fight.enemyTargetHeroId=target.id||target.name") && html.includes(".warrior.ai-targeted") && html.includes("@keyframes enemyLockRing"),"enemy target selection should visibly mark the threatened allied unit with a telegraph ring");
assert.ok(source.includes("localRelation=s.factionRelations[factionForRegion(i).id]||-20") && source.includes("Math.floor(localRelation/10)"),"friendly diplomacy should reduce enemy morale in campaign battles");
assert.ok(source.includes('playSfx(id==="xiliang"?"swing":id==="yuan"?"hit":"critical")'),"faction tactics should use distinct existing sound cues");
assert.ok(source.includes("campaignLegacy:legacy") && source.includes("legacy.humanity*.025") && source.includes("legacy.strategy*3"), "accumulated story choices must modify allied defense and enemy morale in combat");
assert.ok(source.includes("applyChapterChoiceOutcome(i,n)"), "chapter decisions must alter persistent world state");
assert.ok(source.includes("low.loyalty=Math.min(100,(low.loyalty||75)+2)") && source.includes("lead.loyalty=Math.min(100,(lead.loyalty||75)+2)"), "humanity and strategy choices should have distinct persistent hero loyalty consequences");
assert.ok(source.includes("s.intel=Math.min(20,(s.intel||0)+1)"), "strategy choice should grant persistent strategic intelligence");
assert.ok(html.includes("@keyframes bossLineAdvance") && html.includes("@keyframes bossChampionRise") && html.includes("@keyframes bossTitleReveal"), "boss entrance should animate both formation and champion with a title reveal");
assert.ok(source.includes("choiceHistory[i]={choice:n,day:s.day,title:c.title}"), "chapter choice history must persist");
assert.ok(html.includes("Visual direction pass") && html.includes(".spy-agent"), "visual presentation pass missing");
assert.ok(source.includes("page]||0"), "music should react to the current game scene");
assert.ok(source.includes("makeWave();drawBattle();startMusic();return true"), "music must change when a boss wave begins");
assert.ok(source.includes('page="battle";drawBattle();startMusic()'), "battle scene should start its own soundtrack");
assert.equal((source.match(/function ensureSpyNetwork\(/g)||[]).length,1,"spy state initializer must not be duplicated");
assert.ok(source.includes("步阵协同") && source.includes("骑兵协同") && source.includes("远程协同"), "troop formation synergy missing");
assert.ok(source.includes("识破破绽，追击重伤目标") && source.includes("掩护己方远程部队"), "enemy tactical behavior missing");
assert.ok(source.includes('name==="青龙偃月"') && source.includes('name==="麒麟奇谋"'), "signature hero skills missing");
assert.ok(source.includes("skillCostReduction"), "strategist skill cost synergy missing");
assert.ok(html.includes("terrain-2:before") && html.includes("terrain-3:before"), "terrain battlefield visuals missing");
assert.ok(html.includes("weather-layer") && html.includes(".weather-rain") && html.includes(".weather-fog") && html.includes(".weather-wind"), "battlefield weather should have distinct animated visual layers");
assert.ok(source.includes("突袭我军弓弩手"), "enemy cavalry should flank the backline");
assert.ok(source.includes("军心崩溃，弃械溃逃"), "enemy morale collapse and rout missing");
assert.ok(source.includes("异常状态已消退"), "status expiration feedback missing");
assert.ok(source.includes("掩护己方远程部队"), "enemy guard unit protection tactic missing");
assert.ok(source.includes("护盾抵消"), "shield damage feedback missing");

const declaredFunctions = new Set([...source.matchAll(/function\s+([A-Za-z_$][\w$]*)\s*[(]/g)].map(x => x[1]));
const inlineHandlerNames = [...html.matchAll(/onclick="([^"]+)"/g)].map(m => {
  const hit = m[1].match(/^\s*([A-Za-z_$][\w$]*)\s*[(]/);
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
  source + "\nreturn {state:()=>s,fight:()=>fight,continueTurn,enemyPhase,events:()=>EVENTS,levelHero,upgradeSkill,bondHero,formation,saveFormation,recruitTroops,healArmy,rations,buyRations,research,craftPotion,itemDetail,salvageItem,go,buildings,upgradeBuilding,startChapter,storyNext,chapterChoice,basicAttack,selectActor,selectTarget,chooseTarget,useHeroSkill,defendAction,finishBattle,randomEvent,chooseEvent,tavern,recruitHero,makeItem,heroAtk,heroDef,equipHero,equipItemTo,forge,craftItem,sideQuest,finishSideQuest,trainArmy,claimDaily,costText,worldPage,inspectRegion,exploreRegion,resolveRegionChoice,establishOutpost,abandonOutpost,raidOutpost,resolveOutpostRaid,connectOutposts,nextDay,assaultRegion,resolveTerritoryAssault,prepareSiege,reinforceOutpost,upgradeOutpost,unitEffectiveness,isRegionAdjacent,beginTerritoryBattle,checkBattleEnd,regionTerrain,terrainDefenseMultiplier,terrainAttackMultiplier,terrainSceneClass,battlefieldAttackMultiplier,battlefieldDefenseMultiplier,terrainDefenseMultiplier,regionTerrain,damage,sendFactionEnvoy,resolveEnemyWorldTurn,setBattleStance,cityEdicts,setCityEdict,cityOffices,appointCityOfficer,dismissCityOfficer,cityOfficerEffects,cityGovernance,runCityAction,reduceCityTax,settleCityGovernance,ensureHeroPolitics,heroRelationScore,improveHeroRelation,rewardHeroLoyalty,driftHeroLoyalty,prepareFieldTactic,resolvePendingSiege,ensureSpyNetwork,scoutEnemyRegion,sabotageEnemySupply,recruitSpy,trainSpy,spyMission,openSpyOffice,resolveEnemyEspionage,factionForRegion,enemyCommander,siegeCost,campaignLegacy,applyChapterChoiceOutcome,applyFactionBattleTactic,factionTargetPlan,storyEcho,setFight:v=>{fight=v},factionRelationTier,factionDoctrine,factionOverview,makeWave,drawBattle,applyFactionBattleTactic};"
)(documentMock, storage, windowMock, fn => 1, () => {}, () => true);

{
  game.state().factionRelations.yellow=35;
  assert.ok(game.storyEcho(0).includes("当地黄巾余部已愿意与我军互通消息"),"story echo should reflect improved local faction relations");
  game.state().factionRelations.yellow=-20;
  assert.ok(game.storyEcho(0).includes("敌意未消"),"story echo should reflect hostile local faction relations");
}

assert.equal(game.state().heroes.length, 3, "new game should start with a complete three-hero formation");
assert.equal(game.factionRelationTier(-20),"敌对","negative faction relation should be hostile");
assert.equal(game.factionRelationTier(16),"中立","improved faction relation should reach neutral tier");
const doctrineIds=["yellow","xiliang","yuan","cao","shu","jingwu"];
assert.equal(doctrineIds.length,6,"all six factions should have doctrines");
const doctrines=doctrineIds.map(id=>game.factionDoctrine(id));
assert.equal(new Set(doctrines.map(d=>d.name)).size,6,"each faction must have a distinct military doctrine");
assert.ok(doctrines.every(d=>d.siege>0&&d.inf>0&&d.cav>0&&d.arch>0&&d.desc),"every faction doctrine needs valid siege and reinforcement weights");
{
  const cases=[
    {id:"yellow",round:3,expected:"黄巾蜂拥",shield:24},
    {id:"xiliang",round:2,expected:"西凉奔袭",field:"doctrineChargeRound"},
    {id:"yuan",round:3,expected:"河北重阵",shield:42,troop:"重步兵"},
    {id:"cao",round:2,expected:"魏武整军",field:"doctrineRallyRound"},
    {id:"shu",round:2,expected:"巴蜀坚守",shield:30},
    {id:"jingwu",round:2,expected:"荆吴连弩",field:"doctrineVolleyRound"}
  ];
  for(const c of cases){
    const enemy={name:"QA敌军",troop:c.troop||"步兵",atk:30,def:20,hp:200,max:200,alive:true,shield:0};
    const active={enemyFactionId:c.id,round:c.round,doctrineRound:null,enemies:[enemy],logs:[],enemyMorale:60,mode:"territory",territoryIndex:0,chapter:0};
    game.setFight(active);
    const message=game.applyFactionBattleTactic();
    assert.ok(message.includes(c.expected),"faction tactic should trigger: "+c.id);
    if(c.shield)assert.ok(enemy.shield>=c.shield,"faction tactic should grant its shield effect: "+c.id);
    if(c.field)assert.equal(active[c.field],c.round,"faction tactic should set its combat effect marker: "+c.id);
  }
}
{
  const wounded={id:"wounded",name:"重伤武将",hp:10,max:100,atk:10,def:20,energy:1,troop:"步兵"};
  const archer={id:"archer",name:"弓手",hp:70,max:100,atk:30,def:5,energy:3,troop:"弓兵"};
  const tank={id:"tank",name:"重甲将",hp:80,max:100,atk:20,def:50,energy:2,troop:"步兵"};
  const threat={id:"threat",name:"高攻将",hp:60,max:100,atk:70,def:10,energy:4,troop:"步兵"};
  const allies=[wounded,archer,tank,threat],backline=[archer],frontline=[wounded,tank,threat];
  game.setFight({factionFocusHeroId:null});
  assert.equal(game.factionTargetPlan("yellow","步兵",allies,backline,frontline).target.id,"wounded","Yellow Turban AI should swarm the weakest unit");
  assert.equal(game.factionTargetPlan("xiliang","骑兵",allies,backline,frontline).target.id,"archer","Xiliang cavalry should flank the weakest backline defense");
  assert.equal(game.factionTargetPlan("xiliang","骑兵",allies,[],frontline).target.id,"archer","Xiliang cavalry should adapt by striking the weakest-defense unit when no backline exists");
  assert.equal(game.factionTargetPlan("yuan","步兵",allies,backline,frontline).target.id,"threat","Yuan heavy infantry should breach the weakest-defense frontline unit");
  const caoFirst=game.factionTargetPlan("cao","步兵",allies,backline,frontline).target;
  assert.equal(game.factionTargetPlan("cao","骑兵",allies,backline,frontline).target.id,caoFirst.id,"Cao Wei should maintain coordinated focus fire");
  assert.equal(game.factionTargetPlan("shu","步兵",allies,backline,frontline).target.id,"threat","Shu defenders should prioritize the highest attack threat");
  assert.equal(game.factionTargetPlan("jingwu","弓兵",allies,backline,frontline).target.id,"threat","Jing-Wu crossbows should lock onto the highest-energy target");
}

assert.ok(game.factionDoctrine("xiliang").cav>game.factionDoctrine("xiliang").arch,"Xiliang doctrine should prioritize cavalry");
assert.ok(game.factionDoctrine("jingwu").arch>game.factionDoctrine("jingwu").cav,"Jingwu doctrine should prioritize ranged troops");
assert.ok(game.factionDoctrine("shu").siege<1,"Shu doctrine should be less aggressive in siege warfare");
game.go("world");game.factionOverview();assert.ok(elements.get("view").innerHTML.includes("军略：")||game.factionOverview().includes("军略："),"faction overview should explain each doctrine");
const garrisonBeforeDiplomacy=game.state().enemyGarrisons[3].inf+game.state().enemyGarrisons[3].cav+game.state().enemyGarrisons[3].arch;
game.applyChapterChoiceOutcome(3,1);
const garrisonAfterDiplomacy=game.state().enemyGarrisons[3].inf+game.state().enemyGarrisons[3].cav+game.state().enemyGarrisons[3].arch;
assert.ok(garrisonAfterDiplomacy<garrisonBeforeDiplomacy,"strategy choice should weaken the regional garrison");
assert.equal(game.state().enemyMoraleByRegion[3],66,"strategy choice should lower local enemy morale by four");
game.go("home");
assert.ok(elements.get("view").innerHTML.includes("密探机关"), "home page should expose the intelligence bureau");
game.recruitSpy();
assert.equal(game.state().spyAgents.length,1,"recruiting a spy should add one persistent agent");
const recruitedSpy=game.state().spyAgents[0];
game.trainSpy();
assert.equal(recruitedSpy.skill,2,"spy training should improve the least experienced agent");
game.spyMission(recruitedSpy.id,"counter");
assert.ok(game.state().counterIntelUntil>=game.state().day+4,"counter-intelligence should remain active for four days");
const protectedFood=game.state().food;
assert.ok(game.resolveEnemyEspionage(true).includes("截获"),"active counter-intelligence should intercept enemy agents");
assert.equal(game.state().food,protectedFood,"intercepted enemy agents must not damage supplies");
assert.ok(game.state().spyLog.length>=2,"spy operations should be written to the intelligence log");
game.state().gold=1000;
recruitedSpy.readyDay=game.state().day;
game.state().explored.push(3);
game.state().regionControl[3]="enemy";
elements.get("spyTarget").value="3";
game.spyMission(recruitedSpy.id,"infiltrate");
assert.equal(recruitedSpy.infiltration.region,3,"infiltration should bind an agent to the selected enemy region");
assert.equal(recruitedSpy.infiltration.untilDay,game.state().day+3,"infiltration should persist for three days");
assert.ok(source.includes("enemyMorale=s.enemyMoraleByRegion"),"spy sabotage and rumor should affect regional battle morale");
assert.ok(source.includes("legacyHumanity")&&source.includes("legacyStrategy"),"campaign decisions should have persistent strategic consequences");
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
const exploredBeforeRepeat=game.state().explored.length;
game.exploreRegion(0);
assert.equal(game.state().explored.length, exploredBeforeRepeat, "a region must not grant its discovery reward twice");
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
assert.ok(elements.get("view").innerHTML.includes(game.fight().weather.name), "battle HUD should display current battlefield weather");
assert.ok(elements.get("view").innerHTML.includes("主攻骑兵"), "battle HUD should display selected assault troop focus");
const weatherBefore=game.fight().weather;
game.fight().weather={id:"rain",name:"暴雨",icon:"🌧️",arch:.88,burn:1};
const cavalryProbe={troop:"骑兵"},archerProbe={troop:"弓兵"};
game.fight().allies.push(cavalryProbe,archerProbe);
assert.ok(Math.abs(game.battlefieldAttackMultiplier(archerProbe,{})-.88)<.001, "rain should reduce archer attack by twelve percent");
assert.ok(Math.abs(game.battlefieldAttackMultiplier(cavalryProbe,{})-(1.12*.92*.88))<.001, "rain and pass terrain should offset cavalry focus bonus");
const enemyProbe={troop:"步兵"};
game.fight().enemies.push(enemyProbe);
const expectedDefense=1.04*game.terrainDefenseMultiplier(game.regionTerrain(game.fight().territoryIndex));
assert.ok(Math.abs(game.battlefieldDefenseMultiplier(enemyProbe)-expectedDefense)<.001, "rain and defending terrain should strengthen garrison defense");
game.fight().enemies.pop();
game.fight().allies.pop();game.fight().allies.pop();
game.fight().weather=weatherBefore;
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
const doctrineFight=game.fight();
const savedDoctrineState={enemies:doctrineFight.enemies,enemyFactionId:doctrineFight.enemyFactionId,enemyMorale:doctrineFight.enemyMorale,round:doctrineFight.round,doctrineRound:doctrineFight.doctrineRound,doctrineFx:doctrineFight.doctrineFx};
function testFactionTactic(id,round,troop,check){
  doctrineFight.enemyFactionId=id;doctrineFight.round=round;doctrineFight.doctrineRound=null;doctrineFight.doctrineFx=null;doctrineFight.enemyMorale=40;
  doctrineFight.enemies=[{name:"QA兵",troop,hp:100,max:100,alive:true,shield:0}];
  const beforeMorale=doctrineFight.enemyMorale;const msg=game.applyFactionBattleTactic();
  assert.ok(msg.includes(id==="yellow"?"黄巾":id==="xiliang"?"西凉":id==="yuan"?"河北":id==="cao"?"魏武":id==="shu"?"巴蜀":"荆吴"),id+" should announce its own tactic");
  check(doctrineFight,beforeMorale);
  const shield=doctrineFight.enemies[0].shield;game.applyFactionBattleTactic();
  assert.equal(doctrineFight.enemies[0].shield,shield,id+" tactic must not stack twice in one round");
}
testFactionTactic("yellow",3,"步兵",f=>assert.equal(f.enemies[0].shield,24,"Yellow Turban rally should add temporary shield"));
testFactionTactic("xiliang",2,"骑兵",f=>assert.equal(f.doctrineChargeRound,2,"Xiliang cavalry charge should be armed for this round"));
testFactionTactic("yuan",3,"步兵",f=>assert.equal(f.enemies[0].shield,42,"Yuan heavy infantry should form a shield wall"));
testFactionTactic("cao",2,"步兵",(f,before)=>assert.equal(f.enemyMorale,before+6,"Cao Wei coordinated command should restore morale"));
testFactionTactic("shu",2,"步兵",f=>assert.equal(f.enemies[0].shield,30,"Shu defensive doctrine should add a protective shield"));
testFactionTactic("jingwu",2,"弩兵",f=>assert.equal(f.doctrineVolleyRound,2,"Jingwu crossbow volley should guarantee suppression"));
Object.assign(doctrineFight,savedDoctrineState);

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

  // Walk every campaign chapter through dialogue, branch, battle and unlock.
  let chapterFlowsTested=0;
  for(let i=0;i<chapters.length;i++){
    const st=game.state();
    st.story=i;st.gold=100000;st.food=100000;st.wood=100000;st.iron=100000;st.jade=100000;
    game.startChapter(i);
    let steps=0;
    while(elements.get("modal").innerHTML.includes('onclick="storyNext()"')){
      game.storyNext();steps++;
      assert.ok(steps<30,"chapter dialogue must terminate: "+chapters[i].title);
    }
    assert.ok(steps>=3,"chapter should present at least three dialogue advances: "+chapters[i].title);
    st.flags.humanity=6;st.flags.strategy=4;
    game.chapterChoice(0);
    assert.equal(game.state().choiceHistory[i].choice,0,"chapter choice history should persist: "+chapters[i].title);
    assert.ok(game.state().factionRelations.yellow>=-17,"humanitarian chapter choice should improve the local faction relation");
    assert.deepEqual(game.campaignLegacy(),{humanity:2,strategy:2},"campaign legacy should derive bounded modifiers from prior choices");
    assert.ok(game.fight(),"chapter branch should start battle: "+chapters[i].title);
    assert.equal(game.fight().campaignLegacy.humanity,2,"humanity legacy should be attached to the battle");
    assert.equal(game.fight().campaignLegacy.strategy,2,"strategy legacy should be attached to the battle");
    assert.equal(game.fight().enemyMorale,58,"strategy legacy should reduce the chapter-choice enemy morale by six points");
    assert.ok(game.fight().allies[0].def>=Math.round(game.heroDef(st.heroes[0])*1.05),"humanity legacy should improve allied defense");
    assert.equal(game.fight().waves,3,"chapter battle should contain three waves: "+chapters[i].title);
    game.fight().wave=3;game.makeWave();
    assert.ok(game.fight().bossIntro && game.fight().enemies.some(x=>x.boss),"third wave should spawn a boss unit");
    game.drawBattle();
    assert.match(elements.get("view").innerHTML,/boss-arrival[\s\S]*boss-title/,"boss wave should render the animated entrance treatment");
    assert.equal(game.fight().bossIntro,false,"boss entrance should play once rather than replay on every UI redraw");
    game.fight().phase="end";game.fight().win=true;
    game.finishBattle();
    assert.equal(game.state().story,i+1,"victory should unlock next chapter: "+chapters[i].title);
    chapterFlowsTested++;
  }
  assert.equal(chapterFlowsTested,30,"all 30 chapter flows should be exercised");

  console.log("Game QA passed:", {
    chapters: chapters.length,
    chapterFlowsTested,
    randomEventBranches: eventBranchesTested,
    randomEvents: events.length,
    inlineButtonHandlers: new Set(inlineHandlerNames).size,
    heroes: game.state().heroes.length,
    battleWaves: 3,
    gameHtmlBytes: Buffer.byteLength(html),
    tested: ["startup","city","daily missions","story","battle","skills","events","region exploration, branching encounter, outpost control and daily economy","recruitment","equipment","forging","side quests","rewards"]
  });
})().catch(error => { console.error(error); process.exitCode = 1; });
