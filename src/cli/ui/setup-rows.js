import { grey, dim } from '../../lib/colors.js'
import { num, fmtDuration, fmtSize, nsLabel, nsfwLabel, onOff } from './format.js'
export const setupRows = function (info) {
  const { file, fileSize, workers, queueLimit, opts } = info
  const name = String(file).split(/[\\/]/).pop()
  const bound = queueLimit + workers // peak batches held in memory
  const t = []
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
  return t
}
