import test from 'tape'
import { rejects } from './helpers.js'
import { createElement as h } from 'react'
import { renderToString } from 'ink'
import { PassThrough } from 'node:stream'
import { setTimeout as delay } from 'node:timers/promises'
import { execFile } from 'node:child_process'
import { promisify, stripVTControlCharacters } from 'node:util'
import { rmSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import defaults from '../src/lib/defaults.js'
import makeFixture from '../src/lib/fixture.js'
import { promptParams, PromptCancelled } from '../src/cli/prompts.js'
import { promptValue } from '../src/cli/prompt-value.js'
import { baseParams } from '../src/cli/params.js'
import { progressSnapshot } from '../src/cli/ui/progress.js'
import TerminalTheme from '../src/cli/ui/TerminalTheme.js'
import Dashboard from '../src/cli/components/Dashboard.js'
import ResultsReport from '../src/cli/components/ResultsReport.js'
import SetupSheet from '../src/cli/components/SetupSheet.js'

const exec = promisify(execFile)
const bin = fileURLToPath(new URL('../src/cli/bin.js', import.meta.url))
const fixture = makeFixture(20)
test.onFinish(() => rmSync(fixture.dir, { recursive: true, force: true }))
const env = { ...process.env, NO_COLOR: '1', NO_UNICODE: '1', FORCE_COLOR: '0' }

test('CLI flag run prints setup and results as plain ASCII, with heartbeat disabled', async (t) => {
  const { stdout, stderr } = await exec(process.execPath, [bin, fixture.file, '--format', 'text', '--workers', '1', '--heartbeat', '0'], { env })
  t.match(stdout, /Setup/)
  t.match(stdout, /Results\s+done/)
  t.match(stdout, /processed\s+20/)
  t.match(stdout, /throughput/)
  t.doesNotMatch(stdout, /\x1b|[^\x00-\x7f]/)
  t.doesNotMatch(stdout, /overall/)
  t.equal(stderr, '')
})

test('CLI silent run emits nothing and invalid options fail quietly', async (t) => {
  const { stdout, stderr } = await exec(process.execPath, [bin, fixture.file, '--workers', '1', '--silent'], { env })
  t.equal(stdout + stderr, '')
  await rejects(t, exec(process.execPath, [bin, '/missing.xml', '--silent'], { env }), (err) => {
    t.equal(err.code, 1)
    t.equal(err.stdout + err.stderr, '')
    return true
  })
})

test('non-terminal guided and missing-option invocations fail without hanging', async (t) => {
  for (const args of [[], ['-i'], ['--format', 'text']]) {
    await rejects(t, exec(process.execPath, [bin, ...args], { env, timeout: 5000 }), (err) => {
      t.equal(err.code, 1)
      t.match(err.stderr, /requires a terminal|missing required/)
      return true
    })
  }
})

test('prompt coercion preserves number defaults, parses extensions, and validates', (t) => {
  t.equal(promptValue({ type: 'number' }, '', 12), 12)
  t.equal(promptValue({ type: 'number' }, '4', 12), 4)
  t.throws(() => promptValue({ type: 'number' }, 'wrong'), /number/)
  t.equal(promptValue({ type: 'string', parse: (value) => value.toUpperCase() }, 'en'), 'EN')
  t.throws(() => promptValue({ type: 'path', validate: () => 'missing file' }, 'nope'), /missing file/)
  t.end()
})

// Exercise real Ink UI keyboard handlers with terminal-like streams.
function terminal() {
  const stdin = new PassThrough()
  stdin.isTTY = true
  stdin.setRawMode = () => {}
  stdin.ref = () => {}
  stdin.unref = () => {}
  const stdout = new PassThrough()
  stdout.isTTY = true
  stdout.columns = 80
  let output = ''
  stdout.on('data', (chunk) => { output += chunk.toString() })
  // Keep intermediate frames even when the test runner is running in CI.
  return { stdin, stdout, stderr: stdout, interactive: true, output: () => stripVTControlCharacters(output) }
}

test('wizard keeps defaults and plugin choice types across text/select/boolean/number prompts', { timeout: 5000 }, async (t) => {
  const io = terminal()
  const params = [
    { name: 'name', desc: 'Name', type: 'string' },
    { name: 'choice', desc: 'Choice', type: 'select', choices: [{ label: 'Seven', value: 7 }, { label: 'Nine', value: 9 }] },
    { name: 'enabled', desc: 'Enabled', type: 'boolean' },
    { name: 'count', desc: 'Count', type: 'number' }
  ]
  const result = promptParams(params, { name: 'hello', choice: 9 }, { defaults: { enabled: true, count: 12 } }, io)
  for (let i = 0; i < params.length; i += 1) {
    await delay(60)
    io.stdin.write('\r')
  }
  t.deepEqual(await result, { name: 'hello', choice: 9, enabled: true, count: 12 })
  t.match(io.output(), /starting the run/)
})

test('wizard displays validation errors and allows correction', { timeout: 5000 }, async (t) => {
  const io = terminal()
  const result = promptParams([{ name: 'count', desc: 'Count', type: 'number' }], {}, {}, io)
  await delay(60)
  io.stdin.write('oops')
  await delay(60)
  io.stdin.write('\r')
  await delay(60)
  // Clear the input with backspaces, then submit a valid number.
  for (let i = 0; i < 4; i += 1) {
    io.stdin.write('\x7f')
    await delay(30)
  }
  await delay(60)
  io.stdin.write('3')
  await delay(60)
  io.stdin.write('\r')
  t.deepEqual(await result, { count: 3 }, io.output())
  t.match(io.output(), /must be a number/)
})

test('wizard cancellation rejects and releases the terminal', { timeout: 5000 }, async (t) => {
  for (const key of ['\x03', '\x1b']) {
    const io = terminal()
    const result = promptParams([{ name: 'file', desc: 'File', type: 'path' }], {}, {}, io)
    const rejected = rejects(t, result, PromptCancelled)
    await delay(60)
    io.stdin.write(key)
    await rejected
    t.match(io.output(), /cancelled/)
  }
})

test('dashboard preserves worker states, counts, overall progress and queue statistics', (t) => {
  const workers = [{ index: 0, rangeSize: 100 }, { index: 1, rangeSize: 100, finished: true }]
  const frame = progressSnapshot({ workers, status: { 0: { bytes: 50, processed: 10, written: 8, errors: 1 } }, parked: [workers[0]], queue: [[]], queueLimit: 2 })
  t.equal(frame.progress, 75)
  const output = stripVTControlCharacters(renderToString(h(TerminalTheme, null, h(Dashboard, { frame })), { columns: 60 }))
  for (const pattern of [/parked/, /done/, /processed 10/, /written 8/, /75%/, /queue 1\/2/, /errors 1/]) t.match(output, pattern)
  // Terminal color sequences do not occupy visible columns.
  t.ok(output.split('\n').every((line) => line.length <= 60))
  t.end()
})

test('setup and report preserve filters, skip reasons, error examples and performance', (t) => {
  const setup = stripVTControlCharacters(renderToString(h(SetupSheet, { info: { file: fixture.file, fileSize: 1024, workers: 2, queueLimit: 2, opts: { ...defaults, skip_nsfw: { Weapons: true } } } })))
  t.match(setup, /selective/)
  t.match(setup, /Weapons/)
  t.match(setup, /memory bound/)
  const stats = { processed: 10, written: 5, skipped: 3, skipped_namespace: 2, skipped_redirect: 1, errors: 2, errorTypes: [{ message: 'parse failed', count: 2, title: 'Example page' }], took: 1000, workers: 2, batches: 1, maxQueue: 2, parked: 1, bytes: 1024, maxRss: 1048576 }
  const output = stripVTControlCharacters(renderToString(h(ResultsReport, { stats })))
  for (const label of ['done, with errors', 'namespace', 'redirects', 'parse failed', 'Example page', 'throughput', 'backpressure', 'peak memory']) t.ok(output.includes(label), label)
  t.end()
})

test('writer extensions still receive parsed options and await batch/end listeners', async (t) => {
  const writer = fileURLToPath(new URL('./cli-writer.js', import.meta.url))
  const { stdout, stderr } = await exec(process.execPath, [writer, fixture.file, '--out', 'pages'], { env })
  t.deepEqual(JSON.parse(stdout), { out: 'pages', written: fixture.expect.articles.length })
  t.equal(stderr, '')
  await rejects(t, exec(process.execPath, [writer, fixture.file, '--out', 'pages', '--fail'], { env, timeout: 5000 }), (err) => {
    t.equal(err.code, 1)
    t.equal(err.stdout + err.stderr, '')
    return true
  })
})


test('skip multi-select groups filters, preserves defaults, and continues to plugin prompts', { timeout: 5000 }, async (t) => {
  const io = terminal()
  const filters = baseParams.filter((param) => param.name.startsWith('skip_'))
  const params = [...filters, { name: 'out', desc: 'Output', type: 'string' }]
  const result = promptParams(params, { skip_redirect: false, out: 'pages' }, {
    defaults: { skip_redirect: true, skip_stub: true }
  }, io)
  await delay(60)
  io.stdin.write('\r')
  await delay(60)
  io.stdin.write('\r')
  t.deepEqual(await result, {
    skip_redirect: false, skip_disambig: false, skip_nsfw: false, skip_stub: true, out: 'pages'
  })
  t.match(io.output(), /Step 1\/2/)
  t.match(io.output(), /Which pages should be skipped/)
  t.doesNotMatch(io.output(), /Y\/n|y\/N/)
})

test('skip multi-select toggles multiple filters and allows clearing all selections', { timeout: 5000 }, async (t) => {
  const filters = baseParams.filter((param) => param.name.startsWith('skip_'))
  const cases = [
    { keys: [' ', '\x1b[B', ' ', '\x1b[B', ' ', '\r'], expected: {
      skip_redirect: false, skip_disambig: true, skip_nsfw: true, skip_stub: false
    } },
    { keys: [' ', '\r'], expected: {
      skip_redirect: false, skip_disambig: false, skip_nsfw: false, skip_stub: false
    } }
  ]
  for (const { keys, expected } of cases) {
    const io = terminal()
    const result = promptParams(filters, {}, {}, io)
    for (const key of keys) {
      await delay(60)
      io.stdin.write(key)
    }
    t.deepEqual(await result, expected)
  }
})
