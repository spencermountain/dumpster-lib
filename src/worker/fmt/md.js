const md = function (doc) {
  return {
    type: doc.classify()?.type,
    summary: doc.summary(),
    categories: doc.categories(),
    infobox: doc.infobox(),
    links: doc.links(),
    intro: doc.sections()[0]?.text() || '',
  }
}
export default md