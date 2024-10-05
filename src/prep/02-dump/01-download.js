/* eslint-disable no-console */
import fs from 'node:fs'
import wget from '../_wget.js'
import { getFileSize, elapsed } from '../_fns.js'
import { dim } from '../_fns.js'

const downloadDump = async function (file, dir, proj) {
  // console.log(yellow(`\n\nDownloading ${proj} dump:`))
  if (fs.existsSync(file) || fs.existsSync(file + '.bz2')) {
    console.log(dim(`  Wikimedia dump file exists, skipping download.`))
    return
  }
  let url = `https://dumps.wikimedia.org/${proj}/latest/${proj}-latest-pages-articles.xml.bz2`
  await getFileSize(url)

  let start = Date.now()
  await wget(url, dir)
  elapsed(start)
}

export default downloadDump