import dumpster from './src/index.js'

console.log('start')
dumpster({
  project: 'wikipedia',
  lang: 'sw',
  format: 'text',
  chunkSize: 10,
  format: 'text',
  file: '/Volumes/4TB/wikipedia/swwiki-latest-pages-articles.xml'
}).on('end', () => {
  console.log('end')
})

// console.log('end')