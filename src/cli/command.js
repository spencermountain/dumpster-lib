import { Command } from 'commander'
import { baseParams, applyParams, passedParams } from './params.js'

// Commander owns flags and help; the same parameter schema drives the Ink form.
export function parseCommand(config, argv = process.argv) {
  const params = [...baseParams, ...(config.params || [])]
  const program = new Command()
    .name(config.name || 'dumpster')
    .description(config.description || 'parse a wikimedia dump')
    .version(config.version || '0.0.0', '-v, --version')
    .argument('[file]', 'path to the .xml dump (same as --file)')
    .option('-i, --interactive', 'configure the run with a guided setup')
  applyParams(program, params)
  program.parse(argv)
  const chosen = passedParams(program, params)
  if (program.args[0]) chosen.file = program.args[0]
  return { program, params, chosen, guided: program.opts().interactive || argv.length === 2 }
}
