# Battle character artwork and model notes

Battle rendering now uses generated, offline-bundled rigged GLB characters (Liu Bei, Guan Yu, Zhang Fei) through Three.js. These are procedural 3D characters with skinned meshes and animation clips; they are **not** historical portrait face swaps, and their faces are not texture-mapped from the portraits below.

Historical portraits are retained only as research/reference material:
- Liu Bei: [Portraits of Famous Men - Liu Bei](https://commons.wikimedia.org/wiki/File:Portraits_of_Famous_Men_-_Liu_Bei.jpg), Philadelphia Museum of Art album leaf.
- Guan Yu: [Guanyu.jpg](https://commons.wikimedia.org/wiki/File:Guanyu.jpg), Wikimedia Commons file page; credit/license attribution should be verified before reuse.
- Zhang Fei: [故宫南薰殿张飞画像.jpg](https://commons.wikimedia.org/wiki/File:故宫南薰殿张飞画像.jpg), Qing imperial portrait.

Runtime battle models are loaded from the app's local assets, so they do not require portrait-network downloads. If GLB/WebGL loading fails, the SVG fallback remains visible.