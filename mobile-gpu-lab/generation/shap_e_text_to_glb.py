#!/usr/bin/env python3
"""Text-to-GLB generation using the official OpenAI Shap-E implicit-3D model.

This is the full-mesh generation path. The earlier point-cloud MLP remains intact
as a separate experimental checkpoint and is not silently overwritten here.
"""
import argparse
import hashlib
import json
import os
import time
from pathlib import Path

import numpy as np
import torch
import trimesh

from shap_e.diffusion.sample import sample_latents
from shap_e.diffusion.gaussian_diffusion import diffusion_from_config
from shap_e.models.download import load_model, load_config
from shap_e.models.nn.camera import DifferentiableCameraBatch, DifferentiableProjectiveCamera
from shap_e.util.collections import AttrDict


MODEL_SOURCE = "https://github.com/openai/shap-e"
MODEL_LICENSE = "MIT code release; see upstream model card for usage cautions"


def make_pan_cameras(size: int, device: torch.device) -> DifferentiableCameraBatch:
    origins, xs, ys, zs = [], [], [], []
    for theta in np.linspace(0, 2 * np.pi, num=20):
        z = np.array([np.sin(theta), np.cos(theta), -0.5], dtype=np.float32)
        z /= np.sqrt(np.sum(z ** 2))
        origin = -z * 4
        x = np.array([np.cos(theta), -np.sin(theta), 0.0], dtype=np.float32)
        y = np.cross(z, x)
        origins.append(origin)
        xs.append(x)
        ys.append(y)
        zs.append(z)
    camera = DifferentiableProjectiveCamera(
        origin=torch.from_numpy(np.stack(origins)).float().to(device),
        x=torch.from_numpy(np.stack(xs)).float().to(device),
        y=torch.from_numpy(np.stack(ys)).float().to(device),
        z=torch.from_numpy(np.stack(zs)).float().to(device),
        width=size,
        height=size,
        x_fov=0.7,
        y_fov=0.7,
    )
    return DifferentiableCameraBatch(shape=(1, len(xs)), flat_camera=camera)


@torch.no_grad()
def decode_to_tri_mesh(transmitter, latent: torch.Tensor):
    cameras = make_pan_cameras(2, latent.device)
    params = transmitter.encoder.bottleneck_to_params(latent[None])
    decoded = transmitter.renderer.render_views(
        AttrDict(cameras=cameras),
        params=params,
        options=AttrDict(rendering_mode="stf", render_with_direction=False),
    )
    raw_meshes = getattr(decoded, "raw_meshes", None)
    if not raw_meshes:
        raise RuntimeError("Shap-E decoder returned no triangle mesh")
    return raw_meshes[0].tri_mesh()


def vertex_colors(tri_mesh):
    channels = getattr(tri_mesh, "vertex_channels", None) or {}
    if not all(k in channels for k in ("R", "G", "B")):
        return None
    rgb = np.stack([np.asarray(channels[k]).reshape(-1) for k in ("R", "G", "B")], axis=1)
    if rgb.size == 0 or not np.isfinite(rgb).all():
        return None
    if float(rgb.max()) <= 1.0:
        rgb = rgb * 255.0
    rgba = np.concatenate(
        [np.clip(rgb, 0, 255), np.full((len(rgb), 1), 255.0)], axis=1
    )
    return rgba.astype(np.uint8)


def export_mesh(tri_mesh, output_dir: Path):
    verts = np.asarray(tri_mesh.verts, dtype=np.float32)
    faces = np.asarray(tri_mesh.faces, dtype=np.int64)
    if verts.ndim != 2 or verts.shape[1] != 3 or len(verts) < 3:
        raise RuntimeError("Generated mesh has invalid vertices")
    if faces.ndim != 2 or faces.shape[1] != 3 or len(faces) < 1:
        raise RuntimeError("Generated mesh has no triangle faces")
    if not np.isfinite(verts).all() or faces.min() < 0 or faces.max() >= len(verts):
        raise RuntimeError("Generated mesh contains invalid geometry")

    ply_path = output_dir / "shap-e-generated.ply"
    with ply_path.open("wb") as f:
        tri_mesh.write_ply(f)

    colors = vertex_colors(tri_mesh)
    mesh = trimesh.Trimesh(
        vertices=verts,
        faces=faces,
        vertex_colors=colors,
        process=False,
    )
    glb_path = output_dir / "shap-e-generated.glb"
    mesh.export(str(glb_path), file_type="glb")

    with glb_path.open("rb") as f:
        if f.read(4) != b"glTF":
            raise RuntimeError("GLB export failed its magic-header check")
    check = trimesh.load(str(glb_path), force="mesh", process=False)
    if len(check.vertices) < 3 or len(check.faces) < 1:
        raise RuntimeError("Exported GLB could not be read back")
    return ply_path, glb_path, len(verts), len(faces), colors is not None


