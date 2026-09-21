import { green, yellow, red, cyan, grey, dim } from '../../lib/colors.js'
import { num, fmtDuration, fmtSize, truncate, pctOf } from './format.js'
export const reportRows = function (stats) {
  const all = stats.processed || 0
  const secs = stats.took / 1000
  const perSec = (n) => (secs > 0 ? Math.round(n / secs) : n)
  const mbPerSec = secs > 0 && stats.bytes ? Math.round((stats.bytes / 1048576 / secs) * 10) / 10 : 0
  const avgBatch = stats.batches > 0 ? Math.round(stats.written / stats.batches) : 0

  const t = []
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

  return t
}
