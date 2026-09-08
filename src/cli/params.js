import fs from 'node:fs'
import { formats } from '../pool/_prep.js'

const fileExists = (v) => (v && fs.existsSync(v) ? undefined : `no file found at '${v}'`)

// one declarative list of the pool's options, used to drive BOTH the commander flags
// and the clack prompts - so a param is described in exactly one place.
//
// each param:
//   name     - the dumpster() option key (matches the flag's camelCase)
//   flags    - commander flag spec
//   desc     - help text / prompt message
//   type     - 'path' | 'string' | 'number' | 'select' | 'boolean'
//   choices  - for 'select'
//   required - must be present; prompted for when missing
//   guided   - included in the full guided setup (bare invocation, or --interactive)
//   parse    - commander value coercion
const baseParams = [
  {
    name: 'file',
    flags: '-f, --file <path>',
    desc: 'path to the unzipped .xml dump',
    type: 'path',
    required: true,
    guided: true,
    validate: (v) => fileExists(v),
  },
  {
    name: 'format',
    flags: '--format <name>',
    desc: 'shape of each page',
    type: 'select',
    choices: formats,
    guided: true,
  },
  { name: 'lang', flags: '--lang <code>', desc: 'wiki language code (e.g. en, sw)', type: 'string', guided: true },
  { name: 'redirects', flags: '--redirects', desc: 'keep redirect pages', type: 'boolean', guided: true },
  { name: 'disambiguation', flags: '--no-disambiguation', desc: 'keep disambiguation pages', type: 'boolean', guided: true },

  // advanced - flags only, not part of the guided flow
  { name: 'project', flags: '--project <name>', desc: 'wiki project (e.g. wikipedia)', type: 'string' },
  { name: 'workers', flags: '--workers <n>', desc: 'parsing threads', type: 'number' },
  { name: 'batchPageCount', flags: '--batch-page-count <n>', desc: 'pages per batch', type: 'number' },
  { name: 'queueLimit', flags: '--queue-limit <n>', desc: 'batches held before pausing workers', type: 'number' },
  {
    name: 'namespace',
    flags: '--namespace <n>',
    desc: "namespace to keep, or 'all'",
    type: 'number',
    parse: (v) => (v === 'all' ? null : Number(v)),
  },
  { name: 'heartbeat', flags: '--heartbeat <ms>', desc: 'ms between status frames (0 to disable)', type: 'number' },
]

// register each param as a commander option
const applyParams = function (program, params) {
  for (const p of params) {
    if (p.parse) {
      program.option(p.flags, p.desc, p.parse)
    } else if (p.type === 'number') {
      program.option(p.flags, p.desc, (v) => Number(v))
    } else {
      program.option(p.flags, p.desc)
    }
  }
}

// only the options the user actually typed (not commander's defaults) - so dumpster()
// can still apply its own defaults for everything left unset
const passedParams = function (program, params) {
  const all = program.opts()
  const out = {}
  for (const p of params) {
    if (program.getOptionValueSource(p.name) === 'cli') {
      out[p.name] = all[p.name]
    }
  }
  return out
}


export { baseParams, applyParams, passedParams, fileExists }
