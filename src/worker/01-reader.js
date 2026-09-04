import fs from 'node:fs'

const OPEN = '<page>'
const CLOSE = '</page>'

// read one byte-range of a dump, yielding each '<page>...</page>' as a string.
//
// pull-based: `for await` over the stream only reads more of the file when the
// consumer asks for the next page. so an `await` inside the consumer's loop
// pauses the file-read too, and nothing piles up while a writer is busy.
//
// this is the only file that knows how the dump is read. to swap the reader,
// keep the contract:  pages({ file, start, end }) → async iterator of page-xml strings
const pages = async function* ({ file, start, end }) {
  const stream = fs.createReadStream(file, { start, end, encoding: 'utf8', highWaterMark: 1024 * 1024 })
  let buffer = ''
  try {
    for await (const chunk of stream) {
      buffer += chunk
      let cursor = 0
      let close = -1
      while ((close = buffer.indexOf(CLOSE, cursor)) !== -1) {
        const open = buffer.indexOf(OPEN, cursor)
        const stop = close + CLOSE.length
        // a '</page>' with no opening tag is a partial page from before our range - skip it
        if (open !== -1 && open < close) {
          yield buffer.slice(open, stop)
        }
        cursor = stop
      }
      if (cursor > 0) {
        buffer = buffer.slice(cursor) // compact once per chunk, not once per page
      }
    }
  } finally {
    stream.destroy()
  }
}
export default pages
