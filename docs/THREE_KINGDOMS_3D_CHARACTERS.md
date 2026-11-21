# Q-style 3D hero prototype

## Current implementation

The first playable 3D hero is **Liu Bei**, integrated into the allied formation in the existing 2.5D battlefield.

- Character source: `app/src/main/assets/hero3d.js`.
- Geometry: original procedural Three.js meshes assembled from spheres, cylinders, boxes, and shaped surfaces. The head, torso, legs, shoulders, arms, forearms, hands, and swords are separate objects connected through nested transform groups.
- Style: compact Q-style proportions, vermilion robe, bronze/gold lamellar armour, crown ornament, moustache and short stubble, paired swords.
- Animation: procedural idle breathing/sway, two-handed sword attack with a forward body lunge, skill preparation, hit reaction, and a simple knockdown/death pose.
- Runtime: Three.js r128, loaded locally from `app/src/main/assets/vendor/three.min.js`; no model or texture is fetched at runtime.
- Scene integration: a transparent WebGL canvas is layered into the existing 2.5D battlefield and positions Liu Bei against the same `.body-art` anchor used by the original 2D sprites.
- Fallback: Liu Bei's existing SVG remains in the markup and is revealed automatically if the WebGL model cannot initialize.
- Scope: only the allied Liu Bei currently uses the new 3D renderer. Guan Yu, Zhang Fei, enemy characters, and the rest of the general roster retain their existing 2D artwork. The terrain painter and miniature pixel troop formations are unchanged.

## What this prototype is not

This first pass is **not** a skinned GLB/GLTF character and does not use motion-capture clips. It is a hand-assembled 3D mesh character with hierarchical part animation. The current animation poses are a prototype foundation; they are not yet a finished combat animation library.

## Build and validation

The Android workflow installs Three.js r128, copies its minified runtime into the app's offline assets, then runs source checks, Chromium browser interaction tests, and the APK build.

The browser test checks that:
- the Three.js renderer initializes and the Liu Bei character is attached to the battlefield;
- the character contains a multipart 3D mesh assembly and uses Q-style proportions;
- a normal attack changes the character's animation state;
- battle damage, skill energy, defence, enemy turns, and save/reload continue to work.

The Android emulator/device job remains skipped when the project owner requests browser-only validation.

## Licence

- Three.js: MIT License. The bundled runtime is sourced from https://github.com/mrdoob/three.js.
- Liu Bei's procedural mesh design and part-animation code in `hero3d.js` are original project code.
