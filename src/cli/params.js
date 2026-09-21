import fs from 'node:fs'
import { formats } from '../pool/_prep.js'

const fileExists = (v) => (v && fs.existsSync(v) ? undefined : `no file found at '${v}'`)

const parseNamespace = function (value) {
  const normalized = value.trim().toLowerCase()
  if (normalized === 'all' || normalized === 'true') return true
  if (normalized === 'none' || normalized === 'false') return false
  if (normalized.startsWith('{')) return JSON.parse(value)
  return Number(value)
}

// one declarative list of the pool's options, used to drive BOTH the commander flags
// and the Ink prompts - so a param is described in exactly one place.
//
// each param:
//   name     - the dumpster() option key
//   flags    - commander flag spec
//   desc     - help text / prompt message
//   type     - 'path' | 'string' | 'number' | 'select' | 'boolean'
//   cliName  - commander's camelCase option key, when it differs from name
//   negativeFlags / negativeDesc - optional explicit false form for a boolean
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
  {
    name: 'skip_redirect',
    cliName: 'skipRedirect',
    flags: '--skip-redirect',
    negativeFlags: '--no-skip-redirect',
    desc: 'skip redirect pages',
    negativeDesc: 'include redirect pages',
    type: 'boolean',
    guided: true,
  },
  {
    name: 'skip_disambig',
    cliName: 'skipDisambig',
    flags: '--skip-disambig',
    negativeFlags: '--no-skip-disambig',
    desc: 'skip disambiguation pages',
    negativeDesc: 'include disambiguation pages',
    type: 'boolean',
    guided: true,
  },
  {
    name: 'skip_nsfw',
    cliName: 'skipNsfw',
    flags: '--skip-nsfw',
    negativeFlags: '--no-skip-nsfw',
    desc: 'skip NSFW pages',
    negativeDesc: 'include NSFW pages',
    type: 'boolean',
    guided: true,
  },
  {
    name: 'skip_stub',
    cliName: 'skipStub',
    flags: '--skip-stub',
    negativeFlags: '--no-skip-stub',
    desc: 'skip stub pages',
    negativeDesc: 'include stub pages',
    type: 'boolean',
    guided: true,
  },

  // advanced - flags only, not part of the guided flow
  { name: 'project', flags: '--project <name>', desc: 'wiki project (e.g. wikipedia)', type: 'string' },
  { name: 'workers', flags: '--workers <n>', desc: 'parsing threads', type: 'number' },
  { name: 'batchPageCount', flags: '--batch-page-count <n>', desc: 'pages per batch', type: 'number' },
  { name: 'queueLimit', flags: '--queue-limit <n>', desc: 'batches held before pausing workers', type: 'number' },
  {
    name: 'namespace',
    flags: '--namespace <rule>',
    desc: "namespace ID, 'all', 'none', or a JSON boolean map",
    type: 'string',
    parse: parseNamespace,
  },
  { name: 'heartbeat', flags: '--heartbeat <ms>', desc: 'ms between status frames (0 to disable)', type: 'number' },
  { name: 'silent', flags: '--silent', desc: 'suppress all library status output', type: 'boolean' },
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
    if (p.negativeFlags) {
      program.option(p.negativeFlags, p.negativeDesc)
    }
  }
}

// only the options the user actually typed (not commander's defaults) - so dumpster()
// can still apply its own defaults for everything left unset
const passedParams = function (program, params) {
  const all = program.opts()
  const out = {}
  for (const p of params) {
    const cliName = p.cliName || p.name
    if (program.getOptionValueSource(cliName) === 'cli') {
      out[p.name] = all[cliName]
    }
  }
  return out
}


export { baseParams, applyParams, passedParams, fileExists }
