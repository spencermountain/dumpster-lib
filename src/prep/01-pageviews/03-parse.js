import sh from 'shelljs'
import fs from 'node:fs'
const tsvOut = './pageviews.tsv'
import { dim } from '../_fns.js'

const round = n => Math.round(n * 10) / 10

const parsePageviews = function (file, lang, project) {
  const jsonOut = `./${lang}-${project}-pageviews.json`

  if (fs.existsSync(jsonOut)) {
    console.log(dim('     Pageviews output file exists, skipping parsing.'))
    return
  }

  //filter large pageview file down to our project-lang only
  console.log(dim(`    parsing pageview counts`))
  sh.exec(`grep '^${lang}.${project} .* desktop ' ${file} > ${tsvOut}`)

  let counts = {}
  let max = 0
  let total = 0
  // turn tsv into key-value
  let arr = fs.readFileSync(tsvOut).toString().split(/\n/)
  for (let i = 0; i < arr.length; i += 1) {
    let a = arr[i].split(' ')
    let title = a[1]
    if (title !== undefined && a[4] !== '1') {
      // title = encodeTitle(title)
      let num = Number(a[4])
      counts[title] = num
      if (num > max) {
        max = num
      }
      total += 1
    }
  }
  fs.writeFileSync(jsonOut, JSON.stringify(counts, null, 2))
  console.log(`    max pageview: ${max.toLocaleString()}`)
  console.log('    mean: ', round(total / Object.keys(counts).length))
  console.log('\n\n')

  // cleanup tmp file
  sh.exec(`rm ${tsvOut}`)
}

export default parsePageviews