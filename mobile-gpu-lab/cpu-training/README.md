# GitHub CPU text-to-3D baseline

This workflow is retained as the repository's first custom-trained 3D experiment. It is not the full-mesh generator.

## Pipeline

1. Read metadata from Hugging Face Dataset Server for `codepawl/pixel-atlas-glb` and `codepawl/objaverse-clean-glb`.
2. Accept only rows with an explicit CC0 or CC-BY-4.0 license; attribution fields are retained for CC-BY assets.
3. Download supported GLB geometry and sample 128 surface points per asset.
4. Train a compact text-to-point-cloud MLP on CPU using bidirectional Chamfer distance.
5. Commit model weights, normalized point clouds, source paths, and metrics under `mobile-gpu-lab/trained/`.

The latest recorded run contained 5,943 usable assets, 128 points per asset, 10 epochs, and warm-started the previous checkpoint. Its training Chamfer metric decreased from 0.01704 to 0.01245. This is a training-set metric, not proof of good text-to-3D generalization.

## Outputs

- `pointcloud-model.json`: legacy MLP architecture and weights.
- `training-samples.json`: 5,943 point-cloud samples with caption and license/source provenance.
- `training-manifest.json`: sample count, epoch history, metrics, and limitations.

## Honest limitations

The model uses hashed character n-gram text features and predicts only 128 XYZ points. It does not generate mesh topology, watertight surfaces, textures, materials, or rigging. Its current dataset is a small low-poly subset. The 5,943 custom samples are preserved for future training and fine-tuning work.

## Full-mesh generator

For a genuine text-conditioned implicit 3D generator that decodes complete triangle meshes and exports GLB, see [the Shap-E generation path](../generation/README.md). It uses published pretrained Shap-E weights; the 5,943 custom samples are preserved but have not yet been used to fine-tune Shap-E.
