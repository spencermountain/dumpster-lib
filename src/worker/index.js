import { workerData, parentPort } from 'node:worker_threads'
import { decode } from 'html-entities'
import pages from './01-reader.js'
import parseXml from './02-xml.js'
import parsePage from './03-parse.js'
import wantThisPage from './04-filter.js'
import { red } from '../lib/colors.js'

// each worker reads one byte-range of the dump:
//   read '<page>' blocks → wtf_wikipedia → post a batch every `batchPageCount` pages.
//
// backpressure: after posting a batch we await an 'ack' from the pool before
// reading further. the reader is pull-based, so while we wait the file-read
// stops too - a slow writer never piles pages up in memory anywhere.

const { index, file, start, end, lang, namespace, format, batchPageCount } = workerData

const status = {
  index,
  finished: false,
  started_at: Date.now(),
  processed: 0,
  skipped_namespace: 0,
  skipped_redirect: 0,
  skipped_disambig: 0,
  skipped_empty: 0,
  errors: 0,
  written: 0,
}

let onAck = null
const send = function (msg) {
  return new Promise((resolve) => {
    onAck = resolve
    parentPort.postMessage(msg)
  })
}
parentPort.on('message', (msg) => {
  if (msg.type === 'ack' && onAck !== null) {
    const fn = onAck
    onAck = null
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
    // only process pages in a given namespace
    if (namespace !== null && meta.namespace !== namespace) {
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
    } else if (want === 'empty') {
      status.skipped_empty += 1
    }
  } catch (e) {
    status.errors += 1
    console.log(red(`\nWorker ${index} couldn't process '${title}':\n got error ${e}`))
  }
  return null
}

const run = async function () {
  let batch = []
  try {
    for await (let xml of pages({ file, start, end })) {
      const page = eachPage(xml)
      if (page !== null) {
        batch.push(page)
      }
      if (batch.length >= batchPageCount) {
        await send({ type: 'batch', pages: batch, status })
        batch = []
      }
    }
    if (batch.length > 0) {
      await send({ type: 'batch', pages: batch, status })
    }
    status.finished = true
    parentPort.postMessage({ type: 'done', status })
  } catch (err) {
    parentPort.postMessage({ type: 'error', error: err.stack || String(err), status })
  }
}
run()
