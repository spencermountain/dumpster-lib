const onCancel = function () {
  console.log('\n\nExit dumpster script ✌️.\n')
  process.exit()
}

const toParams = function (name, opts) {
  let cmd = `npx ${name}`
  if (opts.file) {
    cmd += ` --file=${opts.file}`
  }
  if (opts.project) {
    cmd += ` --project=${opts.project}`
  }
  if (opts.lang) {
    cmd += ` --lang=${opts.lang}`
  }
  if (opts.pageviews) {
    cmd += ` --pageviews`
  }
  if (opts.format === 'json' || opts.format === 'text') {
    cmd += ` --format=${opts.format}`
  }
  return cmd
}

export { onCancel, toParams }
