import fs from 'node:fs'

const formats = ['text', 'sm', 'md', 'lg', 'xl', 'html', 'markdown', 'json']
const renamedFilters = {
  redirects: 'skip_redirect',
  disambiguation: 'skip_disambig',
  nsfw: 'skip_nsfw'
}

const validSkipNsfwOption = function (option) {
  if (typeof option === 'boolean') {
    return true
  }
  if (option === null || typeof option !== 'object' || Array.isArray(option)) {
    return false
  }
  const proto = Object.getPrototypeOf(option)
  return (
    (proto === Object.prototype || proto === null) &&
    Object.values(option).every((value) => typeof value === 'boolean')
  )
}

// throw early on bad options. the pool turns this into an 'error' event and a rejected `done`
const checkOptions = function (opts) {
  const { file, format, skip_redirect, skip_disambig, skip_nsfw } = opts
  const renamed = Object.keys(renamedFilters).find((name) => Object.hasOwn(opts, name))
  if (renamed) {
    throw new Error(`'${renamed}' has been renamed to '${renamedFilters[renamed]}' with inverted boolean semantics`)
  }
  if (!file || !fs.existsSync(file)) {
    throw new Error(`can't find file '${file}' - please supply the path to a wikipedia dump, in xml format`)
  }
  if (/\.bz2$/.test(file)) {
    throw new Error(`please unzip this file first:  $ bzip2 -d ${file}`)
  }
  if (!formats.includes(format)) {
    throw new Error(`unknown format '${format}' - expected one of: ${formats.join(', ')}`)
  }
  if (typeof skip_redirect !== 'boolean') {
    throw new Error(`'skip_redirect' must be true or false`)
  }
  if (typeof skip_disambig !== 'boolean') {
    throw new Error(`'skip_disambig' must be true or false`)
  }
  if (!validSkipNsfwOption(skip_nsfw)) {
    throw new Error(`'skip_nsfw' must be true, false, or an object mapping reasons to booleans`)
  }
}
export { checkOptions, formats }
