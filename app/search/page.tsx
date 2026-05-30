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

/* ─── Icons ─── */

const SearchIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
  </svg>
)

const ArrowUpRight = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M7 7h10v10" /><path d="M7 17 17 7" />
  </svg>
)

/* ─── Paper Card ─── */

function PaperHit({ hit }: { hit: any }) {
  return (
    <div className="group bg-white rounded-lg border border-[#e8e2d9] hover:border-[#d4cbc0] hover:shadow-sm transition-all">
      <div className="p-4">
        {/* Title */}
        <Link href={`/paper/${hit.id}`}>
          <h3 className="text-base font-semibold text-[#1a1a2e] group-hover:text-[#c14b3f] transition-colors leading-snug mb-2">
            <Highlight attribute="title" hit={hit} />
          </h3>
        </Link>

        {/* Authors */}
        {hit.authors && hit.authors.length > 0 && (
          <p className="text-sm text-[#6b5d52] leading-relaxed mb-2.5">
            {hit.authors.slice(0, 6).join(', ')}
            {hit.authors.length > 6 && (
              <span className="text-[#a0988c]"> et al.</span>
            )}
          </p>
        )}

        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
          <span className="px-2 py-0.5 bg-[#f0ebe4] text-[#6b5d52] rounded font-medium">
            {hit.venue}
          </span>
          <span className="text-[#8a7e72]">{hit.year}</span>
          {hit.pages && <span className="text-[#a0988c]">pp. {hit.pages}</span>}
          {hit.ee && (
            <a
              href={hit.ee}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-[#8a7e72] hover:text-[#c14b3f] transition-colors inline-flex items-center gap-0.5"
            >
              DOI <ArrowUpRight />
            </a>
          )}
        </div>
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
        <div key={hit.id ?? `hit-${i}`} className="animate-in" style={{ animationDelay: `${i * 25}ms` }}>
          <PaperHit hit={hit} />
        </div>
      ))}
      {items.length === 0 && (
        <div className="text-center py-16">
          <p className="text-[#8a7e72]">No papers match your search.</p>
          <p className="text-sm text-[#a0988c] mt-1">Try adjusting your filters or search terms.</p>
        </div>
      )}
      <div ref={sentinelRef} />
    </div>
  )
}

/* ─── Year Range ─── */

function YearRange() {
  const { start, range, refine } = useRange({ attribute: 'year' })
  const [from, to] = start ?? [undefined, undefined]
  const [inputFrom, setInputFrom] = useState('')
  const [inputTo, setInputTo] = useState('')

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
      .then((data) => { if (data.facetStats?.year) setDisplayBounds(data.facetStats.year) })
      .catch(() => {})
  }, [])

  useEffect(() => {
    const validFrom = Number.isFinite(from) ? String(from) : ''
    const validTo = Number.isFinite(to) ? String(to) : ''
    if (validFrom !== inputFrom) setInputFrom(validFrom)
    if (validTo !== inputTo) setInputTo(validTo)
  }, [from, to])

  const minLabel = Number.isFinite(range.min) ? range.min : displayBounds?.min
  const maxLabel = Number.isFinite(range.max) ? range.max : displayBounds?.max

  return (
    <div>
      <div className="flex items-center gap-2">
        <input
          type="text" inputMode="numeric"
          placeholder={minLabel ? String(minLabel) : 'From'}
          value={inputFrom}
          onChange={(e) => {
            const v = e.target.value
            setInputFrom(v)
            refine([v ? Number(v) : undefined, inputTo ? Number(inputTo) : undefined])
          }}
          className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#e2ddd4] rounded-md focus:border-[#c14b3f] focus:outline-none focus:ring-2 focus:ring-[#c14b3f]/10"
        />
        <span className="text-[#c4bbb0] text-xs">–</span>
        <input
          type="text" inputMode="numeric"
          placeholder={maxLabel ? String(maxLabel) : 'To'}
          value={inputTo}
          onChange={(e) => {
            const v = e.target.value
            setInputTo(v)
            refine([inputFrom ? Number(inputFrom) : undefined, v ? Number(v) : undefined])
          }}
          className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#e2ddd4] rounded-md focus:border-[#c14b3f] focus:outline-none focus:ring-2 focus:ring-[#c14b3f]/10"
        />
      </div>
      {displayBounds && (
        <div className="flex justify-between mt-1.5 text-[10px] text-[#a0988c]">
          <span>{displayBounds.min}</span>
          <span>{displayBounds.max}</span>
        </div>
      )}
    </div>
  )
}

