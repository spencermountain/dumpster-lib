import getPageviews from './01-pageviews/index.js'
import getDump from './02-dump/index.js'

const getReady = async function (opts) {
  opts.dir = opts.dir || process.cwd()
  opts.file = opts.file || `./${opts.lang}wiki-latest-pages-articles.xml`

  //download pageviews data?
  if (opts.pageviews) {
    await getPageviews(opts)
  }
  await getDump(opts.lang, opts.project, opts.dir)
}

export default getReady
