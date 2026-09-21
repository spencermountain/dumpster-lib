import { createElement as h } from 'react'
import { Box, Text } from 'ink'
import KeyValueTable from './KeyValueTable.js'
import { reportRows } from '../ui/report-rows.js'

export default function ResultsReport({ stats }) {
  return h(Box, { flexDirection: 'column', marginY: 1 },
    h(Text, { bold: true, color: 'magenta' }, 'Results  ',
      h(Text, { color: stats.errors > 0 ? 'yellow' : 'green' }, stats.errors > 0 ? 'done, with errors' : 'done')),
    h(KeyValueTable, { rows: reportRows(stats) })
  )
}
