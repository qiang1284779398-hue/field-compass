# Development workstreams

## Parallel workstreams

| Workstream | Current implementation in this pass | Verification |
|---|---|---|
| Story depth | Persist chapter choice history, echo the latest three decisions, and convert accumulated humanity/strategy into battle modifiers. Each chapter choice now also changes the local faction relation (humanity) or weakens the local garrison and morale (strategy). | Source assertions plus deterministic checks of campaign legacy and 30 chapter flows. |
| Visual art direction | Improve banner hierarchy, cards, tactile controls, readability and battlefield contrast; render moving rain, fog and wind layers; add a boss arrival title and formation entrance treatment. Existing character/environment art remains in use. | CSS/source assertions plus browser battle smoke test. |
| Music and sound | Route the existing offline soundtrack by current screen and chapter; the third-wave boss battle switches to the already-bundled fourth track. Preserve toggle and combat SFX. | Source assertions and browser smoke test; no new original recording claimed. |
| Battle animation | Improve battlefield depth, target highlighting, damage popups and slash impact feedback; add a distinct boss formation entrance and title treatment while respecting reduced-motion settings. | Existing animation assertions and browser smoke test. |
| New gameplay | Persistent spy bureau remains in place. Diplomacy now exposes hostile/wary/neutral/friendly tiers, and improved relations reduce enemy siege pressure in addition to envoy truces. | Deterministic relationship-tier assertions; siege behavior still needs hands-on multi-faction campaign testing. |
| QA and integration | Extend source/runtime checks; retain full campaign and random-event branch checks, then run browser and Android workflows. | GitHub Actions. |

## Existing systems not duplicated

The game already had basic regional scouting, enemy garrison reports, supply sabotage, troop-type counters, troop synergy, status effects, four background tracks and battle animations. This pass builds on those systems rather than creating duplicate versions.

## Known limitations after this pass

- Story choices now have persistent regional consequences and cumulative combat consequences, but this is still a branching consequence layer rather than a fully rewritten multi-ending 30-chapter narrative.
- Visual work is a CSS/presentation pass, not a replacement set of bespoke character illustrations.
- Music routing uses the existing bundled tracks; no new soundtrack recordings are claimed.
- Spy field-operation success is probability-based. Capture/recovery, costs and persistent reports need hands-on playtesting.
- A successful source check or APK build does not prove every gameplay path is bug-free.
