# Development workstreams

## Parallel workstreams

| Workstream | Current implementation in this pass | Verification |
|---|---|---|
| Story depth | Persist chapter choice history and campaign legacy; humanitarian choices encourage the least-loyal officer, while strategic choices reward the lead commander, grant intelligence and weaken local garrisons. Battle conclusions retain the campaign echo. | Source assertions plus deterministic checks of campaign legacy and 30 chapter flows. |
| Visual art direction | Improve banner hierarchy, cards, tactile controls, readability and battlefield contrast; render moving rain, fog and wind layers; show doctrine-specific battlefield flashes and a persistent enemy-doctrine chip. Existing character/environment art remains in use. | CSS/source assertions plus browser battle smoke test. |
| Music and sound | Route the existing offline soundtrack by current screen and chapter; third-wave bosses use the bundled fourth track, while territorial battles select a track by defending faction. Preserve toggle and combat SFX. | Updated source assertion and browser smoke test; no new original recording claimed. |
| Battle animation | Improve battlefield depth, target highlighting, damage popups and slash impact feedback; retain boss formation entrance; add short faction-tactic flashes while respecting reduced-motion settings. | Existing animation assertions and browser smoke test. |
| New gameplay | Persistent spy bureau and diplomacy remain integrated. Six doctrines now trigger tactical effects during enemy turns: Yellow Turbans rally shields, Xiliang cavalry charge, Yuan heavy infantry shield wall, Cao Wei morale rally, Shu terrain defense and Jing-Wu crossbow suppression. The effects alter shields, morale, damage or suppression rather than being labels only. | Deterministic test fixtures exercise all six effects; regional attack/defense, reinforcement and siege doctrine tests remain. |
| QA and integration | Align soundtrack assertions with faction-aware routing; expose a controlled battle fixture to test each doctrine effect without randomness; retain full campaign and random-event branch checks. | GitHub Actions: logic, browser, APK build and Android emulator. |

## Existing systems not duplicated

The game already had basic regional scouting, enemy garrison reports, supply sabotage, troop-type counters, troop synergy, status effects, four background tracks and battle animations. This pass builds on those systems rather than creating duplicate versions.

## Known limitations after this pass

- Story choices now have persistent regional, commander-loyalty and cumulative combat consequences, but this is still a branching consequence layer rather than a fully rewritten multi-ending 30-chapter narrative.
- Visual work is a CSS/presentation pass, not a replacement set of bespoke character illustrations.
- Music routing uses the existing bundled tracks; no new soundtrack recordings are claimed.
- Spy field-operation success is probability-based. Capture/recovery, costs and persistent reports need hands-on playtesting.
- A successful source check or APK build does not prove every gameplay path is bug-free.
