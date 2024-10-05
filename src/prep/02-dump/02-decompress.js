/* eslint-disable no-console */
import { elapsed } from '../_fns.js'
import sh from 'shelljs'
// import decompress from '@xhmikosr/decompress';

const decompressDump = async function (file) {
  console.log('Decompressing file:')
  let start = Date.now()
  // await decompress(file, '.')
  let cmd = `bzip2 -d ${file}`
  sh.exec(cmd)
  elapsed(start)
  console.log('Wikimedia dump decomression done');
}
export default decompressDump