import getDump from './02-get-dump.js'
import getPageviews from './01-get-pageviews.js'
import fs from 'node:fs'

const getReady = async function (opts) {

  opts.dir = opts.dir || process.cwd()
  opts.file = opts.file || `./${opts.lang}wiki-latest-pages-articles.xml`
  let { dir, file } = opts

  //download pageviews data?
  if (opts.pageviews) {
    await getPageviews(dir)
  }

  // download a dump, or re-use existing one
  if (fs.existsSync(file) === true) {
    console.log(`Unzipped file already exists, using '${file}'`)
    return
  }

  console.log(`Downloading ${opts.lang} ${opts.project} dump`)
  await getDump(opts.lang, opts.project, dir)
}

export default getReady
