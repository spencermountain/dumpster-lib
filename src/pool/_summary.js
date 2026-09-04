import { green, magenta, cyan, grey, dim } from '../lib/colors.js'

// calculate sums from each worker
const calc = function (arr) {
  let sums = {
    processed: 0,
    skipped: 0,
    written: 0,
    errors: 0,

    skipped_namespace: 0,
    skipped_redirect: 0,
    skipped_disambig: 0,
    skipped_empty: 0
  }
  arr.forEach((o) => {
    sums.processed += o.processed || 0
    sums.written += o.written || 0
    sums.errors += o.errors || 0
    sums.skipped_namespace += o.skipped_namespace || 0
    sums.skipped_redirect += o.skipped_redirect || 0
    sums.skipped_disambig += o.skipped_disambig || 0
    sums.skipped_empty += o.skipped_empty || 0
  })
  sums.skipped =
    sums.skipped_namespace + sums.skipped_redirect + sums.skipped_disambig + sums.skipped_empty
  return sums
}

const percent = (sum, total) => {
  let p = total === 0 ? 0 : parseInt((sum / total) * 100, 10)
  return grey(' (' + p + '%)')
}
const num = (n) => {
  return n.toLocaleString().padStart(8)
}
const round = (n) => Math.round(n * 10) / 10

const printSummary = function (res) {
  let all = res.processed
  let msg = `\n\n\n${dim('-----------')}\n`
  msg += '\nProcessed:'.padEnd(16) + magenta(num(all)) + ' pages'
  msg += '\nWrote:'.padEnd(16) + green(num(res.written)) + ' ' + percent(res.written, all)
  msg += '\nSkipped:'.padEnd(16) + cyan(num(res.skipped)) + ' ' + percent(res.skipped, all)
  msg += '\n     - namespace:'.padEnd(20) + cyan(num(res.skipped_namespace))
  msg += '\n     - redirects:'.padEnd(20) + cyan(num(res.skipped_redirect))
  msg += '\n     - disambig:'.padEnd(20) + cyan(num(res.skipped_disambig))
  msg += '\n     - empty:'.padEnd(20) + cyan(num(res.skipped_empty))
  if (res.errors > 0) {
    msg += '\nErrors:'.padEnd(16) + cyan(num(res.errors))
  }
  msg += '\n\n ' + dim(`${res.batches.toLocaleString()} batches, queue peaked at ${res.maxQueue}, workers paused ${res.parked.toLocaleString()} times`)
  let mins = res.took / 1000 / 60
  msg += '\n ' + dim('took ' + round(mins) + ' mins')
  console.log(msg)
}
export { calc, printSummary }
