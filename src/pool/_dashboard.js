/* eslint-disable no-console */
import Table from 'cli-table3'
import logUpdate from 'log-update'
import { enabled, green, yellow, blue, red, cyan, grey, dim, magenta } from '../lib/colors.js'

// cli-table3 colors its own head/border, so gate those on the same color switch
const tableStyle = (extra = {}) => ({
  head: enabled() ? ['magenta'] : [],
  border: enabled() ? ['grey'] : [],
  'padding-left': 1,
  'padding-right': 1,
  ...extra,
})

// whether the terminal can render box-drawing / block glyphs. the usual heuristic:
// a UTF-8 locale (and not the bare linux console). NO_UNICODE forces the ascii fallback.
const unicodeOk = function () {
  if (process.env.NO_UNICODE !== undefined) {
    return false
  }
  if (process.platform === 'win32') {
    return Boolean(process.env.WT_SESSION || process.env.TERM_PROGRAM === 'vscode' || process.env.TERM === 'xterm-256color')
  }
  if (process.env.TERM === 'linux') {
    return false // the linux virtual console has no box-drawing font
  }
  return /UTF-?8$/i.test(process.env.LC_ALL || process.env.LC_CTYPE || process.env.LANG || '')
}
const ascii = () => !unicodeOk()

// ascii box-drawing for cli-table3, when unicode isn't available (else its unicode default)
const ASCII_CHARS = {
  top: '-', 'top-mid': '+', 'top-left': '+', 'top-right': '+',
  bottom: '-', 'bottom-mid': '+', 'bottom-left': '+', 'bottom-right': '+',
  left: '|', 'left-mid': '+', mid: '-', 'mid-mid': '+',
  right: '|', 'right-mid': '+', middle: '|',
}
const tableChars = () => (ascii() ? ASCII_CHARS : {})

// the live heartbeat UI: a per-worker table with status chips and progress bars,
// redrawn in-place with log-update so the numbers update without scrolling.
//
// only used on a TTY. when output is piped/redirected (CI, a file, `| less`) the
// cursor tricks would just make garbage, so we fall back to plain append-only rows.

const num = (n) => n.toLocaleString()
const pct = (frac) => (Math.round(frac * 100) + '%').padStart(4)

// a progress bar, e.g. ███████░░░░░░ (or #######----- in ascii mode)
const bar = function (frac, width) {
  frac = Math.max(0, Math.min(1, frac))
  const full = Math.round(frac * width)
  const [fill, empty] = ascii() ? ['#', '-'] : ['█', '░']
  return fill.repeat(full) + dim(empty.repeat(width - full))
}

const chip = function (state) {
  const dot = ascii() ? '* ' : '● '
  if (state === 'error') return red(dot + 'error')
  if (state === 'done') return blue(dot + 'done')
  if (state === 'parked') return yellow(dot + 'parked')
  return green(dot + 'running')
}

// a worker's state, from what the pool knows right now
const workerState = function (pool, w) {
  if (pool.error) return 'error'
  if (w.finished) return 'done'
  if (pool.parked.includes(w)) return 'parked'
  return 'running'
}

// bytes read so far vs the worker's byte-range (finished workers read all of theirs)
const workerProgress = function (pool, w) {
  const size = w.rangeSize || 1
  const bytes = w.finished ? size : (pool.status[w.index]?.bytes || 0)
  return { bytes, size, frac: Math.min(1, bytes / size) }
}

