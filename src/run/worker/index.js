import { workerData, parentPort } from 'worker_threads'
import { JSONfn } from 'jsonfn'
import reader from './01-reader.js'
import { magenta } from '../_lib.js'
import fs from 'node:fs'

let {
  file,
  index,
  workers,
  lang,
  pageviews,
  project,
  namespace,
  redirects,
  disambiguation,
  libPath
} = workerData

let methods = JSONfn.parse(workerData.methods)

const lib = await import(libPath || 'wtf_wikipedia')
const wtf = lib.default

//spaces to underscores
const encodeTitle = (title) => {
  return title.trim().replace(/ /g, '_')
}

let viewCount = {}
// load the pageviews dataset, if we asked for it
if (pageviews && fs.existsSync('./pageviews.json')) {
  try {
    viewCount = JSON.parse(fs.readFileSync('./pageviews.json').toString())
  } catch (e) {
    console.error('Error parsing pageviews file:', e)
  }
}

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
  // parse the wikitext
  let doc = wtf(meta.wiki, meta)
  // skip redirect pages
  if (redirects === false && doc.isRedirect()) {
    status.skipped_redirect += 1
    return null
  }
  // skip disambiguation pages
  if (disambiguation === false && doc.isDisambig()) {
    status.skipped_disambig += 1
    return null
  }
  if (!methods.doPage(doc)) {
    status.skipped_empty += 1
    return null
  }
  // actually process the page
  let body = methods.parse(doc)
  if (body) {
    status.written += 1
    const result = {
      title: meta.title || doc.title(),
      id: meta.pageID,
      revisionID: meta.revisionID,
      timestamp: meta.timestamp,
      ns: meta.namespace,
      lang: lang,
      project: project,
      body
    }
    result.encoded_title = encodeTitle(result.title)
    if (pageviews === true) {
      result.pageviews = viewCount[result.encoded_title] || 0
    }
    methods.output(result)
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
