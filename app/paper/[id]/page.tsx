import { dblpIndex } from '@/lib/meilisearch'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  try {
    const paper = await dblpIndex.getDocument(id)
    return {
      title: paper?.title ?? 'Paper Not Found',
    }
  } catch {
    return { title: 'Paper Not Found' }
  }
}

export default async function PaperDetailPage({ params }: Props) {
  const { id } = await params
  let paper: any

  try {
    paper = await dblpIndex.getDocument(id)
  } catch {
    notFound()
  }
  if (!paper) notFound()

  return (
    <div className="min-h-screen bg-[#f5f6fa]">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link
            href="/search"
            className="text-sm text-gray-400 hover:text-gray-600 transition-colors flex items-center gap-1"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            Back
          </Link>
          <span className="text-sm text-gray-300">/</span>
          <Link href="/search" className="text-sm text-gray-400 hover:text-gray-600">
            Search
          </Link>
          <span className="text-sm text-gray-300">/</span>
          <span className="text-sm text-gray-600 truncate">{paper.title}</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        <article className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Title area */}
          <div className="px-6 pt-6 pb-4 border-b border-gray-50">
            <h1 className="text-xl font-bold text-gray-900 leading-snug mb-3">
              {paper.title}
            </h1>
            <p className="text-sm text-gray-500 leading-relaxed">
              {paper.authors?.join(', ')}
            </p>
          </div>

          {/* Metadata grid */}
          <div className="px-6 py-4 border-b border-gray-50">
            <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
              {paper.venue && (
                <div>
                  <dt className="text-[10px] uppercase tracking-wider text-gray-400 mb-0.5">Venue</dt>
                  <dd className="text-gray-800 font-medium">{paper.venue}</dd>
                </div>
              )}
              {paper.year && (
                <div>
                  <dt className="text-[10px] uppercase tracking-wider text-gray-400 mb-0.5">Year</dt>
                  <dd className="text-gray-800 font-medium">{paper.year}</dd>
                </div>
              )}
              {paper.pages && (
                <div>
                  <dt className="text-[10px] uppercase tracking-wider text-gray-400 mb-0.5">Pages</dt>
                  <dd className="text-gray-800 font-medium">{paper.pages}</dd>
                </div>
              )}
              {paper.key && (
                <div>
                  <dt className="text-[10px] uppercase tracking-wider text-gray-400 mb-0.5">DBLP Key</dt>
                  <dd className="text-xs font-mono text-gray-500 truncate">{paper.key}</dd>
                </div>
              )}
            </dl>
          </div>

          {/* Links */}
          {(paper.ee || paper.url) && (
            <div className="px-6 py-4 border-b border-gray-50">
              <h2 className="text-[10px] uppercase tracking-wider text-gray-400 mb-2.5">Links</h2>
              <div className="flex flex-wrap gap-2">
                {paper.ee && (
                  <a
                    href={paper.ee}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                      <polyline points="15 3 21 3 21 9" />
                      <line x1="10" y1="14" x2="21" y2="3" />
                    </svg>
                    Publisher DOI
                  </a>
                )}
                {paper.url && (
                  <a
                    href={`https://dblp.org/${paper.url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-md transition-colors"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                      <polyline points="15 3 21 3 21 9" />
                      <line x1="10" y1="14" x2="21" y2="3" />
                    </svg>
                    DBLP
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Authors list */}
          {paper.authors && paper.authors.length > 0 && (
            <div className="px-6 py-4 border-b border-gray-50">
              <h2 className="text-[10px] uppercase tracking-wider text-gray-400 mb-2.5">Authors</h2>
              <div className="flex flex-wrap gap-1.5">
                {paper.authors.map((author: string, i: number) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 text-xs text-gray-600 bg-gray-50 rounded-md"
                  >
                    {author}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Abstract */}
          {paper.abstract && (
            <div className="px-6 py-4">
              <h2 className="text-[10px] uppercase tracking-wider text-gray-400 mb-2.5">Abstract</h2>
              <p className="text-sm text-gray-600 leading-relaxed">{paper.abstract}</p>
            </div>
          )}
        </article>
      </main>
    </div>
  )
}
