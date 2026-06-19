import run from './src/index.js'

let foo = run({
  project: 'wikipedia',
  lang: 'sw',
  format: 'text',
  chunks: 10,
  output: function (res) {
    console.log('--', res)
  },
  file: '/Volumes/4TB/wikipedia/swwiki-latest-pages-articles.xml'
})

console.log(foo)