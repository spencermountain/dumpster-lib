import Pool from './pool/Pool.js'
import defaults from './lib/defaults.js'
import path from 'node:path'

const isPath = /^[\.\/]/
const dir = process.cwd()

// ok guess we're gonna do this...
const run = function (opts) {
  // make libPath relative to current working dir
  if (opts && opts.libPath && isPath.test(opts.libPath)) {
    opts.libPath = path.join(dir, opts.libPath)
  }
  opts = Object.assign({}, defaults, opts)
  let pool = new Pool(opts)
  pool.start()
  return new Promise((resolve, reject) => {
    pool.on('end', () => {
      resolve()
    })
    pool.on('error', (err) => {
      reject(err)
    })
  })
}
export default run
