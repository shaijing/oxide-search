'use client'

import { useCallback, useState } from 'react'

export function BibtexButton({ bibtex }: { bibtex: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(bibtex)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // Fallback: select-less copy
      const ta = document.createElement('textarea')
      ta.value = bibtex
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    }
  }, [bibtex])

  const handleDownload = useCallback(() => {
    const blob = new Blob([bibtex], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'paper.bib'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [bibtex])

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleCopy}
        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-[#6b5d52] bg-[#f5f0ea] hover:bg-[#ece4db] rounded-lg transition-colors"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {copied
            ? <><polyline points="20 6 9 17 4 12" /></>
            : <><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></>
          }
        </svg>
        {copied ? 'Copied!' : 'BibTeX'}
      </button>
      <button
        onClick={handleDownload}
        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-[#6b5d52] bg-[#f5f0ea] hover:bg-[#ece4db] rounded-lg transition-colors"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
        .bib
      </button>
    </div>
  )
}
