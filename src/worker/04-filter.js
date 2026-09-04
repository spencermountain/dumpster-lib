const filterPage = function (page, opts) {
  if (page.isRedirect && !opts.redirects) {
    return 'redirect'
  } else if (page.isDisambig && !opts.disambiguation) {
    return 'disambig'
  } else if (page.isEmpty) {
    return 'empty'
  }
  return true // keep this page
}

export default filterPage
