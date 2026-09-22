import { test, after } from 'node:test'
import assert from 'node:assert'
import { execFile } from 'node:child_process'
import { rmSync } from 'node:fs'
import { promisify } from 'node:util'
import { fileURLToPath } from 'node:url'
import dumpster from '../src/index.js'
import makeFixture from '../src/lib/fixture.js'

const fixture = makeFixture(300)
const execFileAsync = promisify(execFile)
const silentRunner = fileURLToPath(new URL('./silent-run.js', import.meta.url))
after(() => rmSync(fixture.dir, { recursive: true, force: true }))

const base = { file: fixture.file, format: 'text', silent: true, lang: 'en' }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

test('silent suppresses stdout and stderr for a complete run', async () => {
  // Exercise silence with colors enabled, without Node's conflicting-env warning.
  const env = { ...process.env, FORCE_COLOR: '1', NO_COLOR: undefined }
  const { stdout, stderr } = await execFileAsync(process.execPath, [silentRunner, fixture.file], { env })
  assert.equal(stdout, '')
  assert.equal(stderr, '')
})

test('every article arrives exactly once, across workers and partial batches', async () => {
  const pool = dumpster({ ...base, workers: 4, batchPageCount: 7 })
  const got = []
  pool.on('batch', (pages) => {
    pages.forEach((p) => got.push(p.title))
  })
  const stats = await pool.done
  assert.deepEqual(got.sort(), fixture.expect.articles.slice().sort())
  assert.equal(stats.written, fixture.expect.articles.length)
  assert.equal(stats.skipped_redirect, fixture.expect.redirects)
  assert.equal(stats.skipped_namespace, fixture.expect.otherNs)
  assert.equal(stats.processed, fixture.count)
  assert.equal(stats.workers, 4)
})

test('a slow async writer is awaited, never overlapped, and bounds the queue', async () => {
  const pool = dumpster({ ...base, workers: 4, batchPageCount: 5 })
  let inFlight = 0
  let maxInFlight = 0
  let pages = 0
  pool.on('batch', async (batch) => {
    inFlight += 1
    maxInFlight = Math.max(maxInFlight, inFlight)
    await sleep(8)
    pages += batch.length
    inFlight -= 1
  })
  const stats = await pool.done
  assert.equal(maxInFlight, 1, 'one batch handed over at a time')
  assert.equal(pages, fixture.expect.articles.length)
  assert.ok(stats.maxQueue <= stats.workers * 2, `queue peaked at ${stats.maxQueue}`)
  assert.ok(stats.parked > 0, 'workers were actually paused for the writer')
})

test('a sync writer works with the same listener', async () => {
  const pool = dumpster({ ...base, workers: 2, batchPageCount: 50 })
  let n = 0
  pool.on('batch', (pages) => {
    n += pages.length // returns undefined
  })
  await pool.done
  assert.equal(n, fixture.expect.articles.length)
})

test('honours skip_redirect option', async () => {
  const pool = dumpster({ ...base, workers: 2, skip_redirect: false })
  let redirects = 0
  pool.on('batch', (pages) => {
    redirects += pages.filter((p) => p.isRedirect).length
  })
  const stats = await pool.done
  assert.equal(redirects, fixture.expect.redirects)
  assert.equal(stats.skipped_redirect, 0)
})

test('honours skip_disambig option', async () => {
  const pool = dumpster({ ...base, workers: 2, skip_disambig: true })
  pool.on('batch', (pages) => {
    assert.equal(pages.some((page) => page.isDisambig), false)
  })
  const stats = await pool.done
  assert.equal(stats.skipped_disambig, fixture.expect.disambig)
})

test('accepts numeric, boolean, and boolean-map namespace rules', async () => {
  const cases = [
    {
      namespace: 14,
      written: fixture.expect.otherNs,
      skipped: fixture.count - fixture.expect.otherNs
    },
    { namespace: true, written: fixture.count - fixture.expect.redirects, skipped: 0 },
    { namespace: false, written: 0, skipped: fixture.count },
    {
      namespace: { 0: false, 14: true },
      written: fixture.expect.otherNs,
      skipped: fixture.count - fixture.expect.otherNs
    }
  ]
  for (const expected of cases) {
    const pool = dumpster({ ...base, workers: 1, namespace: expected.namespace })
    pool.on('batch', (pages) => {
      if (expected.written === fixture.expect.otherNs) {
        assert.equal(pages.every((page) => page.ns === 14), true)
      }
    })
    const stats = await pool.done
    assert.equal(stats.written, expected.written)
    assert.equal(stats.skipped_namespace, expected.skipped)
  }
})

test('flags stubs and honours skip_stub option', async () => {
  const included = dumpster({ ...base, workers: 2 })
  let stubs = 0
  included.on('batch', (pages) => {
    stubs += pages.filter((page) => page.isStub).length
  })
  const includedStats = await included.done
  assert.equal(stubs, fixture.expect.stubs)
  assert.equal(includedStats.skipped_stub, 0)

  const filtered = dumpster({ ...base, workers: 2, skip_stub: true })
  filtered.on('batch', (pages) => {
    assert.equal(pages.some((page) => page.isStub), false)
  })
  const filteredStats = await filtered.done
  assert.equal(filteredStats.skipped_stub, fixture.expect.stubs)
  assert.equal(filteredStats.written, fixture.expect.articles.length - fixture.expect.stubs)
})

