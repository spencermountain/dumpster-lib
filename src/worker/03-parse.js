import wtf from 'wtf_wikipedia'

//spaces to underscores
const encodeTitle = (title) => {
  return title.trim().replace(/ /g, '_')
}

const toOutputFormat = (doc, fmt) => {
  if (fmt === 'text') {
    return { text: doc.text() }
  } else if (fmt === 'html') {
    return { html: doc.html() }
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
    id: meta.pageID,
    encoded_title: encodeTitle(title),
    isRedirect: doc.isRedirect(),
    isDisambig: doc.isDisambig(),
    revisionID: meta.revisionID,
    timestamp: meta.timestamp,
    ns: meta.namespace,
    lang: meta.lang,
    project: meta.project,
    body
  }
  return result
}

export default parsePage