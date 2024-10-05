/* eslint-disable no-console */
import fetch from 'node-fetch'
import fs from 'node:fs'
import path from 'node:path'
const blue = (str) => '\x1b[34m' + str + '\x1b[0m'

function print(txt) {
  // console.log(txt)
  process.stdout.clearLine()
  process.stdout.cursorTo(0)
  process.stdout.write(txt)
}

const wget = async function (url, dir) {
  let parts = new URL(url).pathname.split(/\//)
  let filename = parts[parts.length - 1]
  let file = path.join(dir, filename)
  // don't clobber existing file
  if (fs.existsSync(file) || fs.existsSync(file.replace(/\.bz2$/, ''))) {
    console.log(blue(`\n   File exists, skipping download: \n'${file}'\n`))
    return
  }
  const res = await fetch(url)
  const fileStream = fs.createWriteStream(file)
  await new Promise((resolve, reject) => {
    let done = 0
    let total = Number(res.headers.get('content-length'))
    res.body.pipe(fileStream)
    let timer = setInterval(() => print(Math.floor((done / total) * 100) + '%'), 1000)
    res.body.on('data', (chunk) => (done += chunk.length))
    res.body.on('error', (error) => {
      print('')
      clearInterval(timer)
      console.log(error)
      reject()
    })
    fileStream.on('finish', () => {
      print('')
      clearInterval(timer)
      resolve()
    })
  })
}

export default wget
// wget('http://192.168.2.198/api/static/movies%2FBetween.The.Lines.1977.mp4', './foo.mp4')
