#!/usr/bin/env node
import getPrompts from '../bin/index.js'
import prepare from './prep/index.js'
import run from './run/index.js'


let opts = await getPrompts()
opts.output = opts.output || function (res) {
  console.log(res)
}
console.log(opts)

// download+unzip files
await prepare(opts)

// begin parsing
await run(opts)
