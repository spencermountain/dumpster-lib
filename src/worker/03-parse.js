import wtf from 'wtf_wikipedia'
import wtfPluginSummary from 'wtf-plugin-summary'
import wtfPluginClassify from 'wtf-plugin-classify'
import wtfPluginHtml from 'wtf-plugin-html'
import wtfPluginMarkdown from 'wtf-plugin-markdown'
import wtfPluginI18n from 'wtf-plugin-i18n'
import wtfPluginNsfw from 'wtf-plugin-nsfw'

import sm from './output/sm.js'
import md from './output/md.js'

wtf.plugin(wtfPluginI18n)
wtf.plugin(wtfPluginSummary)
wtf.plugin(wtfPluginClassify)
wtf.plugin(wtfPluginHtml)
wtf.plugin(wtfPluginMarkdown)
wtf.plugin(wtfPluginNsfw)

//spaces to underscores
const encodeTitle = (title) => {
  return title.trim().replace(/ /g, '_')
}

const toOutputFormat = (doc, fmt) => {
  if (fmt === 'text') {
    return { text: doc.text() }
  } else if (fmt === 'sm') {
    return sm(doc)
  } else if (fmt === 'md') {
    return md(doc)
  } else if (fmt === 'lg') {
    return doc.json()
  } else if (fmt === 'xl') {
    let res = doc.json()
    res.text = doc.text()
    return res
  } else if (fmt === 'html') {
    return { html: doc.html() }
  } else if (fmt === 'markdown') {
    return { markdown: doc.markdown() }
  } else if (fmt === 'json') {
    return doc.json()
  } else {
    return doc.json()
  }
}

const parsePage = function (meta, fmt) {
  // parse the wikitext
  let doc = wtf(meta.wiki, meta)
  // actually process the page
  let body = toOutputFormat(doc, fmt)
  let title = meta.title //|| doc.title()
  const result = {
    title,
    pageID: meta.pageID,
    encoded_title: encodeTitle(title),
    isRedirect: doc.isRedirect(),
    isDisambig: doc.isDisambig(),
    revisionID: meta.revisionID,
    timestamp: meta.timestamp,
    ns: meta.namespace,
  }
  return Object.assign(result, body)
}

export default parsePage