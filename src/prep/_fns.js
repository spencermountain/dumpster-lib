
const dim = (str) => '\x1b[2m' + str + '\x1b[0m'
const red = str => '\x1b[31m' + str + '\x1b[0m'
const blue = str => '\x1b[34m' + str + '\x1b[0m'
const yellow = str => '\x1b[33m' + str + '\x1b[0m'
const b = str => '\x1b[1m' + str + '\x1b[0m'
const green = str => '\x1b[32m' + str + '\x1b[0m'
const cyan = str => '\x1b[36m' + str + '\x1b[0m'

const round = (n) => Math.round(n * 10) / 10

function humanFileSize(size) {
  var i = size == 0 ? 0 : Math.floor(Math.log(size) / Math.log(1024));
  return +((size / Math.pow(1024, i)).toFixed(2)) * 1 + ' ' + ['B', 'kB', 'MB', 'GB', 'TB'][i];
}

const getFileSize = async function (url) {
  const response = await fetch(url, { method: 'head' });
  const result = response.headers.get('content-length');
  console.log(green(`     File size: ${humanFileSize(result)}`));
  return result
}

const elapsed = function (start) {
  let diff = Date.now() - start
  let mins = diff / 1000 / 60
  let msg = dim('   took ' + round(mins) + ' mins\n\n')
  console.log(msg)
}

// get ready for filename
const encodeTitle = function (title) {
  title = title || ''
  title = title.trim()
  //titlecase it
  title = title.charAt(0).toUpperCase() + title.substring(1)
  //spaces to underscores
  title = title.replace(/ /g, '_')
  // escape slashes, or possible absolute paths
  title = encodeURIComponent(title)
  // clobber any potential dot files, or relative paths
  title = title.replace(/^\./g, '\\./')
  // some operating systems complain with long filenames
  if (title.length >= 255) {
    title = title.substr(0, 254) //truncate it
  }
  return title
}


export { elapsed, getFileSize, encodeTitle, red, blue, yellow, b, dim, cyan }
