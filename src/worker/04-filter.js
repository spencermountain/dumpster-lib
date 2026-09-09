const skipNsfw = function (reason, option) {
  if (typeof option === 'boolean') {
    return option
  }
  return option[reason] === true
}

const filterPage = function (page, opts) {
  if (page.isRedirect && opts.skip_redirect) {
    return 'redirect'
  } else if (page.isDisambig && opts.skip_disambig) {
    return 'disambig'
  } else if (page.isNsfw && skipNsfw(page.nsfwReason, opts.skip_nsfw)) {
    return 'nsfw'
  } else if (page.isEmpty) {
    return 'empty'
  }
  return true // keep this page
}

export default filterPage
