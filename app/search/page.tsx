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
import { useRef, useEffect, useState, createContext, useContext, useCallback } from 'react'
import { instantMeiliSearch } from '@meilisearch/instant-meilisearch'
import Link from 'next/link'

import { Separator } from '@/components/ui/separator'
import { toBibtex } from '@/lib/bibtex'

const { searchClient } = instantMeiliSearch(
    process.env.NEXT_PUBLIC_MEILISEARCH_URL!,
    process.env.NEXT_PUBLIC_MEILISEARCH_KEY!
)

/* ─── Selection Context ─── */

interface SelectionItem {
    id: string
    title: string
    authors: string[]
    venue: string
    year: number
    key?: string
    ee?: string
    url?: string
    pages?: string
}

const SelectionCtx = createContext<{
    selected: Map<string, SelectionItem>
    toggle: (hit: any) => void
    clear: () => void
    count: number
}>({
    selected: new Map(),
    toggle: () => { },
    clear: () => { },
    count: 0,
})

/* ─── Icons ─── */

const SearchIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
    </svg>
)

const CheckIcon = () => (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
    </svg>
)

const XIcon = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
)

/* ─── Paper Card ─── */

function PaperHit({ hit }: { hit: any }) {
    const { selected, toggle } = useContext(SelectionCtx)
    const isChecked = selected.has(hit.id)

    return (
        <div className={`px-4 py-3 transition-colors ${isChecked ? 'bg-blue-100/60' : ''}`}>
            <div className="flex gap-3">
                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2">
                        <Link href={`/paper/${hit.id}`} className="flex-1 min-w-0">
                            <h3 className="text-sm font-medium text-foreground leading-snug group-hover:text-primary transition-colors">
                                <Highlight attribute="title" hit={hit} />
                            </h3>
                        </Link>
                        {/* Checkbox */}
                        <label onClick={(e) => e.stopPropagation()} className="relative mt-0.5 flex-shrink-0">
                            <input type="checkbox" checked={isChecked} onChange={() => toggle(hit)} className="peer sr-only" />
                            <div className="w-3.5 h-3.5 rounded border-2 border-muted-foreground/30 bg-card peer-checked:bg-primary peer-checked:border-primary flex items-center justify-center transition-all cursor-pointer hover:border-primary">
                                {isChecked && <CheckIcon />}
                            </div>
                        </label>
                    </div>

                    {hit.authors && hit.authors.length > 0 && (
                        <p className="text-xs text-muted-foreground/70 mt-1 leading-relaxed">
                            {hit.authors.slice(0, 6).join(', ')}
                            {hit.authors.length > 6 && <span className="text-muted-foreground/40"> et al.</span>}
                        </p>
                    )}

                    <div className="flex flex-wrap items-center gap-2 mt-1.5">
                        <span className="text-[11px] font-medium text-primary">{hit.venue}</span>
                        <span className="text-[11px] text-muted-foreground">{hit.year}</span>
                        {hit.pages && <span className="text-[11px] text-muted-foreground/50">· pp. {hit.pages}</span>}
                        {hit.ee && (
                            <a href={hit.ee} target="_blank" rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="text-[11px] text-muted-foreground/50 hover:text-primary transition-colors">
                                DOI
                            </a>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

/* ─── Hits ─── */

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
        <div>
            {items.map((hit, i) => (
                <div key={hit.id ?? `hit-${i}`} className={`animate-in ${i % 2 === 0 ? 'bg-white' : 'bg-blue-50/30'}`}
                    style={{ animationDelay: `${i * 15}ms` }}>
                    <PaperHit hit={hit} />
                </div>
            ))}
            {items.length === 0 && (
                <div className="text-center py-16">
                    <p className="text-muted-foreground">No papers match your search.</p>
                    <p className="text-sm text-muted-foreground/70 mt-1">Try adjusting your filters or search terms.</p>
                </div>
            )}
            <div ref={sentinelRef} />
        </div>
    )
}

/* ─── Selection Panel ─── */

function SelectionPanel() {
    const { selected, toggle, clear, count } = useContext(SelectionCtx)
    const [open, setOpen] = useState(true)
    const [feedback, setFeedback] = useState<string | null>(null)

    const isEmpty = count === 0
    const items = Array.from(selected.values())

    const showFeedback = (msg: string) => {
        setFeedback(msg)
        setTimeout(() => setFeedback(null), 1200)
    }

    const downloadFile = (content: string, filename: string) => {
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url; a.download = filename
        document.body.appendChild(a); a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
    }

    const copyText = async (text: string) => {
        try { await navigator.clipboard.writeText(text) }
        catch {
            const ta = document.createElement('textarea')
            ta.value = text; document.body.appendChild(ta)
            ta.select(); document.execCommand('copy')
            document.body.removeChild(ta)
        }
    }

    const handleExportBib = useCallback(() => {
        const bib = items.map((item) => toBibtex(item)).join('\n')
        downloadFile(bib, 'selected.bib')
        showFeedback('BibTeX downloaded')
    }, [items])

    const handleCopyBib = useCallback(async () => {
        const bib = items.map((item) => toBibtex(item)).join('\n')
        await copyText(bib)
        showFeedback('BibTeX copied')
    }, [items])

    const handleCopyText = useCallback(async () => {
        const text = items.map((item) => {
            const authors = item.authors?.slice(0, 3).join(', ') ?? 'Unknown'
            const suffix = item.authors?.length > 3 ? ' et al.' : ''
            return `${authors}${suffix}. ${item.title}. ${item.venue}, ${item.year}.`
        }).join('\n\n')
        await copyText(text)
        showFeedback('Text copied')
    }, [items])

    const handleCopyTitles = useCallback(async () => {
        const titles = items.map((item) => item.title).join('\n')
        await copyText(titles)
        showFeedback('Titles copied')
    }, [items])

    const handleExportCsv = useCallback(() => {
        const header = 'title,authors,venue,year,pages,doi,url'
        const rows = items.map((item) =>
            [
                `"${(item.title ?? '').replace(/"/g, '""')}"`,
                `"${(item.authors ?? []).join('; ').replace(/"/g, '""')}"`,
                `"${item.venue ?? ''}"`,
                item.year ?? '',
                item.pages ?? '',
                item.ee ?? '',
                item.url ?? '',
            ].join(',')
        ).join('\n')
        downloadFile(header + '\n' + rows, 'selected.csv')
        showFeedback('CSV downloaded')
    }, [items])

    return (
        <div className={`border rounded-lg bg-card overflow-hidden ${isEmpty ? 'border-dashed border-border' : 'border shadow-sm'}`}>
            {/* Header */}
            <button
                onClick={() => setOpen(!open)}
                className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-foreground hover:bg-muted/50 transition-colors"
            >
                <span className="flex items-center gap-1.5">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="9 11 12 14 22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                    </svg>
                    Selected ({count})
                </span>
                {!isEmpty && (
                    <div className="flex items-center gap-2">
                        <span onClick={(e) => { e.stopPropagation(); clear() }}
                            className="text-muted-foreground hover:text-primary transition-colors cursor-pointer">Clear all</span>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                            className={`transition-transform ${open ? 'rotate-180' : ''}`}>
                            <polyline points="6 9 12 15 18 9" />
                        </svg>
                    </div>
                )}
            </button>

            {/* Empty state */}
            {isEmpty && (
                <div className="px-3 py-6 text-center">
                    <p className="text-[10px] text-muted-foreground/50">Check papers to add them here</p>
                </div>
            )}

            {/* Toolbar */}
            {!isEmpty && (
                <div className="border-t border-border bg-muted/50">
                    {/* Feedback toast */}
                    {feedback && (
                        <div className="px-3 py-1 text-[10px] text-primary font-medium text-center border-b border-border/20">
                            ✓ {feedback}
                        </div>
                    )}
                    <div className="px-2 py-1.5 flex flex-wrap gap-x-1 gap-y-0.5">
                        <button onClick={handleCopyBib}
                            className="flex items-center gap-1 px-2 py-1 text-[10px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded transition-colors">
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                            </svg>
                            BibTeX
                        </button>
                        <button onClick={handleExportBib}
                            className="flex items-center gap-1 px-2 py-1 text-[10px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded transition-colors">
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
                            </svg>
                            .bib
                        </button>
                        <button onClick={handleCopyText}
                            className="flex items-center gap-1 px-2 py-1 text-[10px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded transition-colors">
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
                            </svg>
                            Text
                        </button>
                        <button onClick={handleCopyTitles}
                            className="flex items-center gap-1 px-2 py-1 text-[10px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded transition-colors">
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
                            </svg>
                            Titles
                        </button>
                        <button onClick={handleExportCsv}
                            className="flex items-center gap-1 px-2 py-1 text-[10px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded transition-colors">
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
                            </svg>
                            CSV
                        </button>
                    </div>
                </div>
            )}

            {/* List */}
            {!isEmpty && open && (
                <div className="max-h-[calc(100vh-14rem)] overflow-y-auto overscroll-contain">
                    {items.map((item) => (
                        <div key={item.id} className="flex items-start gap-2 px-3 py-2 border-t border-border/30 hover:bg-muted/30 group">
                            <Link href={`/paper/${item.id}`} className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-foreground leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                                    {item.title}
                                </p>
                                <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                                    {item.authors?.slice(0, 2).join(', ')}{item.authors?.length > 2 ? ' et al.' : ''} · {item.venue} {item.year}
                                </p>
                            </Link>
                            <button onClick={() => toggle(item)}
                                className="flex-shrink-0 mt-0.5 text-muted-foreground/50 hover:text-primary transition-colors">
                                <XIcon />
                            </button>
                        </div>
                    ))}
                </div>
            )}
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
            headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + process.env.NEXT_PUBLIC_MEILISEARCH_KEY },
            body: JSON.stringify({ limit: 0, facets: ['year'] }),
        })
            .then((r) => r.json())
            .then((data) => { if (data.facetStats?.year) setDisplayBounds(data.facetStats.year) })
            .catch(() => { })
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
                <input type="text" inputMode="numeric" placeholder={minLabel ? String(minLabel) : 'From'}
                    value={inputFrom}
                    onChange={(e) => { const v = e.target.value; setInputFrom(v); refine([v ? Number(v) : undefined, inputTo ? Number(inputTo) : undefined]) }}
                    className="flex h-8 w-full rounded-md border border-input bg-background px-2.5 py-1 text-xs ring-offset-background placeholder:text-muted-foreground/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1" />
                <span className="text-muted-foreground/40 text-xs">–</span>
                <input type="text" inputMode="numeric" placeholder={maxLabel ? String(maxLabel) : 'To'}
                    value={inputTo}
                    onChange={(e) => { const v = e.target.value; setInputTo(v); refine([inputFrom ? Number(inputFrom) : undefined, v ? Number(v) : undefined]) }}
                    className="flex h-8 w-full rounded-md border border-input bg-background px-2.5 py-1 text-xs ring-offset-background placeholder:text-muted-foreground/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1" />
            </div>
            {displayBounds && (
                <div className="flex justify-between mt-1.5 text-[10px] text-muted-foreground/60">
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
    return <button onClick={refine} className="text-xs text-muted-foreground hover:text-primary transition-colors">Clear all</button>
}

function CurrentRefinementsWithClear() {
    const { canRefine, refine } = useClearRefinements()
    return (
        <div className="flex items-center gap-2">
            <CurrentRefinements classNames={{
                list: 'flex flex-wrap gap-1.5',
                item: 'inline-flex items-center gap-1 px-2.5 py-1 text-xs bg-secondary text-secondary-foreground rounded-full',
                delete: 'ml-0.5 hover:text-primary font-bold leading-none', categoryLabel: 'font-medium',
            }} />
            {canRefine && <button onClick={refine} className="text-xs text-muted-foreground hover:text-primary transition-colors flex-shrink-0">Clear all</button>}
        </div>
    )
}

/* ─── Page ─── */

export default function SearchPage() {
    const [selected, setSelected] = useState<Map<string, SelectionItem>>(new Map())

    const toggle = useCallback((hit: any) => {
        setSelected((prev) => {
            const next = new Map(prev)
            if (next.has(hit.id)) {
                next.delete(hit.id)
            } else {
                next.set(hit.id, {
                    id: hit.id,
                    title: hit.title,
                    authors: hit.authors ?? [],
                    venue: hit.venue,
                    year: hit.year,
                    key: hit.key,
                    ee: hit.ee,
                    url: hit.url,
                    pages: hit.pages,
                })
            }
            return next
        })
    }, [])

    const clear = useCallback(() => setSelected(new Map()), [])

    return (
        <SelectionCtx.Provider value={{ selected, toggle, clear, count: selected.size }}>
            <div className="min-h-screen bg-background">
                {/* Header */}
                <header className="bg-white border-b border-border sticky top-0 z-10">
                    <div className="max-w-7xl mx-auto h-14 flex items-center justify-between px-4">
                        <Link href="/search" className="flex items-center gap-2.5">
                            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                                <span className="text-primary-foreground font-bold text-xs" style={{ fontFamily: 'Georgia, serif' }}>O</span>
                            </div>
                            <span className="text-lg font-semibold text-foreground" style={{ fontFamily: 'Georgia, serif', letterSpacing: '-0.02em' }}>Oxide Search</span>
                        </Link>
                        <a href="https://dblp.org" target="_blank" rel="noopener noreferrer"
                            className="text-xs text-muted-foreground hover:text-primary transition-colors">data via DBLP</a>
                    </div>
                </header>

                <main className="w-full px-4 sm:px-6 lg:px-12 py-6 ">
                    <InstantSearch indexName="dblp" searchClient={searchClient}>
                        {/* Search bar */}
                        <div className="mb-5 w-1/2 mx-auto">
                            <SearchBox placeholder="Search papers by title, author, venue…"
                                classNames={{
                                    root: 'w-full', form: 'relative',
                                    input: 'w-full px-4 py-3 pl-10 text-sm bg-card border-2 border-input rounded-xl focus:border-ring focus:outline-none transition-colors shadow-sm',
                                    submit: 'absolute left-3.5 top-0 bottom-0 flex items-center text-muted-foreground',
                                    reset: 'hidden',
                                    loadingIndicator: 'absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground',
                                }}
                                submitIconComponent={() => <SearchIcon />} />
                        </div>

                        {/* Active filters */}
                        <div className="mb-4"><CurrentRefinementsWithClear /></div>

                        <div className="flex gap-6 items-start w-2/3 mx-auto">
                            {/* Left: Selection sidebar */}
                            <aside className="w-52 flex-shrink-0 self-start max-lg:hidden lg:sticky lg:top-[calc(3.5rem+1.5rem)]">
                                <SelectionPanel />
                            </aside>

                            {/* Results */}
                            <div className="flex-1 min-w-0">
                                <div className="mb-4"><Stats /></div>
                                <Hits />
                            </div>

                            {/* Right: Filters sidebar */}
                            <aside className="w-full lg:w-56 flex-shrink-0 lg:sticky lg:top-[calc(3.5rem+1.5rem)] self-start max-lg:border-t max-lg:border-border max-lg:pt-5 max-lg:mt-2">
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Filters</h3>
                                        <ClearButton />
                                    </div>

                                    <div>
                                        <h4 className="text-sm font-medium text-foreground mb-2">Venue</h4>
                                        <div className="max-h-52 overflow-y-auto pr-1 venue-scroll">
                                            <RefinementList attribute="venue" searchable searchablePlaceholder="Search venues…" showMore
                                                classNames={{
                                                    root: 'text-sm', list: 'space-y-0.5', item: 'flex items-center gap-1.5 py-0.5',
                                                    checkbox: 'w-3.5 h-3.5 rounded border-muted-foreground/40',
                                                    label: 'flex items-center gap-1.5 cursor-pointer text-muted-foreground hover:text-foreground text-xs',
                                                    count: 'ml-auto text-[10px] text-muted-foreground/60 bg-secondary px-1.5 py-0.5 rounded',
                                                    searchBox: 'mb-1.5', showMore: 'mt-1 text-xs text-primary hover:text-primary/80 transition-colors',
                                                }} />
                                        </div>
                                    </div>

                                    <Separator />

                                    <div>
                                        <h4 className="text-sm font-medium text-foreground mb-2">Year</h4>
                                        <YearRange />
                                    </div>
                                </div>
                            </aside>
                        </div>
                    </InstantSearch>
                </main>

                <style>{`
          @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
          .animate-in { animation: fadeIn 0.3s ease forwards; opacity: 0; }
        `}</style>
            </div>
        </SelectionCtx.Provider>
    )
}
