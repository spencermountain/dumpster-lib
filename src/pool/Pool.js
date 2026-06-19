import path from 'node:path'
import fs from 'node:fs'
import EventEmitter from 'events'
import { Worker } from 'worker_threads'
import { fileURLToPath } from 'node:url'
import { checkFile } from './_prep.js'
import getSummary from './_summary.js'
import { blue, yellow, magenta, grey } from '../lib/colors.js'
const dir = path.dirname(fileURLToPath(import.meta.url))

class Pool extends EventEmitter {
  constructor(opts) {
    super(opts)
    checkFile(opts.file)
    this.opts = opts
    this.workers = []
    // start the logger
    this.heartbeat = setInterval(() => this.beat(), this.opts.heartbeat)
    this.status = [{}]
    this.results = []
  }
  // kick off each worker, on a part of the file
  start() {
    let bytes = fs.statSync(this.opts.file)['size']
    const mb = Math.round(bytes / 1048576) + 'mb'
    console.log(`\n\nstarting ${blue(this.opts.workers)} workers on the ${yellow(mb)} file`)
    for (let i = 0; i < this.opts.workers; i += 1) {
      // Create each worker.
      let info = {
        workerData: {
          index: i,
          file: this.opts.file,
          namespace: this.opts.namespace,
          redirects: this.opts.redirects,
          lang: this.opts.lang,
          pageviews: this.opts.pageviews,
          project: this.opts.project,
          disambiguation: this.opts.disambiguation,
          workers: this.opts.workers,
          format: this.opts.format,
        }
      }
      const file = path.join(dir, '../worker/index.js')
      const worker = new Worker(file, info)
      // receive status of each worker, when requested
      worker.on('message', (msg) => {
        // update the status of this worker
        if (msg.status) {
          this.status[msg.status.index] = msg.status
        }
        // if we have a result, collect it
        if (msg.result) {
          // console.log('msg', this.results.length, 'of', this.opts.chunkSize)
          this.results.push(msg.result.body)
          // if we've reached the chunk size, emit the chunk
          if (this.results.length >= this.opts.chunkSize) {
            this.emit('chunk', this.results)
            this.results = []
          }
        }
      })
      worker.on('error', (err) => console.error(err))
      worker.on('exit', (code) => {
        console.log('worker done', code)
      })
      this.workers.push(worker)
    }
    let header = this.workers.map((_, i) => ` #${i + 1}`.padStart('8')).join('   ')
    console.log('\n' + magenta(header))
  }
  stop() {
    console.log('cleaning up...')
    clearInterval(this.heartbeat)
    // drain any remaining results
    if (this.results.length > 0) {
      this.emit('chunk', this.results)
      this.results = []
    }
    this.emit('end')
    this.removeAllListeners()
    // log some stats
    getSummary(this.status)
    // todo: figure out how to exit naturally
    setTimeout(() => {
      process.exit()
    }, 500)
  }
  // heartbeat status logger
  beat() {
    this.workers.forEach((w) => w.postMessage('thump'))
    setTimeout(() => {
      let row = this.status
        .map((o) => (o.written !== undefined ? o.written.toLocaleString().padStart('8') : '???'))
        .join('   ')
      console.log(grey(row))
      // are they all done?
      let allDone = this.status.every((obj) => obj.finished === true)
      if (allDone === true) {
        this.stop()
      }
    }, 500)
  }
}

export default Pool
