import dumpster from '../src/index.js'

const pool = dumpster({
  file: process.argv[2],
  format: 'text',
  workers: 1,
  silent: true,
})

await pool.done
