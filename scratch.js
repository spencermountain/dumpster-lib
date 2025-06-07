import run from './src/run/index.js'

run({
  project: 'wikipedia',
  lang: 'simple',
  pageviews: false,
  format: 'text',
  output: function (res) {
    console.log(res)
  },
  file: '/Users/spencer/Desktop/wikipedia/simplewiki-latest-pages-articles.xml'
})