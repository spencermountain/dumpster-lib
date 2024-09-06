
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
export { elapsed, getFileSize }
