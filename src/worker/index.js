import { workerData, parentPort } from 'node:worker_threads'
import { decode } from 'html-entities'
import pages from './01-reader.js'
import parseXml from './02-xml.js'
import parsePage from './03-parse.js'
import wantThisPage from './04-filter.js'
import { keepNamespace } from '../lib/namespace.js'

// each worker reads one byte-range of the dump:
//   read '<page>' blocks → wtf_wikipedia → post a batch every `batchPageCount` pages.
//
// backpressure: after handing over a batch we pause until the pool sends
// 'resume', meaning it has room for more. the reader is pull-based, so while
// we wait the file-read stops too - a slow writer never piles pages up anywhere.

const { index, file, start, end, lang, namespace, format, batchPageCount } = workerData

const status = {
  index,
  finished: false,
  started_at: Date.now(),
  processed: 0,
  skipped_namespace: 0,
  skipped_redirect: 0,
  skipped_disambig: 0,
  skipped_nsfw: 0,
  skipped_stub: 0,
  skipped_empty: 0,
  errors: 0,
  written: 0,
  bytes: 0, // bytes of page-xml read so far - for progress against our range size
}

// post a batch, then pause until the pool tells us to resume
let onResume = null
const handOver = function (msg) {
  return new Promise((resolve) => {
    onResume = resolve
    parentPort.postMessage(msg)
  })
}
parentPort.on('message', (msg) => {
  if (msg.type === 'resume' && onResume !== null) {
    const fn = onResume
    onResume = null
    fn()
  }
})

// one page's xml → the result to hand over, or null when it's filtered-out
const eachPage = function (xml) {
  status.processed += 1
  let title = 'Unknown page'
  try {
    const meta = parseXml(xml)
    title = meta.title
    // apply the namespace inclusion rule before parsing the page
    if (!keepNamespace(meta.namespace, namespace)) {
      status.skipped_namespace += 1
      return null
    }
    meta.wiki = decode(meta.wiki)
    meta.lang = meta.lang || lang
    const result = parsePage(meta, format)
    // apply filters
    const want = wantThisPage(result, workerData)
    if (want === true) {
      status.written += 1
      return result
    } else if (want === 'redirect') {
      status.skipped_redirect += 1
    } else if (want === 'disambig') {
      status.skipped_disambig += 1
    } else if (want === 'nsfw') {
      status.skipped_nsfw += 1
    } else if (want === 'stub') {
      status.skipped_stub += 1
    } else if (want === 'empty') {
      status.skipped_empty += 1
    }
  } catch (e) {
    status.errors += 1
    // hand the warning to the pool - a console.log from here would punch into the live table
    parentPort.postMessage({ type: 'warning', index, title, error: String(e) })
  }
  return null
}

const run = async function () {
  let batch = []
  try {
    for await (let xml of pages({ file, start, end })) {
      status.bytes += Buffer.byteLength(xml) // ~proportional to our byte-range; enough for a progress bar
      const page = eachPage(xml)
      if (page !== null) {
        batch.push(page)
      }
      if (batch.length >= batchPageCount) {
        await handOver({ type: 'batch', pages: batch, status })
        batch = []
      }
    }
    if (batch.length > 0) {
      await handOver({ type: 'batch', pages: batch, status })
    }
    status.finished = true
    parentPort.postMessage({ type: 'done', status })
  } catch (err) {
    parentPort.postMessage({ type: 'error', error: err.stack || String(err), status })
  }
}
run()
