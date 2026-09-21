import { createElement as h } from 'react'
import { Box, Text } from 'ink'
import { MultiSelect } from '@inkjs/ui'

export default function SkipPagesInput({ filters, initial, onSubmit }) {
  return h(Box, { flexDirection: 'column' },
    h(Text, { bold: true }, 'Which pages should be skipped?'),
    h(Text, { dimColor: true }, 'Arrows to move, Space to toggle, Enter to continue. Select none to keep all.'),
    h(MultiSelect, {
      options: filters.map(({ name, label }) => ({ value: name, label })),
      defaultValue: filters.filter(({ name }) => Boolean(initial[name])).map(({ name }) => name),
      onSubmit: (selected) => onSubmit(Object.fromEntries(
        filters.map(({ name }) => [name, selected.includes(name)])
      ))
    })
  )
}
