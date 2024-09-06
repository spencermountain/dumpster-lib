
/* eslint-disable no-console */
import { elapsed } from '../_fns.js'
import decompress from '@xhmikosr/decompress';

const getPageViews = async function (file) {
  console.log('decompressing file:')
  let start = Date.now()
  let out = await decompress(file, './')
  console.log(out)
  elapsed(start)
  console.log('Pageviews decomression done');
}
export default getPageViews
