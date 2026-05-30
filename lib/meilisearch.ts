import { Meilisearch } from 'meilisearch'

const client = new Meilisearch({
  host: process.env.MEILISEARCH_URL!,
  apiKey: process.env.MEILISEARCH_KEY!
})

export const dblpIndex = client.index('dblp')