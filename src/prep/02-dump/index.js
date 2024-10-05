/* eslint-disable no-console */
import fs from 'node:fs'
import path from 'node:path'
import downloadDump from './01-download.js'
import decompressDump from './02-decompress.js'

const getDump = async function (lang, project, dir) {
  // Filenames are 'enwiki', 'frwiktionary' etc,
  let proj = project === 'wikipedia' ? `${lang}wiki` : `${lang}${project}`
  let file = path.join(dir, `./${proj}-latest-pages-articles.xml`)
  if (fs.existsSync(file)) {
    console.log(` Wikimedia dump file exists, skipping download.\n   '${file}'`)
    return
  }
  await downloadDump(file, dir, proj)
  await decompressDump(file + '.bz2')
}
export default getDump
