const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");
const root = path.resolve("app/src/main/assets/characters");
for (const hero of ["liu-bei","guan-yu","zhang-fei"]) {
  const file = path.join(root, hero + ".glb");
  const data = fs.readFileSync(file);
  assert.equal(data.readUInt32LE(0), 0x46546c67, hero + " must be valid GLB (glTF binary)");
  assert.equal(data.readUInt32LE(8), data.length, hero + " GLB header length must match file bytes");
  let offset = 12, json = null;
  while (offset < data.length) {
    const chunkLength = data.readUInt32LE(offset);
    const chunkType = data.readUInt32LE(offset + 4);
    offset += 8;
    const chunk = data.subarray(offset, offset + chunkLength);
    offset += chunkLength;
    if (chunkType === 0x4e4f534a) json = JSON.parse(chunk.toString("utf8"));
  }
  assert.ok(json, hero + " must contain a glTF JSON chunk");
  const skin = (json.skins || []).sort((a,b) => (b.joints||[]).length-(a.joints||[]).length)[0];
  const joints = skin?.joints?.length || 0;
  const animations = json.animations || [];
  const meshes = json.meshes || [];
  assert.ok(joints >= 20, hero + " must have a real humanoid skeletal rig, found " + joints);
  assert.ok(animations.length >= 2, hero + " must include walk/run animation clips, found " + animations.length);
  assert.ok(meshes.length > 0 && (json.nodes||[]).some(n=>n.mesh!==undefined && n.skin!==undefined), hero + " must contain a skinned mesh");
  const names = (json.nodes||[]).map(n=>n.name||"");
  const jointNames = (skin?.joints||[]).map(i=>names[i]).filter(Boolean);
  console.log(hero + ": " + (data.length/1024/1024).toFixed(2) + " MB, " + joints + " joints, " + animations.map(a=>a.name).join(", ") + "; bones: " + jointNames.join(", "));
}
