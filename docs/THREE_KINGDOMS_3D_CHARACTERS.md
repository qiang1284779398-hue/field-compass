# Q-style 3D hero prototype

## Current implementation

The first playable 3D hero is **Liu Bei**, integrated into the allied formation in the existing 2.5D battlefield.

- Character source: `app/src/main/assets/hero3d.js`.
- Geometry: original procedural Three.js meshes with beveled extruded plates, curved tubes, shaped robe panels, layered metal fittings, sculpted facial forms, and detailed straight jian swords. Static sibling meshes are merged by material inside each rig segment to keep Android draw calls manageable.
- Style: compact Q-style proportions; deep vermilion layered robe; individually modeled lamellar chest scales, faulds, shoulder guards, bracers and greaves; decorated winged ceremonial crown with jade and red enamel; long earlobes; layered moustache and divided chin beard; paired ornamented jian.
- Face: separate cheek/jaw planes, brow ridges, eyelids, irises, pupils, catchlights, nose bridge/tip/nostrils, mouth, sideburns and individual beard strands.
- Weapon placement: both jian are attached to the hands, lifted into a forward depth layer ahead of the breastplate, and angled outward in the rest pose so neither the torso nor cape occludes them during attacks and skills. Browser QA also checks their scaled world-space depth and live attack rotation.
- Animation: procedural idle breathing/sway, anticipation-to-strike-to-recovery sword movement, articulated shoulder/elbow/wrist/hand response, subtle leg bracing, skill preparation, hit reaction, and a simple knockdown/death pose.
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
