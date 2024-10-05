import getPageviews from './01-pageviews/index.js'
import getDump from './02-dump/index.js'

const getReady = async function (opts) {
  let { lang, project } = opts
  opts.dir = opts.dir || process.cwd()
  let proj = project === 'wikipedia' ? `${lang}wiki` : `${lang}${project}`
  opts.file = opts.file || `./${proj}-latest-pages-articles.xml`

  //download pageviews data?
  if (opts.pageviews) {
    await getPageviews(opts)
  }
  await getDump(opts.lang, opts.project, opts.dir)
}

export default getReady
