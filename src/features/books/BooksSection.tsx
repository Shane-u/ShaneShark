import { BookCard } from '@/components/cards/BookCard'
import { SectionShell } from '@/components/layout/SectionShell'
import { useProfileStore } from '@/store/useProfileStore'

export function BooksSection() {
  const bookList = useProfileStore((state) => state.books)

  return (
    <SectionShell
      id="books"
      eyebrow="Bookshelf"
      title="书单正在整理中"
      description="我会把看过的书放到这里，目前先放占位卡片，记录下一步准备阅读的主题。"
    >
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {bookList.map((book) => (
          <BookCard key={book.id} book={book} />
        ))}
      </div>
    </SectionShell>
  )
}

