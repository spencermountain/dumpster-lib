const sm = function (doc) {
  return {
    type: doc.classify()?.type,
    summary: doc.summary(),
    categories: doc.categories(),
    infobox: doc.infobox(),
  }
}
export default sm