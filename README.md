# cococat · 喵呜小屋

一款中文 3D 猫咪陪伴小游戏。领养一只小猫，陪它吃饭、玩耍、换装和探险，把小屋慢慢布置成家。使用 Three.js + Vite，纯前端运行，无需注册。

**[在线试玩](https://leeweir.github.io/cococat/)** · [源码仓库](https://github.com/leeweir/cococat) · [构建与发布](https://github.com/leeweir/cococat/actions/workflows/pages.yml)

## 玩法

- **20 种小猫**：三花、布偶、缅因、暹罗、曼基康、挪威森林猫等，各有外形、性格和偏爱的食材。
- **日常照顾**：搭配猫饭、搓泡泡洗澡，一起看鱼鱼频道、蝴蝶纪录片和鸟鸟音乐会。
- **互动陪玩**：逗猫棒、抛球捡球、纸箱捉迷藏，也可以摸摸小猫、听它喵喵叫。
- **100 件免费服饰**：帽子、眼镜、围脖、上衣、裤裙、背饰、鞋袜和尾饰，8 个部位自由混搭，支持随机搭配和一键脱下。
- **布置小屋**：摆放家具、切换墙面与地板配色；部分家具用陪玩和寻宝获得的爱心解锁。
- **外出探险**：花花公园、蓝铃花园、月牙小街，收集 12 件宝物，结识猫朋友，遇见随机小故事。
- **陪伴与记录**：亲密度成长、纪念册和小猫近景，记录一起生活的小片段。

## 操作

首次进入时，选择猫咪、取好名字，再点击“带它回家”。

| 操作 | 方法 |
| --- | --- |
| 走路 | 在小屋或探险场景中使用方向键、WASD、屏幕方向按钮，或点击地面 |
| 转动视角 | 使用视角旋转按钮；领养与近景页面也可拖动场景 |
| 摸摸小猫 | 在小屋或衣柜中点击小猫 |
| 换装 | 打开“换衣服”，选择部位和服饰；再次点击已穿上的服饰即可脱下 |
| 摆放家具 | 在“我们的小屋”中进入布置，选择家具并拖动摆放 |
| 开关音效 | 点击右上角的音符按钮 |

## 存档

进度自动保存在当前浏览器的 `localStorage` 中，没有云端存档。不同浏览器、设备或站点地址之间不会自动同步；清除网站数据会删除本地进度。

- 设置中的“完全重新开始”会回到领养页，同时保留最近一次重开前的进度。
- 如需撤销重开，可在设置中选择“恢复上一次进度”。这不能恢复已被浏览器清除的网站数据。

## 本地开发

推荐使用 Node.js 22 和 npm；游戏需要支持 WebGL 2 的现代浏览器。

```sh
git clone https://github.com/leeweir/cococat.git
cd cococat
npm ci
npm run dev
```

本地开发地址：<http://127.0.0.1:4175/>。

| 命令 | 用途 |
| --- | --- |
| `npm run dev` | 启动开发服务器 |
| `npm test` | 运行现有测试 |
| `npm run build` | 构建生产版本到 `dist/` |
| `npm run check` | 依次运行测试和生产构建 |
| `npm run preview` | 预览已构建的 `dist/`，地址为 <http://127.0.0.1:4175/cococat/> |

生产预览前先运行 `npm run build`。开发服务器与预览服务器使用同一端口，切换时请先停止正在运行的服务。

测试覆盖存档迁移、重新开始与恢复、奖励去重、猫咪网格和步态、服饰搭配与资源释放、家具布局和绕行路径。

## 自动发布

源码和 GitHub Pages 使用同一个公开仓库 `leeweir/cococat`，无需独立发布仓库，也无需提交 `dist/`。

推送到 `main` 后，[Publish cococat](https://github.com/leeweir/cococat/actions/workflows/pages.yml) 工作流会自动安装依赖、运行 `npm run check`，再将构建产物部署到 GitHub Pages。也可在 Actions 页面手动运行该工作流。

仓库 **Settings → Pages → Build and deployment → Source** 应选择 **GitHub Actions**。

生产资源路径在 `vite.config.js` 中设为 `/cococat/`，开发服务器使用根路径。发布地址为 <https://leeweir.github.io/cococat/>。
