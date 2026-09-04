import path from 'node:path'
import fs from 'node:fs'
import EventEmitter from 'node:events'
import { Worker } from 'node:worker_threads'
import { fileURLToPath } from 'node:url'
import { checkOptions } from './_prep.js'
import partition from './_partition.js'
import { calc, printSummary } from './_summary.js'
import { blue, yellow, magenta, grey } from '../lib/colors.js'

const workerFile = path.join(path.dirname(fileURLToPath(import.meta.url)), '../worker/index.js')

// the worker pool, and the backpressure between the workers and your writer.
//
// flow of a batch:
//   a worker posts {batch} and pauses itself until we tell it to resume
//   → the pool pushes it onto `queue`
//   → writerLoop() hands batches to the 'batch' listeners one at a time,
//     awaiting whatever they return (a promise, or nothing at all)
//   → 'resume' is sent right away if the queue is short,
//     or held until the writer catches up, if it's backed-up.
//
// memory stays bounded at ~(highWater + workers) batches no matter how slow the
// writer is: every worker is paused, waiting for 'resume', before it parses more.
class Pool extends EventEmitter {
  constructor(opts) {
    super()
    this.opts = opts
    this.workers = []
    this.queue = [] // batches waiting for the writer
    this.parked = [] // paused workers we have not yet told to resume
    this.status = {} // the latest status object from each worker, by index
    this.stats = { batches: 0, written: 0, maxQueue: 0, parked: 0 }
    this.highWater = opts.highWater
    this.error = null
    this.closing = false
    this.wakeWriter = null
    this.heartbeat = null
    this.startedAt = Date.now()
    this.done = new Promise((resolve, reject) => {
      this.resolveDone = resolve
      this.rejectDone = reject
    })
    // callers may listen for 'error' instead of awaiting this
    this.done.catch(() => {})
  }

  // kick off each worker, on a part of the file
  start() {
    const { file, workers } = this.opts
    checkOptions(this.opts)
    const ranges = partition(file, workers)
    if (!this.highWater) {
      this.highWater = Math.max(1, ranges.length)
    }
    const mb = Math.round(fs.statSync(file).size / 1048576) + 'mb'
    console.log(`\n\nstarting ${blue(ranges.length)} workers on the ${yellow(mb)} file`)
    ranges.forEach((range, i) => this.spawn(i, range))
    const header = this.workers.map((_, i) => ` #${i + 1}`.padStart(8)).join('   ')
    console.log('\n' + magenta(header))
    if (this.opts.heartbeat > 0) {
      this.heartbeat = setInterval(() => this.beat(), this.opts.heartbeat)
    }
    this.writerLoop()
  }

  spawn(index, range) {
    const o = this.opts
    const workerData = {
      index,
      file: o.file,
      start: range.start,
      end: range.end,
      namespace: o.namespace,
      redirects: o.redirects,
      disambiguation: o.disambiguation,
      lang: o.lang,
      project: o.project,
      format: o.format,
      batchPageCount: o.batchPageCount,
    }
    const worker = new Worker(workerFile, { workerData })
    worker.index = index
    worker.finished = false
    worker.on('message', (msg) => this.onMessage(worker, msg))
    worker.on('error', (err) => this.abort(err))
    worker.on('exit', (code) => {
      if (code !== 0 && this.closing === false) {
        this.abort(new Error(`worker #${index} exited with code ${code}`))
      }
    })
    this.workers.push(worker)
  }

  onMessage(worker, msg) {
    if (this.closing) {
      return // late messages during teardown
    }
    if (msg.status) {
      this.status[worker.index] = msg.status
    }
    if (msg.type === 'batch') {
      this.queue.push(msg.pages)
      this.stats.maxQueue = Math.max(this.stats.maxQueue, this.queue.length)
      this.wake()
      if (this.queue.length <= this.highWater) {
        worker.postMessage({ type: 'resume' })
      } else {
        this.stats.parked += 1
        this.parked.push(worker) // writer is backed-up - hold this worker
      }
    } else if (msg.type === 'done') {
      worker.finished = true
      this.wake()
    } else if (msg.type === 'error') {
      this.abort(new Error(msg.error))
    }
  }

  wake() {
    if (this.wakeWriter !== null) {
      const fn = this.wakeWriter
      this.wakeWriter = null
      fn()
    }
  }

  // hand batches to the 'batch' listeners, one at a time.
  // a listener that returns a promise is awaited - that's the backpressure signal.
  // a plain sync listener has finished by the time it returns, so it just flows.
  async writerLoop() {
    while (this.error === null) {
      const pages = this.queue.shift()
      if (pages === undefined) {
        if (this.workers.every((w) => w.finished)) {
          break
        }
        await new Promise((resolve) => (this.wakeWriter = resolve))
        continue
      }
      try {
        await Promise.all(this.rawListeners('batch').map((fn) => fn(pages)))
      } catch (err) {
        return this.abort(err)
      }
      this.stats.batches += 1
      this.stats.written += pages.length
      if (this.queue.length < this.highWater) {
        this.resumeParked()
      }
      // let worker messages and the heartbeat interleave, even with a sync writer
      await new Promise((resolve) => setImmediate(resolve))
    }
    if (this.error === null) {
      await this.finish()
    }
  }

  resumeParked() {
    const parked = this.parked
    this.parked = []
    parked.forEach((w) => w.postMessage({ type: 'resume' }))
  }

  async finish() {
    clearInterval(this.heartbeat)
    const stats = this.summary()
    // 'end' listeners are awaited too - flush and close your db here
    try {
      await Promise.all(this.rawListeners('end').map((fn) => fn(stats)))
    } catch (err) {
      return this.abort(err)
    }
    await this.stopWorkers()
    printSummary(stats)
    this.resolveDone(stats)
  }

  async abort(err) {
    if (this.error !== null) {
      return
    }
    this.error = err
    clearInterval(this.heartbeat)
    this.wake()
    await this.stopWorkers()
    if (this.listenerCount('error') > 0) {
      this.emit('error', err)
    }
    this.rejectDone(err)
  }

  stopWorkers() {
    this.closing = true
    return Promise.all(this.workers.map((w) => w.terminate()))
  }

  summary() {
    const res = calc(Object.values(this.status))
    return Object.assign(res, this.stats, {
      workers: this.workers.length,
      took: Date.now() - this.startedAt,
    })
  }

  // heartbeat status logger
  beat() {
    const row = this.workers
      .map((w) => {
        const s = this.status[w.index]
        return (s ? s.written.toLocaleString() : '???').padStart(8)
      })
      .join('   ')
    const rss = Math.round(process.memoryUsage().rss / 1048576)
    console.log(grey(row) + grey(`   │ queue ${this.queue.length}  parked ${this.parked.length}  rss ${rss}mb`))
  }
}

export default Pool
