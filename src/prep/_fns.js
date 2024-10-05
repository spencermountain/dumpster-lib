
const dim = (str) => '\x1b[2m' + str + '\x1b[0m'
const round = (n) => Math.round(n * 10) / 10

const getFileSize = async function (url) {
  const response = await fetch(url, { method: 'head' });
  const result = response.headers['content-length'];
  console.log(`Target size: ${result}`);
  return result
}

const elapsed = function (start) {
  let diff = Date.now() - start
  let mins = diff / 1000 / 60
  let msg = '\n\n ' + dim('took ' + round(mins) + ' mins')
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

export { elapsed, getFileSize, encodeTitle }
