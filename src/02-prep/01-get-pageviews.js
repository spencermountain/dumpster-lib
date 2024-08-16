/* eslint-disable no-console */
import spacetime from 'spacetime'
import fs from 'node:fs'
import path from 'node:path'
import wget from './_wget.js'
import { elapsed } from './_fns.js'
const domain = 'https://dumps.wikimedia.org'
import decompress from '@xhmikosr/decompress';

// get pageviews dataset from wikimedia
const downloadFile = async function (dir) {
  // get yesterday's version
  let d = spacetime.yesterday()
  let y = d.year()
  let m = d.format('{year}-{month-pad}')
  let date = d.format('{year}{month-pad}{date-pad}')
  let file = path.join(dir, `./pageviews-${date}-user.bz2`)
  if (fs.existsSync(file)) {
    console.log('   Pageviews file exists, skipping download.')
    return file
  }
  const url = domain + `/other/pageview_complete/${y}/${m}/pageviews-${date}-user.bz2`
  let start = Date.now()
  await wget(url, dir)
  elapsed(start)
  return file
}

const getPageViews = async function (dir) {
  console.log(`\nDownloading Wikimedia Pageviews dataset (~500mb):`)
  let file = await downloadFile(dir)

  console.log('decompressing file:')
  let start = Date.now()
  let out = await decompress(file, './')
  console.log(out)
  elapsed(start)
  console.log('Pageviews decomression done');
}
export default getPageViews
