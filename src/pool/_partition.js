import fs from 'node:fs'

const TAG = Buffer.from('<page>')
const WINDOW = 1024 * 1024

// scan forward from `from` for the next '<page>' tag, and return its byte offset
const findPageStart = function (fd, from, size) {
  // keep a tag's-worth of overlap between windows, so a tag split across two reads is still found
  const buf = Buffer.alloc(WINDOW + TAG.length - 1)
  let pos = from
  while (pos < size) {
    const n = fs.readSync(fd, buf, 0, buf.length, pos)
    if (n < TAG.length) {
      break
    }
    const at = buf.subarray(0, n).indexOf(TAG)
    if (at !== -1) {
      return pos + at
    }
    pos += n - (TAG.length - 1)
  }
  return size
}

// split the file into `count` byte-ranges that begin exactly on a '<page>' tag,
// so every page belongs to exactly one worker - none are split, lost or doubled.
// (a small file may produce fewer ranges than asked for)
const partition = function (file, count) {
  const size = fs.statSync(file).size
  if (size === 0) {
    return []
  }
  const fd = fs.openSync(file, 'r')
  let starts = []
  try {
    for (let i = 0; i < count; i += 1) {
      const guess = Math.floor((size * i) / count)
      starts.push(findPageStart(fd, guess, size))
    }
  } finally {
    fs.closeSync(fd)
  }
  starts = [...new Set(starts)].sort((a, b) => a - b).filter((b) => b < size)
  // `end` is inclusive, like fs.createReadStream
  return starts.map((start, i) => {
    const next = starts[i + 1] !== undefined ? starts[i + 1] : size
    return { start, end: next - 1 }
  })
}
export default partition
