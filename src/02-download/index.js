import dlWiki from './dump-dl.js'
import dlPageviews from './pageviews-dl.js'
import fs from 'node:fs'
import path from 'node:path'

const getReady = async function (opts) {

  let dir = opts.dir || process.cwd()

  //download pageviews data?
  if (opts.pageviews) {
    console.log(`Downloading wikipedia pageviews dataset`)
    dlPageviews(dir)
  }

  // download a dump, or re-use existing one
  let file = path.join(dir, `./${opts.lang}wiki-latest-pages-articles.xml`)
  if (fs.existsSync(file) === false) {
    console.log(`Downloading ${opts.lang} wikipedia dump`)
    await dlWiki(opts.lang, dir)
  }
}

export default getReady
