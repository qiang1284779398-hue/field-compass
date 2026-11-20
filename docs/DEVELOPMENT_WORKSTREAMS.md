# Development workstreams

## Parallel workstreams

| Workstream | Current implementation in this pass | Verification |
|---|---|---|
| Story depth | Persist chapter choice history and show a cumulative narrative echo based on humanity/strategy decisions. | Source assertions; full 30-chapter flow regression remains in verify-game. |
| Visual art direction | Improve banner hierarchy, cards, tactile controls, readability and battlefield contrast. Existing character/environment art remains in use. | CSS/source assertions and browser smoke test. |
| Music and sound | Route the existing offline soundtrack by current screen as well as battle chapter; preserve music toggle and existing combat SFX. | Source assertions and browser smoke test. |
| Battle animation | Improve battlefield depth, target highlighting, damage popups and slash impact feedback while respecting reduced-motion settings. | Existing animation assertions and browser smoke test. |
| New gameplay | Add persistent spy agents with recruitment, training, intel gathering, supply sabotage, rumor operations, counter-intelligence, fatigue, capture and recovery. | Deterministic recruit/train/counter-intel regression checks; probabilistic field missions need manual play testing. |
| QA and integration | Extend source/runtime checks; retain full campaign and random-event branch checks, then run browser and Android workflows. | GitHub Actions. |

## Existing systems not duplicated

The game already had basic regional scouting, enemy garrison reports, supply sabotage, troop-type counters, troop synergy, status effects, four background tracks and battle animations. This pass builds on those systems rather than creating duplicate versions.

## Known limitations after this pass

- The story echo currently reflects accumulated humanity/strategy choices; it is not yet a fully branching rewrite of all 30 chapters.
- Visual work is a CSS/presentation pass, not a replacement set of bespoke character illustrations.
- Music routing uses the existing bundled tracks; no new soundtrack recordings are claimed.
- Spy field-operation success is probability-based. Capture/recovery, costs and persistent reports need hands-on playtesting.
- A successful source check or APK build does not prove every gameplay path is bug-free.