// the whole frame, as one string for log-update
const render = function (pool) {
  const table = new Table({
    head: ['#', 'state', 'progress', 'processed', 'written'],
    style: tableStyle(),
    chars: tableChars(),
    colAligns: ['right', 'left', 'left', 'right', 'right'],
  })
  let readBytes = 0
  let totalBytes = 0
  pool.workers.forEach((w) => {
    const s = pool.status[w.index] || {}
    const p = workerProgress(pool, w)
    readBytes += p.bytes
    totalBytes += p.size
    table.push([
      '#' + (w.index + 1),
      chip(workerState(pool, w)),
      bar(p.frac, 16) + ' ' + pct(p.frac),
      num(s.processed || 0),
      green(num(s.written || 0)),
    ])
  })
  const overall = totalBytes === 0 ? 0 : readBytes / totalBytes
  const rss = Math.round(process.memoryUsage().rss / 1048576)
  const errors = pool.workers.reduce((n, w) => n + (pool.status[w.index]?.errors || 0), 0)
  let out = table.toString()
  out += '\n' + magenta(' overall  ') + bar(overall, 30) + ' ' + pct(overall)
  let footer = `\n   queue ${pool.queue.length}/${pool.queueLimit},  ${pool.parked.length} parked,  ${rss}mb`
  out += '\n' + dim(footer) + (errors > 0 ? red(`  errors ${num(errors)}`) : '')
  return out
}

// one plain, append-only row - for non-TTY output (unchanged from the old heartbeat)
const plainRow = function (pool) {
  const row = pool.workers
    .map((w) => {
      const s = pool.status[w.index]
      return (s ? s.written.toLocaleString() : '???').padStart(8)
    })
    .join('   ')
  const rss = Math.round(process.memoryUsage().rss / 1048576)
  return grey(row) + grey(`   │ queue ${pool.queue.length}  parked ${pool.parked.length}  rss ${rss}mb`)
}

const isTTY = () => Boolean(process.stdout.isTTY)

// a worker's per-page parse warning. the pool tallies these for the end-of-run
// report; here we only print live off a TTY (append-only). on a TTY we stay quiet -
// a print now would land in the middle of the live table - and the report sums it up.
const warn = function (pool, line) {
  if (!isTTY()) {
    console.log(red(line))
  }
}

// draw one heartbeat frame
const beat = function (pool) {
  if (isTTY()) {
    logUpdate(render(pool))
  } else {
    console.log(plainRow(pool))
  }
}

// persist the final frame and hand the cursor back, before the report
const stop = function () {
  if (isTTY()) {
    logUpdate.done()
  }
}

// ----- end-of-run report -----

const HAIR = 1048576 // bytes per MB