/* ─── Clear Filters ─── */

function ClearButton() {
  const { canRefine, refine } = useClearRefinements()
  if (!canRefine) return null
  return (
    <button onClick={refine} className="text-xs text-[#8a7e72] hover:text-[#c14b3f] transition-colors">
      Clear all
    </button>
  )
}

/* ─── Search Page ─── */

export default function SearchPage() {
  return (
    <div className="min-h-screen bg-[#f8f6f2]">
      {/* Header */}
      <header className="bg-white border-b border-[#e8e2d9] sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/search" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-[#1a1a2e] rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xs" style={{ fontFamily: 'Georgia, serif' }}>O</span>
            </div>
            <span className="text-lg font-semibold text-[#1a1a2e]" style={{ fontFamily: 'Georgia, serif', letterSpacing: '-0.02em' }}>
              Oxide Search
            </span>
          </Link>
          <a href="https://dblp.org" target="_blank" rel="noopener noreferrer"
            className="text-xs text-[#a0988c] hover:text-[#6b5d52] transition-colors">
            data via DBLP
          </a>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        <InstantSearch indexName="dblp" searchClient={searchClient}>
          {/* Search bar */}
          <div className="mb-5">
            <SearchBox
              placeholder="Search papers by title, author, venue…"
              classNames={{
                root: 'w-full max-w-xl',
                form: 'relative',
                input: 'w-full px-4 py-3 pl-10 text-sm bg-white border-2 border-[#e2ddd4] rounded-xl focus:border-[#c14b3f] focus:outline-none transition-colors shadow-sm',
                submit: 'absolute left-3.5 top-1/2 -translate-y-1/2 text-[#a0988c]',
                reset: 'absolute right-3.5 top-1/2 -translate-y-1/2 text-[#a0988c]',
              }}
              submitIconComponent={() => <SearchIcon />}
            />
          </div>

          {/* Active filters */}
          <div className="mb-4">
            <CurrentRefinementsWithClear />
          </div>

          <div className="flex flex-col lg:flex-row gap-6">
            {/* Results column */}
            <div className="flex-1 min-w-0">
              <div className="mb-4 flex items-center justify-between">
                <Stats />
              </div>
              <Hits />
            </div>

            {/* Sidebar filters */}
            <aside className="w-full lg:w-56 flex-shrink-0">
              <div className="lg:sticky lg:top-20 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-[#8a7e72] uppercase tracking-wider">Filters</h3>
                  <ClearButton />
                </div>

                {/* Venue */}
                <section>
                  <h4 className="text-sm font-medium text-[#4a3f35] mb-2.5">Venue</h4>
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
                        checkbox: 'w-3.5 h-3.5 rounded border-[#d4cbc0]',
                        label: 'flex items-center gap-1.5 cursor-pointer text-[#6b5d52] hover:text-[#1a1a2e] text-xs',
                        count: 'ml-auto text-[10px] text-[#a0988c] bg-[#f0ebe4] px-1.5 py-0.5 rounded',
                        searchBox: 'mb-2',
                        showMore: 'mt-2 text-xs text-[#8a7e72] hover:text-[#c14b3f] transition-colors',
                      }}
                    />
                  </div>
                </section>

                {/* Year */}
                <section>
                  <h4 className="text-sm font-medium text-[#4a3f35] mb-2.5">Year</h4>
                  <YearRange />
                </section>
              </div>
            </aside>
          </div>
        </InstantSearch>
      </main>

      {/* Animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-in {
          animation: fadeIn 0.3s ease forwards;
          opacity: 0;
        }
      `}</style>
    </div>
  )
}

/* ─── Current Refinements + Clear ─── */

function CurrentRefinementsWithClear() {
  const { canRefine, refine } = useClearRefinements()
  return (
    <div className="flex items-center gap-2">
      <CurrentRefinements
        classNames={{
          list: 'flex flex-wrap gap-1.5',
          item: 'inline-flex items-center gap-1 px-2.5 py-1 text-xs bg-[#f0ebe4] text-[#6b5d52] rounded-full',
          delete: 'ml-0.5 hover:text-[#c14b3f] font-bold leading-none',
          categoryLabel: 'font-medium',
        }}
      />
      {canRefine && (
        <button onClick={refine}
          className="text-xs text-[#a0988c] hover:text-[#c14b3f] transition-colors flex-shrink-0">
          Clear all
        </button>
      )}
    </div>
  )
}
