import { green, yellow, grey, dim } from '../../lib/colors.js'
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
export const ascii = () => !unicodeOk()


export const num = (n) => (n || 0).toLocaleString()
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
  if (ns === null || ns === true || ns === undefined) return 'all'
  if (ns === false) return 'none'
  if (ns === 0) return '0  ' + dim('(articles)')
  if (typeof ns === 'object') {
    const included = Object.keys(ns).filter((key) => ns[key] === true)
    if (included.length === 0) return 'none'
    return included.map((key) => (key === '0' ? '0 ' + dim('(articles)') : key)).join(', ')
  }
  return String(ns)
}


const truncate = (s, n) => {
  s = String(s)
  return s.length > n ? s.slice(0, n - 1) + (ascii() ? '~' : '…') : s
}
const pctOf = (n, total) => (total === 0 ? '0%' : Math.round((n / total) * 100) + '%')


export { fmtDuration, fmtSize, nsLabel, nsfwLabel, onOff, truncate, pctOf }