// 1.2s / 4m 12s / 1h 03m
const fmtDuration = function (ms) {
  if (ms < 1000) return ms + 'ms'
  const s = ms / 1000
  if (s < 60) return (Math.round(s * 10) / 10 )+ 's'
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ${Math.round(s % 60)}s`
  const h = Math.floor(m / 60)
  return `${h}h ${String(m % 60).padStart(2, '0')}m`
}

// 512 MB / 1.4 GB
const fmtSize = function (bytes) {
  const mb = bytes / HAIR
  if (mb >= 1024) return (Math.round(mb / 102.4) / 10) + ' GB'
  return Math.round(mb) + ' MB'
}

// ----- pre-run setup sheet -----

const onOff = (b) => (b ? green('included') : grey('excluded'))
const nsfwLabel = function (skipOption) {
  if (typeof skipOption === 'boolean') {
    return onOff(!skipOption)
  }
  const skipped = Object.keys(skipOption).filter((reason) => skipOption[reason] === true)
  if (skipped.length === 0) {
    return onOff(true)
  }
  return yellow('selective') + dim(' (skipping ' + skipped.join(', ') + ')')
}
const nsLabel = (ns) => {
  if (ns === null || ns === undefined) return 'all'
  if (ns === 0) return '0  ' + dim('(articles)')
  return String(ns)
}


// a table of the run's configuration, and the memory it should stay within
const preRun = function (info) {
  const { file, fileSize, workers, queueLimit, opts } = info
  const name = String(file).split(/[\\/]/).pop()
  const bound = queueLimit + workers // peak batches held in memory
  const t = new Table({ style: tableStyle(), chars: tableChars(), colAligns: ['left', 'left'] })
  t.push(['file', name + '  ' + dim('(' + fmtSize(fileSize) + ')')])
  t.push(['workers', num(workers)])
  t.push(['format', opts.format])
  t.push(['namespace', nsLabel(opts.namespace)])
  t.push(['redirects', onOff(!opts.skip_redirect)])
  t.push(['disambiguation', onOff(!opts.skip_disambig)])
  t.push(['NSFW', nsfwLabel(opts.skip_nsfw)])
  t.push(['stubs', onOff(!opts.skip_stub)])
  t.push(['batch size', num(opts.batchPageCount) + ' pages'])
  t.push(['queue limit', num(queueLimit) + ' batches'])
  t.push(['heartbeat', opts.heartbeat > 0 ? 'every ' + fmtDuration(opts.heartbeat) : grey('off')])
  t.push(['memory bound', '~' + num(bound) + ' batches  ' + dim('(~' + num(bound * opts.batchPageCount) + ' pages)')])
  console.log('\n' + magenta(' Setup'))
  console.log(t.toString())
}

// ----- end-of-run report -----

const truncate = (s, n) => {
  s = String(s)
  return s.length > n ? s.slice(0, n - 1) + (ascii() ? '~' : '…') : s
}
const pctOf = (n, total) => (total === 0 ? '0%' : Math.round((n / total) * 100) + '%')

// one combined run report: outcomes, a skip + error breakdown, and performance.
// printed once, after the live table has been persisted.
const report = function (stats) {
  const all = stats.processed || 0
  const secs = stats.took / 1000
  const perSec = (n) => (secs > 0 ? Math.round(n / secs) : n)
  const mbPerSec = secs > 0 && stats.bytes ? Math.round((stats.bytes / HAIR / secs) * 10) / 10 : 0
  const avgBatch = stats.batches > 0 ? Math.round(stats.written / stats.batches) : 0

  const t = new Table({ style: tableStyle(), chars: tableChars(), colAligns: ['left', 'right'] })
  const withPct = (n, total, color) => color(num(n)) + '  ' + dim('(' + pctOf(n, total) + ')')

  // outcomes
  t.push(['processed', num(all)])
  t.push(['written', withPct(stats.written, all, green)])
  t.push(['skipped', withPct(stats.skipped, all, cyan)])
  const reasons = [
    ['namespace', stats.skipped_namespace],
    ['redirects', stats.skipped_redirect],
    ['disambig', stats.skipped_disambig],
    ['NSFW', stats.skipped_nsfw],
    ['stubs', stats.skipped_stub],
    ['empty', stats.skipped_empty],
  ]
  reasons.forEach(([label, n]) => {
    if (n > 0) {
      t.push(['  - ' + label, grey(num(n)) + '  ' + dim('(' + pctOf(n, stats.skipped) + ' of skips)')])
    }
  })

  // errors, described by type (worst offenders first)
  if (stats.errors > 0) {
    t.push(['errors', withPct(stats.errors, all, red)])
    const types = stats.errorTypes || []
    types.slice(0, 5).forEach((e) => {
      const eg = e.title ? '  ' + dim('e.g. ' + truncate(e.title, 22)) : ''
      t.push(['  - ' + truncate(e.message, 46), grey('x' + num(e.count)) + eg])
    })
    if (types.length > 5) {
      t.push(['  ...', dim('+' + num(types.length - 5) + ' more error types')])
    }
  }

  // performance
  t.push(['duration', fmtDuration(stats.took)])
  t.push(['data read', fmtSize(stats.bytes || 0) + (mbPerSec ? '  ' + dim(mbPerSec + ' MB/s') : '')])
  t.push(['throughput', num(perSec(all)) + ' pages/s'])
  t.push(['written', num(perSec(stats.written)) + ' pages/s'])
  t.push(['workers', num(stats.workers)])
  t.push(['batches', num(stats.batches) + '  ' + dim('~' + num(avgBatch) + '/batch')])
  t.push(['peak queue', num(stats.maxQueue) + ' / ' + num(stats.workers)])
  t.push(['backpressure', stats.parked > 0 ? yellow(num(stats.parked) + ' pauses') : green('none')])
  t.push(['peak memory', fmtSize(stats.maxRss || 0)])

  const done = stats.errors > 0 ? yellow('done, with errors') : green('done')
  console.log('\n\n\n\n' + magenta(' Results') + '  ' + done)
  console.log(t.toString())
}

export { preRun, beat, stop, warn, report }
