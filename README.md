# 野外指北针 · Field Compass

面向 **Amazfit Balance 3** 的 Zepp OS 电子指北针。

## 功能
- 使用手表内置指南针传感器读取实时方向角。
- 480 × 480 圆形表盘，刻度、双色综合指针、角度和八方位显示。
- 未校准时显示校准提示。
- 支持 Balance 3 中国大陆版及国际版 deviceSource。

## 构建
本项目使用 Zepp OS Zeus CLI：

```bash
npm install --global @zeppos/zeus-cli
python -m pip install pillow qrcode
python scripts/generate_assets.py
zeus build
```

构建产物位于 `dist/`。

## 安装二维码
扫描仓库中的 [INSTALL_QR.png](INSTALL_QR.png) 可打开最新发布页。安装需要通过 Zepp App 的开发者模式扫码/安装流程。

## 重要说明
此应用读取手表指南针传感器的磁北方向。户外导航时请远离磁铁、手机扬声器、金属物件和高压电线，并在首次使用或方向异常时按提示校准。它不能替代纸质地图、实体指北针和备用导航方案。