def sha256(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for block in iter(lambda: f.read(1024 * 1024), b""):
            h.update(block)
    return h.hexdigest()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--prompt", required=True, help="English text prompt")
    parser.add_argument("--steps", type=int, default=16)
    parser.add_argument("--guidance-scale", type=float, default=12.0)
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--threads", type=int, default=2)
    parser.add_argument("--device", choices=("cpu", "cuda"), default="cpu")
    parser.add_argument("--cache-dir", default="/tmp/shap-e-model-cache")
    parser.add_argument("--output-dir", default="mobile-gpu-lab/generated")
    args = parser.parse_args()

    prompt = args.prompt.strip()
    if len(prompt) < 3 or len(prompt) > 500:
        raise ValueError("Prompt must contain 3–500 characters")
    if not 4 <= args.steps <= 64:
        raise ValueError("--steps must be between 4 and 64")
    if args.guidance_scale <= 0 or args.guidance_scale > 30:
        raise ValueError("--guidance-scale must be in (0, 30]")

    if args.device == "cuda" and not torch.cuda.is_available():
        raise RuntimeError("CUDA was requested but is not available")
    device = torch.device(args.device)
    torch.set_num_threads(max(1, min(args.threads, 4)))
    torch.manual_seed(args.seed)
    os.environ.setdefault("TOKENIZERS_PARALLELISM", "false")

    cache_dir = str(Path(args.cache_dir).resolve())
    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    print("[1/4] Loading Shap-E transmitter and text diffusion weights", flush=True)
    transmitter = load_model("transmitter", device=device, cache_dir=cache_dir)
    model = load_model("text300M", device=device, cache_dir=cache_dir)
    diffusion = diffusion_from_config(load_config("diffusion", cache_dir=cache_dir))
    transmitter.eval()
    model.eval()

    print("[2/4] Sampling implicit 3D latents from text", flush=True)
    with torch.no_grad():
        latents = sample_latents(
            batch_size=1,
            model=model,
            diffusion=diffusion,
            guidance_scale=args.guidance_scale,
            model_kwargs={"texts": [prompt]},
            clip_denoised=True,
            use_fp16=False,
            use_karras=True,
            karras_steps=args.steps,
            sigma_min=1e-3,
            sigma_max=160,
            s_churn=0.0,
            device=device,
            progress=True,
        )

    print("[3/4] Decoding the implicit field into a colored triangle mesh", flush=True)
    tri_mesh = decode_to_tri_mesh(transmitter, latents[0])
    ply_path, glb_path, vertex_count, face_count, has_vertex_colors = export_mesh(
        tri_mesh, output_dir
    )

    manifest = {
        "generator": "OpenAI Shap-E text300M + transmitter",
        "source": MODEL_SOURCE,
        "code_license": MODEL_LICENSE,
        "custom_dataset": "mobile-gpu-lab/trained/training-samples.json",
        "custom_dataset_sample_count": 5943,
        "custom_dataset_finetuned_into_shap_e": False,
        "prompt": prompt,
        "seed": args.seed,
        "device": str(device),
        "steps": args.steps,
        "guidance_scale": args.guidance_scale,
        "output_format": "GLB triangle mesh with vertex colors when available",
        "vertices": vertex_count,
        "triangles": face_count,
        "vertex_colors": has_vertex_colors,
        "glb_file": glb_path.name,
        "glb_sha256": sha256(glb_path),
        "generated_utc": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "notes": [
            "This is a pretrained full 3D generator, not the previous 128-point MLP.",
            "The repository's 5943 custom samples and point-cloud checkpoint are preserved; this run does not fine-tune Shap-E on them.",
            "Shap-E model-card notes: generated meshes can contain rough edges, holes, or blurry textures.",
            "Shap-E model card advises caution for commercial use; review upstream terms before commercial deployment.",
            "CPU generation is slower; the workflow uses reduced sampling steps for a reproducible smoke test."
        ],
    }
    manifest_path = output_dir / "shap-e-manifest.json"
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")

    print("[4/4] Export and validation complete", flush=True)
    print(json.dumps({
        "glb": str(glb_path),
        "ply": str(ply_path),
        "vertices": vertex_count,
        "triangles": face_count,
        "vertex_colors": has_vertex_colors,
        "sha256": manifest["glb_sha256"],
    }, ensure_ascii=False), flush=True)


if __name__ == "__main__":
    main()
