# Full 3D generation upgrade

This directory adds a real text-conditioned implicit-3D generator on top of the earlier experimental point-cloud baseline.

## Generator

- Base model: OpenAI Shap-E `text300M` + `transmitter`.
- Representation: generated neural implicit 3D function, decoded to a triangle mesh.
- Export: GLB and PLY; GLB carries vertex colors when the decoder provides them.
- Execution: GitHub Actions CPU runner, so no personal computer or phone setup is needed for the CI generation test.

The workflow downloads the official pretrained checkpoints into the runner cache and produces a sample mesh. It does not copy multi-gigabyte model checkpoints into the Git repository.

## Run locally

Install the upstream project and trimesh, then run:

```bash
pip install "git+https://github.com/openai/shap-e.git" trimesh
python mobile-gpu-lab/generation/shap_e_text_to_glb.py \
  --device cpu \
  --prompt "a stylized medieval wooden shield with a metal rim and central boss" \
  --steps 16 \
  --seed 42
```

The generated files are written to `mobile-gpu-lab/generated/`.

For better quality, increase sampling steps up to 64; CPU generation becomes slower. Prompts should be written in English because the released text model uses an English-oriented text-conditioning pipeline.

## What is preserved and what changed

The existing `mobile-gpu-lab/trained/pointcloud-model.json`, `training-samples.json`, and `training-manifest.json` are left untouched. The 5,943 custom samples remain available for a later Shap-E-compatible fine-tuning pipeline.

Important: this first integration uses Shap-E's published pretrained weights. It does **not** yet fine-tune those weights on the repository's 5,943 assets. The custom dataset must first be re-encoded into Shap-E's latent training format (including the required multi-view/3D preprocessing); the old 128-point MLP weights cannot be loaded into Shap-E because the architectures are unrelated.

## Quality and licensing notes

Shap-E is a much more capable foundation than the old 128-point regressor because it can generate implicit 3D representations and decode them to meshes. It is still not equivalent to current commercial generators: the upstream model card notes that outputs may have rough edges, holes, and blurry textures, and advises caution for commercial use. Review the upstream model card and license before redistribution or commercial deployment.

- Code and checkpoints: https://github.com/openai/shap-e
- Model card: https://github.com/openai/shap-e/blob/main/model-card.md
- Existing custom dataset: `../trained/training-samples.json`
