import type {
  HeroProfile,
  SocialStat,
  ExperienceHighlight,
  SkillGroup,
  ShowcaseItem,
  BookItem,
  FavoriteItem,
  BlogPost,
} from '@/types/profile'

export const heroProfile: HeroProfile = {
  name: 'Shane',
  tagline: 'ShaneShark · 学习+写作+前端动画',
  summary:
    '我是 Shane，擅长 Java、Go、C++、Python，也会用 Vue、React 和 JavaScript 写前端，还喜欢研究算法和 GSAP 动画，在 ShaneShark 上记录成长。',
  roles: [
    { label: '博客写作', href: '#blog' },
    { label: 'React 项目', href: '#projects' },
    { label: '算法练习', href: '#skills' },
    { label: '游戏灵感', href: '#games' },
  ],
  orbitBadges: [
    { label: 'Java', icon: '☕️' },
    { label: 'Go', icon: '🐹' },
    { label: 'C++', icon: '⚙️' },
    { label: 'React', icon: '⚛️' },
  ],
  stats: [
    { label: 'CSDN 访问', value: '40,108' },
    { label: 'CSDN 粉丝', value: '423' },
    { label: '加入 CSDN', value: '2023-08-01' },
  ],
}

export const socialStats: SocialStat[] = [
  {
    id: 'github',
    platform: 'GitHub',
    handle: 'Shane-u',
    followers: 'Projects 12+',
    metrics: [
      { label: 'Repos', value: '12+' },
      { label: 'Stacks', value: 'Go · React' },
    ],
    summary: '开源练习场，记录 React、Go、算法题解以及 ShaneShark 站点源码。',
    url: 'https://github.com/Shane-u',
    accent: 'blue',
  },
  {
    id: 'csdn',
    platform: 'CSDN',
    handle: 'VZS_0',
    followers: '粉丝 423',
    metrics: [
      { label: '访问量', value: '40,108' },
      { label: '创作', value: '博客 60+' },
    ],
    summary: '喜欢写长文拆解算法、Java、Go和学习方法',
    url: 'https://blog.csdn.net/VZS_0',
    accent: 'pink',
  },
]

export const experienceHighlights: ExperienceHighlight[] = [
  {
    company: '软安科技有限公司',
    title: 'Java后端开发',
    description: `基于Spring Boot+Sa-Token+MyBatis-plus+Redis+PostgreSQL+MinIO+K8s 的服务代码审计服务提供平台，涵盖软安源兮（SCA）与软安静兮（SAST）两种在线检测方式，为厦门理工学院及其他高校提供代码安全审计赋能。`,
    link: 'https://www.softsafe-tech.com/',
    badge: '实习',
    accent: 'orange',
  },
]

export const skillGroups: SkillGroup[] = [
  {
    id: 'backend-langs',
    title: '后端 & 语言',
    items: [
      { label: 'Java', level: 9 },
      { label: 'Go', level: 8 },
      { label: 'C++', level: 8 },
    ],
  },
  {
    id: 'frontend',
    title: '前端 & 动画',
    items: [
      { label: 'React 18 + TS', level: 9 },
      { label: 'Vue 3', level: 8 },
      { label: 'GSAP', level: 7 },
    ],
  },
  {
    id: 'algorithms',
    title: '算法 & 实战',
    items: [
      { label: 'Python', level: 7 },
      { label: 'JavaScript', level: 8 },
      { label: '算法题解', level: 9 },
    ],
  },
]

export const showcases: ShowcaseItem[] = [
  {
    id: 'shane-portal',
    category: 'project',
    title: 'ShaneShark Portal',
    description: '当前网站源码，使用 React 18、Zustand、GSAP、Tailwind 和自动批处理渲染来描述 Shane 的学习旅程。',
    url: 'https://github.com/Shane-u/ShaneShark',
    stats: [{ label: 'Stack', value: 'React 18' }],
  },
  {
    id: 'gsap-stories',
    category: 'project',
    title: 'GSAP Scroll Stories',
    description: '用 GSAP ScrollTrigger 构建滚动触发的时间轴和文字动效，沉浸式讲述博客章节。',
    url: 'https://github.com/Shane-u',
    stats: [{ label: '焦点', value: 'ScrollTrigger' }],
  },
  {
    id: 'blog-video-tour',
    category: 'video',
    title: 'CSDN 博客导览',
    description: '把博客层层拆分细细讲解，方便伙伴快速了解算法题解和前端技巧。',
    url: 'https://blog.csdn.net/VZS_0',
    stats: [{ label: '访问', value: '40K+' }],
  },
]

export const books: BookItem[] = [
  {
    id: 'algo-blueprint',
    title: '算法蓝图（暂定）',
    author: 'Shane 正在整理',
    tag: 'Coming soon',
    href: '#',
  },
  {
    id: 'frontend-playlist',
    title: '前端动效清单（暂定）',
    author: 'ShaneShark Draft',
    tag: 'Coming soon',
    href: '#',
  },
  {
    id: 'growth-notes',
    title: '成长笔记（暂定）',
    author: 'Shane · Blog',
    tag: 'Coming soon',
    href: '#',
  },
  {
    id: 'reading-placeholder',
    title: '书单整理中',
    author: '更新中',
    tag: 'Coming soon',
    href: '#',
  },
]

export const favorites: FavoriteItem[] = [
  {
    id: 'gsap-docs',
    title: 'GSAP 官方文档',
    summary: '滚动动画的圣经，包含 ScrollTrigger、SplitText 等插件的最佳实践。',
    href: 'https://gsap.com/docs/v3/',
    tag: '动画',
  },
  {
    id: 'vue-style',
    title: 'Vue 官方风格指南',
    summary: '保持 Vue 组件整洁、易维护的规则集合，也是 Shane 做组件抽象时的参考。',
    href: 'https://vuejs.org/style-guide/',
    tag: '前端',
  },
  {
    id: 'go-algorithms',
    title: 'The Algorithms · Go',
    summary: '将经典算法用 Go 复刻一遍',
    href: 'https://github.com/TheAlgorithms/Go',
    tag: '算法',
  },
]

export const blogs: BlogPost[] = [
  {
    id: 'blog-gsap',
    title: '手把手打造 GSAP 滚动动画',
    excerpt: '记录 ShaneShark 如何把文字和卡片动效绑定到 ScrollTrigger，配合 React 18 自动批处理。',
    url: 'https://blog.csdn.net/VZS_0/article/details/140000001',
    published: '2025-11-01',
    tags: ['GSAP', 'React', '动画'],
    stats: [
      { label: '阅读', value: '3,200+' },
      { label: '点赞', value: '120+' },
    ],
  },
  {
    id: 'blog-algo',
    title: '用 Java/Go 双语刷题的节奏',
    excerpt: '总结 Java 与 Go 切换时的坑、调度方式，以及如何把游戏节奏转成刷题时间块。',
    url: 'https://blog.csdn.net/VZS_0/article/details/140000002',
    published: '2025-10-12',
    tags: ['Java', 'Go', '算法'],
    stats: [
      { label: '阅读', value: '2,700+' },
      { label: '收藏', value: '86' },
    ],
  },
  {
    id: 'blog-shaneshark',
    title: 'ShaneShark 设计稿与响应式实践',
    excerpt: '从线框图到 Tailwind 布局，说明如何让不同设备都能看到清晰的 Shane 故事。',
    url: 'https://blog.csdn.net/VZS_0/article/details/140000003',
    published: '2025-09-05',
    tags: ['React', 'Tailwind', '设计'],
    stats: [
      { label: '阅读', value: '1,900+' },
      { label: '评论', value: '45' },
    ],
  },
]

