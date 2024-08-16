/* eslint-disable no-console */
import fs from 'node:fs'
import path from 'node:path'
import wget from './_wget.js'
import { getFileSize, elapsed } from './_fns.js'

const download = async function (file, dir) {
  if (fs.existsSync(file + '.bz2')) {
    console.log(`  Wikimedia dump file exists, skipping download.`)
    return
  }
  console.log('\n\nDownloading dump:')
  let url = `https://dumps.wikimedia.org/${proj}/latest/${proj}-latest-pages-articles.xml.bz2`
  await getFileSize(url)

  let start = Date.now()
  await wget(url, dir)
  elapsed(start)
}

const unzipDump = async function (file) {
  console.log('Decompressing file:')
  let start = Date.now()
  await decompress(file, '.')
  elapsed(start)
  console.log('Wikimedia dump decomression done');
}

const getDump = async function (lang, project, dir) {
  // Filenames are 'enwiki', 'frwiktionary' etc,
  let proj = project === 'wikipedia' ? `${lang}wiki` : `${lang}${project}`
  let file = path.join(dir, `./${proj}-latest-pages-articles.xml`)
  if (fs.existsSync(file)) {
    console.log(` Wikimedia dump file exists, skipping download.\n   '${file}'`)
    return
  }
  await download(lang, project, dir)
  await unzipDump(file + '.bz2')
}
export default getDump
