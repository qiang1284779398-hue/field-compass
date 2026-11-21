# Q-style 3D hero prototype

## Current implementation

The first three allied generals now use separate, original procedural Q-style 3D character builds in the existing 2.5D battlefield.

- Shared source: `app/src/main/assets/hero3d.js`.
- Shared geometry language: beveled extruded plates, curved tube details, layered cloth and armour, sculpted facial forms, articulated hands and weapon grips. Static sibling meshes are merged by material inside rig segments to reduce draw calls on Android.
- **Liu Bei**: deep vermilion layered robe, detailed gold lamellar armour, winged crown with jade and red enamel, long earlobes, layered moustache and divided chin beard, paired ornamented jian held visibly in front of the torso.
- **Guan Yu**: broad green battle robe and green lamellar armour, ruddy face, stern eyes, long black side-locks and flowing multi-strand beard, green-and-gold battle turban, oversized shoulder guards, and a detailed front-held Green Dragon Crescent Blade with a crescent steel edge, engraved shaft, fittings and red silk tassel.
- **Zhang Fei**: wider, stockier silhouette, dark iron lamellar armour over crimson under-robe, oversized tiger-like pauldrons, broad ruddy face, heavy brows and round fierce eyes, black wrapped headcloth, thick moustache and pointed beard, and a front-held Zhangba Serpent Spear with recurved steel point, lacquered shaft and red tassel.
- **Face detail**: each character has individually positioned brows, eyelids, irises, pupils, catchlights, nose, cheeks, jaw, mouth and facial hair; face proportions, complexion and beard silhouette differ by general.
- **Weapons and animation**: each signature weapon stays forward of the breastplate and cape. Weapon rotation is linked to the articulated hand/forearm hierarchy; idle sway, anticipation, attack swing, skill preparation, recovery, hurt and death states are shared while retaining each general's distinct equipment and silhouette.
- **Runtime**: Three.js r128, loaded locally from `app/src/main/assets/vendor/three.min.js`; no model or texture is fetched at runtime.
- **Scene integration**: a transparent WebGL canvas is layered into the existing 2.5D battlefield and each 3D actor is anchored to the matching original `.body-art` placement. The three original 2D SVG sprites remain available as graceful fallbacks.
- **Preservation**: terrain painter, miniature pixel troop formations, non-brother generals, campaign logic, skills, status effects, troop rules, and save data remain in their existing systems.

## What this prototype is not

This first pass is **not** a skinned GLB/GLTF character and does not use motion-capture clips. It is a hand-assembled 3D mesh character with hierarchical part animation. The current animation poses are a prototype foundation; they are not yet a finished combat animation library.

## Build and validation

The Android workflow installs Three.js r128, copies its minified runtime into the app's offline assets, then runs source checks, Chromium browser interaction tests, and the APK build.

The browser test checks that:
- the Three.js renderer initializes and all three sworn brothers attach to the battlefield;
- each character contains a high-detail multipart 3D assembly with its own silhouette and signature weapon;
- Guan Yu and Zhang Fei's signature weapons remain in the visible forward layer;
- attack and skill inputs change each character's animation state;
- battle damage, skill energy, defence, enemy turns, and save/reload continue to work.

The Android emulator/device job remains skipped when the project owner requests browser-only validation.

## Licence

- Three.js: MIT License. The bundled runtime is sourced from https://github.com/mrdoob/three.js.
- The three sworn brothers' procedural mesh designs and part-animation code in `hero3d.js` are original project code.
