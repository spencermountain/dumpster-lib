import { promptParams, PromptCancelled } from './prompts.js'
import { parseCommand } from './command.js'
import dumpster from '../index.js'
import defaults from '../lib/defaults.js'
import { checkOptions } from '../pool/_prep.js'

// the shared CLI runner. every dumpster tool (the lib itself, and each writer plugin)
// calls this - passing its name, any extra params, and the writer to attach.
//
//   run({ name, description, version, params, defaults, writer })
//
//   params  - extra commander/Ink params, same shape as baseParams
//   defaults- option overrides for this tool
//   writer  - (pool, opts) => void   attach your 'batch'/'end' listeners here
const run = async function (config = {}) {
  const { program, params, chosen: passed, guided } = parseCommand(config)
  let chosen = passed
  const prompts = guided
    ? params.filter((p) => p.guided)
    : params.filter((p) => p.required && chosen[p.name] == null)

  if (prompts.length > 0) {
    if (!process.stdin.isTTY || !process.stdout.isTTY) {
      program.error(guided
        ? 'guided setup requires a terminal; pass --file and other required options instead'
        : `missing required option(s): ${prompts.map((p) => '--' + p.name).join(', ')}`)
    }
    try {
      chosen = await promptParams(prompts, chosen, config)
    } catch (err) {
      if (!(err instanceof PromptCancelled)) throw err
      process.exitCode = 130
      return
    }
  }

  const opts = Object.assign({}, config.defaults, chosen)

  // validate with the lib's own rules, so the CLI and library agree on what's valid
  try {
    checkOptions(Object.assign({}, defaults, opts))
  } catch (err) {
    if (!opts.silent) {
      process.stderr.write(err.message + '\n')
    }
    process.exitCode = 1
    return
  }

  const pool = dumpster(opts)
  const interrupt = () => {
    process.exitCode = 130
    void pool.abort(new PromptCancelled())
  }
  process.once('SIGINT', interrupt)
  try {
    if (typeof config.writer === 'function') config.writer(pool, opts)
    await pool.done
    return
  } catch (err) {
    // the pool has already torn down; surface the reason and fail the process
    if (!opts.silent) {
      process.stderr.write((err.message || String(err)) + '\n')
    }
    await pool.abort(err)
    process.exitCode = err instanceof PromptCancelled ? 130 : 1
  } finally {
    process.removeListener('SIGINT', interrupt)
  }
}

export default run
export { run }
