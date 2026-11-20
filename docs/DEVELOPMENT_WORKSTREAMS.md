# Development workstreams

## Parallel workstreams

| Workstream | Current implementation in this pass | Verification |
|---|---|---|
| Story depth | Persist chapter choice history and campaign legacy; humanitarian choices encourage the least-loyal officer, while strategic choices reward the lead commander, grant intelligence and weaken local garrisons. Chapter briefings narrate local faction relations, and friendly relations now reduce enemy morale in campaign battles. | Source assertions plus deterministic checks of campaign legacy and 30 chapter flows. |
| Visual art direction | Improve banner hierarchy, cards, tactile controls, readability and battlefield contrast; render moving rain, fog and wind layers; show doctrine-specific battlefield flashes, a persistent enemy-doctrine chip and a clear warning marker over the ally selected by enemy AI. Existing character/environment art remains in use. | CSS/source assertions plus browser battle smoke test. |
| Music and sound | Route the existing offline soundtrack by current screen and chapter; third-wave bosses use the bundled fourth track, while territorial battles select a track by defending faction. Faction tactics now reuse distinct existing swing, hit and critical cues. | Updated source assertion and browser smoke test; no new original recording claimed. |
| Battle animation | Improve battlefield depth, target highlighting, damage popups and slash impact feedback; retain boss formation entrance; add short faction-tactic flashes and a pulsing enemy-target warning while respecting reduced-motion settings. | Existing animation assertions and browser smoke test. |
| New gameplay | Six doctrines now shape enemy target selection as well as battlefield effects: Yellow Turbans swarm the weakest unit; Xiliang cavalry flank low-defense backliners and adapt to the weakest-defense unit if no backline exists; Yuan heavy infantry breach the weakest-defense frontline point; Cao Wei coordinate persistent focus fire; Shu prioritize the greatest attack threat; Jing-Wu lock onto the highest-energy target for suppression. Friendly regional diplomacy now also lowers campaign enemy morale. Faction tactic cues reuse different bundled impact sounds, and the threatened-unit marker has a pulsing telegraph ring. Target priorities are surfaced to the player with combat-log reasons and an on-unit lock marker. Existing spy and diplomacy systems remain integrated. | Deterministic target-priority and six-tactic fixtures, alongside regional attack/defense, reinforcement and siege doctrine checks. |
| QA and integration | Align soundtrack assertions with faction-aware routing; expose controlled battle fixtures to test each doctrine effect and target priority without randomness; assert local faction narrative echoes and target-warning feedback; retain full campaign and random-event branch checks. | GitHub Actions: logic, browser, APK build and Android emulator. |

## Existing systems not duplicated

The game already had basic regional scouting, enemy garrison reports, supply sabotage, troop-type counters, troop synergy, status effects, four background tracks and battle animations. This pass builds on those systems rather than creating duplicate versions.

## Known limitations after this pass

- Story choices now have persistent regional, commander-loyalty and cumulative combat consequences, but this is still a branching consequence layer rather than a fully rewritten multi-ending 30-chapter narrative.
- Visual work is a CSS/presentation pass, not a replacement set of bespoke character illustrations.
- Music routing uses the existing bundled tracks; no new soundtrack recordings are claimed.
- Spy field-operation success is probability-based. Capture/recovery, costs and persistent reports need hands-on playtesting.
- A successful source check or APK build does not prove every gameplay path is bug-free.
