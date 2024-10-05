/* eslint-disable no-console */
import { elapsed } from '../_fns.js'
import sh from 'shelljs'
// import decompress from '@xhmikosr/decompress';

const decompressDump = async function (file) {
  console.log('  Decompressing file:')
  let start = Date.now()
  sh.exec(`bzip2 -d ${file}`)
  elapsed(start)
  console.log('Wikimedia dump decomression done');
  // sh.exec(`rm ${file}`)
}
export default decompressDump