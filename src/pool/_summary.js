// calculate sums from each worker's status
const calc = function (arr) {
  const sums = {
    processed: 0,
    skipped: 0,
    written: 0,
    errors: 0,

    skipped_namespace: 0,
    skipped_redirect: 0,
    skipped_disambig: 0,
    skipped_nsfw: 0,
    skipped_stub: 0,
    skipped_empty: 0
  }
  arr.forEach((o) => {
    sums.processed += o.processed || 0
    sums.written += o.written || 0
    sums.errors += o.errors || 0
    sums.skipped_namespace += o.skipped_namespace || 0
    sums.skipped_redirect += o.skipped_redirect || 0
    sums.skipped_disambig += o.skipped_disambig || 0
    sums.skipped_nsfw += o.skipped_nsfw || 0
    sums.skipped_stub += o.skipped_stub || 0
    sums.skipped_empty += o.skipped_empty || 0
  })
  sums.skipped =
    sums.skipped_namespace +
    sums.skipped_redirect +
    sums.skipped_disambig +
    sums.skipped_nsfw +
    sums.skipped_stub +
    sums.skipped_empty
  return sums
}

export { calc }
