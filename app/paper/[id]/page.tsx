import { dblpIndex } from '@/lib/meilisearch'
import { toBibtex } from '@/lib/bibtex'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { BibtexButton } from './bibtex-button'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  try {
    const paper = await dblpIndex.getDocument(id)
    return { title: paper?.title ?? 'Paper Not Found' }
  } catch {
    return { title: 'Paper Not Found' }
  }
}

const ExternalIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    <polyline points="15 3 21 3 21 9" />
    <line x1="10" y1="14" x2="21" y2="3" />
  </svg>
)

export default async function PaperDetailPage({ params }: Props) {
  const { id } = await params
  let paper: any

  try { paper = await dblpIndex.getDocument(id) } catch { notFound() }
  if (!paper) notFound()

  return (
    <div className="min-h-screen bg-[#f8f6f2]">
      {/* Header */}
      <header className="bg-white border-b border-[#e8e2d9] sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 h-12 flex items-center gap-2 text-sm">
          <Link href="/search" className="text-[#8a7e72] hover:text-[#1a1a2e] transition-colors flex items-center gap-1">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
            </svg>
            Search
          </Link>
          <span className="text-[#d4cbc0]">/</span>
          <span className="text-[#4a3f35] truncate min-w-0">{paper.title}</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        <article className="bg-white rounded-xl border border-[#e8e2d9] shadow-sm overflow-hidden">
          {/* Title */}
          <div className="px-6 pt-6 pb-5 border-b border-[#f0ebe4]">
            <h1 className="text-xl font-bold text-[#1a1a2e] leading-snug mb-3">{paper.title}</h1>
            <p className="text-sm text-[#6b5d52] leading-relaxed">{paper.authors?.join(', ')}</p>
          </div>

          {/* Metadata */}
          <div className="px-6 py-4 border-b border-[#f0ebe4]">
            <dl className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-3 text-sm">
              <div>
                <dt className="text-[10px] uppercase tracking-wider text-[#a0988c] mb-0.5">Venue</dt>
                <dd className="font-medium text-[#4a3f35]">{paper.venue}</dd>
              </div>
              <div>
                <dt className="text-[10px] uppercase tracking-wider text-[#a0988c] mb-0.5">Year</dt>
                <dd className="font-medium text-[#4a3f35]">{paper.year}</dd>
              </div>
              {paper.pages && (
                <div>
                  <dt className="text-[10px] uppercase tracking-wider text-[#a0988c] mb-0.5">Pages</dt>
                  <dd className="font-medium text-[#4a3f35]">{paper.pages}</dd>
                </div>
              )}
              {paper.key && (
                <div className="col-span-2 sm:col-span-3">
                  <dt className="text-[10px] uppercase tracking-wider text-[#a0988c] mb-0.5">DBLP Key</dt>
                  <dd className="text-xs font-mono text-[#6b5d52] break-all">{paper.key}</dd>
                </div>
              )}
            </dl>
          </div>

          {/* Authors */}
          {paper.authors && paper.authors.length > 0 && (
            <div className="px-6 py-4 border-b border-[#f0ebe4]">
              <h2 className="text-xs font-semibold text-[#8a7e72] uppercase tracking-wider mb-3">Authors</h2>
              <div className="flex flex-wrap gap-1.5">
                {paper.authors.map((author: string, i: number) => (
                  <span key={i} className="px-3 py-1 text-xs text-[#4a3f35] bg-[#f5f0ea] rounded-md">
                    {author}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Links */}
          {(paper.ee || paper.url) && (
            <div className="px-6 py-4 border-b border-[#f0ebe4]">
              <h2 className="text-xs font-semibold text-[#8a7e72] uppercase tracking-wider mb-3">Links</h2>
              <div className="flex flex-wrap gap-2">
                {paper.ee && (
                  <a href={paper.ee} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-[#c14b3f] bg-[#fdf4f2] hover:bg-[#fae8e4] rounded-lg transition-colors">
                    <ExternalIcon /> Publisher DOI
                  </a>
                )}
                {paper.url && (
                  <a href={`https://dblp.org/${paper.url}`} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-[#6b5d52] bg-[#f5f0ea] hover:bg-[#ece4db] rounded-lg transition-colors">
                    <ExternalIcon /> DBLP
                  </a>
                )}
              </div>
            </div>
          )}

          {/* BibTeX */}
          <div className="px-6 py-4 border-b border-[#f0ebe4]">
            <h2 className="text-xs font-semibold text-[#8a7e72] uppercase tracking-wider mb-3">Cite this paper</h2>
            <BibtexButton bibtex={toBibtex(paper)} />
          </div>

          {/* Abstract */}
          {paper.abstract && (
            <div className="px-6 py-4">
              <h2 className="text-xs font-semibold text-[#8a7e72] uppercase tracking-wider mb-3">Abstract</h2>
              <p className="text-sm text-[#4a3f35] leading-relaxed">{paper.abstract}</p>
            </div>
          )}
        </article>

        {/* Back link */}
        <div className="mt-6 text-center">
          <Link href="/search" className="text-xs text-[#8a7e72] hover:text-[#c14b3f] transition-colors">
            ← Back to search results
          </Link>
        </div>
      </main>
    </div>
  )
}
