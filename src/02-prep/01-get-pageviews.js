/* eslint-disable no-console */
import spacetime from 'spacetime'
import wget from './_wget.js'
import { elapsed } from './_fns.js'
const domain = 'https://dumps.wikimedia.org'
import decompress from '@xhmikosr/decompress';

const getPageViews = async function (dir) {
  // get yesterday's version
  let d = spacetime.yesterday()
  let y = d.year()
  let m = d.format('{year}-{month-pad}')
  let date = d.format('{year}{month-pad}{date-pad}')
  const url = domain + `/other/pageview_complete/${y}/${m}/pageviews-${date}-user.bz2`
  let start = Date.now()
  await wget(url, dir)
  elapsed(start)

  console.log('decompressing file:')
  decompress(file, 'dist').then(() => {
    console.log('done!');
  });
}
export default getPageViews
