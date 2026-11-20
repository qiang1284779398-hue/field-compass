# Battle character artwork credits

The first historical-art portrait pass uses remote Wikimedia Commons artwork as temporary 2.5D character billboards. It is not yet a rigged 3D model or a wrapped 3D texture.

- Liu Bei: [Portraits of Famous Men - Liu Bei](https://commons.wikimedia.org/wiki/File:Portraits_of_Famous_Men_-_Liu_Bei.jpg), Philadelphia Museum of Art album leaf; public-domain mark / faithful reproduction of a public-domain work.
- Guan Yu: [Guanyu.jpg](https://commons.wikimedia.org/wiki/File:Guanyu.jpg), historical depiction; Wikimedia Commons file page records a Creative Commons Attribution-ShareAlike 3.0 / GFDL license. Credit: Fanghong. Adaptations must comply with the selected license.
- Zhang Fei: [故宫南薰殿张飞画像.jpg](https://commons.wikimedia.org/wiki/File:故宫南薰殿张飞画像.jpg), Qing imperial portrait; public-domain status recorded by Commons.

The images are fetched over HTTPS at runtime. The Android app therefore needs network access for these portraits. If loading fails or the device is offline, the existing SVG character renderer remains as a fallback. Before a final offline release, bundle optimized, rights-checked image files locally and include all required license notices.
