import { FavoriteCard } from '@/components/cards/FavoriteCard'
import { SectionShell } from '@/components/layout/SectionShell'
import { useProfileStore } from '@/store/useProfileStore'

export default function FavoritesPage() {
  const favorites = useProfileStore((state) => state.favorites)

  return (
    <div className="px-4">
      <SectionShell
        eyebrow="Favorites"
        title="收藏的资料和灵感来源"
        description="动画、前端规范、算法仓库都集中在这里，方便我和同学查阅。"
      >
        <div className="grid gap-6 md:grid-cols-2">
          {favorites.map((favorite) => (
            <FavoriteCard key={favorite.id} favorite={favorite} />
          ))}
        </div>
      </SectionShell>
    </div>
  )
}

