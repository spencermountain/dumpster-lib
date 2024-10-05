
/* eslint-disable no-console */
import downloadFile from './01-download.js'
import decompress from './02-decompress.js'
import parseFile from './03-parse.js'
import { yellow } from '../_fns.js'

const getPageViews = async function (opts) {
  console.log(yellow(`\n   Preparing Wikimedia Pageviews dataset (~500mb):`))
  let file = await downloadFile(opts.dir)

  let out = await decompress(file)

  parseFile(out, opts.lang, opts.project)

}
export default getPageViews
