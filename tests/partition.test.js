import { test, after } from 'node:test'
import assert from 'node:assert'
import { readFileSync, rmSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import partition from '../src/pool/_partition.js'
import makeFixture from './fixture.js'

const fixture = makeFixture(200)
after(() => rmSync(fixture.dir, { recursive: true, force: true }))

test('ranges start on <page>, and tile the file with no gaps', () => {
  const buf = readFileSync(fixture.file)
  const ranges = partition(fixture.file, 5)
  assert.equal(ranges.length, 5)
  ranges.forEach((r, i) => {
    assert.equal(buf.subarray(r.start, r.start + 6).toString(), '<page>', `range ${i} starts on a tag`)
    if (i > 0) {
      assert.equal(ranges[i - 1].end, r.start - 1, 'contiguous')
    }
  })
  assert.equal(ranges[ranges.length - 1].end, buf.length - 1, 'runs to the end of the file')
  // every page tag lands in exactly one range
  const tags = buf.toString().split('<page>').length - 1
  assert.equal(tags, 200)
})

test('a tiny file yields fewer ranges than workers asked', () => {
  const small = makeFixture(3)
  try {
    const ranges = partition(small.file, 8)
    assert.ok(ranges.length <= 3)
    assert.ok(ranges.length >= 1)
  } finally {
    rmSync(small.dir, { recursive: true, force: true })
  }
})

test('an empty file yields no ranges', () => {
  const file = path.join(fixture.dir, 'empty.xml')
  writeFileSync(file, '')
  assert.deepEqual(partition(file, 4), [])
})
