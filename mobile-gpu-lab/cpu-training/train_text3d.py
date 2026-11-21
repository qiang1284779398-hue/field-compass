import os, json, time, random, struct, hashlib
from pathlib import Path
import requests
import numpy as np
import torch
from torch import nn

DS="codepawl/pixel-atlas-glb"
OUT=Path("mobile-gpu-lab/trained")
CACHE=Path("/tmp/glb-cache")
MAX=int(os.getenv("MAX_MODELS","64"))
LIMIT=int(os.getenv("MAX_GLB_BYTES",str(4*1024*1024)))
N=128
random.seed(17); np.random.seed(17); torch.manual_seed(17)
torch.set_num_threads(2)
S=requests.Session()
S.headers["User-Agent"]="game-text3d-cpu-training/1.0"

def api(url,params):
 r=S.get(url,params=params,timeout=60); r.raise_for_status(); return r.json()

def rows():
 base="https://datasets-server.huggingface.co"
 sp=api(base+"/splits",{"dataset":DS}).get("splits",[])
 out=[]
 for x in sp[:12]:
  offset=0
  while offset<2000 and len(out)<MAX*12:
   try:
    q=api(base+"/rows",{"dataset":DS,"config":x["config"],"split":x["split"],"offset":offset,"length":100})
    batch=q.get("rows",[])
    out.extend(z.get("row",{}) for z in batch)
    if len(batch)<100: break
    offset+=100
   except Exception as e:
    print("[WARN] split page:",x.get("split"),offset,str(e)[:160],flush=True); break
  if len(out)>=MAX*12: break
 return out

def getpath(r):
 f=r.get("files") or {}
 # Prefer the uncompressed engine tier; the web tier uses EXT_meshopt_compression.
 vals=[f.get("engine"),f.get("glb"),r.get("engine"),f.get("web"),r.get("web"),r.get("glb"),r.get("mesh")]
 for v in vals:
  if isinstance(v,dict): v=v.get("path") or v.get("url")
  if isinstance(v,str) and v.lower().split("?")[0].endswith(".glb"): return v
 return None

