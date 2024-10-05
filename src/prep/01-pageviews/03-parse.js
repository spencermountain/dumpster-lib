import sh from 'shelljs'
import fs from 'node:fs'
const tsvOut = './pageviews.tsv'
const jsonOut = './pageviews.json'

//spaces to underscores
const encodeTitle = (title) => {
  return title.trim().replace(/ /g, '_')
}

const parsePageviews = function (file, lang, project) {
  //filter-it down to our project only
  console.log(`Parsing ${lang} ${project} counts from pageview data:`)
  let cmd = `grep '^${lang}.${project} .* desktop ' ${file} > ${tsvOut}`
  sh.exec(cmd)

  let counts = {}
  let max = 0
  let total = 0
  // turn tsv into key-value
  let arr = fs.readFileSync(tsvOut).toString().split(/\n/)
  for (let i = 0; i < arr.length; i += 1) {
    let a = arr[i].split(' ')
    let title = a[1]
    if (title !== undefined && a[4] !== '1') {
      title = encodeTitle(title)
      let num = Number(a[4])
      counts[title] = num
      if (num > max) {
        max = num
      }
      total += 1
    }
  }
  console.log('  writing pageviews:')
  fs.writeFileSync(jsonOut, JSON.stringify(counts, null, 2))
  console.log('    wrote pageviews json')
  console.log(`    max pageview: ${max.toLocaleString()}`)
  console.log('    mean: ', total / Object.keys(counts).length)
  console.log('\n\n')

  // cleanup tmp file
  sh.exec(`rm ${tsvOut}`)
}

export default parsePageviews