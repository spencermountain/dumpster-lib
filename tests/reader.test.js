import { test, after } from 'node:test'
import assert from 'node:assert'
import { rmSync } from 'node:fs'
import pages from '../src/worker/01-reader.js'
import partition from '../src/pool/_partition.js'
import makeFixture from '../src/lib/fixture.js'

const fixture = makeFixture(300)
after(() => rmSync(fixture.dir, { recursive: true, force: true }))
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const title = (xml) => xml.match(/<title>(.+?)<\/title>/)[1]

test('yields every page of a range, in order, as a clean <page>...</page> string', async () => {
  const [range] = partition(fixture.file, 1)
  const titles = []
  for await (const xml of pages({ file: fixture.file, ...range })) {
    assert.ok(xml.startsWith('<page>'))
    assert.ok(xml.endsWith('</page>'))
    titles.push(title(xml))
  }
  assert.equal(titles.length, 300)
  assert.equal(titles[0], 'Page 1')
  assert.equal(titles[299], 'Page 300')
})

test('a slow consumer gets every page exactly once (the read waits for each pull)', async () => {
  const seen = new Map()
  for (const range of partition(fixture.file, 4)) {
    for await (const xml of pages({ file: fixture.file, ...range })) {
      const t = title(xml)
      seen.set(t, (seen.get(t) || 0) + 1)
      await sleep(1)
    }
  }
  const dups = [...seen].filter(([, n]) => n > 1).map(([t]) => t)
  assert.deepEqual(dups, [])
  assert.equal(seen.size, 300)
})

test('a missing file surfaces as a thrown error', async () => {
  await assert.rejects(async () => {
    for await (const _ of pages({ file: fixture.file + '.nope', start: 0, end: 10 })) {
      // never
    }
  })
})
