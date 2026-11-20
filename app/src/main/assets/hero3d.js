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
   const mat=(color,metalness=.15,roughness=.72)=>new THREE.MeshStandardMaterial({color,metalness,roughness});
   const gold=mat(0xd3ad62,.72,.3),green=mat(0x174b38,.25,.62),black=mat(0x171719,.12,.82),red=mat(0x842d27,.2,.7);
   // Character-specific head silhouettes: not a shared generic helmet.
   if(id==="guan-yu"){
    const guan=new THREE.Group();
    const crown=new THREE.Mesh(new THREE.CylinderGeometry(.22,.29,.20,12),green);crown.position.y=.13;guan.add(crown);
    const brim=new THREE.Mesh(new THREE.CylinderGeometry(.37,.37,.055,16),gold);brim.position.y=.02;guan.add(brim);
    const crest=new THREE.Mesh(new THREE.BoxGeometry(.12,.42,.12),gold);crest.position.set(0,.42,0);guan.add(crest);
    const sideL=new THREE.Mesh(new THREE.BoxGeometry(.12,.34,.12),green);sideL.position.set(-.31,.12,0);guan.add(sideL);
    const sideR=sideL.clone();sideR.position.x=.31;guan.add(sideR);headBone.add(guan);
   }else if(id==="zhang-fei"){
    const band=new THREE.Mesh(new THREE.TorusGeometry(.245,.065,8,24),black);band.position.y=.08;band.rotation.x=Math.PI/2;headBone.add(band);
    const knot=new THREE.Mesh(new THREE.SphereGeometry(.10,12,8),red);knot.position.set(0,.24,-.02);headBone.add(knot);
    const plume=new THREE.Mesh(new THREE.ConeGeometry(.09,.38,8),black);plume.position.set(0,.47,0);headBone.add(plume);
   }else{
    const crown=new THREE.Group();
    const base=new THREE.Mesh(new THREE.BoxGeometry(.43,.12,.34),red);base.position.y=.08;crown.add(base);
    const front=new THREE.Mesh(new THREE.BoxGeometry(.28,.22,.07),gold);front.position.set(0,.22,.16);crown.add(front);
    const jewel=new THREE.Mesh(new THREE.SphereGeometry(.075,12,8),mat(0x9b3030,.45,.3));jewel.position.set(0,.36,.16);crown.add(jewel);
    const wing=new THREE.Mesh(new THREE.BoxGeometry(.52,.055,.12),gold);wing.position.y=.12;crown.add(wing);headBone.add(crown);
   }
   const addBeard=(color,style)=>{
    const shape=new THREE.Shape();
    if(style==="long"){shape.moveTo(-.17,-.02);shape.quadraticCurveTo(-.25,-.30,-.13,-.58);shape.quadraticCurveTo(-.07,-.82,0,-.94);shape.quadraticCurveTo(.12,-.73,.14,-.48);shape.quadraticCurveTo(.23,-.22,.17,-.02);shape.quadraticCurveTo(0,-.10,-.17,-.02)}
    else {shape.moveTo(-.20,-.02);shape.quadraticCurveTo(-.28,-.28,-.19,-.47);shape.quadraticCurveTo(-.08,-.62,0,-.55);shape.quadraticCurveTo(.10,-.66,.20,-.43);shape.quadraticCurveTo(.28,-.20,.20,-.02);shape.quadraticCurveTo(0,-.10,-.20,-.02)}
    const beard=new THREE.Mesh(new THREE.ExtrudeGeometry(shape,{depth:.055,bevelEnabled:true,bevelSegments:3,steps:1,bevelSize:.018,bevelThickness:.018}),mat(color,.02,.95));
    beard.position.set(0,-.12,.18);headBone.add(beard);
   };
   if(id==="guan-yu")addBeard(0x241f1a,"long");
   if(id==="zhang-fei")addBeard(0x171513,"full");
   if(id==="liu-bei"){
    const moustacheMat=mat(0x241b16,.02,.95);
    [-1,1].forEach(side=>{const curve=new THREE.QuadraticBezierCurve3(new THREE.Vector3(0,-.10,.20),new THREE.Vector3(side*.12,-.13,.24),new THREE.Vector3(side*.23,-.04,.20));const moustache=new THREE.Mesh(new THREE.TubeGeometry(curve,10,.035,7,false),moustacheMat);headBone.add(moustache)});
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
  app.scene.add(root);rec.ready=true;
  play(rec,"idle");
 }).catch(()=>{});
 return rec;
}
function findAction(rec,kind){
 const keys=Object.keys(rec.actions);
 let key=keys.find(k=>kind==="idle"?/idle|stand|breath/.test(k):kind==="attack"?/sword.*(slash|combo|thrust)|slash|attack|combat|melee/.test(k):/death|die|fall|shot.*head|shot.*chest|knockdown/.test(k));
 if(!key&&kind==="idle")key=keys[0];
 if(!key&&kind==="attack")key=keys.find(k=>/hit|punch|fight|combo/.test(k));
 if(!key&&kind==="death")key=keys.find(k=>/shot|hit|fall|knockdown|dead/.test(k));
 return key?rec.actions[key]:null;
}
function play(rec,kind){
 if(!rec.mixer||rec.current===kind)return;
 const next=findAction(rec,kind);if(!next)return;
 if(rec.active)rec.active.fadeOut(.12);
 next.reset();if(kind==="death"){next.setLoop(THREE.LoopOnce,1);next.clampWhenFinished=true;}else{next.setLoop(THREE.LoopRepeat,Infinity);next.clampWhenFinished=false;}next.fadeIn(.12).play();rec.active=next;rec.current=kind;
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
  const scale=desiredH/actual;rec.root.scale.setScalar(scale);
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
window.__hero3dStatus=function(){return Array.from(actors.values()).map(a=>({id:a.id,ready:a.ready,skinnedMeshes:a.skinnedMeshes||0,bones:a.boneCount||0,clips:Object.keys(a.actions).length,weaponSocket:a.weaponSocket||false}))};
window.initHero3D=function(sceneEl){
 try{init();if(!app)return;sync(sceneEl);if(!raf)raf=requestAnimationFrame(frame)}catch(e){console.warn("3D hero renderer unavailable; using 2D fallback",e)}
};
window.addEventListener("resize",()=>{if(lastScene&&lastScene.isConnected)sync(lastScene)});
})();
