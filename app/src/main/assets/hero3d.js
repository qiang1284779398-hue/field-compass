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
    black: mat(0x171310, 0.01, 0.96), jade: mat(0x1e684d, 0.22, 0.42)
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
  function tube(parent, points, radius, material) {
    const curve = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(p[0],p[1],p[2])));
    return add(parent, new THREE.TubeGeometry(curve, 14, radius, 7, false), material);
  }
  function createSword(hand, side) {
    const sword = new THREE.Group();
    cylinder(sword, mats.leather, [0,-.02,.02], .035, .035, .18, 10);
    box(sword, mats.gold, [0,.075,.025], [.25,.045,.07], [0,0,side*.08]);
    cylinder(sword, mats.goldDark, [0,-.11,.02], .045, .045, .045, 10);
    box(sword, mats.steel, [0,.37,.015], [.075,.51,.026]);
    const tip = add(sword, new THREE.ConeGeometry(.052,.15,4), mats.steel, [0,.70,.015], null, [0,0,0]);
    tip.rotation.z = 0;
    box(sword, mats.steelDark, [0,.28,.032], [.04,.22,.012]);
    sword.rotation.z = side * -.08;
    hand.add(sword);
    return sword;
  }

  function createLiuBei() {
    const world = new THREE.Group();
    const motion = new THREE.Group(); world.add(motion);
    const body = new THREE.Group(); motion.add(body);
    const headPivot = new THREE.Group(); headPivot.position.set(0,1.26,.015); body.add(headPivot);

    // Ground shadow and short boots/legs establish a compact 2.7-head chibi silhouette.
    const shadow = add(motion, new THREE.CircleGeometry(.42,24), new THREE.MeshBasicMaterial({color:0x07100c,transparent:true,opacity:.24,depthWrite:false}), [0,.012,0], [1,.32,1], [-Math.PI/2,0,0]);
    [-1,1].forEach(side => {
      const leg = new THREE.Group(); leg.position.set(side*.145,.48,0); body.add(leg);
      cylinder(leg, mats.robeDark, [0,-.17,0], .105,.12,.34,12);
      ball(leg,mats.leather,[0,-.34,.035],[.14,.085,.22],12);
      box(leg,mats.goldDark,[0,-.265,.145],[.16,.035,.035]);
    });

    // Short red tunic, flared hem, belt and embossed lamellar chest armor.
    cylinder(body,mats.robe,[0,.39,0],.245,.39,.62,16);
    cylinder(body,mats.robeDark,[0,.115,0],.33,.395,.075,16);
    cylinder(body,mats.goldDark,[0,.17,0],.337,.39,.035,16);
    const torso=ball(body,mats.robeLight,[0,.72,0],[.355,.39,.25],18);
    ball(body,mats.goldDark,[0,.70,.225],[.325,.33,.085],18);
    ball(body,mats.robeDark,[0,.71,.276],[.294,.298,.055],18);
    ball(body,mats.robeLight,[0,.73,.314],[.274,.273,.035],18);
    // Individually layered lamellar plates with dark seams, rivets and engraved edging.
    for(let row=0;row<4;row++){
      for(let col=0;col<5;col++){
        const x=(col-2)*.094, y=.875-row*.092, z=.351-Math.abs(x)*.12;
        box(body,mats.goldDark,[x,y-.006,z-.006],[.084,.066,.026],[0,0,-x*.25]);
        box(body,mats.gold,[x,y+.004,z+.009],[.073,.047,.022],[0,0,-x*.25]);
        ball(body,mats.goldDark,[x-.026,y+.004,z+.022],[.008,.008,.006],8);
        ball(body,mats.goldDark,[x+.026,y+.004,z+.022],[.008,.008,.006],8);
      }
    }
    // Raised central breastplate, embossed cloud motif and lower segmented faulds.
    ball(body,mats.gold,[0,.69,.354],[.105,.145,.035],16);
    ball(body,mats.goldDark,[0,.69,.385],[.071,.105,.014],14);
    tube(body,[[0,.77,.402],[-.035,.72,.404],[0,.68,.406],[.035,.64,.404],[0,.60,.402]],.009,mats.gold);
    for(let i=0;i<5;i++){
      const x=(i-2)*.105;
      box(body,mats.goldDark,[x,.265,.333],[.088,.095,.028],[0,0,-x*.12]);
      box(body,mats.robeLight,[x,.27,.35],[.071,.073,.018],[0,0,-x*.12]);
      ball(body,mats.gold,[x,.31,.367],[.012,.012,.008],8);
    }
    box(body,mats.gold,[0,.49,.276],[.58,.045,.055]);
    box(body,mats.leather,[0,.43,.27],[.60,.11,.055]);
    box(body,mats.gold,[0,.43,.31],[.12,.12,.04]);
    box(body,mats.goldDark,[0,.43,.337],[.075,.075,.018]);
    ball(body,mats.jade,[0,.43,.35],[.038,.038,.018],14);
    // Belt rivets and paired hanging jade/gold fittings.
    for(let i=0;i<7;i++)ball(body,mats.gold,[((i-3)*.075),.49,.314],[.012,.012,.009],8);
    [-1,1].forEach(side=>{
      box(body,mats.robeDark,[side*.19,.30,.33],[.065,.19,.035],[0,0,side*.08]);
      box(body,mats.gold,[side*.19,.30,.355],[.012,.17,.012],[0,0,side*.08]);
    });
    [-1,1].forEach(side=>{
      ball(body,mats.robeDark,[side*.34,.91,0],[.22,.18,.23],14);
      ball(body,mats.goldDark,[side*.34,.94,.12],[.205,.15,.12],16);
      ball(body,mats.gold,[side*.34,.94,.19],[.18,.125,.075],16);
      ball(body,mats.robeLight,[side*.34,.94,.235],[.145,.09,.025],14);
      for(let k=0;k<4;k++){
        const yy=.99-k*.045;
        box(body,mats.goldDark,[side*.34,yy,.25],[.205,.028,.018],[0,0,side*.06]);
        box(body,mats.gold,[side*.34,yy+.008,.263],[.17,.012,.012],[0,0,side*.06]);
      }
      ball(body,mats.gold,[side*.34,.87,.27],[.035,.035,.02],10);
    });

    // Back mantle: a layered red cape with a gold hem.
    const cape = new THREE.Shape();
    cape.moveTo(-.23,.96); cape.lineTo(.23,.96); cape.lineTo(.39,.10);
    cape.quadraticCurveTo(.15,-.02,0,.08); cape.quadraticCurveTo(-.16,-.02,-.39,.10); cape.closePath();
    const capeMesh = add(body,new THREE.ShapeGeometry(cape),mats.robeDark,[0,.02,-.20]);
    capeMesh.material.side=THREE.DoubleSide;
    box(body,mats.gold,[0,.12,-.17],[.67,.035,.03]);

    // Articulated shoulders, elbows, forearms and twin swords.
    const arms=[];
    [-1,1].forEach(side=>{
      const arm=new THREE.Group(); arm.position.set(side*.34,.94,.02); body.add(arm);
      cylinder(arm,mats.robeLight,[0,-.13,0],.135,.12,.29,12,[0,0,side*-.1]);
      ball(arm,mats.goldDark,[0,-.25,.012],[.125,.115,.12],12);
      const forearm=new THREE.Group(); forearm.position.set(0,-.26,.015); arm.add(forearm);
      cylinder(forearm,mats.robe,[0,-.105,0],.105,.085,.24,12);
      cylinder(forearm,mats.gold,[0,-.22,.018],.095,.095,.075,12);
      const hand=new THREE.Group(); hand.position.set(0,-.29,.045); forearm.add(hand);
      ball(hand,mats.skin,[0,0,.015],[.095,.09,.085],12);
      const sword=createSword(hand,side);
      arms.push({arm,forearm,hand,sword,side});
    });

    // Oversized expressive head, side hair, face and restrained imperial headpiece.
    ball(headPivot,mats.hair,[0,.01,-.035],[.372,.405,.335],20);
    ball(headPivot,mats.skin,[0,-.005,.035],[.337,.373,.313],20);
    [-1,1].forEach(side=>{
      ball(headPivot,mats.skin,[side*.322,-.055,.02],[.075,.12,.09],12);
      ball(headPivot,mats.robeDark,[side*.303,.10,-.005],[.075,.24,.09],12);
      ball(headPivot,mats.skinShade,[side*.315,-.055,.087],[.022,.06,.012],10);
    });
    // Forehead/hairline and crown.
    ball(headPivot,mats.hair,[0,.265,-.005],[.34,.16,.31],18);
    // Layered imperial headpiece: cloth cap, engraved brow band, side wings and jade crest.
    box(headPivot,mats.robeDark,[0,.375,-.005],[.43,.12,.34]);
    box(headPivot,mats.goldDark,[0,.405,.174],[.34,.055,.045]);
    box(headPivot,mats.gold,[0,.416,.198],[.29,.027,.018]);
    for(let i=0;i<7;i++)ball(headPivot,mats.gold,[((i-3)*.043),.416,.212],[.009,.009,.006],8);
    box(headPivot,mats.goldDark,[0,.47,-.005],[.21,.105,.17]);
    box(headPivot,mats.gold,[0,.485,.087],[.17,.09,.035]);
    box(headPivot,mats.robeLight,[0,.47,.108],[.10,.06,.018]);
    [-1,1].forEach(side=>{
      box(headPivot,mats.goldDark,[side*.31,.405,-.005],[.38,.055,.09],[0,0,side*-.025]);
      box(headPivot,mats.gold,[side*.31,.416,.044],[.34,.018,.018],[0,0,side*-.025]);
      ball(headPivot,mats.gold,[side*.47,.39,-.005],[.025,.025,.025],10);
    });
    ball(headPivot,mats.jade,[0,.55,.11],[.058,.058,.035],16);
    ball(headPivot,mats.gold,[0,.55,.135],[.075,.018,.018],12);
    add(headPivot,new THREE.ConeGeometry(.052,.13,8),mats.gold,[0,.63,0]);
    // Brows, almond eyes, pupils, nose and cheek shading.
    [-1,1].forEach(side=>{
      // Sculpted brows, upper/lower eyelids, iris glint and cheek planes.
      box(headPivot,mats.hair,[side*.12,.078,.319],[.12,.028,.024],[0,0,side*.11]);
      ball(headPivot,mats.skinShade,[side*.115,.015,.321],[.062,.046,.022],14);
      ball(headPivot,mats.white,[side*.115,.015,.337],[.049,.034,.018],14);
      ball(headPivot,mats.pupil,[side*.105,.014,.352],[.022,.027,.012],12);
      ball(headPivot,mats.black,[side*.105,.014,.361],[.009,.014,.007],8);
      ball(headPivot,mats.white,[side*.094,.026,.366],[.007,.007,.004],8);
      tube(headPivot,[[side*.07,-.012,.35],[side*.115,-.025,.355],[side*.16,-.012,.35]],.006,mats.skinShade);
      ball(headPivot,mats.skinShade,[side*.22,-.095,.285],[.065,.04,.015],10);
      ball(headPivot,mats.robeLight,[side*.23,-.11,.296],[.034,.012,.009],8);
    });
    ball(headPivot,mats.skinShade,[0,-.045,.345],[.042,.052,.036],12);
    ball(headPivot,mats.skin,[0,-.025,.35],[.03,.04,.028],12);
    // Layered moustache and shaped goatee, with individual tapered strands.
    tube(headPivot,[[0,-.105,.35],[-.055,-.12,.365],[-.13,-.105,.35],[-.20,-.075,.315]],.027,mats.beard);
    tube(headPivot,[[0,-.105,.35],[.055,-.12,.365],[.13,-.105,.35],[.20,-.075,.315]],.027,mats.beard);
    tube(headPivot,[[0,-.17,.354],[-.018,-.23,.35],[-.012,-.29,.325]],.018,mats.beard);
    tube(headPivot,[[0,-.17,.354],[.018,-.23,.35],[.012,-.29,.325]],.018,mats.beard);
    ball(headPivot,mats.beard,[0,-.19,.32],[.075,.09,.045],14);
    for(let i=0;i<7;i++){
      const x=(i-3)*.022;
      tube(headPivot,[[x,-.21,.35],[x*1.15,-.26,.34],[x*1.3,-.30-Math.abs(i-3)*.006,.32]],.008,mats.beard);
    }
    // Small ear ornaments and a gold chest medallion.
    [-1,1].forEach(side=>{
      ball(headPivot,mats.gold,[side*.365,-.03,.03],[.025,.05,.025],10);
      ball(body,mats.gold,[side*.12,.62,.322],[.025,.025,.012],8);
    });

    return {world,motion,body,headPivot,arms,shadow,meshes:0,baseHeight:2.02,action:"idle",actionAt:0,wasSwinging:false,wasCast:false,wasHurt:false,wasDead:false,baseX:0,baseY:0,scale:1};
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
    let slash=0,raise=0,lean=0,tilt=0;
    if(rec.action==="attack"&&t<.74){
      const p=t/.74;slash=p<.22?smooth(p/.22):p<.57?1-smooth((p-.22)/.35):0;
      lean=Math.sin(Math.min(1,p)*Math.PI)*.16;tilt=-slash*.10;
    } else if(rec.action==="skill"&&t<.84){
      const p=t/.84;raise=p<.28?smooth(p/.28):p<.66?1-smooth((p-.28)/.38):0;
      lean=Math.sin(p*Math.PI)*.09;
    } else if(rec.action==="hurt"&&t<.54){
      const p=t/.54;tilt=Math.sin(p*Math.PI)*.20;lean=-Math.sin(p*Math.PI)*.06;
    } else if(rec.action==="dead"){
      tilt=-1.25;lean=-.18;
    } else if(rec.action!=="idle"&&t>(rec.action==="attack"?.74:rec.action==="skill"?.84:.54)){
      rec.action="idle";rec.actionAt=now;
    }
    rec.motion.position.y=.014*Math.sin(now*.003)+lean;
    rec.motion.position.x=(rec.action==="attack"?slash*.07:0);
    rec.motion.rotation.z=tilt;
    rec.body.rotation.y=(rec.action==="attack"?slash*.32:0)+.025*Math.sin(now*.0014);
    rec.headPivot.rotation.x=.025*Math.sin(now*.0017);
    rec.headPivot.rotation.y=.035*Math.sin(now*.0012);
    rec.arms.forEach(arm=>{
      const idle=arm.side*(.10+.035*idleWave);
      if(rec.action==="attack")arm.arm.rotation.z=idle+slash*(arm.side===1?-1.62:1.18);
      else if(rec.action==="skill")arm.arm.rotation.z=idle+raise*(arm.side===1?-.88:1.06);
      else if(rec.action==="hurt")arm.arm.rotation.z=idle+Math.sin(t/ .54*Math.PI)*arm.side*.28;
      else if(rec.action==="dead")arm.arm.rotation.z=arm.side*.65;
      else arm.arm.rotation.z=idle;
      arm.forearm.rotation.z=rec.action==="attack"?slash*(arm.side===1?-.44:.34):rec.action==="skill"?raise*-.30:0;
      arm.sword.rotation.z=(rec.action==="attack"?slash*(arm.side===1?-.62:.42):rec.action==="skill"?raise*(arm.side===1?-.38:.45):0);
    });
  }
  function frame(now) {
    raf=requestAnimationFrame(frame);
    if(!app)return;
    if(lastScene&&lastScene.isConnected){sync(lastScene);actors.forEach(a=>animate(a,now));app.renderer.render(app.scene,app.camera);}
  }
  window.__hero3dStatus=function(){
    return Array.from(actors.values()).map(a=>({id:a.id,ready:true,renderer:!!app&&!!app.renderer.getContext(),meshes:a.meshes,toneMappingExposure:app&&app.renderer.toneMappingExposure,model:"procedural-chibi-3d",heightRatio:2.02/0.74,state:a.action,scale:a.scale,position:{x:a.world.position.x,y:a.world.position.y}}));
  };
  window.initHero3D=function(sceneEl){
    try{init();if(!app)return;sync(sceneEl);if(!raf)raf=requestAnimationFrame(frame);}
    catch(e){console.warn("Q版3D刘备初始化失败，保留2D立绘回退",e);}
  };
  window.addEventListener("resize",()=>{if(lastScene&&lastScene.isConnected)sync(lastScene);});
})();