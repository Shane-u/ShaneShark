import { BlogCard } from '@/components/cards/BlogCard'
import { SectionShell } from '@/components/layout/SectionShell'
import { useProfileStore } from '@/store/useProfileStore'

export function BlogSection() {
  const blogs = useProfileStore((state) => state.blogs)

  return (
    <SectionShell
      id="blog"
      eyebrow="Blog"
      title="把学习过程写成故事"
      description="CSDN 上的长文同步在这里，涵盖 React、GSAP 动画、算法心得以及源码引发的灵感。"
      actions={
        <a
          href="https://blog.csdn.net/VZS_0"
          target="_blank"
          rel="noreferrer"
          className="rounded-full border border-slate-200 px-5 py-2 text-sm font-semibold text-slate-700 transition hover:border-accent hover:text-accent dark:border-slate-600 dark:text-slate-200"
        >
          访问 CSDN
        </a>
      }
    >
      <div className="grid gap-6 md:grid-cols-2">
        {blogs.map((post) => (
          <BlogCard key={post.id} post={post} />
        ))}
      </div>
    </SectionShell>
  )
}

export default BlogSection


