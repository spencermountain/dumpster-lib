import { test } from 'node:test'
import assert from 'node:assert'
import { Command } from 'commander'
import { baseParams, applyParams, passedParams } from '../src/cli/params.js'

const filterParams = baseParams.filter((param) => param.name.startsWith('skip_'))
const namespaceParams = baseParams.filter((param) => param.name === 'namespace')
const silentParams = baseParams.filter((param) => param.name === 'silent')

const parseWith = function (params, args) {
  const program = new Command()
  program.exitOverride()
  applyParams(program, params)
  program.parse(args, { from: 'user' })
  return passedParams(program, params)
}

const parse = (args) => parseWith(filterParams, args)

test('CLI skip flags map to the snake-case library options', () => {
  const opts = parse(['--no-skip-redirect', '--skip-disambig', '--skip-nsfw', '--skip-stub'])
  assert.deepEqual(opts, {
    skip_redirect: false,
    skip_disambig: true,
    skip_nsfw: true,
    skip_stub: true
  })
})

test('CLI parses namespace numbers, booleans, and maps', () => {
  assert.deepEqual(parseWith(namespaceParams, ['--namespace', '14']), { namespace: 14 })
  assert.deepEqual(parseWith(namespaceParams, ['--namespace', 'all']), { namespace: true })
  assert.deepEqual(parseWith(namespaceParams, ['--namespace', 'none']), { namespace: false })
  assert.deepEqual(parseWith(namespaceParams, ['--namespace', '{"0":true,"14":false}']), {
    namespace: { 0: true, 14: false }
  })
})

test('CLI maps --silent to the library option', () => {
  assert.deepEqual(parseWith(silentParams, ['--silent']), { silent: true })
})
