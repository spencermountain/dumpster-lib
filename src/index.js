import Pool from './pool/Pool.js'
import defaults from './lib/defaults.js'

const dumpster = function (opts) {
  opts = Object.assign({}, defaults, opts)
  const pool = new Pool(opts)
  // start on the next tick, so listeners attached right after this call are in place
  setImmediate(() => {
    try {
      pool.start()
    } catch (err) {
      pool.abort(err)
    }
  })
  return pool
}
export default dumpster
