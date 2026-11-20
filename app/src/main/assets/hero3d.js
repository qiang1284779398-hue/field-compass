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
  let headBone=null;root.traverse(o=>{if(!headBone&&o.isBone&&/head$/i.test(o.name))headBone=o});
  if(headBone){
   const palette=id==="guan-yu"?{metal:0x24513c,trim:0xd1ae65}:id==="zhang-fei"?{metal:0x252a33,trim:0xaaaeb4}:{metal:0x8d3028,trim:0xd8b66c};
   const cap=new THREE.Group();
   const dome=new THREE.Mesh(new THREE.SphereGeometry(.235,18,10,0,Math.PI*2,0,Math.PI/2),new THREE.MeshStandardMaterial({color:palette.metal,metalness:.42,roughness:.55}));
   dome.scale.set(1,.62,.88);dome.position.y=.12;cap.add(dome);
   const band=new THREE.Mesh(new THREE.TorusGeometry(.222,.025,8,24),new THREE.MeshStandardMaterial({color:palette.trim,metalness:.7,roughness:.3}));
   band.position.y=.10;band.rotation.x=Math.PI/2;cap.add(band);
   const crest=new THREE.Mesh(new THREE.BoxGeometry(.045,.24,.06),new THREE.MeshStandardMaterial({color:palette.trim,metalness:.65}));
   crest.position.set(0,.28,0);cap.add(crest);
   headBone.add(cap);
   if(id==="guan-yu"){
    const beardShape=new THREE.Shape();beardShape.moveTo(-.16,-.02);beardShape.quadraticCurveTo(-.23,-.28,-.12,-.55);beardShape.quadraticCurveTo(-.08,-.72,0,-.82);beardShape.quadraticCurveTo(.12,-.65,.13,-.48);beardShape.quadraticCurveTo(.22,-.24,.16,-.02);beardShape.quadraticCurveTo(0,-.10,-.16,-.02);
    const beard=new THREE.Mesh(new THREE.ExtrudeGeometry(beardShape,{depth:.045,bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:.012,bevelThickness:.012}),new THREE.MeshStandardMaterial({color:0x203b2a,roughness:.92}));
    beard.position.set(0,-.10,.18);headBone.add(beard);
   }
  }
  const socket=root.getObjectByName("WeaponR");
  if(socket&&specs[id].weapon!=="none"){
   const weapon=makeWeapon(specs[id].weapon);
   weapon.rotation.set(0,0,0);
   weapon.scale.setScalar(id==="guan-yu"?1.05:1);
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
 next.reset().fadeIn(.12).play();rec.active=next;rec.current=kind;
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
