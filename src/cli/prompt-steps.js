const skipLabels = {
  skip_redirect: 'Redirect pages',
  skip_disambig: 'Disambiguation pages',
  skip_nsfw: 'NSFW pages',
  skip_stub: 'Stub pages'
}

// Group the core filters at the first skip prompt, leaving plugin prompts in order.
export function promptSteps(params) {
  const filters = params.filter((param) => Object.hasOwn(skipLabels, param.name))
  const steps = []
  for (const param of params) {
    if (!filters.includes(param)) steps.push({ param })
    else if (param === filters[0]) {
      steps.push({ filters: filters.map((filter) => ({ ...filter, label: skipLabels[filter.name] })) })
    }
  }
  return steps
}
