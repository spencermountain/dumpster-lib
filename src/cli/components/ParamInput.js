import { createElement as h, useState } from 'react'
import { Box, Text } from 'ink'
import { TextInput, Select, ConfirmInput } from '@inkjs/ui'
import { promptValue } from '../prompt-value.js'

export default function ParamInput({ param, initial, onSubmit }) {
  const [error, setError] = useState('')
  const submit = (input) => {
    try {
      const value = promptValue(param, input, initial)
      setError('')
      onSubmit(value)
    } catch (err) {
      setError(err.message)
    }
  }
  let input
  if (param.type === 'select') {
    const choices = param.choices.map((c) => typeof c === 'string' ? { value: c, label: c } : c)
    // Ink UI uses string keys; preserve arbitrary values in plugin choice schemas.
    const selected = choices.findIndex((c) => Object.is(c.value, initial))
    // Ink UI focuses the first option, independently of defaultValue. Put the
    // current choice first and leave it uncommitted so Enter always submits.
    if (selected > 0) choices.unshift(...choices.splice(selected, 1))
    input = h(Select, {
      options: choices.map((c, i) => ({ label: c.label, value: String(i) })),
      onChange: (key) => submit(choices[Number(key)].value)
    })
  } else if (param.type === 'boolean') {
    input = h(ConfirmInput, {
      defaultChoice: initial ? 'confirm' : 'cancel',
      onConfirm: () => submit(true),
      onCancel: () => submit(false)
    })
  } else {
    input = h(TextInput, {
      defaultValue: initial == null ? '' : String(initial),
      onSubmit: submit
    })
  }
  return h(Box, { flexDirection: 'column' },
    h(Text, { bold: true }, param.desc),
    input,
    error && h(Text, { color: 'red' }, error)
  )
}
