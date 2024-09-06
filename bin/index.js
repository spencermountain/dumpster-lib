import { intro, outro } from './dialogue.js'
import getProject from './01-project.js'
import getLanguage from './02-language.js'
import getPageviews from './03-pageviews.js'
import getParser from './04-parser.js'
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'

const getArgs = function () {
  let given = yargs(hideBin(process.argv)).parse()
  delete given['$0']
  delete given['_']
  return given
}

const doPrompts = async function (name = 'dumpster') {
  let res = getArgs()

  intro(name)

  // only ask the questions we need to
  if (res.file === undefined && res.project === undefined) {
    let r = await getProject()
    Object.assign(res, r)
  }
  if (res.file === undefined && res.lang === undefined) {
    let r = await getLanguage()
    Object.assign(res, r)
  }
  if (res.lang && res.project && res.pageviews === undefined) {
    let r = await getPageviews()
    Object.assign(res, r)
  }
  if (res.parser === undefined) {
    let r = await getParser()
    Object.assign(res, r)
  }

  outro(name, res)
  return res
}

export default doPrompts
