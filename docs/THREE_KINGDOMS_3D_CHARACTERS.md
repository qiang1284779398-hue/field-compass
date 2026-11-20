# Three Kingdoms rigged 3D hero pipeline

The player-side Liu Bei, Guan Yu and Zhang Fei are generated as separate GLB characters during the Android build and bundled into the APK. The APK does not fetch character files from the internet.

## Character identity

- Liu Bei: older, East Asian face settings, mustache with light stubble, warm red/brown costume palette and a crown-like headpiece.
- Guan Yu: East Asian face settings, full dark-green beard plus a longer head-bone-attached beard extension, green/gold costume palette, crescent guandao attached at the right-hand weapon socket.
- Zhang Fei: broad/heavy build, prominent jaw and square head modifiers, short heavy beard, dark armour palette and a spear attached at the right-hand weapon socket.

Historical portraits are visual references for silhouette, beard, costume palette and headwear. They are not stretched over the model as flat face stickers. Each hero is an independently generated 3D human with its own face parameters, facial hair, materials, skin weights and facial/body rig.

## Runtime

- Three.js r128 classic browser build, GLTFLoader and SkeletonUtils are copied into local Android assets during CI.
- Each GLB contains a skinned humanoid mesh and animation clips. Runtime clones the skinned skeleton per character, uses AnimationMixer, and drives idle/attack/death clips from existing battle animation states.
- Weapon props attach to the rig's `WeaponR` hand socket. The battle scene keeps its existing 2.5D terrain renderer; the three named player generals are rendered as 3D models above it.
- If WebGL or a model fails to load, the original SVG figure remains visible. Combat damage, target selection, skills, story and save logic remain in the existing game code.

## Build and validation

`.github/workflows/android.yml` generates the three GLBs from `characters/*.json`, verifies that they exist, runs browser tests against the local GLB files, then packages them into the APK. Browser QA checks that at least one loaded hero has skinned meshes, a humanoid skeleton and multiple animation clips.

## Licences

- Ara 3D Gen generator code: MIT.
- MakeHuman character data used by the generator: CC0 1.0.
- Three.js: MIT.
- Motion-capture clips included by the generator derive from the CMU Graphics Lab Motion Capture Database; the source permits use including commercial use but does not permit reselling the raw data by itself. Retain upstream notices when redistributing the game.
