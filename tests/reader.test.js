import test from 'tape'
import { rejects } from './helpers.js'
import { rmSync } from 'node:fs'
import pages from '../src/worker/01-reader.js'
import partition from '../src/pool/_partition.js'
import makeFixture from '../src/lib/fixture.js'

const fixture = makeFixture(300)
test.onFinish(() => rmSync(fixture.dir, { recursive: true, force: true }))
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const title = (xml) => xml.match(/<title>(.+?)<\/title>/)[1]

test('yields every page of a range, in order, as a clean <page>...</page> string', async (t) => {
  const [range] = partition(fixture.file, 1)
  const titles = []
  for await (const xml of pages({ file: fixture.file, ...range })) {
    t.ok(xml.startsWith('<page>'))
    t.ok(xml.endsWith('</page>'))
    titles.push(title(xml))
  }
  t.equal(titles.length, 300)
  t.equal(titles[0], 'Page 1')
  t.equal(titles[299], 'Page 300')
})

test('a slow consumer gets every page exactly once (the read waits for each pull)', async (t) => {
  const seen = new Map()
  for (const range of partition(fixture.file, 4)) {
    for await (const xml of pages({ file: fixture.file, ...range })) {
      const t = title(xml)
      seen.set(t, (seen.get(t) || 0) + 1)
      await sleep(1)
    }
  }
  const dups = [...seen].filter(([, n]) => n > 1).map(([t]) => t)
  t.deepEqual(dups, [])
  t.equal(seen.size, 300)
})

test('a missing file surfaces as a thrown error', async (t) => {
  await rejects(t, async () => {
    for await (const _ of pages({ file: fixture.file + '.nope', start: 0, end: 10 })) {
      // never
    }
  })
})
