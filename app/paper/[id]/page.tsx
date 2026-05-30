import { dblpIndex } from '@/lib/meilisearch'
import { notFound } from 'next/navigation'
import Link from 'next/link'

interface Props {
  params: Promise<{ id: string }>
}

export default async function PaperDetailPage({ params }: Props) {
  const { id } = await params
  let paper: any = null

  try {
    paper = await dblpIndex.getDocument(id)
  } catch {
    notFound()
  }

  if (!paper) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <Link href="/search" className="text-blue-600 hover:underline">
            ← Back to Search
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">{paper.title}</h1>

          <div className="mb-6">
            <p className="text-gray-600">{paper.authors?.join(', ')}</p>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-sm text-gray-500">Venue</p>
              <p className="font-medium">{paper.venue}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Year</p>
              <p className="font-medium">{paper.year}</p>
            </div>
          </div>

          {paper.ee && (
            <div className="mb-4">
              <a
                href={paper.ee}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                View Paper →
              </a>
            </div>
          )}

          {paper.abstract && (
            <div className="mt-6 pt-6 border-t">
              <h2 className="text-sm font-semibold text-gray-500 uppercase mb-2">Abstract</h2>
              <p className="text-gray-700 leading-relaxed">{paper.abstract}</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}