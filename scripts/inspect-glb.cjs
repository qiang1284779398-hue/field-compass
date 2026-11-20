const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");
const root = path.resolve("app/src/main/assets/characters");
for (const hero of ["liu-bei","guan-yu","zhang-fei"]) {
  const file = path.join(root, hero + ".glb");
  const data = fs.readFileSync(file);
  assert.equal(data.readUInt32LE(0), 0x46546c67, hero + " must be valid GLB (glTF binary)");
  const declaredLength = data.readUInt32LE(8);
  assert.equal(declaredLength, data.length, hero + " GLB header length must match file bytes");
  let offset = 12, json = null;
  while (offset < data.length) {
    const chunkLength = data.readUInt32LE(offset);
    const chunkType = data.readUInt32LE(offset + 4);
    offset += 8;
    const chunk = data.subarray(offset, offset + chunkLength);
    offset += chunkLength;
    if (chunkType === 0x4e4f534a) json = JSON.parse(chunk.toString("utf8"));
  }
  assert.ok(json, hero + " must contain glTF JSON chunk");
  const skin = (json.skins || []).sort((a,b) => (b.joints||[]).length-(a.joints||[]).length)[0];
  const joints = skin?.joints?.length || 0;
  const animations = json.animations || [];
  const nodeNames = (json.nodes || []).map(n => n.name || "");
  assert.ok(joints >= 20, hero + " must have a real skeletal rig, found " + joints);
  assert.ok(animations.length >= 3, hero + " must include animation clips, found " + animations.length);
  assert.ok(nodeNames.includes("WeaponR"), hero + " must have a weapon attachment socket");
  const socketIndex = nodeNames.indexOf("WeaponR");
  const parents = new Map();
  (json.nodes || []).forEach((node, i) => (node.children || []).forEach(child => parents.set(child, i)));
  assert.equal(nodeNames[parents.get(socketIndex)], "RightHand", hero + " weapon socket must be parented to the right hand");
  for (const faceBone of ["Head","Jaw","LeftEye","RightEye"]) assert.ok(nodeNames.includes(faceBone), hero + " must have facial bones: " + faceBone);
  console.log(hero + ": " + (data.length/1024/1024).toFixed(2) + " MB, " + joints + " joints, " + animations.length + " clips, face bones + right-hand weapon socket OK");
}
