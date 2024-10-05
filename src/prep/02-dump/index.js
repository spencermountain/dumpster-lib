/* eslint-disable no-console */
import fs from 'node:fs'
import path from 'node:path'
import downloadDump from './01-download.js'
import decompressDump from './02-decompress.js'
import { cyan, dim, b } from '../_fns.js'

const getDump = async function (lang, project, dir) {
  console.log(cyan(`\n  === Setting up `) + cyan(b(`${lang.toUpperCase()} ${project}`)) + cyan(` dump ===`))

  // Filenames are 'enwiki', 'frwiktionary' etc,
  let proj = project === 'wikipedia' ? `${lang}wiki` : `${lang}${project}`
  let file = path.join(dir, `./${proj}-latest-pages-articles.xml`)
  if (fs.existsSync(file)) {
    console.log(dim(`   dump file exists, skipping step.\n`))
    return
  }
  await downloadDump(file, dir, proj)
  await decompressDump(file + '.bz2')
}
export default getDump
