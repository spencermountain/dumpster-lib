import { workerData, parentPort } from 'worker_threads'
import reader from './01-reader.js'
import parsePage from './03-parse.js'
import wantThisPage from './04-filter.js'
import { magenta } from '../lib/colors.js'

let {
  file,
  index,
  workers,
  lang,
  namespace,
  format
} = workerData

let status = {
  index,
  finished: false,
  started_at: Date.now(),
  processed: 0,

  skipped_namespace: 0,
  skipped_redirect: 0,
  skipped_disambig: 0,
  skipped_empty: 0,

  written: 0
}

const eachPage = function (meta) {
  status.processed += 1
  // only process pages in a given namespace
  if (meta.namespace !== namespace && namespace !== null) {
    status.skipped_namespace += 1
    return null
  }
  meta.lang = meta.lang || lang
  let result = parsePage(meta, format)
  // apply filters
  let wantPage = wantThisPage(result)
  if (wantPage === true) {
    status.written += 1
    parentPort.postMessage({ result })
  } else if (wantPage === 'redirect') {
    status.skipped_redirect += 1
  } else if (wantPage === 'disambig') {
    status.skipped_disambig += 1
  } else if (wantPage === 'empty') {
    status.skipped_empty += 1
  }
}

setTimeout(() => {
  // start off the worker!
  reader({ index, workers, file }, eachPage).then((doc) => {
    console.log(magenta(`worker #${index} finished`))
    status.finished = true
  })
}, 2000)

// log the status of this worker, when asked
parentPort.on('message', () => parentPort.postMessage({ status }))
