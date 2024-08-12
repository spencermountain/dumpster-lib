import doPrompts from './01-prompts/index.js'
import getReady from './02-download/index.js'
import run from './03-run/index.js'


let opts = await doPrompts()

await getReady(opts)

await run(opts)
