import { ShowcaseCard } from '@/components/cards/ShowcaseCard'
import { SectionShell } from '@/components/layout/SectionShell'
import { useProfileStore } from '@/store/useProfileStore'

export function ShowcaseSection() {
  const showcaseItems = useProfileStore((state) => state.showcases)
  const projects = showcaseItems.filter((item) => item.category === 'project')
  const games = showcaseItems.filter((item) => item.category === 'game')
  const videos = showcaseItems.filter((item) => item.category === 'video')

  return (
    <>
      <SectionShell
        id="projects"
        eyebrow="Projects"
        title="把想法上线成 React / Go 项目"
        description="记录 ShaneShark 门户、GSAP 动画实验和开源练习场，让同学们可以直接 fork。"
      >
        <div className="grid gap-6 md:grid-cols-3">
          {projects.map((item) => (
            <ShowcaseCard key={item.id} item={item} />
          ))}
        </div>
      </SectionShell>

      <SectionShell
        id="games"
        eyebrow="Games"
        title="游戏与生活灵感"
        description="用游戏思维训练策略，自制小游戏，把体验都写进 ShaneShark。"
      >
        <div className="grid gap-6 md:grid-cols-3">
          {games.map((item) => (
            <ShowcaseCard key={item.id} item={item} />
          ))}
        </div>
      </SectionShell>

      <SectionShell
        id="video"
        eyebrow="Video"
        title="博客导览短视频"
        description="把长文拆成易于分享的短视频或动图，帮助朋友快速知道每篇文章讲什么。"
      >
        <div className="grid gap-6 md:grid-cols-2">
          {videos.map((item) => (
            <ShowcaseCard key={item.id} item={item} />
          ))}
        </div>
      </SectionShell>
    </>
  )
}

