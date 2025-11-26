export interface HeroProfile {
  name: string
  tagline: string
  summary: string
  roles: Array<{ label: string; href: string }>
  orbitBadges: Array<{ label: string; icon: string }>
  stats: Array<{ label: string; value: string }>
}

export type SocialAccent =
  | 'pink'
  | 'indigo'
  | 'green'
  | 'teal'
  | 'blue'
  | 'purple'

export interface SocialStat {
  id: string
  platform: string
  handle: string
  followers: string
  metrics?: Array<{ label: string; value: string }>
  summary: string
  url: string
  accent: SocialAccent
}

export interface ExperienceHighlight {
  company: string
  title: string
  description: string
  link: string
  badge: string
  accent: 'slate' | 'orange'
}

export interface SkillGroup {
  id: string
  title: string
  items: Array<{ label: string; level: number }>
}

export interface ShowcaseItem {
  id: string
  title: string
  description: string
  url: string
  category: 'project' | 'game' | 'video'
  stats?: Array<{ label: string; value: string }>
}

export interface BookItem {
  id: string
  title: string
  author: string
  tag: string
  href: string
}

export interface FavoriteItem {
  id: string
  title: string
  summary: string
  href: string
  tag: string
}

export interface BlogPost {
  id: string
  title: string
  excerpt: string
  url: string
  published: string
  tags: string[]
  stats: Array<{ label: string; value: string }>
}

