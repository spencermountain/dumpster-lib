import Pool from './pool/Pool.js'
import defaults from './lib/defaults.js'

// ok guess we're gonna do this...
const dumpster = function (opts) {
  opts = Object.assign({}, defaults, opts)
  let pool = new Pool(opts)
  pool.start()
  // return new Promise((resolve, reject) => {
  pool.on('end', () => {
    resolve()
  })
  pool.on('error', (err) => {
    reject(err)
  })
  // pool.on('chunk', (chunk) => {
  //   console.log('chunks', chunk.length)
  //   onChunk(chunk)
  // })
  // })
  return pool
}
export default dumpster
