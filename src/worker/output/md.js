const md = function (doc) {
  return {
    type: doc.classify()?.type,
    summary: doc.summary(),
    categories: doc.categories(),
    infobox: doc.infobox(),
    templates: doc.templates().map((t) => t.json()),
    links: doc.links(),
    intro: doc.sections()[0]?.text() || '',
  }
}
export default md
