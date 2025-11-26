import { create } from 'zustand'
import {
  heroProfile,
  socialStats,
  experienceHighlights,
  skillGroups,
  showcases,
  books,
  favorites,
  blogs,
} from './profile-data'
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

interface ProfileState {
  hero: HeroProfile
  socials: SocialStat[]
  experience: ExperienceHighlight[]
  skills: SkillGroup[]
  showcases: ShowcaseItem[]
  books: BookItem[]
  favorites: FavoriteItem[]
  blogs: BlogPost[]
}

export const useProfileStore = create<ProfileState>(() => ({
  hero: heroProfile,
  socials: socialStats,
  experience: experienceHighlights,
  skills: skillGroups,
  showcases,
  books,
  favorites,
  blogs,
}))

