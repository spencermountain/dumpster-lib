
/* eslint-disable no-console */
import { elapsed } from '../_fns.js'
import decompress from '@xhmikosr/decompress';
import path from 'node:path'
import fs from 'node:fs'
import decompressTarbz from '@xhmikosr/decompress-tarbz2'

const getPageViews = async function (file) {

  let expected = file.replace(/\.bz2$/, '')
  if (fs.existsSync(expected)) {
    console.log('   Pageviews file exists, skipping decompress.')
    return file
  }

  let dir = path.parse(file).dir
  console.log('decompressing file: (~3mins)', 'to ' + dir)
  let start = Date.now()


  let opts = { plugins: [decompressTarbz()] }
  let out = await decompress(file, dir, opts).then(files => {
    console.log(files)
    console.log('done!');
  });
  console.log(out)
  elapsed(start)
  console.log('Pageviews decomression done');
}
export default getPageViews


getPageViews('/Users/spencer/mountain/dumpster-lib/pageviews-20240805-user.bz2')