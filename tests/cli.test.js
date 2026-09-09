import { test } from 'node:test'
import assert from 'node:assert'
import { Command } from 'commander'
import { baseParams, applyParams, passedParams } from '../src/cli/params.js'

const filterParams = baseParams.filter((param) => param.name.startsWith('skip_'))

const parse = function (args) {
  const program = new Command()
  program.exitOverride()
  applyParams(program, filterParams)
  program.parse(args, { from: 'user' })
  return passedParams(program, filterParams)
}

test('CLI skip flags map to the snake-case library options', () => {
  const opts = parse(['--no-skip-redirect', '--skip-disambig', '--skip-nsfw', '--skip-stub'])
  assert.deepEqual(opts, {
    skip_redirect: false,
    skip_disambig: true,
    skip_nsfw: true,
    skip_stub: true
  })
})
