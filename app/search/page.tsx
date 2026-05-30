'use client'

import {
  InstantSearch,
  SearchBox,
  useInfiniteHits,
  RefinementList,
  useRange,
  useClearRefinements,
  CurrentRefinements,
  Stats,
  Highlight,
} from 'react-instantsearch'
import { useRef, useEffect, useState } from 'react'
import { instantMeiliSearch } from '@meilisearch/instant-meilisearch'
import Link from 'next/link'

const { searchClient } = instantMeiliSearch(
  process.env.NEXT_PUBLIC_MEILISEARCH_URL!,
  process.env.NEXT_PUBLIC_MEILISEARCH_KEY!
)

/* ─── Paper Card ─── */

function PaperHit({ hit }: { hit: any }) {
  return (
    <div className="bg-white rounded-lg border border-gray-100 hover:shadow-md hover:border-blue-200 transition-all p-4">
      <Link href={`/paper/${hit.id}`} className="block">
        <h3 className="text-base font-semibold text-gray-900 hover:text-blue-600 transition-colors mb-1.5 leading-snug">
          <Highlight attribute="title" hit={hit} />
        </h3>
      </Link>
      <p className="text-sm text-gray-500 mb-2 leading-relaxed">
        {hit.authors?.slice(0, 5).join(', ')}
        {hit.authors?.length > 5 && ' et al.'}
      </p>
      <div className="flex items-center gap-2.5 text-xs">
        <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded font-medium">{hit.venue}</span>
        <span className="text-gray-400">{hit.year}</span>
        {hit.pages && <span className="text-gray-400">pp. {hit.pages}</span>}
      </div>
    </div>
  )
}

/* ─── Hits with Infinite Scroll ─── */

function Hits() {
  const { items, isLastPage, showMore } = useInfiniteHits()
  const sentinelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isLastPage) return
    const el = sentinelRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) showMore() },
      { rootMargin: '400px' },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [isLastPage, showMore])

  return (
    <div className="space-y-3">
      {items.map((hit, i) => (
        <div key={hit.id ?? `hit-${i}`}>
          <PaperHit hit={hit} />
        </div>
      ))}
      {items.length === 0 && (
        <p className="text-center py-12 text-sm text-gray-400">No papers found</p>
      )}
      <div ref={sentinelRef} />
    </div>
  )
}

/* ─── Year Range Filter ─── */

function YearRange() {
  const { start, range, refine } = useRange({ attribute: 'year' })
  const [from, to] = start ?? [undefined, undefined]
  const [inputFrom, setInputFrom] = useState('')
  const [inputTo, setInputTo] = useState('')

  // Fetch actual min/max from index for display
  const [displayBounds, setDisplayBounds] = useState<{ min: number; max: number } | null>(null)
  useEffect(() => {
    fetch(process.env.NEXT_PUBLIC_MEILISEARCH_URL + '/indexes/dblp/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + process.env.NEXT_PUBLIC_MEILISEARCH_KEY,
      },
      body: JSON.stringify({ limit: 0, facets: ['year'] }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.facetStats?.year) setDisplayBounds(data.facetStats.year)
      })
      .catch(() => {})
  }, [])

  // Sync local state when refine resets externally (e.g. ClearRefinements)
  useEffect(() => {
    const validFrom = Number.isFinite(from) ? String(from) : ''
    const validTo = Number.isFinite(to) ? String(to) : ''
    if (validFrom !== inputFrom) setInputFrom(validFrom)
    if (validTo !== inputTo) setInputTo(validTo)
  }, [from, to])

  // Fall back to display bounds if range is Infinity
  const minLabel =
    Number.isFinite(range.min) ? range.min : displayBounds?.min
  const maxLabel =
    Number.isFinite(range.max) ? range.max : displayBounds?.max

  return (
    <div>
      <div className="flex items-center gap-2">
        <input
          type="text"
          inputMode="numeric"
          placeholder={minLabel ? String(minLabel) : 'From'}
          value={inputFrom}
          onChange={(e) => {
            const v = e.target.value
            setInputFrom(v)
            refine([
              v ? Number(v) : undefined,
              inputTo ? Number(inputTo) : undefined,
            ])
          }}
          className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded focus:border-blue-400 focus:outline-none"
        />
        <span className="text-gray-300 text-xs">–</span>
        <input
          type="text"
          inputMode="numeric"
          placeholder={maxLabel ? String(maxLabel) : 'To'}
          value={inputTo}
          onChange={(e) => {
            const v = e.target.value
            setInputTo(v)
            refine([
              inputFrom ? Number(inputFrom) : undefined,
              v ? Number(v) : undefined,
            ])
          }}
          className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded focus:border-blue-400 focus:outline-none"
        />
      </div>
      {displayBounds && (
        <div className="flex justify-between mt-1 text-[10px] text-gray-400">
          <span>{displayBounds.min}</span>
          <span>{displayBounds.max}</span>
        </div>
      )}
    </div>
  )
}

