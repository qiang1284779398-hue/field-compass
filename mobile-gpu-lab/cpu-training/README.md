# GitHub CPU text-to-3D training

GitHub Actions runs this pipeline on a standard Ubuntu CPU runner. No phone or personal computer is needed for training.

## Pipeline
1. Read metadata from Hugging Face Dataset Server for codepawl/pixel-atlas-glb.
2. Accept only assets whose individual row license explicitly says CC0.
3. Download small GLB files, parse triangle geometry, and sample 128 points by triangle surface area.
4. Train a compact text-to-point-cloud MLP on CPU using bidirectional Chamfer distance.
5. Commit model weights, training samples, and metrics under mobile-gpu-lab/trained; also upload a workflow artifact.

## Start manually
Open the repository Actions tab, choose CPU Text-to-3D Training, then Run workflow. Defaults are at most 32 models and 80 epochs. A scheduled run is configured weekly.

## Outputs
- pointcloud-model.json: model architecture and weights.
- training-samples.json: actual CC0 captions and sampled point clouds.
- training-manifest.json: sample count, epochs, loss history, and limitations.

## Honest limitations
This is a reproducible CPU baseline, not a pretrained commercial text-to-3D model. The source dataset is mostly pixel-art/low-poly objects; text features are hashed character n-grams, not a pretrained language encoder. Output is a point cloud, not a watertight editable mesh; no textures, materials, or rigging are generated.
