/* Procedural Q-style 3D Liu Bei prototype. Three.js is bundled locally for offline APK use. */
(function () {
  "use strict";
  if (!window.THREE) { console.warn("Three.js runtime unavailable; keeping the Liu Bei SVG fallback."); return; }
  const actors = new Map();
  let app = null, raf = 0, lastScene = null;

  const mat = (color, metalness, roughness) => new THREE.MeshStandardMaterial({
    color: color, metalness: metalness == null ? 0.08 : metalness,
    roughness: roughness == null ? 0.72 : roughness
  });
  const mats = {
    robe: mat(0x681d24, 0.05, 0.82), robeLight: mat(0x91332f, 0.04, 0.78),
    robeDark: mat(0x35171d, 0.04, 0.88), skin: mat(0xc98766, 0.01, 0.92),
    skinShade: mat(0x87513f, 0.01, 0.94), hair: mat(0x171210, 0.01, 0.96),
    beard: mat(0x211915, 0.01, 0.98), gold: mat(0xa77b3d, 0.42, 0.42),
    goldDark: mat(0x65451f, 0.32, 0.55), leather: mat(0x281a15, 0.02, 0.94),
    steel: mat(0x9caeb0, 0.52, 0.34), steelDark: mat(0x4c6264, 0.38, 0.48),
    white: mat(0xd9c8ad, 0.01, 0.72), pupil: mat(0x1a100e, 0.01, 0.42),
    black: mat(0x171310, 0.01, 0.96), jade: mat(0x1e684d, 0.22, 0.42),
    robeEdge: mat(0xc18b51, 0.22, 0.58), lacquer: mat(0x4b171e, 0.24, 0.48),
    goldBright: mat(0xd9b66f, 0.58, 0.31), bronze: mat(0x805329, 0.48, 0.50),
    steelBright: mat(0xe2e5dd, 0.72, 0.24), steelGroove: mat(0x64777c, 0.62, 0.43),
    cloth: mat(0x7d252b, 0.01, 0.98), clothLight: mat(0xa4433b, 0.01, 0.94),
    skinLight: mat(0xe2ac8b, 0.01, 0.90), skinWarm: mat(0xb87359, 0.01, 0.93),
    lip: mat(0x793d37, 0.01, 0.91), eyeDark: mat(0x2b1b18, 0.01, 0.55),
    hairLight: mat(0x35231c, 0.01, 0.90), redJewel: mat(0x7d252b, 0.24, 0.28)
  };

  function add(parent, geometry, material, position, scale, rotation) {
    const o = new THREE.Mesh(geometry, material);
    if (position) o.position.set(position[0], position[1], position[2]);
    if (scale) o.scale.set(scale[0], scale[1], scale[2]);
    if (rotation) o.rotation.set(rotation[0], rotation[1], rotation[2]);
    o.castShadow = false; o.receiveShadow = false;
    parent.add(o); return o;
  }
  function ball(parent, material, position, scale, segments) {
    return add(parent, new THREE.SphereGeometry(1, segments || 16, Math.max(8, Math.round((segments || 16) * .68))), material, position, scale);
  }
  function box(parent, material, position, size, rotation) {
    return add(parent, new THREE.BoxGeometry(size[0], size[1], size[2]), material, position, [1,1,1], rotation);
  }
  function cylinder(parent, material, position, radiusTop, radiusBottom, height, segments, rotation) {
    return add(parent, new THREE.CylinderGeometry(radiusTop, radiusBottom, height, segments || 12), material, position, null, rotation);
  }
  function tube(parent, points, radius, material, segments) {
    const curve = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(p[0],p[1],p[2])));
    return add(parent, new THREE.TubeGeometry(curve, segments || 18, radius, 7, false), material);
  }
  function sculptedPlate(parent, material, x, y, z, width, height, depth, style) {
    const sh = new THREE.Shape(), w=width/2, h=height/2;
    if(style==="shield"){
      sh.moveTo(-w,h*.72); sh.quadraticCurveTo(-w,h,-w*.34,h);
      sh.quadraticCurveTo(0,h*1.04,w*.34,h); sh.quadraticCurveTo(w,h,w,h*.72);
      sh.lineTo(w*.82,-h*.38); sh.quadraticCurveTo(0,-h*1.18,-w*.82,-h*.38); sh.closePath();
    } else {
      sh.moveTo(-w*.72,h); sh.quadraticCurveTo(-w,h,-w,h*.58);
      sh.lineTo(-w*.9,-h*.48); sh.quadraticCurveTo(0,-h*1.12,w*.9,-h*.48);
      sh.lineTo(w,h*.58); sh.quadraticCurveTo(w,h,w*.72,h); sh.closePath();
    }
    const geo=new THREE.ExtrudeGeometry(sh,{depth:depth,steps:1,bevelEnabled:true,bevelSegments:2,bevelSize:Math.min(width,height)*.055,bevelThickness:depth*.22});
    return add(parent,geo,material,[x,y,z]);
  }
  function gem(parent, x, y, z, size, material) {
    const o=add(parent,new THREE.OctahedronGeometry(size,1),material,[x,y,z],[.82,1,.55]);
    return o;
  }
  function seam(parent, points, radius, material) {
    return tube(parent,points,radius,material,24);
  }
  function createSword(hand, side) {
    const sword=new THREE.Group();
    // A proper straight jian silhouette: tapered double edge, central fuller and pointed tip.
    const bladeShape=new THREE.Shape();
    bladeShape.moveTo(-.040,.16); bladeShape.lineTo(-.035,.56); bladeShape.lineTo(-.020,.76);
    bladeShape.quadraticCurveTo(0,.83,.020,.76); bladeShape.lineTo(.035,.56);
    bladeShape.lineTo(.040,.16); bladeShape.quadraticCurveTo(0,.12,-.040,.16);
    const blade=add(sword,new THREE.ExtrudeGeometry(bladeShape,{depth:.018,bevelEnabled:true,bevelSegments:2,bevelSize:.006,bevelThickness:.004}),mats.steel,[0,0,.012]);
    blade.material.side=THREE.DoubleSide;
    tube(sword,[[0,.20,.039],[0,.40,.039],[0,.61,.034],[0,.75,.025]],.005,mats.steelGroove,22);
    tube(sword,[[-.031,.22,.032],[-.027,.49,.032],[-.016,.69,.027]],.004,mats.steelBright,18);
    tube(sword,[[.031,.22,.032],[.027,.49,.032],[.016,.69,.027]],.004,mats.steelBright,18);
    // Guard, engraved grip, wire wrapping and pommel.
    const guard= sculptedPlate(sword,mats.goldDark,0,.145,.04,.25,.085,.035,"shield");
    guard.rotation.z=side*.045;
    box(sword,mats.goldBright,[0,.145,.063],[.18,.018,.012],[0,0,side*.045]);
    cylinder(sword,mats.leather,[0,-.055,.025],.032,.034,.22,14);
    for(let i=0;i<5;i++){
      tube(sword,[[-.025,-.135+i*.038,.052],[.025,-.108+i*.038,.052]],.004,mats.gold,8);
    }
    cylinder(sword,mats.goldDark,[0,-.18,.025],.045,.035,.055,12);
    gem(sword,0,-.183,.057,.025,mats.jade);
    ball(sword,mats.goldBright,[0,-.205,.025],[.027,.027,.027],12);
    sword.rotation.z=side*-.055;
    hand.add(sword);
    return sword;
  }

  function createLiuBei() {
    const world=new THREE.Group();
    const motion=new THREE.Group(); world.add(motion);
    const body=new THREE.Group(); motion.add(body);
    const headPivot=new THREE.Group(); headPivot.position.set(0,1.265,.018); body.add(headPivot);
    const shadow=add(motion,new THREE.CircleGeometry(.43,32),
      new THREE.MeshBasicMaterial({color:0x07100c,transparent:true,opacity:.23,depthWrite:false}),
      [0,.012,0],[1,.30,1],[-Math.PI/2,0,0]);

    // Lower body: dark riding boots, red greaves, articulated knees and tiny gold buckles.
    const legs=[];
    [-1,1].forEach(side=>{
      const leg=new THREE.Group(); leg.position.set(side*.145,.47,0); body.add(leg);
      cylinder(leg,mats.robeDark,[0,-.145,0],.105,.115,.30,16);
      ball(leg,mats.leather,[0,-.315,.045],[.145,.09,.215],16);
      ball(leg,mats.leather,[0,-.275,.14],[.105,.075,.09],14);
      sculptedPlate(leg,mats.lacquer,0,-.15,.112,.145,.235,.035,"shield");
      sculptedPlate(leg,mats.goldDark,0,-.14,.142,.125,.205,.022,"shield");
      sculptedPlate(leg,mats.robeLight,0,-.135,.158,.102,.18,.016,"shield");
      seam(leg,[[-.045,-.235,.174],[0,-.26,.18],[.045,-.235,.174]],.006,mats.goldBright);
      box(leg,mats.goldBright,[0,-.285,.203],[.075,.022,.018]);
      for(let i=0;i<3;i++)ball(leg,mats.gold,[((i-1)*.035),-.05,.104],[.008,.008,.008],8);
      legs.push(leg);
    });

    // Inner robe and flared ceremonial skirt with layered hems and visible cloth folds.
    cylinder(body,mats.robe,[0,.405,0],.255,.385,.64,24);
    cylinder(body,mats.robeDark,[0,.105,0],.385,.395,.085,24);
    cylinder(body,mats.goldDark,[0,.151,0],.394,.402,.038,24);
    cylinder(body,mats.goldBright,[0,.166,0],.397,.399,.012,24);
    cylinder(body,mats.cloth,[0,.255,0],.337,.365,.19,24);
    for(let side=-1;side<=1;side+=2){
      for(let i=0;i<3;i++){
        const x=side*(.12+i*.075);
        seam(body,[[x,.58,.23],[x*1.12,.38,.30],[x*1.22,.18,.31]],.008,i===1?mats.clothLight:mats.robeDark,20);
      }
    }
    // Front split robe panels, piping and embroidered cloud-scroll hems.
    sculptedPlate(body,mats.robeDark,-.105,.30,.315,.22,.43,.025,"shield");
    sculptedPlate(body,mats.robeLight,-.105,.31,.335,.19,.40,.012,"shield");
    sculptedPlate(body,mats.robeDark,.105,.30,.315,.22,.43,.025,"shield");
    sculptedPlate(body,mats.robeLight,.105,.31,.335,.19,.40,.012,"shield");
    seam(body,[[-.22,.12,.33],[-.16,.085,.35],[-.10,.12,.354]],.008,mats.goldBright);
    seam(body,[[.10,.12,.354],[.16,.085,.35],[.22,.12,.33]],.008,mats.goldBright);

    // Torso and lacquered breastplate. Every scale is a separate chamfered metal piece.
    ball(body,mats.robeLight,[0,.745,0],[.355,.385,.255],24);
    ball(body,mats.lacquer,[0,.72,.224],[.327,.326,.09],24);
    ball(body,mats.goldDark,[0,.72,.267],[.302,.303,.065],24);
    ball(body,mats.robeDark,[0,.72,.302],[.285,.287,.048],24);
    // Curved collar and shoulder-to-chest gilded piping.
    seam(body,[[-.22,1.015,.12],[-.14,1.08,.20],[0,1.105,.22],[.14,1.08,.20],[.22,1.015,.12]],.025,mats.goldDark,28);
    seam(body,[[-.20,1.016,.145],[-.12,1.072,.218],[0,1.09,.235],[.12,1.072,.218],[.20,1.016,.145]],.009,mats.goldBright,28);
    for(let row=0;row<4;row++){
      for(let col=0;col<7;col++){
        const x=(col-3)*.075, y=.895-row*.088;
        const curveZ=.324+.026*Math.max(0,1-(x*x/.085)-((y-.72)*(y-.72)/.11));
        sculptedPlate(body,mats.goldDark,x,y,curveZ,.071,.067,.019,"round");
        sculptedPlate(body,(row+col)%3===0?mats.goldBright:mats.gold,x,y+.004,curveZ+.014,.061,.054,.014,"round");
        ball(body,mats.bronze,[x-.022,y+.012,curveZ+.031],[.006,.006,.004],8);
        ball(body,mats.goldBright,[x+.022,y+.012,curveZ+.031],[.006,.006,.004],8);
      }
    }
    // Central heraldic medallion: Liu Bei's benevolent-house crest in jade and gold.
    ball(body,mats.goldDark,[0,.714,.367],[.115,.145,.035],20);
    ball(body,mats.goldBright,[0,.714,.392],[.092,.12,.024],20);
    ball(body,mats.redJewel,[0,.714,.411],[.065,.09,.018],18);
    seam(body,[[0,.79,.431],[-.035,.75,.434],[0,.714,.436],[.035,.675,.434],[0,.64,.431]],.008,mats.goldBright);
    gem(body,0,.714,.447,.027,mats.jade);
    // Lower segmented faulds and engraved gold borders.
    for(let i=0;i<7;i++){
      const x=(i-3)*.087, y=.335-Math.abs(i-3)*.012;
      sculptedPlate(body,mats.goldDark,x,y,.317,.082,.13,.035,"shield");
      sculptedPlate(body,i%2?mats.robeLight:mats.robe,x,y+.004,.339,.068,.109,.018,"shield");
      seam(body,[[x-.022,y+.045,.361],[x,y+.055,.364],[x+.022,y+.045,.361]],.004,mats.goldBright,8);
    }
    // Belt with a carved buckle, jade clasp, rivets and hanging ceremonial tassels.
    box(body,mats.leather,[0,.445,.292],[.60,.105,.065]);
    box(body,mats.goldDark,[0,.445,.335],[.145,.135,.035]);
    box(body,mats.goldBright,[0,.445,.359],[.112,.105,.018]);
    sculptedPlate(body,mats.redJewel,0,.445,.375,.07,.068,.012,"round");
    gem(body,0,.445,.395,.025,mats.jade);
    for(let i=0;i<9;i++)ball(body,mats.goldBright,[(i-4)*.067,.484,.337],[.009,.009,.008],8);
    [-1,1].forEach(side=>{
      box(body,mats.robeDark,[side*.20,.29,.327],[.068,.22,.037],[0,0,side*.10]);
      box(body,mats.goldBright,[side*.20,.29,.352],[.012,.19,.012],[0,0,side*.10]);
      ball(body,mats.jade,[side*.20,.185,.36],[.024,.04,.017],12);
      tube(body,[[side*.20,.16,.36],[side*.22,.105,.35],[side*.24,.065,.34]],.006,mats.gold,12);
    });

    // Back mantle: a shaped, layered cape with a raised gold hem and embroidered vertical folds.
    const capeShape=new THREE.Shape();
    capeShape.moveTo(-.22,.99); capeShape.quadraticCurveTo(0,1.08,.22,.99);
    capeShape.lineTo(.39,.16); capeShape.quadraticCurveTo(.22,.04,0,.10);
    capeShape.quadraticCurveTo(-.22,.04,-.39,.16); capeShape.closePath();
    const cape=add(body,new THREE.ExtrudeGeometry(capeShape,{depth:.018,bevelEnabled:true,bevelSegments:2,bevelSize:.012,bevelThickness:.008}),mats.robeDark,[0,.015,-.235]);
    cape.material.side=THREE.DoubleSide;
    seam(body,[[-.37,.16,-.205],[-.26,.10,-.205],[0,.075,-.205],[.26,.10,-.205],[.37,.16,-.205]],.012,mats.goldDark,28);
    seam(body,[[-.35,.17,-.194],[-.24,.12,-.194],[0,.10,-.194],[.24,.12,-.194],[.35,.17,-.194]],.004,mats.goldBright,28);
    for(let i=-2;i<=2;i++){
      const x=i*.105;
      seam(body,[[x*.72,.89,-.205],[x,.57,-.206],[x*1.25,.26,-.206]],.006,i%2?mats.robe:mats.clothLight,20);
    }
    // Ornamental clasp at the nape.
    ball(body,mats.goldDark,[0,.99,-.17],[.105,.09,.045],14);
    gem(body,0,.99,-.12,.045,mats.jade);

    // Articulated arm chains: sleeve, elbow, bracer, wrist cuff, detailed hand and jian.
    const arms=[];
    [-1,1].forEach(side=>{
      const arm=new THREE.Group(); arm.position.set(side*.345,.94,.025); body.add(arm);
      ball(arm,mats.robeDark,[0,-.08,0],[.17,.20,.17],18);
      ball(arm,mats.robeLight,[0,-.135,.02],[.135,.175,.13],16);
      sculptedPlate(arm,mats.goldDark,0,-.12,.126,.235,.22,.045,"shield");
      sculptedPlate(arm,mats.gold,0,-.115,.153,.205,.18,.025,"shield");
      sculptedPlate(arm,mats.robeLight,0,-.11,.171,.174,.145,.014,"shield");
      seam(arm,[[-.082,-.08,.185],[0,-.035,.195],[.082,-.08,.185]],.006,mats.goldBright,16);
      gem(arm,0,-.105,.195,.022,mats.jade);
      const forearm=new THREE.Group(); forearm.position.set(0,-.255,.02); arm.add(forearm);
      cylinder(forearm,mats.robe,[0,-.115,0],.105,.085,.25,16);
      ball(forearm,mats.robeLight,[0,-.11,.015],[.10,.14,.095],14);
      sculptedPlate(forearm,mats.goldDark,0,-.13,.095,.145,.255,.03,"shield");
      sculptedPlate(forearm,mats.gold,0,-.13,.116,.12,.225,.02,"shield");
      sculptedPlate(forearm,mats.robeLight,0,-.13,.132,.09,.19,.012,"shield");
      seam(forearm,[[-.052,-.16,.15],[0,-.19,.155],[.052,-.16,.15]],.005,mats.goldBright,12);
      cylinder(forearm,mats.goldDark,[0,-.245,.02],.105,.105,.065,16);
      cylinder(forearm,mats.goldBright,[0,-.245,.066],.092,.092,.018,16);
      const hand=new THREE.Group(); hand.position.set(0,-.305,.045); forearm.add(hand);
      ball(hand,mats.skin,[0,0,.018],[.082,.092,.074],16);
      for(let finger=0;finger<4;finger++){
        const fx=(finger-1.5)*.033;
        ball(hand,mats.skinLight,[fx,-.055,.036],[.018,.044,.024],10);
        ball(hand,mats.skinWarm,[fx,-.084,.034],[.016,.012,.021],8);
      }
      ball(hand,mats.skinWarm,[side*.065,-.005,.04],[.027,.05,.026],10);
      const sword=createSword(hand,side);
      arms.push({arm,forearm,hand,sword,side});
    });

    // Head silhouette and neck: rounded, dignified face with recognizable long Liu Bei earlobes.
    cylinder(body,mats.skinWarm,[0,1.105,.005],.105,.095,.20,16);
    ball(headPivot,mats.hair,[0,.012,-.055],[.375,.405,.34],24);
    ball(headPivot,mats.skin,[0,.005,.035],[.342,.372,.315],28);
    ball(headPivot,mats.skinLight,[0,.08,.205],[.285,.26,.15],24);
    // Jawline and soft cheek planes keep the benevolent, mature expression.
    ball(headPivot,mats.skinWarm,[0,-.205,.17],[.255,.14,.17],20);
    [-1,1].forEach(side=>{
      ball(headPivot,mats.skin,[side*.335,-.04,.035],[.085,.135,.085],16);
      ball(headPivot,mats.skinLight,[side*.355,-.10,.055],[.072,.095,.075],14);
      ball(headPivot,mats.skinWarm,[side*.356,-.075,.105],[.025,.085,.018],12);
      ball(headPivot,mats.hair,[side*.306,.095,-.005],[.074,.255,.09],16);
      ball(headPivot,mats.hairLight,[side*.292,-.095,.06],[.058,.17,.075],14);
      // Hairline curls over the temples.
      for(let i=0;i<3;i++)ball(headPivot,mats.hair,[side*(.245+i*.027),.255-i*.035,.19],[.05,.055,.045],10);
      // Large soft earlobes with subtle gold pendants.
      ball(headPivot,mats.skin,[side*.352,-.035,.045],[.078,.13,.09],16);
      ball(headPivot,mats.skinWarm,[side*.36,-.085,.10],[.052,.075,.04],12);
      ball(headPivot,mats.skinShade,[side*.367,-.02,.112],[.022,.054,.012],10);
      ball(headPivot,mats.goldBright,[side*.37,-.145,.095],[.018,.028,.015],10);
      gem(headPivot,side*.37,-.18,.105,.018,mats.jade);
    });
    // Swept dark hair and a tied top-knot visible beneath the ceremonial crown.
    ball(headPivot,mats.hair,[0,.265,-.012],[.345,.16,.30],20);
    ball(headPivot,mats.hairLight,[0,.30,-.005],[.25,.07,.28],18);
    ball(headPivot,mats.hair,[0,.385,-.035],[.09,.095,.11],14);

    // Imperial scholar-warrior crown: cloth cap, embossed gold band, long horizontal wings and jewels.
    sculptedPlate(headPivot,mats.robeDark,0,.385,-.012,.47,.18,.20,"shield");
    sculptedPlate(headPivot,mats.goldDark,0,.408,.168,.46,.085,.035,"round");
    sculptedPlate(headPivot,mats.goldBright,0,.419,.188,.405,.047,.018,"round");
    seam(headPivot,[[-.19,.42,.205],[-.10,.439,.212],[0,.445,.214],[.10,.439,.212],[.19,.42,.205]],.006,mats.goldBright,22);
    // Symmetrical ceremonial wings with inset red enamel and fine gold rims.
    [-1,1].forEach(side=>{
      const wing= sculptedPlate(headPivot,mats.goldDark,side*.405,.397,.01,.39,.10,.045,"shield");
      wing.rotation.z=side*.035;
      const inset=sculptedPlate(headPivot,mats.robeDark,side*.405,.402,.037,.33,.052,.012,"round");
      inset.rotation.z=side*.035;
      for(let i=0;i<5;i++){
        const x=side*(.275+i*.055);
        ball(headPivot,mats.goldBright,[x,.407,.056],[.009,.009,.008],8);
      }
      gem(headPivot,side*.56,.397,.035,.025,mats.jade);
    });
    sculptedPlate(headPivot,mats.goldDark,0,.50,-.005,.22,.13,.18,"shield");
    sculptedPlate(headPivot,mats.gold,0,.513,.105,.18,.085,.035,"round");
    sculptedPlate(headPivot,mats.robeLight,0,.52,.126,.115,.055,.018,"round");
    gem(headPivot,0,.56,.153,.055,mats.jade);
    gem(headPivot,0,.56,.188,.024,mats.redJewel);
    add(headPivot,new THREE.ConeGeometry(.045,.12,10),mats.goldBright,[0,.63,.02]);
    // Brow ridge, almond eyes, lids, irises, catchlights and cheek warmth.
    [-1,1].forEach(side=>{
      tube(headPivot,[[side*.055,.095,.319],[side*.11,.115,.325],[side*.18,.09,.31]],.014,mats.hair,16);
      ball(headPivot,mats.skinWarm,[side*.12,.012,.314],[.071,.052,.024],16);
      ball(headPivot,mats.white,[side*.12,.012,.335],[.053,.036,.018],16);
      ball(headPivot,mats.pupil,[side*.11,.008,.351],[.023,.029,.012],14);
      ball(headPivot,mats.eyeDark,[side*.11,.008,.359],[.011,.019,.007],10);
      ball(headPivot,mats.white,[side*.098,.023,.366],[.008,.008,.004],8);
      seam(headPivot,[[side*.065,.00,.346],[side*.12,-.026,.351],[side*.175,.0,.344]],.005,mats.skinShade,14);
      ball(headPivot,mats.skinWarm,[side*.225,-.095,.292],[.062,.043,.012],12);
      ball(headPivot,mats.robeLight,[side*.235,-.105,.302],[.025,.01,.006],8);
    });
    // Sculpted nose: bridge, rounded tip, wings and nostril shadows.
    ball(headPivot,mats.skinLight,[0,-.035,.326],[.035,.085,.045],14);
    ball(headPivot,mats.skin,[0,-.09,.356],[.048,.045,.042],14);
    [-1,1].forEach(side=>{
      ball(headPivot,mats.skinWarm,[side*.035,-.103,.34],[.027,.022,.019],10);
      ball(headPivot,mats.skinShade,[side*.027,-.118,.357],[.009,.006,.005],8);
    });
    // A quiet, confident mouth sits below the moustache.
    seam(headPivot,[[-.055,-.178,.337],[-.025,-.188,.344],[0,-.19,.346],[.025,-.188,.344],[.055,-.178,.337]],.006,mats.lip,18);
    ball(headPivot,mats.skinLight,[0,-.205,.326],[.052,.018,.018],12);
    // Distinct Liu Bei moustache, layered beard curls and short divided chin beard.
    seam(headPivot,[[0,-.135,.351],[-.05,-.145,.363],[-.13,-.13,.354],[-.205,-.092,.318]],.027,mats.beard,24);
    seam(headPivot,[[0,-.135,.351],[.05,-.145,.363],[.13,-.13,.354],[.205,-.092,.318]],.027,mats.beard,24);
    seam(headPivot,[[0,-.16,.354],[-.02,-.205,.36],[-.025,-.265,.34],[-.012,-.31,.312]],.018,mats.beard,20);
    seam(headPivot,[[0,-.16,.354],[.02,-.205,.36],[.025,-.265,.34],[.012,-.31,.312]],.018,mats.beard,20);
    ball(headPivot,mats.beard,[0,-.21,.323],[.07,.075,.045],14);
    for(let i=0;i<7;i++){
      const x=(i-3)*.019;
      seam(headPivot,[[x,-.205,.36],[x*1.12,-.255,.35],[x*1.25,-.30-Math.abs(i-3)*.006,.326]],.006,mats.hairLight,12);
    }
    // Fine decorative studs, chest rivets, cloth rosettes and sleeve seams.
    for(let i=0;i<4;i++){
      const x=(i-1.5)*.12;
      gem(body,x,.99,.235,.014,mats.redJewel);
    }
    [-1,1].forEach(side=>{
      ball(body,mats.goldBright,[side*.14,.63,.325],[.018,.018,.01],10);
      ball(body,mats.goldDark,[side*.31,.88,.12],[.035,.035,.035],10);
      seam(body,[[side*.29,.79,.14],[side*.35,.73,.13],[side*.39,.66,.11]],.006,mats.goldBright,14);
    });

    optimizeStaticMeshes(world);
    return {world,motion,body,headPivot,arms,legs,shadow,meshes:0,baseHeight:2.08,
      action:"idle",actionAt:0,wasSwinging:false,wasCast:false,wasHurt:false,wasDead:false,
      baseX:0,baseY:0,scale:1};
  }

  function init() {
    if(app) return;
    const scene=new THREE.Scene();
    const camera=new THREE.OrthographicCamera(-2,2,2,-2,.1,100);
    camera.position.set(0,0,20); camera.lookAt(0,0,0);
    const renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:"low-power",preserveDrawingBuffer:false});
    renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.25));
    renderer.setClearColor(0x000000,0);
    if(THREE.sRGBEncoding)renderer.outputEncoding=THREE.sRGBEncoding;
    if(THREE.ACESFilmicToneMapping!==undefined)renderer.toneMapping=THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure=.82;
    scene.add(new THREE.HemisphereLight(0xffe6ce,0x34231d,.88));
    const key=new THREE.DirectionalLight(0xffd59c,1.18);key.position.set(-3,6,8);scene.add(key);
    const fill=new THREE.DirectionalLight(0x86a9c9,.30);fill.position.set(4,2,-5);scene.add(fill);
    app={scene,camera,renderer,width:0,height:0};
  }
  function ensureActor(id,key) {
    if(actors.has(key))return actors.get(key);
    if(id!=="liu-bei")return null;
    const rec=createLiuBei();rec.id=id;rec.key=key;
    rec.meshes=0;rec.world.traverse(o=>{if(o.isMesh)rec.meshes++;});
    app.scene.add(rec.world);actors.set(key,rec);return rec;
  }
  // Merge static sibling meshes by material inside each rig segment. This keeps the sculpted
  // detail while reducing hundreds of tiny draw calls on mid-range Android devices.
  function mergeStaticMeshes(group) {
    const buckets=new Map(), remove=[];
    group.children.forEach(child=>{
      if(!child.isMesh||!child.geometry||!child.geometry.attributes.position)return;
      child.updateMatrix();
      const key=child.material.uuid;
      if(!buckets.has(key))buckets.set(key,{material:child.material,positions:[],normals:[]});
      const bucket=buckets.get(key),source=child.geometry.clone();
      source.applyMatrix4(child.matrix);
      const geometry=source.index?source.toNonIndexed():source;
      if(geometry!==source)source.dispose();
      if(!geometry.attributes.normal)geometry.computeVertexNormals();
      const p=geometry.attributes.position.array,n=geometry.attributes.normal.array;
      for(let i=0;i<p.length;i++)bucket.positions.push(p[i]);
      for(let i=0;i<n.length;i++)bucket.normals.push(n[i]);
      geometry.dispose();child.geometry.dispose();remove.push(child);
    });
    remove.forEach(child=>group.remove(child));
    buckets.forEach(bucket=>{
      const geometry=new THREE.BufferGeometry();
      geometry.setAttribute("position",new THREE.BufferAttribute(new Float32Array(bucket.positions),3));
      geometry.setAttribute("normal",new THREE.BufferAttribute(new Float32Array(bucket.normals),3));
      geometry.computeBoundingSphere();
      const mesh=new THREE.Mesh(geometry,bucket.material);
      mesh.castShadow=false;mesh.receiveShadow=false;
      group.add(mesh);
    });
  }
  function optimizeStaticMeshes(root) {
    root.traverse(node=>{if(node.isGroup)mergeStaticMeshes(node);});
  }
  const smooth=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};
  function chooseAction(rec,kind,now) {
    if(rec.action===kind)return;
    rec.action=kind;rec.actionAt=now;
  }
  function sync(sceneEl) {
    if(!app||!sceneEl)return;
    if(lastScene!==sceneEl){sceneEl.appendChild(app.renderer.domElement);app.renderer.domElement.className="hero3d-layer";app.renderer.domElement.setAttribute("aria-hidden","true");lastScene=sceneEl;}
    const rect=sceneEl.getBoundingClientRect(),w=Math.max(1,rect.width),h=Math.max(1,rect.height);
    if(w!==app.width||h!==app.height){
      app.width=w;app.height=h;app.renderer.setSize(w,h,false);
      app.camera.left=-w/200;app.camera.right=w/200;app.camera.top=h/200;app.camera.bottom=-h/200;app.camera.updateProjectionMatrix();
    }
    sceneEl.querySelectorAll('.warrior[data-hero3d="liu-bei"]').forEach(el=>{
      const key="liu-bei:"+el.dataset.side+":"+el.dataset.index,rec=ensureActor("liu-bei",key);
      if(!rec)return;
      const anchor=el.querySelector(".body-art");if(!anchor)return;
      const a=anchor.getBoundingClientRect(),cx=a.left-rect.left+a.width/2,base=a.bottom-rect.top;
      rec.baseX=(cx-w/2)/100;rec.baseY=(h/2-base)/100;
      const desiredHeight=a.height/100;rec.scale=desiredHeight/rec.baseHeight;
      rec.world.position.set(rec.baseX,rec.baseY,0);rec.world.scale.setScalar(rec.scale);
      rec.world.rotation.y=.12;
      const now=performance.now(),swing=el.classList.contains("swinging")||el.classList.contains("attack-left")||el.classList.contains("attack-right"),
        cast=el.classList.contains("cast"),hurt=el.classList.contains("hurt"),dead=el.classList.contains("dead");
      if(swing&&!rec.wasSwinging)chooseAction(rec,"attack",now);
      else if(cast&&!rec.wasCast)chooseAction(rec,"skill",now);
      else if(hurt&&!rec.wasHurt)chooseAction(rec,"hurt",now);
      else if(dead&&!rec.wasDead)chooseAction(rec,"dead",now);
      if(!swing&&!cast&&!hurt&&!dead&&now-rec.actionAt>(rec.action==="attack"?.72:rec.action==="skill"?.82:rec.action==="hurt"?.52:rec.action==="dead"?999:0))chooseAction(rec,"idle",now);
      rec.wasSwinging=swing;rec.wasCast=cast;rec.wasHurt=hurt;rec.wasDead=dead;
      el.classList.add("hero3d-ready");
    });
  }
  function animate(rec,now) {
    const t=(now-rec.actionAt)/1000, idleWave=Math.sin(now*.0024);
    let slash=0,raise=0,lean=0,tilt=0,brace=0;
    if(rec.action==="attack"&&t<.78){
      const p=t/.78;
      // Anticipation -> committed cut -> short impact hold -> weighted recovery.
      if(p<.23){brace=smooth(p/.23);slash=-.16*brace;}
      else if(p<.48){const q=smooth((p-.23)/.25);slash=-.16+1.16*q;}
      else if(p<.62){slash=1.0-.06*smooth((p-.48)/.14);}
      else slash=.94*(1-smooth((p-.62)/.38));
      lean=Math.sin(Math.min(1,p)*Math.PI)*.17;
      tilt=-slash*.12;
    } else if(rec.action==="skill"&&t<.92){
      const p=t/.92;
      raise=p<.30?smooth(p/.30):p<.69?1-smooth((p-.30)/.39):0;
      lean=Math.sin(p*Math.PI)*.11;
      brace=raise;
    } else if(rec.action==="hurt"&&t<.58){
      const p=t/.58;tilt=Math.sin(p*Math.PI)*.22;lean=-Math.sin(p*Math.PI)*.075;
    } else if(rec.action==="dead"){
      tilt=-1.25;lean=-.18;
    } else if(rec.action!=="idle"&&t>(rec.action==="attack"?.78:rec.action==="skill"?.92:.58)){
      rec.action="idle";rec.actionAt=now;
    }
    rec.motion.position.y=.012*Math.sin(now*.003)+lean;
    rec.motion.position.x=(rec.action==="attack"?slash*.075:0);
    rec.motion.rotation.z=tilt;
    rec.body.rotation.y=(rec.action==="attack"?slash*.34:0)+.022*Math.sin(now*.0014);
    rec.body.scale.y=1-(rec.action==="attack"?.025*slash:0);
    rec.headPivot.rotation.x=.018*Math.sin(now*.0017)+(rec.action==="attack"?-.045*slash:0);
    rec.headPivot.rotation.y=.028*Math.sin(now*.0012)+(rec.action==="attack"?-.06*slash:0);
    rec.arms.forEach(arm=>{
      const idle=arm.side*(.085+.025*idleWave);
      if(rec.action==="attack")arm.arm.rotation.z=idle+slash*(arm.side===1?-1.72:1.28);
      else if(rec.action==="skill")arm.arm.rotation.z=idle+raise*(arm.side===1?-.98:1.12);
      else if(rec.action==="hurt")arm.arm.rotation.z=idle+Math.sin(t/.58*Math.PI)*arm.side*.32;
      else if(rec.action==="dead")arm.arm.rotation.z=arm.side*.68;
      else arm.arm.rotation.z=idle;
      arm.forearm.rotation.z=rec.action==="attack"?slash*(arm.side===1?-.56:.42):rec.action==="skill"?raise*-.36:0;
      arm.hand.rotation.z=rec.action==="attack"?slash*(arm.side===1?-.19:.15):rec.action==="skill"?raise*.10:0;
      arm.sword.rotation.z=(rec.action==="attack"?slash*(arm.side===1?-.72:.52):rec.action==="skill"?raise*(arm.side===1?-.42:.48):0);
    });
    rec.legs.forEach((leg,index)=>{
      const side=index===0?-1:1;
      leg.rotation.z=rec.action==="attack"?side*.035*slash:rec.action==="hurt"?side*.06:rec.action==="dead"?side*.12:side*.008*Math.sin(now*.002);
      leg.rotation.x=rec.action==="attack"?(index===1?-.07:.035)*slash:0;
    });
    rec.shadow.material.opacity=rec.action==="dead"?.30:.23;
  }

  function frame(now) {
    raf=requestAnimationFrame(frame);
    if(!app)return;
    if(lastScene&&lastScene.isConnected){sync(lastScene);actors.forEach(a=>animate(a,now));app.renderer.render(app.scene,app.camera);}
  }
  window.__hero3dStatus=function(){
    return Array.from(actors.values()).map(a=>({id:a.id,ready:true,renderer:!!app&&!!app.renderer.getContext(),meshes:a.meshes,detailLevel:"high-detail-chibi",rig:{head:true,torso:true,shoulders:true,forearms:true,hands:true,legs:true,weapons:2},optimizedStaticMeshes:true,toneMappingExposure:app&&app.renderer.toneMappingExposure,model:"procedural-chibi-3d",heightRatio:2.08/0.74,state:a.action,scale:a.scale,position:{x:a.world.position.x,y:a.world.position.y}}));
  };
  window.initHero3D=function(sceneEl){
    try{init();if(!app)return;sync(sceneEl);if(!raf)raf=requestAnimationFrame(frame);}
    catch(e){console.warn("Q版3D刘备初始化失败，保留2D立绘回退",e);}
  };
  window.addEventListener("resize",()=>{if(lastScene&&lastScene.isConnected)sync(lastScene);});
})();