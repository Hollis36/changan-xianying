# 归档核验记录 · 2026-11-09

本记录说明归档当日实际运行的检查，不保证未来不同系统的字形与编码结果完全相同。

- `npm ci` 成功，锁定 Three.js 0.186.1、esbuild 0.28.2、mp4-muxer 5.2.2。
- `npm test`：52/52 通过，包含全片 5760 帧镜头边界、24 个构件与几何锚点检查。
- `npm run build` 成功，原 `docs/` 网站输出无差异。
- `python3 -m unittest discover -s scripts -p 'test_*.py'`：4/4 通过，覆盖分卷排序、重复恢复、损坏附件、整包校验失败与采样路径越界拒绝。
- 从归档目录启动 `npm run film`，Chrome 实际导出测试片：12 秒、3840×2160、H.264、30 fps、360 帧、60,897,352 字节，无声。已检查渲染页面构件画面。
- 重新运行 `production/boards/build.py`：四张 A3 JPG 的 SHA256 全部与最终参赛包的原图一致。
- 从 Release 暂存附件以 `--offline` 恢复原版音乐和 CC0 采样，重新运行 `music/compose_orchestral.py`：20 秒 WAV 与原母带 SHA256 完全一致。
- 完整公开材料 ZIP 压缩包 CRC 检查通过；报名身份字段已改为待填写；分卷分别有大小与 SHA256，整包有独立 SHA256。核验清单见 `release-manifest.json`。
- 文档、源码和拆分 ZIP 文本检查未发现登录凭据、私人绝对路径或实际预览签名。作品说明 Word 作者元数据为空。
- 代码与 Python 复核完成，修复了 Windows 默认编码读取中文路径的问题。

本次没有重新渲染 192 秒完整主片：归档附件保留已完成的最终原片。未提供自动生成最新 Word 的完整流水线；其可编辑 Word 原件在归档包内，文字源在 `competition/`。未声称影片在所有浏览器/GPU 下逐字节一致。
