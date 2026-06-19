const filterPage = function (page) {
  if (page.isRedirect) {
    return 'redirect'
  } else if (page.isDisambig) {
    return 'disambig'
  } else if (page.isEmpty) {
    return 'empty'
  }
  return true // keep all pages
}

export default filterPage