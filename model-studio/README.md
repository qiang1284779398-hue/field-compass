# 墨造 2.0 · AI 文字生成 3D 模型工坊

面向手机浏览器的中文 AI 3D 角色生成工具。当前页面接入 **Tripo API**，由云端模型根据文字提示词生成真实 3D 网格与 PBR 材质，而不是用球体、方块拼装人物。

## 在线打开

- 页面：<https://qiang1284779398-hue.github.io/game/model-studio/>
- 源码：[`model-studio/index.html`](./index.html)

GitHub Pages 需在仓库 Settings → Pages 中选择 Deploy from a branch、`main`、`/(root)`。提交后等待 Pages 部署完成。

## 当前功能

- 手机优先的中文响应式界面
- 刘备、关羽、张飞、赵云、吕布的详细 Q 版角色提示词模板
- Tripo 文生 3D API 接入
- P2 游戏资产拓扑、H3.1 高精度、P1 轻量模型选项
- 面数上限与纹理质量选项
- 异步任务提交与状态轮询
- Three.js / GLTFLoader 实时 GLB 预览，支持旋转和缩放
- 下载生成的 GLB 文件

## 使用方法

1. 在 [Tripo 开发者平台](https://developers.tripo3d.ai/zh/keys) 创建 API Key，并确认账户有可用额度。
2. 用手机浏览器打开在线页面。
3. 选择人物模板，按需要修改描述。
4. 粘贴 API Key，选择模型与质量。
5. 点击“开始 AI 生成”，等待云端任务完成。
6. 在预览区检查模型，点击“下载 GLB 模型”。

## 模型选择建议

- **P2**：面向游戏资产和实时生产，适合先尝试作为手游角色基础网格。
- **H3.1**：偏高精度几何细节，可能需要在后续处理中降低面数。
- **P1**：较轻量的低模方案。

AI 生成结果仍需逐个检查。文字生成 3D 不保证准确还原复杂武器、面部身份、双手握持、服装分件或完整人体拓扑。正式进入游戏前，建议在 Blender 中检查比例、法线、材质、面数、原点、朝向和骨骼。

## API 与安全说明

- 页面直接从浏览器请求 Tripo API；若服务端未允许网页跨域请求，浏览器会出现 CORS 错误，需要增加安全的后端代理。
- API Key 仅保存在当前页面运行内存，不写入仓库或浏览器持久化存储；刷新页面后需要重新输入。
- 这是静态网页直连 API，密钥仍会用于本机浏览器发出的请求。不要在公共设备输入，也不要将密钥提交到 GitHub 或发送给他人。
- 生成任务会消耗 Tripo 账户额度。ChatGPT 订阅不包含 Tripo API 额度。
- 页面通过 CDN 加载 Three.js，需要网络连接。

## 技术结构

- 单页 HTML / CSS / JavaScript
- Three.js 0.170.0
- OrbitControls：模型旋转与缩放
- GLTFLoader：加载生成的 GLB
- Tripo v3 Text-to-Model API：任务创建与轮询

## 已知边界

- 当前版本接入真实 AI 文生 3D，但不是无限制免费本地生成。
- AI 模型生成属于概率性结果，提示词不能保证角色完全符合历史人物细节。
- 当前提供 GLB 预览与下载，尚未完成自动绑骨、动作生成、武器挂点校准、批量角色一致性和一键游戏资源验收。
- 浏览器直连 API 可能受 CORS、网络、账户权限或额度影响；遇到此类问题需要部署服务端代理，不能通过修改提示词解决。

## 官方文档

- [Tripo API 中文文档](https://developers.tripo3d.ai/zh)
- [文生 3D：P 系列](https://developers.tripo3d.ai/en/docs/generation-text-to-model/p)
- [文生 3D：H 系列](https://developers.tripo3d.ai/en/docs/generation-text-to-model/standard)
