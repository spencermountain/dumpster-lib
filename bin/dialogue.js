import { toParams, yellow, b, dim } from './_lib.js'

const intro = function (name = 'dumpster') {
  let msg = `

Welcome to ${name}
a utility to download and parse a wikimedia dump.

`

  console.log(msg)
}

const outro = function (name = 'dumpster', opts = {}) {
  let lang = opts.lang || ''
  let heading = `Preparing to parse ${b(lang.toUpperCase())} ${b(yellow(opts.project || 'wiki'))}`
  let msg = `\n\n${yellow(heading)}\n
   ${dim('To re - run this script, you can run:')}
  ${toParams(name, opts)}

  `

  console.log(msg)
}

export { intro, outro }
