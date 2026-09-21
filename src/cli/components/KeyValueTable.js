import { createElement as h } from 'react'
import { Box, Text } from 'ink'

export default function KeyValueTable({ rows }) {
  return h(Box, { flexDirection: 'column', paddingLeft: 1 },
    rows.map(([label, value], index) => h(Box, { key: index },
      h(Box, { width: '35%', flexShrink: 0 }, h(Text, { dimColor: true }, label)),
      h(Box, { flexGrow: 1, flexBasis: 0 }, h(Text, null, String(value)))
    ))
  )
}
