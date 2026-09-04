// builds a miniature pages-articles xml dump, in the same shape wikimedia ships it.
import { writeFileSync, mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'

const page = function ({ id, title, ns, text, redirect }) {
  return `  <page>
    <title>${title}</title>
    <ns>${ns}</ns>
    <id>${id}</id>
    ${redirect ? `<redirect title="${redirect}" />` : ''}
    <revision>
      <id>${id * 100}</id>
      <timestamp>2024-01-0${(id % 9) + 1}T00:00:00Z</timestamp>
      <model>wikitext</model>
      <format>text/x-wiki</format>
      <text bytes="${text.length}" xml:space="preserve">${text}</text>
    </revision>
  </page>
`
}

const header = `<mediawiki xmlns="http://www.mediawiki.org/xml/export-0.11/" version="0.11" xml:lang="en">
  <siteinfo>
    <sitename>Tinywiki</sitename>
    <dbname>tinywiki</dbname>
    <namespaces>
      <namespace key="0" case="first-letter" />
      <namespace key="14" case="first-letter">Category</namespace>
    </namespaces>
  </siteinfo>
`

const para = "'''Tinytown''' is a town in [[Ontario]], with a {{convert|10|km}} main street &amp; a &lt;ref&gt;citation&lt;/ref&gt;. "

// `count` pages: mostly small articles, some big ones (so worker seams land mid-page),
// every 10th a redirect, every 25th a category page
const makeFixture = function (count = 300) {
  const pages = []
  const expect = { articles: [], redirects: 0, otherNs: 0 }
  for (let id = 1; id <= count; id += 1) {
    const title = `Page ${id}`
    if (id % 10 === 0) {
      pages.push({ id, title, ns: 0, text: '#REDIRECT [[Page 1]]', redirect: 'Page 1' })
      expect.redirects += 1
    } else if (id % 25 === 0) {
      pages.push({ id, title: `Category:Cat ${id}`, ns: 14, text: 'a category' })
      expect.otherNs += 1
    } else {
      const reps = id % 40 === 1 ? 600 : 1 + (id % 5) // a few ~70kb pages
      let text = para.repeat(reps)
      text += `\n\n==History==\nFounded in ${1800 + id}.\n[[Category:Towns]]`
      pages.push({ id, title, ns: 0, text })
      expect.articles.push(title)
    }
  }
  const xml = header + pages.map(page).join('') + '</mediawiki>\n'
  const dir = mkdtempSync(path.join(tmpdir(), 'dumpster-lib-'))
  const file = path.join(dir, 'tinywiki-latest-pages-articles.xml')
  writeFileSync(file, xml)
  return { file, dir, count, expect }
}
export default makeFixture
