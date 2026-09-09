import { Command } from 'commander'
import { intro, outro, text, select, confirm, isCancel, cancel, log } from '@clack/prompts'
import dumpster from '../index.js'
import defaults from '../lib/defaults.js'
import { checkOptions } from '../pool/_prep.js'
import { baseParams, applyParams, passedParams } from './params.js'

// ask for one param with the clack prompt that fits its type
const promptParam = async function (p, initial) {
  let res
  if (p.type === 'select') {
    const options = p.choices.map((c) => (typeof c === 'string' ? { value: c, label: c } : c))
    res = await select({ message: p.desc, options, initialValue: initial })
  } else if (p.type === 'boolean') {
    res = await confirm({ message: p.desc, initialValue: Boolean(initial) })
  } else if (p.type === 'number') {
    const r = await text({
      message: p.desc,
      initialValue: initial != null ? String(initial) : '',
      validate: (v) => (v && Number.isNaN(Number(v)) ? 'must be a number' : undefined),
    })
    if (isCancel(r)) {
      res = r
    } else if (r === '') {
      res = initial
    } else {
      res = Number(r)
    }

  } else {
    res = await text({
      message: p.desc,
      initialValue: initial != null ? String(initial) : '',
      validate: p.validate,
    })
  }
  if (isCancel(res)) {
    cancel('cancelled')
    process.exit(130)
  }
  return res
}

// walk a set of params, prompting each with its current value pre-filled
const promptParams = async function (params, current, config) {
  const out = { ...current }
  for (const p of params) {
    const initial = current[p.name] ?? config.defaults?.[p.name] ?? defaults[p.name]
    out[p.name] = await promptParam(p, initial)
  }
  return out
}

// the shared CLI runner. every dumpster tool (the lib itself, and each writer plugin)
// calls this - passing its name, any extra params, and the writer to attach.
//
//   run({ name, description, version, params, defaults, writer })
//
//   params  - extra commander/clack params, same shape as baseParams
//   defaults- option overrides for this tool
//   writer  - (pool, opts) => void   attach your 'batch'/'end' listeners here
const run = async function (config = {}) {
  const params = [...baseParams, ...(config.params || [])]
  const program = new Command()
  program
    .name(config.name || 'dumpster')
    .description(config.description || 'parse a wikimedia dump')
    .version(config.version || '0.0.0', '-v, --version')
    .argument('[file]', 'path to the .xml dump (same as --file)')
    .option('-i, --interactive', 'configure the run with a guided setup')
  applyParams(program, params)
  program.parse()

  const flags = program.opts()
  let chosen = passedParams(program, params)
  const posFile = program.args[0]
  if (posFile) {
    chosen.file = posFile
  }

  // bare invocation, or -i, runs the full guided setup; otherwise we only prompt
  // for required options the user left out.
  const bare = process.argv.slice(2).length === 0
  if (flags.interactive || bare) {
    intro(config.name || 'dumpster')
    chosen = await promptParams(params.filter((p) => p.guided), chosen, config)
    outro('starting the run')
  } else {
    const missing = params.filter((p) => p.required && chosen[p.name] == null)
    if (missing.length > 0) {
      if (!process.stdin.isTTY) {
        program.error(`missing required option(s): ${missing.map((m) => '--' + m.name).join(', ')}`)
      }
      intro(config.name || 'dumpster')
      chosen = await promptParams(missing, chosen, config)
      outro('starting the run')
    }
  }

  const opts = Object.assign({}, config.defaults, chosen)

  // validate with the lib's own rules, so the CLI and library agree on what's valid
  try {
    checkOptions(Object.assign({}, defaults, opts))
  } catch (err) {
    if (!opts.silent) {
      log.error(err.message)
    }
    process.exit(1)
  }

  const pool = dumpster(opts)
  if (typeof config.writer === 'function') {
    config.writer(pool, opts)
  }
  try {
    await pool.done
    return
  } catch (err) {
    // the pool has already torn down; surface the reason and fail the process
    if (!opts.silent) {
      log.error(err.message || String(err))
    }
    process.exitCode = 1
  }
}

export default run
export { run }
