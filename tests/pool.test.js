import { test, after } from 'node:test'
import assert from 'node:assert'
import { rmSync } from 'node:fs'
import dumpster from '../src/index.js'
import makeFixture from './fixture.js'

const fixture = makeFixture(300)
after(() => rmSync(fixture.dir, { recursive: true, force: true }))

const base = { file: fixture.file, format: 'text', heartbeat: 0, lang: 'en' }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

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

test('honours redirects and disambiguation options', async () => {
  const pool = dumpster({ ...base, workers: 2, redirects: true })
  let redirects = 0
  pool.on('batch', (pages) => {
    redirects += pages.filter((p) => p.isRedirect).length
  })
  const stats = await pool.done
  assert.equal(redirects, fixture.expect.redirects)
  assert.equal(stats.skipped_redirect, 0)
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
