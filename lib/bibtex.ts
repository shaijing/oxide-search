export function toBibtex(paper: any): string {
  const key = paper.key
    ? paper.key.replace(/^db\//, '').replace(/\//g, '/')
    : `${(paper.authors?.[0] || 'unknown').split(' ').pop()?.toLowerCase() || 'unknown'}${paper.year || ''}`

  // Heuristic: journal-like venues → @article, else @inproceedings
  const journalIndicators = ['j.', 'journal', 'transactions', 'review', 'letters', 'computing', 'acm', 'ieee']
  const isJournal = journalIndicators.some((w) => paper.venue?.toLowerCase().includes(w))
  const type = isJournal ? 'article' : 'inproceedings'
  const venueField = isJournal ? 'journal' : 'booktitle'

  const fields: string[] = []

  // Authors
  if (paper.authors?.length) {
    const authors = paper.authors
      .map((a: string) => a.replace(/\s+\d{4}$/, '').trim()) // strip disambiguation numbers
      .join(' and ')
    fields.push(`  author    = {${authors}}`)
  }

  // Title
  if (paper.title) fields.push(`  title     = {${paper.title}}`)

  // Venue
  if (paper.venue) fields.push(`  ${venueField} = {${paper.venue}}`)

  // Year
  if (paper.year) fields.push(`  year      = {${paper.year}}`)

  // Pages
  if (paper.pages) {
    const p = paper.pages.includes('-') ? paper.pages : `${paper.pages}--${paper.pages}`
    fields.push(`  pages     = {${p}}`)
  }

  // DOI / ee
  if (paper.ee) {
    const doi = paper.ee.replace(/^https?:\/\/doi\.org\//, '')
    fields.push(`  doi       = {${doi}}`)
  }

  // URL
  if (paper.url) fields.push(`  url       = {https://dblp.org/${paper.url}}`)

  return `@${type}{${key},\n${fields.join(',\n')}\n}\n`
}
