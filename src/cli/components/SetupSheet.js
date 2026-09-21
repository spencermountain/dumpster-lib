import { createElement as h } from 'react'
import { Box, Text } from 'ink'
import KeyValueTable from './KeyValueTable.js'
import { setupRows } from '../ui/setup-rows.js'

export default function SetupSheet({ info }) {
  return h(Box, { flexDirection: 'column', marginY: 1 },
    h(Text, { bold: true, color: 'magenta' }, 'Setup'),
    h(KeyValueTable, { rows: setupRows(info) })
  )
}
