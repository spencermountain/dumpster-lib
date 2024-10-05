import getPrompts from '../bin/index.js'
import prepare from './prep/index.js'
import run from './run/index.js'


let opts = await getPrompts()
// console.log(opts)
await prepare(opts)

// await run(opts)
