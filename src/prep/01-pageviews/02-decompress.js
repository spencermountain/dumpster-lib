
/* eslint-disable no-console */
import { elapsed } from '../_fns.js'
import sh from 'shelljs'
import path from 'node:path'
import fs from 'node:fs'
import { dim } from '../_fns.js'

const getPageViews = async function (file) {

  let expected = file.replace(/\.bz2$/, '')
  if (fs.existsSync(expected)) {
    console.log(dim('   Pageviews file exists, skipping step.'))
    return expected
  }

  let dir = path.parse(file).dir
  console.log('   Decompressing pageview file: (~3mins)', 'to ' + dir)
  let start = Date.now()

  let cmd = `bzip2 -d ${file}`
  sh.exec(cmd)

  elapsed(start)
  return expected
}
export default getPageViews


// getPageViews('/Users/spencer/mountain/dumpster-lib/pageviews-20240805-user.bz2')