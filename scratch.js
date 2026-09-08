import dumpster from './src/index.js'

console.log('start')
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
const stats = await pool.done
console.log('end', stats)
