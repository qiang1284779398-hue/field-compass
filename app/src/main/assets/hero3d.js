/* True 3D rigged hero renderer. Models and Three.js are bundled into the APK by android.yml. */
(function(){
"use strict";
const MODEL_BASE="characters/";
const specs={
 "liu-bei":{file:"liu-bei.glb",weapon:"sword"},
 "guan-yu":{file:"guan-yu.glb",weapon:"guandao"},
 "zhang-fei":{file:"zhang-fei.glb",weapon:"spear"}
};
let app=null,raf=0,lastScene=null;
const loaded=new Map(),actors=new Map();
function makeWeapon(kind){
 const g=new THREE.Group();
 const shaft=new THREE.Mesh(new THREE.CylinderGeometry(.025,.032,1.45,10),new THREE.MeshStandardMaterial({color:kind==="guandao"?0x62452d:0x573c27,roughness:.78}));
 shaft.position.y=-.12;g.add(shaft);
 const metal=new THREE.MeshStandardMaterial({color:kind==="guandao"?0xb9c5c6:0xc7cdd0,metalness:.72,roughness:.28});
 if(kind==="guandao"){
  const sh=new THREE.Shape();sh.moveTo(-.08,.48);sh.quadraticCurveTo(-.42,.78,-.34,1.04);sh.quadraticCurveTo(-.18,1.19,.02,1.03);sh.quadraticCurveTo(.22,.82,.12,.57);sh.lineTo(.02,.68);sh.quadraticCurveTo(-.06,.8,-.08,.48);
  const blade=new THREE.Mesh(new THREE.ExtrudeGeometry(sh,{depth:.045,bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:.018,bevelThickness:.018}),metal);blade.position.set(0,0,.0);g.add(blade);
  const collar=new THREE.Mesh(new THREE.TorusGeometry(.055,.012,6,16),new THREE.MeshStandardMaterial({color:0xd2ae61,metalness:.65}));collar.rotation.x=Math.PI/2;collar.position.y=.48;g.add(collar);
 }else if(kind==="spear"){
  const tip=new THREE.Mesh(new THREE.ConeGeometry(.105,.48,8),metal);tip.position.y=.82;g.add(tip);
  const guard=new THREE.Mesh(new THREE.TorusGeometry(.055,.012,6,14),new THREE.MeshStandardMaterial({color:0xb99554,metalness:.7}));guard.rotation.x=Math.PI/2;guard.position.y=.57;g.add(guard);
 }else{
  const blade=new THREE.Mesh(new THREE.BoxGeometry(.095,.86,.025),metal);blade.position.y=.84;g.add(blade);
  const guard=new THREE.Mesh(new THREE.BoxGeometry(.3,.045,.07),new THREE.MeshStandardMaterial({color:0xc4a15c,metalness:.72}));guard.position.y=.39;g.add(guard);
 }
 return g;
}
function init(){
 if(app)return;
 if(!window.THREE||!THREE.GLTFLoader||!THREE.SkeletonUtils)return;
 const scene=new THREE.Scene();
 const camera=new THREE.OrthographicCamera(-2,2,2,-2,.1,100);camera.position.set(0,0,30);camera.lookAt(0,0,0);
 const renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:"high-performance"});
 renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.6));
 renderer.outputEncoding=THREE.sRGBEncoding;
 renderer.setClearColor(0x000000,0);
 scene.add(new THREE.HemisphereLight(0xe9f1ff,0x463a2c,2.0));
 const key=new THREE.DirectionalLight(0xffe2b5,2.1);key.position.set(-3,6,8);scene.add(key);
 const fill=new THREE.DirectionalLight(0x8aa9d0,.8);fill.position.set(4,2,-5);scene.add(fill);
 app={scene,camera,renderer,canvas:renderer.domElement,width:0,height:0};
 app.canvas.className="hero3d-layer";app.canvas.setAttribute("aria-hidden","true");
}
function getModel(id){
 if(loaded.has(id))return loaded.get(id);
 const p=new Promise((resolve,reject)=>{
  const loader=new THREE.GLTFLoader();
  loader.load(MODEL_BASE+specs[id].file,gltf=>resolve(gltf),undefined,reject);
 });
 loaded.set(id,p);p.catch(e=>{loaded.delete(id);console.warn("3D hero load failed",id,e)});
 return p;
}
function makeActor(id,key){
 if(actors.has(key))return actors.get(key);
 const rec={id,key,root:null,mixer:null,actions:{},current:"",lastSwing:false,lastDead:false,ready:false};
 actors.set(key,rec);
 getModel(id).then(gltf=>{
  if(!app)return;
  const root=THREE.SkeletonUtils.clone(gltf.scene);
  let skinnedMeshes=0,boneCount=0;root.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;if(o.material){o.material.side=THREE.FrontSide}}if(o.isSkinnedMesh&&o.skeleton){skinnedMeshes++;boneCount=Math.max(boneCount,o.skeleton.bones.length)}});
  const box=new THREE.Box3().setFromObject(root),size=box.getSize(new THREE.Vector3());
  root.position.y-=box.min.y;
  const height=Math.max(.1,size.y);
  root.userData.modelHeight=height;
  let headBone=null,bones={};root.traverse(o=>{if(o.isBone){bones[o.name.toLowerCase()]=o;if(!headBone&&/head$/i.test(o.name))headBone=o}});
  if(headBone){
   // Distinctive Three Kingdoms silhouettes, layered over the rigged base mesh.
  const mat=(color,metalness=.15,roughness=.72)=>new THREE.MeshStandardMaterial({color,metalness,roughness});
  const gold=mat(0xd5b56c,.78,.28),green=mat(0x174b38,.3,.58),black=mat(0x17191d,.35,.48),red=mat(0x842d27,.18,.68),jade=mat(0x2c8b68,.45,.25);
  const addWing=(group,side,material,span,height,depth)=>{
   const shape=new THREE.Shape();shape.moveTo(0,0);shape.quadraticCurveTo(.18*side,height*.55,span*side,height*.42);shape.quadraticCurveTo(span*.82*side,height*.12,span*side,0);shape.quadraticCurveTo(span*.48*side,-height*.12,0,-.04);
   const mesh=new THREE.Mesh(new THREE.ExtrudeGeometry(shape,{depth,bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:.018,bevelThickness:.012}),material);
   group.add(mesh);
  };
  if(id==="guan-yu"){
   const hat=new THREE.Group();
   const brim=new THREE.Mesh(new THREE.CylinderGeometry(.39,.39,.055,24),gold);brim.position.y=.02;hat.add(brim);
   const crown=new THREE.Mesh(new THREE.CylinderGeometry(.22,.29,.25,18),green);crown.position.y=.17;hat.add(crown);
   const band=new THREE.Mesh(new THREE.TorusGeometry(.265,.025,8,24),gold);band.position.y=.10;band.rotation.x=Math.PI/2;hat.add(band);
   addWing(hat,-1,green,.68,.27,.045);addWing(hat,1,green,.68,.27,.045);
   const front=new THREE.Mesh(new THREE.SphereGeometry(.085,16,12),jade);front.position.set(0,.22,.27);hat.add(front);
   const crest=new THREE.Mesh(new THREE.ConeGeometry(.075,.25,8),gold);crest.position.set(0,.42,0);hat.add(crest);
   const tassel=new THREE.Mesh(new THREE.ConeGeometry(.045,.3,8),red);tassel.position.set(0,.24,-.20);tassel.rotation.x=Math.PI;hat.add(tassel);
   headBone.add(hat);
  }else if(id==="zhang-fei"){
   const helmet=new THREE.Group();
   const dome=new THREE.Mesh(new THREE.SphereGeometry(.30,20,12,0,Math.PI*2,0,Math.PI*.58),black);dome.position.y=.08;helmet.add(dome);
   const brow=new THREE.Mesh(new THREE.TorusGeometry(.285,.045,8,24),gold);brow.position.y=.02;brow.rotation.x=Math.PI/2;helmet.add(brow);
   [-1,1].forEach(side=>{
    const guard=new THREE.Mesh(new THREE.BoxGeometry(.13,.36,.12),black);guard.position.set(side*.28,-.12,.02);guard.rotation.z=side*.13;helmet.add(guard);
    const hornCurve=new THREE.CatmullRomCurve3([new THREE.Vector3(side*.22,.12,-.02),new THREE.Vector3(side*.43,.25,-.04),new THREE.Vector3(side*.58,.48,-.02)]);
    helmet.add(new THREE.Mesh(new THREE.TubeGeometry(hornCurve,14,.035,8,false),gold));
   });
   const crest=new THREE.Mesh(new THREE.ConeGeometry(.11,.46,10),red);crest.position.set(0,.48,-.02);helmet.add(crest);
   const plume=new THREE.Mesh(new THREE.TorusGeometry(.11,.035,8,16),red);plume.position.set(0,.31,-.08);helmet.add(plume);
   headBone.add(helmet);
  }else{
   const crown=new THREE.Group();
   const base=new THREE.Mesh(new THREE.BoxGeometry(.46,.14,.36),red);base.position.y=.08;crown.add(base);
   const front=new THREE.Mesh(new THREE.BoxGeometry(.30,.22,.07),gold);front.position.set(0,.22,.18);crown.add(front);
   const jewel=new THREE.Mesh(new THREE.SphereGeometry(.075,16,12),jade);jewel.position.set(0,.37,.19);crown.add(jewel);
   const crest=new THREE.Mesh(new THREE.ConeGeometry(.10,.24,8),gold);crest.position.set(0,.37,0);crown.add(crest);
   [-1,1].forEach(side=>{
    const wing=new THREE.Mesh(new THREE.BoxGeometry(.58,.055,.10),gold);wing.position.set(side*.48,.13,0);wing.rotation.z=side*-.035;crown.add(wing);
    const tip=new THREE.Mesh(new THREE.SphereGeometry(.055,10,8),red);tip.position.set(side*.77,.13,0);crown.add(tip);
   });
   headBone.add(crown);
  }
  // Breastplate, shoulder guards and a short cloth mantle are attached to the upper torso bone.
  const chestBone=Object.values(bones).find(b=>/spine2|upperchest|chest/i.test(b.name));
  if(chestBone){
   const armor=new THREE.Group();
   const plateColor=id==="guan-yu"?green:id==="zhang-fei"?black:red;
   const plate=new THREE.Mesh(new THREE.BoxGeometry(.58,.48,.105),mat(plateColor,.34,.52));plate.position.set(0,.02,.12);armor.add(plate);
   const trim=new THREE.Mesh(new THREE.BoxGeometry(.61,.045,.12),gold);trim.position.set(0,.25,.13);armor.add(trim);
   const badge=new THREE.Mesh(new THREE.SphereGeometry(.105,16,12),id==="guan-yu"?jade:gold);badge.scale.set(1,1,.30);badge.position.set(0,.02,.19);armor.add(badge);
   [-1,1].forEach(side=>{
    const pauldron=new THREE.Mesh(new THREE.SphereGeometry(1,16,12),mat(plateColor,.42,.46));pauldron.scale.set(.23,.16,.22);pauldron.position.set(side*.36,.20,.02);armor.add(pauldron);
    const rivet=new THREE.Mesh(new THREE.SphereGeometry(.035,8,8),gold);rivet.position.set(side*.36,.22,.20);armor.add(rivet);
   });
   chestBone.add(armor);
   const mantle=new THREE.Group(),cloth=id==="guan-yu"?green:id==="zhang-fei"?black:red;
   const capeShape=new THREE.Shape();capeShape.moveTo(-.24,.20);capeShape.lineTo(.24,.20);capeShape.lineTo(.42,-.48);capeShape.quadraticCurveTo(.16,-.40,0,-.52);capeShape.quadraticCurveTo(-.18,-.39,-.42,-.48);capeShape.closePath();
   const cape=new THREE.Mesh(new THREE.ExtrudeGeometry(capeShape,{depth:.035,bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:.012,bevelThickness:.012}),cloth);cape.position.set(0,-.12,-.16);mantle.add(cape);
   const capeTrim=new THREE.Mesh(new THREE.BoxGeometry(.78,.035,.045),gold);capeTrim.position.set(0,-.57,-.13);mantle.add(capeTrim);
   chestBone.add(mantle);
  }
  const addBeard=(color,style)=>{
   const beardMat=mat(color,.04,.92);
   const long=style==="long",length=long?.82:.48;
   const strands=long?[
    [[-.10,-.12,.21],[-.13,-.35,.27],[-.07,-.63,.24],[0,-length,.18]],
    [[.10,-.12,.21],[.13,-.35,.27],[.07,-.63,.24],[0,-length,.18]],
    [[-.17,-.10,.19],[-.25,-.30,.23],[-.19,-.50,.21],[-.11,-.65,.18]],
    [[.17,-.10,.19],[.25,-.30,.23],[.19,-.50,.21],[.11,-.65,.18]]
   ]:[
    [[-.12,-.10,.21],[-.16,-.25,.26],[-.09,-.40,.23],[0,-length,.18]],
    [[.12,-.10,.21],[.16,-.25,.26],[.09,-.40,.23],[0,-length,.18]],
    [[0,-.12,.22],[0,-.29,.29],[0,-.42,.23],[0,-.50,.18]]
   ];
   strands.forEach((pts,i)=>{
    const curve=new THREE.CatmullRomCurve3(pts.map(p=>new THREE.Vector3(...p)));
    const strand=new THREE.Mesh(new THREE.TubeGeometry(curve,18,long?.042:.05,7,false),beardMat);headBone.add(strand);
   });
   const chin=new THREE.Mesh(new THREE.SphereGeometry(.13,12,10),beardMat);chin.scale.set(1,.72,.55);chin.position.set(0,-.13,.20);headBone.add(chin);
  };
  if(id==="guan-yu")addBeard(0x201b18,"long");
  if(id==="zhang-fei")addBeard(0x171513,"full");
  if(id==="liu-bei"){
   const moustacheMat=mat(0x241b16,.02,.95);
   [-1,1].forEach(side=>{const curve=new THREE.QuadraticBezierCurve3(new THREE.Vector3(0,-.10,.20),new THREE.Vector3(side*.12,-.13,.24),new THREE.Vector3(side*.23,-.04,.20));headBone.add(new THREE.Mesh(new THREE.TubeGeometry(curve,14,.032,8,false),moustacheMat));});
  }
  }
  const socket=root.getObjectByName("WeaponR")||Object.values(bones).find(b=>/right.*(hand|wrist)|hand.*right/i.test(b.name));
  if(socket&&specs[id].weapon!=="none"){
   const weapon=makeWeapon(specs[id].weapon);
   weapon.rotation.set(specs[id].weapon==="guandao"?-.22:0,0,specs[id].weapon==="spear"?-.16:0);
   weapon.scale.setScalar(id==="guan-yu"?1.25:id==="zhang-fei"?1.18:1);
   socket.add(weapon);
  }
  rec.root=root;rec.skinnedMeshes=skinnedMeshes;rec.boneCount=boneCount;rec.weaponSocket=!!socket;rec.mixer=new THREE.AnimationMixer(root);
  (gltf.animations||[]).forEach(clip=>{rec.actions[clip.name.toLowerCase()]=rec.mixer.clipAction(clip)});
  rec.mixer.addEventListener("finished",event=>{if(event.action===rec.active){rec.active=null;rec.current="idle";}});
  app.scene.add(root);rec.ready=true;
  play(rec,"idle");
 }).catch(()=>{});
 return rec;
}
function findAction(rec,kind){
 const keys=Object.keys(rec.actions);
 let key=keys.find(k=>kind==="idle"?/idle|stand|breath/.test(k):kind==="attack"?/slash|attack|combat|melee|hit|fight|combo/.test(k):/death|die|fall|knockdown|dead/.test(k));
 // The sourced CC0 rigs ship with walk/run only. Keep idle in its authored A-pose and
 // use a one-shot run clip as a temporary attack motion until combat-specific clips exist.
 if(!key&&kind==="attack")key=keys.find(k=>/run|walk/.test(k));
 if(!key&&kind==="death")key=keys.find(k=>/run|walk/.test(k));
 return key?rec.actions[key]:null;
}
function play(rec,kind){
 if(!rec.mixer||rec.current===kind)return;
 const next=findAction(rec,kind);
 if(!next){if(kind==="idle")rec.current="idle";return;}
 if(rec.active)rec.active.fadeOut(.12);
 next.reset();
 const once=kind==="death"||kind==="attack";
 if(once){next.setLoop(THREE.LoopOnce,1);next.clampWhenFinished=kind==="death";}
 else{next.setLoop(THREE.LoopRepeat,Infinity);next.clampWhenFinished=false;}
 next.fadeIn(.12).play();rec.active=next;rec.current=kind;
}
function sync(sceneEl){
 if(!app||!sceneEl)return;
 if(lastScene!==sceneEl){sceneEl.appendChild(app.canvas);lastScene=sceneEl}
 const rect=sceneEl.getBoundingClientRect(),w=Math.max(1,rect.width),h=Math.max(1,rect.height);
 if(w!==app.width||h!==app.height){app.width=w;app.height=h;app.renderer.setSize(w,h,false);app.camera.left=-w/200;app.camera.right=w/200;app.camera.top=h/200;app.camera.bottom=-h/200;app.camera.updateProjectionMatrix()}
 const seen=new Set();
 sceneEl.querySelectorAll(".warrior[data-hero3d]").forEach(el=>{
  const id=el.dataset.hero3d;if(!specs[id])return;
  const side=el.dataset.side||"unknown",unitIndex=el.dataset.index||"0";const key=id+":"+side+":"+unitIndex;seen.add(key);const rec=makeActor(id,key);
  if(!rec.ready||!rec.root)return;
  const anchor=el.querySelector(".body-art");if(!anchor)return;
  const a=anchor.getBoundingClientRect(),cx=a.left-rect.left+a.width/2,base=a.bottom-rect.top;
  rec.root.position.x=(cx-w/2)/100;
  rec.root.position.y=(h/2-base)/100;
  const desiredH=a.height/100;const actual=rec.root.userData.modelHeight||1.8;
  const scale=desiredH/actual; // Fit the imported GLB exactly to the existing 2D character anchor; avoid the old 1.28x overscale.rec.root.scale.setScalar(scale);
  rec.root.rotation.y=el.classList.contains("enemy")?Math.PI:0;
  const swinging=el.classList.contains("swinging"),dead=el.classList.contains("dead");
  if(dead&&!rec.lastDead)play(rec,"death");else if(swinging&&!rec.lastSwing)play(rec,"attack");else if(!dead&&!swinging&&rec.current!=="idle")play(rec,"idle");
  rec.lastSwing=swinging;rec.lastDead=dead;
  el.classList.add("hero3d-ready");
 });
}
function frame(t){
 raf=requestAnimationFrame(frame);
 if(!app)return;
 const dt=app.lastTime?Math.min(.05,(t-app.lastTime)/1000):0;app.lastTime=t;
 actors.forEach(a=>{if(a.mixer)a.mixer.update(dt)});
 if(lastScene&&lastScene.isConnected){sync(lastScene);app.renderer.render(app.scene,app.camera)}
}
window.__hero3dStatus=function(){return Array.from(actors.values()).map(a=>({id:a.id,ready:a.ready,skinnedMeshes:a.skinnedMeshes||0,bones:a.boneCount||0,clips:Object.keys(a.actions).length,weaponSocket:a.weaponSocket||false,modelHeight:a.root?.userData.modelHeight||0,scale:a.root?.scale.x||0,position:a.root?{x:a.root.position.x,y:a.root.position.y}:null}))};
window.initHero3D=function(sceneEl){
 try{init();if(!app)return;sync(sceneEl);if(!raf)raf=requestAnimationFrame(frame)}catch(e){console.warn("3D hero renderer unavailable; using 2D fallback",e)}
};
window.addEventListener("resize",()=>{if(lastScene&&lastScene.isConnected)sync(lastScene)});
})();
