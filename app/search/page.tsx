'use client'

import { InstantSearch, SearchBox, useInfiniteHits } from 'react-instantsearch'
import { useRef, useEffect } from 'react'
import { instantMeiliSearch } from '@meilisearch/instant-meilisearch'
import Link from 'next/link'

const { searchClient } = instantMeiliSearch(
  process.env.NEXT_PUBLIC_MEILISEARCH_URL!,
  process.env.NEXT_PUBLIC_MEILISEARCH_KEY!
)

const PaperHit = ({ hit }: { hit: any }) => (
  <div className="bg-white rounded-lg shadow-sm border border-gray-100 hover:shadow-md hover:border-blue-200 transition-all p-4">
    <Link href={`/paper/${hit.id}`} className="block">
      <h3 className="text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors mb-2">
        {hit.title}
      </h3>
    </Link>
    <p className="text-gray-600 text-sm mb-2">{hit.authors?.join(', ')}</p>
    <div className="flex items-center gap-3 text-sm text-gray-500">
      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded font-medium">{hit.venue}</span>
      <span>{hit.year}</span>
    </div>
  </div>
)

const Hits = () => {
  const { items, isLastPage, showMore } = useInfiniteHits()
  const sentinelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isLastPage) return
    const el = sentinelRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) showMore()
      },
      { rootMargin: '400px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [isLastPage, showMore])

  return (
    <div className="space-y-4">
      {items.map((hit, index) => (
        <div key={hit.id ?? `hit-${index}`}>
          <PaperHit hit={hit} />
        </div>
      ))}
      {items.length === 0 && (
        <p className="text-center py-12 text-gray-500">No results found</p>
      )}
      <div ref={sentinelRef} />
    </div>
  )
}

export default function SearchPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/search" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">D</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">DBLP Search</h1>
              <p className="text-xs text-gray-500">Academic Paper Database</p>
            </div>
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Search Papers</h2>
          <InstantSearch indexName="dblp" searchClient={searchClient}>
            <div className="mb-6">
              <SearchBox
                placeholder="Search papers by title, author, venue..."
                classNames={{
                  root: 'w-full',
                  form: 'relative',
                  input: 'w-full px-4 py-3 pl-12 text-base border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors',
                  submit: 'absolute left-3 top-1/2 -translate-y-1/2 text-gray-400',
                  reset: 'absolute right-3 top-1/2 -translate-y-1/2 text-gray-400',
                }}
              />
            </div>
            <Hits />
          </InstantSearch>
        </div>
      </main>

      <footer className="border-t mt-auto bg-white">
        <div className="max-w-5xl mx-auto px-4 py-6 text-center text-sm text-gray-500">
          DBLP Search
        </div>
      </footer>
    </div>
  )
}