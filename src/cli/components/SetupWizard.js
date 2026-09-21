import { createElement as h, useState, useEffect } from 'react'
import { Box, Text, useApp, useInput } from 'ink'
import defaults from '../../lib/defaults.js'
import ParamInput from './ParamInput.js'
import SkipPagesInput from './SkipPagesInput.js'
import { promptSteps } from '../prompt-steps.js'

export class PromptCancelled extends Error {
  constructor() {
    super('cancelled')
  }
}

export default function SetupWizard({ params, current, config }) {
  const { exit } = useApp()
  const [chosen, setChosen] = useState(current)
  const [step, setStep] = useState(0)
  const [cancelled, setCancelled] = useState(false)
  const steps = promptSteps(params)
  useInput((input, key) => {
    if (key.escape || (key.ctrl && input === 'c')) {
      setCancelled(true)
    }
  })
  useEffect(() => {
    if (cancelled) exit(new PromptCancelled())
    else if (step === steps.length) exit(chosen)
  }, [cancelled, step, steps.length, chosen, exit])
  const active = steps[step]
  const submit = (values) => {
    const next = { ...chosen, ...values }
    setChosen(next)
    setStep(step + 1)
  }

  const initialValue = (name) => {
    if (chosen[name] !== null && chosen[name] !== undefined) {
      return chosen[name]
    }
    if (config.defaults?.[name] !== null && config.defaults?.[name] !== undefined) {
      return config.defaults[name]
    }
    return defaults[name]
  }

  let content

  if (cancelled) {
    content = h(Text, { color: 'yellow' }, 'cancelled')
  } else if (active) {
    let input

    if (active.filters) {
      input = h(SkipPagesInput, {
        key: 'skip-pages',
        filters: active.filters,
        initial: Object.fromEntries(active.filters.map(({ name }) => [name, initialValue(name)])),
        onSubmit: submit
      })
    } else {
      input = h(ParamInput, {
        key: active.param.name,
        param: active.param,
        initial: initialValue(active.param.name),
        onSubmit: (value) => submit({ [active.param.name]: value })
      })
    }

    content = h(
      Box,
      { flexDirection: 'column' },
      h(
        Text,
        { dimColor: true },
        `Step ${step + 1}/${steps.length} - Enter to continue, Esc or Ctrl+C to cancel`
      ),
      input
    )
  } else {
    content = h(Text, { color: 'green' }, 'starting the run')
  }

  return h(
    Box,
    { flexDirection: 'column', gap: 1 },
    h(Text, { bold: true, color: 'magenta' }, config.name || 'dumpster'),
    content
  )
}