/* ─── Search Page ─── */

export default function SearchPage() {
  return (
    <div className="min-h-screen bg-[#f5f6fa]">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/search" className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-blue-600 rounded flex items-center justify-center">
              <span className="text-white font-bold text-xs">D</span>
            </div>
            <span className="text-base font-semibold text-gray-900">DBLP Search</span>
          </Link>
          <a
            href="https://dblp.org"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            dblp.org
          </a>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        <InstantSearch indexName="dblp" searchClient={searchClient}>
          {/* Search bar row */}
          <div className="flex items-center gap-4 mb-5">
            <div className="flex-1 max-w-xl">
              <SearchBox
                placeholder="Search papers by title, author, venue…"
                classNames={{
                  root: 'w-full',
                  form: 'relative',
                  input: 'w-full px-4 py-2.5 pl-10 text-sm border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors bg-white',
                  submit: 'absolute left-3 top-1/2 -translate-y-1/2 text-gray-400',
                  reset: 'absolute right-3 top-1/2 -translate-y-1/2 text-gray-400',
                  loadingIndicator: 'absolute right-3 top-1/2 -translate-y-1/2',
                }}
              />
            </div>
            <Stats />
          </div>

          {/* Active filter tags */}
          <div className="mb-4">
            <CurrentRefinlementsWithClear />
          </div>

          <div className="flex gap-6">
            {/* Results */}
            <div className="flex-1 min-w-0">
              <Hits />
            </div>

            {/* Sidebar filters */}
            <aside className="w-56 flex-shrink-0">
              <div className="sticky top-20 space-y-6">
                {/* Venue */}
                <section>
                  <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2.5">
                    Venue
                  </h4>
                  <div className="max-h-60 overflow-y-auto">
                    <RefinementList
                      attribute="venue"
                      searchable
                      searchablePlaceholder="Search venues…"
                      showMore
                      classNames={{
                        root: 'text-sm',
                        list: 'space-y-1',
                        item: 'flex items-center gap-1.5',
                        checkbox: 'w-3.5 h-3.5 rounded border-gray-300',
                        label: 'flex items-center gap-1.5 cursor-pointer text-gray-600 hover:text-gray-900 text-xs',
                        count: 'ml-auto text-[10px] text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded',
                        searchBox: 'mb-2',
                        showMore: 'mt-2 text-xs text-blue-600 hover:text-blue-800 transition-colors',
                      }}
                    />
                  </div>
                </section>

                {/* Year */}
                <section>
                  <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2.5">
                    Year
                  </h4>
                  <YearRange />
                </section>
              </div>
            </aside>
          </div>
        </InstantSearch>
      </main>
    </div>
  )
}

/* ─── Current Refinements + Clear ─── */

function CurrentRefinlementsWithClear() {
  const { canRefine, refine } = useClearRefinements()

  return (
    <div className="flex items-center gap-3">
      <CurrentRefinements
        classNames={{
          root: 'flex-1',
          list: 'flex flex-wrap gap-1.5',
          item: 'inline-flex items-center gap-1 px-2.5 py-1 text-xs bg-blue-50 text-blue-700 rounded-full',
          delete: 'ml-0.5 hover:text-blue-900 font-bold leading-none',
          categoryLabel: 'font-medium',
        }}
      />
      {canRefine && (
        <button
          onClick={refine}
          className="text-xs text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
        >
          Clear all
        </button>
      )}
    </div>
  )
}
