/* eslint-disable no-console */
import fs from 'node:fs'
import { red, blue, grey } from '../lib/colors.js'
import path from 'node:path'
const root = process.cwd()

const checkFile = function (file) {
  if (!file || !fs.existsSync(file)) {
    console.log(red('\n  --can\'t find file:  "' + blue(file) + '" ---'))
    console.log(grey('     please supply a filename for the wikipedia article dump in xml format'))
    process.exit(1)
  }
  if (/\.bz2$/.test(file)) {
    console.log(red('\n    --- hello, please unzip this file first  ---'))
    console.log(grey('     ($ bzip2 -d ' + file + ' )'))
    process.exit(1)
  }
}

const makeDir = function (name) {
  let dir = name
  if (!path.isAbsolute(name)) {
    dir = path.join(root, name)
  }
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
}
export { checkFile, makeDir }
