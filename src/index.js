import Pool from './pool/Pool.js'
import defaults from './lib/defaults.js'

// ok guess we're gonna do this...
const dumpster = function (opts) {
  opts = Object.assign({}, defaults, opts)
  let pool = new Pool(opts)
  pool.start()
  return pool
}
export default dumpster
