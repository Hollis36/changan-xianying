# 复现与继续修改

本归档以 2026-11-09 的 **192 秒构件详解卡点净版**为制作基线：3840×2160、30 fps、5760 帧、三座建筑、24 个构件、珠光白背景和三首题诗。网页展示页原有的 126 秒概览片是另一个版本，未随归档替换。

## 从新电脑开始

安装 Git、Node.js 20+ 和 Python 3.11–3.13。视频后期另需 FFmpeg；展板另需 Poppler（提供 `pdftoppm`）。建议留出至少 10 GB 磁盘空间；4K 浏览器导出建议桌面 Chrome、8 GB 以上内存与硬件编码支持。

```sh
git clone https://github.com/Hollis36/changan-xianying.git
cd changan-xianying
npm ci
npm test
npm run build
python3 -m http.server 4185 --directory docs
```

访问 http://127.0.0.1:4185/ 看展示页，访问 http://127.0.0.1:4185/exhibition/ 看交互作品。静态网站输出在 `docs/`，原有 GitHub Pages 发布目录也是 `main/docs`。

## 取回最终完整材料

```sh
python3 scripts/restore.py archive
```

输出为 `output/changan-xianying-public-archive-20261109.zip`。脚本先校验两个分卷，再合并并检查整包 SHA256。解压后包含 4K/1080P 主片、三座建筑短片、27 张构件图、4 张 A3 展板、截图、Word/PDF、资料依据和交互 HTML。

分卷是连续二进制片段，不可单独解压。网络慢时可从 [Release](https://github.com/Hollis36/changan-xianying/releases/tag/v2026.11.09-archive) 手动下载附件到 `output/downloads/`，再加 `--offline` 运行。脚本不支持断点续传；失败后可重新运行，已经完整且校验通过的附件会跳过。请勿重命名附件。

这是完整材料的**公开归档副本**：报名文案的身份字段已留空。视频、展板等作品文件未改。包内历史交付核验记录保留原记录；顶层 `SHA256SUMS.txt` 对应本公开副本。材料按赛事系统要求择项提交，不是把整个归档包直接作为投稿附件。

## 修改位置

| 想修改的内容 | 文件 |
| --- | --- |
| 网页诗句与观察视角 | `src/exhibition/views.js` |
| 网页配色与纸白背景 | `src/exhibition/theme.js`、`style.css`、`order.css` |
| 网页建筑几何 | `src/models.js`、`src/details.js` |
| 网页构件、数学与地理说明 | `src/exhibition/anatomy-data.js`、`order-data.js`、`geography/data.js` |
| 影片诗句、24 个构件名称、相机锚点、30 段镜头与卡点帧 | `video/anatomy/data.js` |
| 影片建筑几何与精细斗拱 | `video/anatomy/models.js`、`details.js` |
| 影片构图、渲染、旋转、聚焦与点云变化 | `video/anatomy/film.js` |
| 影片编码与图片导出 | `video/anatomy/main.js` |
| 配乐和声、配器、节奏 | `music/compose_orchestral.py` |
| 展板版式、题诗、说明与截图 | `production/boards/build.py`、`production/boards/inputs/` |
| 最新参赛说明、分镜、术语来源 | `competition/`（Markdown，可编辑） |

网页与影片有各自的几何快照；修改一处不会自动同步另一处。改诗句时请同步网页、影片、展板与说明文档。Word/PDF 成品在归档 ZIP 中；Markdown 是继续编辑的文本源，当前未提供自动生成最新版 Word 的完整流水线。

## 导出 192 秒 4K 影片

```sh
npm run film
```

打开 http://127.0.0.1:4186/ ，先选不同构件检查，再点击“导出12秒测试”；测试从全片第 28 秒开始，输出在 `output/render/`。确认中文字体、颜色和点云细节后，点击“导出192秒4K详解”。也可点击构件图按钮导出 24 张构件图及 3 张整体图。

完整无声文件为 `output/render/构件详解-4K-无声母版.mp4`。渲染时保持页面打开，不要同时操作其他导出。不同硬件的 WebCodecs/H.264 支持与耗时可能不同；不支持时页面会明确报错。重新导出同名文件会覆盖 `output/render/` 的上一份，请先备份要保留的导出。

取回原版音轨，再按顺序合成；每条后期命令省略 `--run` 可先查看参数：

```sh
python3 scripts/restore.py music
python3 scripts/postprocess.py audio --run
python3 scripts/postprocess.py 1080 --run
python3 scripts/postprocess.py bell --run
python3 scripts/postprocess.py pagoda --run
python3 scripts/postprocess.py gate --run
```

输出 `output/film-4k.mp4`、`film-1080p.mp4` 及三个章节。后期脚本拒绝覆盖既有输出。声音按原版 -2 dB、1 秒淡入、末尾 3 秒淡出、192 秒裁切；视频复制保留 4K 编码。`production/ffmpeg-recipes.json` 记录原执行参数的可移植版本。章节分割点是 1997/30 和 3872/30 秒，已在浏览器编码器中强制插入关键帧。修改总时长或镜头边界时，需同步音轨淡出和章节参数，不可只改时长常量。

## 从采样重新编配音乐（可选）

```sh
python3 -m venv .venv
# macOS/Linux：source .venv/bin/activate
# Windows：.venv\Scripts\activate
python -m pip install -r requirements-production.txt
python scripts/restore.py samples
python music/compose_orchestral.py
```

生成 `output/长安万象-恢宏管弦版-20秒-混音.wav`。如需拼接长音轨，将该文件复制为 `output/orchestral-master-20s.wav`，移走已有的 `output/music-bed.wav`，再运行 `python scripts/postprocess.py music --run`。它使用 10 遍 20 秒乐段、0.5 秒交叉淡化，得到 195.5 秒底轨。更改音乐后必须重新核对卡点，旧 `beat-timeline.json` 不会自动适配新音乐。

采样来自 VSCO 2 CE，固定提交与文件列表见 `music/orchestral-samples/manifest.json`，CC0 许可原文保留；原编配源码和精确使用的采样一起归档。

## 重做 A3 展板

在上述 Python 环境里运行：

```sh
python production/boards/build.py
```

输出 `output/boards/02_报名与说明/` 中的四页 A3 PDF 和四张 300 dpi JPG。源截图及三景横幅已存入 `production/boards/inputs/`；网页修改后需手动重新截图替换。原字体为 macOS 宋体和 Arial Unicode。其他平台通过 `CHANGAN_SONG_FONT`、`CHANGAN_HEI_FONT` 指定合法可用的中文字体文件，替换字体后人工核对换行和留白。

## 验证与发布

运行 `npm test` 覆盖网页交互数据、模型和全片 5760 帧时间轴；`npm run build` 生成站点。影片导出后还应检查尺寸、帧率、时长、章节边界、声音以及各场景中文字。软件及硬件差异见 [ENVIRONMENT.md](ENVIRONMENT.md)，归档成片的精确文件身份见 [release-manifest.json](release-manifest.json)。

提交源码前不要加入 `output/`、登录信息或限时预览签名。新成片发布为新的 Release，不覆盖归档版本；原站点的视频入口需另行更新。归档未购买服务、未更换域名，也不包含自动续签腾讯云链接的登录状态。
