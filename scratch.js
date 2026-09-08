import dumpster from './src/index.js'
import { grey, dim } from './src/lib/colors.js'
import logUpdate from 'log-update'

console.log(dim('warming up..'))
const pool = dumpster({
  project: 'wikipedia',
  lang: 'sw',
  batchPageCount: 100,
  format: 'text',
  file: '/Volumes/4TB/wikipedia/swwiki-latest-pages-articles.xml',
})
pool.on('batch', (pages) => {
  // your writer goes here
})
await pool.done

// console.log(stats)
