
const dim = (str) => '\x1b[2m' + str + '\x1b[0m'
const round = (n) => Math.round(n * 10) / 10

const elapsed = function (start) {
  let diff = Date.now() - start
  let mins = diff / 1000 / 60
  let msg = '\n\n ' + dim('took ' + round(mins) + ' mins')
  console.log(msg)
}
export { elapsed }
