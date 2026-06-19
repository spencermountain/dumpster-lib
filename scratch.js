import run from './src/index.js'

console.log('start')
await run({
  project: 'wikipedia',
  lang: 'sw',
  format: 'text',
  chunkSize: 10,
  format: 'text',
  file: '/Volumes/4TB/wikipedia/swwiki-latest-pages-articles.xml'
})

console.log('end')