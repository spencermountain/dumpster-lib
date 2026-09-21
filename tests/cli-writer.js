import run from '../src/cli/index.js'

await run({
  name: 'test-writer',
  params: [
    { name: 'out', flags: '--out <dir>', desc: 'output directory', type: 'path', required: true },
    { name: 'fail', flags: '--fail', desc: 'fail while attaching writer', type: 'boolean' }
  ],
  defaults: { format: 'text', workers: 1, silent: true },
  writer(pool, opts) {
    if (opts.fail) throw new Error('writer setup failed')
    let written = 0
    pool.on('batch', async (pages) => { written += pages.length })
    pool.on('end', async () => {
      process.stdout.write(JSON.stringify({ out: opts.out, written }) + '\n')
    })
  }
})
