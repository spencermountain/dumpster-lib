import test from 'tape'
import { readFileSync, rmSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import partition from '../src/pool/_partition.js'
import makeFixture from '../src/lib/fixture.js'

const fixture = makeFixture(200)
test.onFinish(() => rmSync(fixture.dir, { recursive: true, force: true }))

test('ranges start on <page>, and tile the file with no gaps', (t) => {
  const buf = readFileSync(fixture.file)
  const ranges = partition(fixture.file, 5)
  t.equal(ranges.length, 5)
  ranges.forEach((r, i) => {
    t.equal(buf.subarray(r.start, r.start + 6).toString(), '<page>', `range ${i} starts on a tag`)
    if (i > 0) {
      t.equal(ranges[i - 1].end, r.start - 1, 'contiguous')
    }
  })
  t.equal(ranges[ranges.length - 1].end, buf.length - 1, 'runs to the end of the file')
  // every page tag lands in exactly one range
  const tags = buf.toString().split('<page>').length - 1
  t.equal(tags, 200)
  t.end()
})

test('a tiny file yields fewer ranges than workers asked', (t) => {
  const small = makeFixture(3)
  try {
    const ranges = partition(small.file, 8)
    t.ok(ranges.length <= 3)
    t.ok(ranges.length >= 1)
  } finally {
    rmSync(small.dir, { recursive: true, force: true })
  }
  t.end()
})

test('an empty file yields no ranges', (t) => {
  const file = path.join(fixture.dir, 'empty.xml')
  writeFileSync(file, '')
  t.deepEqual(partition(file, 4), [])
  t.end()
})