test('flags NSFW pages and optionally filters them', async () => {
  const included = dumpster({ ...base, workers: 2 })
  let nsfw = 0
  included.on('batch', (pages) => {
    nsfw += pages.filter((p) => p.isNsfw).length
  })
  const includedStats = await included.done
  assert.equal(nsfw, fixture.expect.nsfw)
  assert.equal(includedStats.skipped_nsfw, 0)

  const filtered = dumpster({ ...base, workers: 2, skip_nsfw: true })
  filtered.on('batch', (pages) => {
    assert.equal(pages.some((p) => p.isNsfw), false)
  })
  const filteredStats = await filtered.done
  assert.equal(filteredStats.skipped_nsfw, fixture.expect.nsfw)
  assert.equal(filteredStats.written, fixture.expect.articles.length - fixture.expect.nsfw)
})

test('accepts an NSFW reason skip map', async () => {
  const pool = dumpster({
    ...base,
    workers: 2,
    skip_nsfw: { Weapons: false, 'Drug-use': true }
  })
  const reasons = []
  pool.on('batch', (pages) => {
    pages.filter((page) => page.isNsfw).forEach((page) => reasons.push(page.nsfwReason))
  })
  const stats = await pool.done
  assert.deepEqual(new Set(reasons), new Set(['Sexuality', 'Weapons']))
  assert.equal(reasons.length, fixture.expect.nsfw - fixture.expect.nsfwReasons['Drug-use'])
  assert.equal(stats.skipped_nsfw, fixture.expect.nsfwReasons['Drug-use'])
})

test('a rejecting writer aborts the run, fires error, and rejects done', async () => {
  const pool = dumpster({ ...base, workers: 3, batchPageCount: 5 })
  let calls = 0
  let errored = null
  pool.on('batch', async () => {
    calls += 1
    if (calls === 2) {
      throw new Error('db is down')
    }
  })
  pool.on('error', (err) => (errored = err))
  await assert.rejects(pool.done, /db is down/)
  assert.equal(errored.message, 'db is down')
  assert.ok(calls < 10, 'stopped handing out batches after the failure')
})

test('end listeners are awaited before done resolves', async () => {
  const pool = dumpster({ ...base, workers: 2 })
  let closed = false
  pool.on('batch', () => {})
  pool.on('end', async (stats) => {
    assert.ok(stats.written > 0)
    await sleep(30)
    closed = true
  })
  await pool.done
  assert.equal(closed, true)
})

test('listeners attached after the call are still in place when the first batch lands', async () => {
  const pool = dumpster({ ...base, workers: 1, batchPageCount: 1000 })
  await sleep(0)
  let n = 0
  pool.on('batch', (pages) => (n += pages.length))
  await pool.done
  assert.equal(n, fixture.expect.articles.length)
})

test('md format includes templates', async () => {
  const pool = dumpster({ ...base, workers: 1, format: 'md' })
  let page = null
  pool.on('batch', (pages) => (page = page || pages.find((p) => p.title === 'Page 1')))
  await pool.done
  assert.equal(page.templates.find((t) => t.template === 'tinytown data').founded, '1801')
  assert.ok(Array.isArray(page.links))
})

test('a missing file rejects done, with a helpful error', async () => {
  const pool = dumpster({ ...base, file: '/nope/enwiki-latest-pages-articles.xml' })
  await assert.rejects(pool.done, /can't find file/)
})

test('an unknown format rejects done', async () => {
  const pool = dumpster({ ...base, format: 'yaml' })
  await assert.rejects(pool.done, /unknown format 'yaml'/)
})

test('an invalid NSFW reason map rejects done', async () => {
  const pool = dumpster({ ...base, skip_nsfw: { Weapons: 'yes' } })
  await assert.rejects(pool.done, /'skip_nsfw' must be true, false, or an object/)
})

test('an invalid skip_stub option rejects done', async () => {
  const pool = dumpster({ ...base, skip_stub: 'yes' })
  await assert.rejects(pool.done, /'skip_stub' must be true or false/)
})

test('an invalid namespace rule rejects done', async () => {
  const pool = dumpster({ ...base, namespace: { 0: 'yes' } })
  await assert.rejects(pool.done, /'namespace' must be an integer, boolean, null, or an object/)
})

test('an invalid silent option rejects done', async () => {
  const pool = dumpster({ ...base, silent: 'yes' })
  await assert.rejects(pool.done, /'silent' must be true or false/)
})

test('renamed filter options fail instead of being silently ignored', async () => {
  const renamed = {
    redirects: 'skip_redirect',
    disambiguation: 'skip_disambig',
    nsfw: 'skip_nsfw'
  }
  for (const [oldName, newName] of Object.entries(renamed)) {
    const pool = dumpster({ ...base, [oldName]: true })
    await assert.rejects(pool.done, new RegExp(`'${oldName}' has been renamed to '${newName}'`))
  }
})
