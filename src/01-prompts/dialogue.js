import { toParams } from './_lib.js'

const intro = function (name = 'dumpster') {
  let msg = `

Welcome to ${name}
a utility to download and parse a wikimedia dump.

`

  console.log(msg)
}

const outro = function (name = 'dumpster', opts = {}) {
  let msg = `

Preparing to parse ${opts.project || 'wiki'} dump.

To re-run this script, you can run:
  ${toParams(name, opts)}

`

  console.log(msg)
}

export { intro, outro }
