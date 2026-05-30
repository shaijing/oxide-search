import { Meilisearch } from 'meilisearch'
import process from 'process'

const client = new Meilisearch({
    host: process.env.MEILISEARCH_URL,
    apiKey: process.env.MEILISEARCH_KEY
})
const results = await client.index('dblp').search('matrix')

console.log(results.hits)