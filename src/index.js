#!/usr/bin/env node
import getPrompts from '../bin/index.js'
import prepare from './prep/index.js'
import run from './run/index.js'


let opts = await getPrompts()

opts.output = function (res) {
  // if (res.pageviews) {
  console.log(res.title, res.lang, res.pageviews)
  // }
}

await prepare(opts)

await run(opts)
