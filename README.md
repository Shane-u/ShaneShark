# ShaneShark · React 18 + GSAP

ShaneShark 是 Shane 的个人门户：博客作者 / 算法练习者。整站使用 React 18、TypeScript、Zustand、Tailwind 与 GSAP，所有文字与统计数据都存放在一个数据文件中，方便随时替换个人信息。

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
| Routing | React Router 7 HashRouter（`#/`、`#/favorites`，适配 GitHub Pages） |
| Code Splitting | `React.lazy` + `Suspense` |
| Animations | GSAP 3 + ScrollTrigger（`useSectionReveal`） |
| Perf | React 18 自动批处理 + memo 友好的无状态组件 |
| Theme Mode | `ThemeProvider` + MagicUI `AnimatedThemeToggler`（导航栏全局切换） |

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
| Hero | `HeroSection` | 仅保留魔法轨道区域：中心 MagicUI `3d-card` + `AnimatedGradientText` 展示 Shane 名片，两层 `OrbitingCircles` 全环绕（头像/LOGO/技能徽章）复刻“数字游牧”式布局 |
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

## Recent Updates

- 2025-11-26：导航加入 MagicUI `AnimatedThemeToggler`，支持记忆 Light/Dark 主题并同步系统偏好。
- 2025-11-26：所有 SectionShell + 卡片（Blog/Project/Skills/Books...）完成深浅色适配，按钮、渐变、背景统一响应主题。
- 2025-11-26：Hero 名片背景改为 `#7bcde0`，保留 `#f2e0c4 / #d9b89c` 点缀，形成“海风 + 沙滩”配色。
- 2025-11-26：Hero 名片切换至 `#f2e0c4 / #d9b89c / #a76d4d` 色系，更贴合 Shane 品牌主色。
- 2025-11-26：按照参考样式重绘 Hero “My name is” 卡片，新增横线分隔、“I'm a” 标签与纵向身份列表。
- 2025-11-26：Hero 名片字体与内容全部切换为白色排版，并配深蓝背景，提升对比度。
- 2025-11-26：给 Hero 名片内的 “Shane” 文本加入 TypingAnimation 打字效果，持续强化个性化动效。
- 2025-11-26：重构 TypingAnimation，支持类型→停顿→删除循环，Hero 中的 “Shane” 现以慢速出入场增强节奏感。
- 2025-11-26：Hero 区块去掉 `SectionShell` 的外层文字，只保留 “My name is” 名片与双层环绕徽章，首屏更聚焦。
- 2025-11-26：调整 Hero 名片定位，让双层轨道围绕卡片中心旋转，视觉焦点更统一。
- 2025-11-26：修正 OrbitingCircles 轨迹中心，图标现以名片为基准环绕，避免偏移。

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

## Theme System

- Provider：`src/providers/ThemeProvider.tsx` 负责在 `<html>` 上下发 `light/dark` class，并将用户选择持久化在 `localStorage (mysite-theme)`。
- Hook：`useTheme()` 暴露 `theme/setTheme/toggleTheme`，在组件里获取当前模式。
- MagicUI 控件：`src/registry/magicui/animated-theme-toggler.tsx`（导航条与移动端入口均在 `SiteHeader` 中使用）。按钮带有 `aria-pressed`、焦点高亮以及轻微光晕动画。
- Tailwind：`tailwind.config.js` 启用了 `darkMode: 'class'`，`index.css` 增补 `html.dark` 的渐变背景与 `color-scheme`，全局可响应主题切换。`SectionShell` 及所有卡片组件都带 `dark:*` 样式，保证导航、卡片、徽章、按钮在双主题下一致。

## CI/CD & Deployment

项目已配置 GitHub Actions 自动化工作流：

### Workflow 文件

- **`.github/workflows/ci.yml`** - 持续集成
  - 代码检查（ESLint）
  - 类型检查（TypeScript）
  - 项目构建
  - 上传构建产物

- **`.github/workflows/deploy.yml`** - 自动部署
  - 自动构建项目
  - 自动部署到 GitHub Pages

### 快速部署

1. **首次部署**：查看 [DEPLOYMENT.md](./DEPLOYMENT.md) 获取详细步骤
2. **日常更新**：推送代码到 `main` 分支，GitHub Actions 会自动部署
3. **查看状态**：在仓库的 **Actions** 标签页查看运行状态

### 部署流程

```bash
# 1. 修改代码
# 2. 提交更改
git add .
git commit -m "更新内容"
# 3. 推送到 GitHub（自动触发部署）
git push origin main
```

> 📖 详细部署指南请查看 [DEPLOYMENT.md](./DEPLOYMENT.md)

## Future Enhancements

- [ ] CSDN 博客通过 API/JSON 自动同步到 `blogs`.
- [ ] 加入 `SplitText` 实现逐字动画，增强英雄区标题表现力。
- [ ] 使用 `React.SuspenseList` 让多个 `SectionShell` 动画串行过渡。
- [ ] 增加 Vitest + Testing Library 覆盖 Blog/Favorites 组件。
- [ ] Footprint 区块接入地图热点或 SVG 路线。

> 这份 README 既是项目说明书，也是 ShaneShark 产品规划文档。替换个人信息时，只需更新 `src/store/profile-data.ts` 与头像文件即可。
