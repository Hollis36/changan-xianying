# 长安显影

在点与点之间，看见长安。

西安钟楼、大雁塔、永宁门的点云交互展览。珠光白背景、三首原创题诗、构件分层与建筑数学关系。

- [展示网站](https://hollis36.github.io/changan-xianying/)
- [交互展览](https://hollis36.github.io/changan-xianying/exhibition/)
- [4K动态影片](https://github.com/Hollis36/changan-xianying/releases/tag/v2026.11.07)

## 本地制作

需要 Node.js 20 或更新版本。

```sh
npm ci
npm test
npm run build
python3 -m http.server 4185 --directory docs
```

打开 http://localhost:4185/ 。`site/`为展示页源文件，`src/`为交互原型源码，`docs/`为GitHub Pages发布目录。修改后先构建，再提交并推送main；Pages发布main分支的docs目录。

## 影像

主片126秒、3840×2160、30fps，建筑缓慢旋转、钟楼构件展开合拢、点云散聚与塔层显现。4K原片在Release中，站内播放器使用1080P网络优化副本。原片保持独立，不混入Git历史。

## 表达边界与来源

模型为程序化艺术重构，不是现场扫描、实测测绘或历史复原。构件与几何关系用于讲解，不构成结构分析结论。三首题诗、代码与制作过程包含AI辅助；不冒称古人诗作或完全手工作品。研究来源可在交互展览里展开，作品说明位于docs/assets/project.pdf。

配乐《长安万象》由程序编配与乐器采样合成，非现场乐团录音。Three.js与VSCO采样的许可说明保留在legal/。本项目未对原创作品另行授予开源许可。

本仓库仅公开展示所需内容，不含报名身份材料、临时预览签名、登录信息或制作日志。
