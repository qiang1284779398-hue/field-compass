# 户外指南针（全新重做）

这是一个不依赖 AndroidX / 第三方 UI 库的原生 Android Java 项目。
使用 Android `TYPE_ROTATION_VECTOR` 方向传感器；设备没有该传感器时会显示提示，不会因空传感器直接崩溃。

## 自动生成 APK
1. 将本项目全部文件上传到 GitHub 仓库根目录（不要把外层文件夹套进去）。
2. 提交到 `main` 或 `master` 分支。
3. 打开仓库的 Actions 页面，等待 `Build Android APK` 运行完成。
4. 打开绿色成功的构建记录，在 Artifacts 下载 `field-compass-apk`。
5. 解压后安装 `app-debug.apk`。

## 本地构建
需要 JDK 17、Android SDK 35 和 Gradle 8.9+：
`gradle assembleDebug`
