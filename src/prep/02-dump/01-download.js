/* eslint-disable no-console */
import fs from 'node:fs'
import wget from '../_wget.js'
import { getFileSize, elapsed } from '../_fns.js'

const downloadDump = async function (file, dir, proj) {
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

export default downloadDump