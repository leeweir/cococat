# 喵呜小屋

一款中文 3D 猫咪陪伴小游戏，使用 Three.js + Vite。猫咪有六种脸型、毛色和体型，采用连续曲面、细毛、虹膜纹理和四足关节动画。暖木小屋、窗边近景和图解操作界面均在浏览器实时渲染。

## 玩法

- 领养六种小猫：三花、布偶、缅因、加菲、橘猫、英短蓝猫。
- 搭配猫饭、搓泡泡洗澡、一起看三个电视频道。
- 逗猫棒、抛球捡球和纸箱捉迷藏。
- 三张散步地图、12 件收藏、猫朋友和随机小故事。
- 购买与摆放家具、换装、感情成长、纪念册和小猫近景。
- 设置中的“完全重新开始”返回初始领养；“恢复上一次进度”可找回最近一次重开前的存档。

进度只存在当前浏览器的本地存储中。不同域名或设备的进度不会自动同步。

## 开发

需要 Node.js 22 或更新的兼容版本。

```sh
npm ci
npm run dev
```

本地地址：`http://localhost:4175/`。

```sh
npm run check
```

检查包括存档迁移、奖励去重、重新开始和恢复、猫咪网格有效性与步态、家具布局和绕行路径。

## 发布

在线试玩：<https://leeweir.github.io/cococat/>。

源码仓库 `leeweir/cat-adoption-game` 保持私有，推送到 `main` 后 GitHub Actions 执行检查，不直接发布 Pages。公开仓库 `leeweir/cococat` 只存放 `dist/` 内的网页成品及 `.nojekyll`，不上传开发源码、测试或本地存档。

发布时运行 `npm run check`，将 `dist/` 内容同步到公开仓库根目录，移除上一版构建文件并保留 `.nojekyll`，提交并推送到 `main`。该仓库的 Pages 来源使用 **Deploy from a branch → main → / (root)**。

生产资源路径固定为 `/cococat/`；本地开发仍使用根路径。构建后运行 `npm run preview`，在 `http://localhost:4175/cococat/` 验证生产版本。原 `/cat-adoption-game-pages/` 地址不再使用。