def getpoints(path):
 url=path if path.startswith("http") else "https://huggingface.co/datasets/"+DS+"/resolve/main/"+path.lstrip("/")
 r=S.get(url,timeout=90); r.raise_for_status()
 b=r.content
 if len(b)>LIMIT: raise ValueError("file exceeds size limit")
 if len(b)<20 or b[:4]!=b"glTF": raise ValueError("not GLB")
 _,ver,total=struct.unpack_from("<4sII",b)
 if ver!=2 or total>len(b): raise ValueError("invalid GLB")
 p=12; doc=None; binary=None
 while p+8<=total:
  n,t=struct.unpack_from("<I4s",b,p); p+=8; c=b[p:p+n]; p+=n
  if t==b"JSON": doc=json.loads(c.decode().rstrip(" \t\r\n\0"))
  elif t==b"BIN\0": binary=c
 if doc is None or binary is None: raise ValueError("missing GLB chunks")
 views=doc.get("bufferViews",[]); acc=doc.get("accessors",[]); tris=[]
 for mesh in doc.get("meshes",[]):
  for prim in mesh.get("primitives",[]):
   ai=prim.get("attributes",{}).get("POSITION")
   if ai is None or prim.get("mode",4)!=4: continue
   a=acc[ai]
   if a.get("componentType")!=5126 or a.get("type")!="VEC3" or a.get("sparse"): continue
   v=views[a["bufferView"]]
   if v.get("buffer",0)!=0: continue
   stride=v.get("byteStride",12); off=v.get("byteOffset",0)+a.get("byteOffset",0)
   xyz=np.ndarray((a["count"],3),dtype="<f4",buffer=binary,offset=off,strides=(stride,4)).copy()
   if len(xyz)<3 or not np.isfinite(xyz).all(): continue
   if "indices" in prim:
    ia=acc[prim["indices"]]; iv=views[ia["bufferView"]]
    dt={5121:"u1",5123:"<u2",5125:"<u4"}.get(ia.get("componentType"))
    if not dt or ia.get("sparse") or iv.get("buffer",0)!=0: continue
    io=iv.get("byteOffset",0)+ia.get("byteOffset",0)
    ix=np.frombuffer(binary,dtype=dt,count=ia["count"],offset=io).astype(np.int64)
   else: ix=np.arange(len(xyz))
   ix=ix[:len(ix)//3*3]
   if len(ix)<3 or ix.max()>=len(xyz): continue
   tri=xyz[ix.reshape(-1,3)]
   area=np.linalg.norm(np.cross(tri[:,1]-tri[:,0],tri[:,2]-tri[:,0]),axis=1)*.5
   ok=area>1e-12
   if ok.any(): tris.append((tri[ok],area[ok]))
 if not tris: raise ValueError("no supported triangle geometry")
 tri=np.concatenate([x[0] for x in tris]); ar=np.concatenate([x[1] for x in tris])
 ids=np.random.choice(len(tri),N,replace=True,p=ar/ar.sum()); tri=tri[ids]
 u=np.sqrt(np.random.rand(N,1)); v=np.random.rand(N,1)
 pts=(1-u)*tri[:,0]+u*(1-v)*tri[:,1]+u*v*tri[:,2]
 pts-=((pts.min(0)+pts.max(0))*.5)
 scale=np.ptp(pts,axis=0).max()
 if scale<1e-8: raise ValueError("degenerate mesh")
 return np.clip(pts/scale,-1,1).astype("float32"),len(b)

def feat(s,d=256):
 s=" "+s.lower()+" "; x=np.zeros(d,dtype="float32")
 for n in (1,2,3):
  for i in range(len(s)-n+1):
   h=hashlib.blake2b(s[i:i+n].encode(),digest_size=8).digest()
   z=int.from_bytes(h,"little"); x[z%d]+=1 if z&1 else -1
 norm=np.linalg.norm(x)
 if norm: x/=norm
 return x

def main():
 OUT.mkdir(parents=True,exist_ok=True); samples=[]; seen=set(); rejected={}
 rr=rows(); print("[INFO] metadata rows",len(rr),flush=True)
 for r in rr:
  lic=str(r.get("license") or "").upper().replace("_","-")
  path=getpath(r); caption=str(r.get("caption") or r.get("subject") or r.get("title") or "").strip()
  if lic not in ("CC0-1.0","CC0"): rejected["license"]=rejected.get("license",0)+1; continue
  if not path or len(caption)<3: rejected["missing_path_or_caption"]=rejected.get("missing_path_or_caption",0)+1; continue
  if path in seen: continue
  seen.add(path)
  try:
   pts,size=getpoints(path)
   samples.append({"id":str(r.get("id") or path),"caption":caption[:250],"license":"CC0-1.0","path":path,"bytes":size,"points":pts})
   print("[DATA]",len(samples),caption[:65],size,flush=True)
   if len(samples)>=MAX: break
  except Exception as e:
   rejected["asset_parse"]=rejected.get("asset_parse",0)+1; print("[SKIP]",path,str(e)[:180],flush=True)
 if len(samples)<4: raise RuntimeError("Only %d usable CC0 assets; rejected=%s"%(len(samples),rejected))
 X=torch.tensor(np.stack([feat(s["caption"]) for s in samples]))
 Y=torch.tensor(np.stack([s["points"].reshape(-1) for s in samples]))
 model=nn.Sequential(nn.Linear(256,128),nn.ReLU(),nn.Linear(128,N*3),nn.Tanh())
 # Continue from the last committed checkpoint when its architecture matches.
 checkpoint=OUT/"pointcloud-model.json"
 warm_started=False
 if checkpoint.exists():
  try:
   saved=json.loads(checkpoint.read_text())
   if saved.get("schema")=="text3d-cpu-mlp-v1" and saved.get("points")==N:
    state={k:torch.tensor(v,dtype=torch.float32) for k,v in saved["weights"].items()}
    model.load_state_dict(state,strict=True); warm_started=True
    print("[INFO] warm-started from previous checkpoint",flush=True)
  except Exception as e: print("[WARN] checkpoint ignored:",str(e)[:160],flush=True)
 opt=torch.optim.AdamW(model.parameters(),lr=.0005 if warm_started else .001,weight_decay=1e-5)
 def chamfer(a,b):
  a=a.view(-1,N,3); b=b.view(-1,N,3)
  d=torch.cdist(a,b).square()
  return d.min(2).values.mean()+d.min(1).values.mean()
 hist=[]; epochs=int(os.getenv("EPOCHS","200"))
 for ep in range(epochs):
  perm=torch.randperm(len(X)); ls=[]
  for ids in perm.split(8):
   loss=chamfer(model(X[ids]),Y[ids]); opt.zero_grad(); loss.backward()
   torch.nn.utils.clip_grad_norm_(model.parameters(),1); opt.step(); ls.append(loss.item())
  avg=float(np.mean(ls)); hist.append(avg)
  if ep==0 or (ep+1)%10==0: print("epoch",ep+1,"/",epochs,"Chamfer",round(avg,6),flush=True)
 weights={k:v.detach().tolist() for k,v in model.state_dict().items()}
 (OUT/"pointcloud-model.json").write_text(json.dumps({"schema":"text3d-cpu-mlp-v1","input_dim":256,"hidden_dim":128,"points":N,"architecture":"256-128-ReLU-384-Tanh","weights":weights},separators=(",",":")))
 clean=[{"id":s["id"],"caption":s["caption"],"license":s["license"],"source":DS,"path":s["path"],"bytes":s["bytes"],"points":np.round(s["points"],5).tolist()} for s in samples]
 (OUT/"training-samples.json").write_text(json.dumps({"schema":"text3d-pointcloud-samples-v1","point_count":N,"samples":clean},ensure_ascii=False,separators=(",",":")))
 manifest={"dataset":DS,"license_filter":"per-row CC0 only","device":"GitHub Actions CPU","sample_count":len(samples),"point_count":N,"epochs":epochs,"warm_started":warm_started,"initial_chamfer":hist[0],"final_chamfer":hist[-1],"best_chamfer":min(hist),"history":hist,"rejected":rejected,"created_utc":time.strftime("%Y-%m-%dT%H:%M:%SZ",time.gmtime()),"limitations":["small low-poly subset", "raw source GLB remains addressable by dataset path; this run stores normalized point clouds and provenance, not binary GLB files","hashed character n-gram features, no pretrained language model","point cloud only; no mesh topology, materials, textures or rigging","experimental baseline, not comparable to commercial text-to-3D systems"]}
 (OUT/"training-manifest.json").write_text(json.dumps(manifest,ensure_ascii=False,indent=2))
 print("[DONE] assets",len(samples),"final Chamfer",hist[-1],flush=True)

if __name__=="__main__": main()
