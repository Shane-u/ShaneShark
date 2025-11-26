# ShaneShark · React 18 + GSAP

ShaneShark 是 Shane 的个人门户：初中生 / 博客作者 / 算法练习者。整站使用 React 18、TypeScript、Zustand、Tailwind 与 GSAP，所有文字与统计数据都存放在一个数据文件中，方便随时替换个人信息。

## Quick Start

```bash
cd /Users/shane/Documents/FrontendProject/MySite
npm install
npm run dev        # http://localhost:5173
npm run build      # production bundle
npm run preview    # serve build locally
```

## Architecture

| Concern | Implementation |
| --- | --- |
| Bundler | Vite 5 + React 18 + TypeScript |
| Styling | Tailwind CSS 3（自定义字体、渐变、阴影） |
| State | Zustand，集中托管 hero/social/experience/.../blogs |
| Routing | React Router 7（`/`、`/favorites`） |
| Code Splitting | `React.lazy` + `Suspense` |
| Animations | GSAP 3 + ScrollTrigger（`useSectionReveal`） |
| Perf | React 18 自动批处理 + memo 友好的无状态组件 |

```
src/
├─ app/router.tsx                 # route definitions + lazy pages
├─ components/                    # shared layout + card primitives
├─ features/                      # section-level components (hero, social, etc.)
├─ pages/                         # routed screens
├─ store/profile-data.ts          # single source of truth for content
├─ store/useProfileStore.ts       # Zustand hook
└─ types/profile.ts               # TypeScript interfaces
```

## Section Overview

| Section | Component | Notes |
| --- | --- | --- |
| Hero | `HeroSection` | 展示 Shane 头像（`assert/avator/avator.jpg`）、CSDN 统计、角色标签 |
| Community | `SocialProofSection` | GitHub + CSDN 卡片，走马灯动画 |
| Practice | `ExperienceSection` | ShaneShark Lab + 校园算法社经历 |
| Skills | `SkillsSection` | 语言、前端动画、算法三组进度条 |
| Projects | `ShowcaseSection` | 项目网格（React / GSAP 实验） |
| Video | `ShowcaseSection` | CSDN 导览短视频 |
| Blog | `BlogSection` | 博客卡片（阅读/点赞统计 + 外链） |
| Footprints | `StatisticsSection` | 时间配比 + 足迹（江苏/四川/浙江/重庆） |
| Bookshelf | `BooksSection` | 书单占位卡片（“书单正在整理中”） |
| Favorites | `FavoritesPage` | 动画 / 前端规范 / 算法仓库收藏 |

所有区块都使用 `SectionShell` 保证一致的间距、标题结构与行动按钮，并默认套用 GSAP 动画。

## Content Schema（`src/store/profile-data.ts`）

| Key | 描述 |
| --- | --- |
| `heroProfile` | 姓名、标语、摘要、角色、轨道徽章、CSDN 数据 |
| `socialStats` | GitHub / CSDN 卡片（`accent` 控制渐变） |
| `experienceHighlights` | ShaneShark Lab、校园算法社经历 |
| `skillGroups` | “后端 & 语言 / 前端 & 动画 / 算法 & 实战” |
| `showcases` | `category` = `project | game | video`，控制展示区域与配色 |
| `blogs` | CSDN 博客列表（标题、摘要、标签、统计、链接） |
| `books` | 书单占位（尚未阅读的主题也可以写在这里） |
| `favorites` | `/favorites` 页签；记录动画/前端/算法资源 |

所有类型定义位于 `src/types/profile.ts`，新增字段后 TypeScript 会立即提示其它需要更新的地方。

> 头像：替换 `assert/avator/avator.jpg` 即可，`HeroSection` 会自动引用。

## Animations & Performance

- `src/hooks/useSectionReveal.ts`：注册 GSAP + ScrollTrigger，对每个 `SectionShell` 做进入动画，并为标题/描述/CTA 添加 stagger。
- 懒加载：Home 页的每个区块用 `React.lazy` + `Suspense` 包裹，减少首屏体积。
- Zustand 保持 store 极简，无副作用；配合 React 18 自动批处理。
- Tailwind 负责响应式排版，`src/index.css` 定义背景渐变、滚动行为与 selection 颜色。

## Accessibility Checklist

- `SectionShell` 输出 `section + h2 + p` 语义结构。
- CTA 统一使用描述性文字（如 “GitHub · Shane-u”）。
- 所有外链均加 `rel="noreferrer"`，头像图片含 `alt` 文案。
- 页面支持键盘导航，Focus 状态由 Tailwind 的边框颜色提供反馈。

## Future Enhancements

- [ ] CSDN 博客通过 API/JSON 自动同步到 `blogs`.
- [ ] 加入 `SplitText` 实现逐字动画，增强英雄区标题表现力。
- [ ] 使用 `React.SuspenseList` 让多个 `SectionShell` 动画串行过渡。
- [ ] 增加 Vitest + Testing Library 覆盖 Blog/Favorites 组件。
- [ ] Footprint 区块接入地图热点或 SVG 路线。

> 这份 README 既是项目说明书，也是 ShaneShark 产品规划文档。替换个人信息时，只需更新 `src/store/profile-data.ts` 与头像文件即可。
