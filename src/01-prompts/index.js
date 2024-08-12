import showBanner from './00-banner.js'
import getProject from './01-project.js'
import getLanguage from './02-language.js'
import getPageviews from './03-pageviews.js'
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'

const getArgs = function () {
  let given = yargs(hideBin(process.argv)).parse()
  delete given['$0']
  delete given['_']
  return given
}

const doPrompts = async function (morePrompts, override) {
  let res = getArgs()

  showBanner('dumpster-duck')

  // only ask the questions we need to
  let obj = res.project ? {} : await getProject()
  Object.assign(res, obj)
  obj = res.lang ? {} : await getLanguage()
  Object.assign(res, obj)
  obj = res.pageviews ? {} : await getPageviews()
  Object.assign(res, obj)

  console.log(res)
  return res
}

export default doPrompts
