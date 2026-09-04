import fs from 'node:fs'

const formats = ['text', 'sm', 'md', 'lg', 'xl', 'html', 'markdown', 'json']

// throw early on bad options. the pool turns this into an 'error' event and a rejected `done`
const checkOptions = function (opts) {
  const { file, format } = opts
  if (!file || !fs.existsSync(file)) {
    throw new Error(`can't find file '${file}' - please supply the path to a wikipedia dump, in xml format`)
  }
  if (/\.bz2$/.test(file)) {
    throw new Error(`please unzip this file first:  $ bzip2 -d ${file}`)
  }
  if (!formats.includes(format)) {
    throw new Error(`unknown format '${format}' - expected one of: ${formats.join(', ')}`)
  }
}
export { checkOptions, formats }
