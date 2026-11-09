# 制作环境

归档基线：2026-11-09。Node.js 20+，依赖实际版本由 package-lock.json 锁定；Python 3.11–3.13，依赖见 requirements-production.txt。

原影片使用 macOS、Chrome WebCodecs 硬件 H.264 编码、Three.js WebGL。画布 3840×2160、30 fps、5760 帧、192 秒；随机种子 1384，点云密度 2.4，编码目标 40 Mbps。

原版字体是系统宋体 Songti SC / STSong 与苹方 PingFang SC。字体不随仓库分发。其他系统可使用合法安装的中文字体替换，但字形与换行不保证完全相同。浏览器/GPU/编码器差异也会影响像素与文件哈希。这里保证源代码、输入与时间轴可恢复；精确成片以 Release 附件及 SHA256 为准。

展板导出另需 Poppler 的 pdftoppm。macOS 默认字体路径在 production/boards/build.py 中；其他平台设置 CHANGAN_SONG_FONT 和 CHANGAN_HEI_FONT。视频声音合成与转码需要 FFmpeg（libx264、AAC）在 PATH 中。
