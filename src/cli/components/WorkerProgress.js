import { createElement as h } from 'react'
import { Box, Text } from 'ink'
import { ProgressBar } from '@inkjs/ui'
import { num } from '../ui/format.js'

const stateColors = { running: 'green', parked: 'yellow', done: 'blue', error: 'red' }

export default function WorkerProgress({ worker }) {
  return h(Box, { flexDirection: 'column' },
    h(Text, null,
      `#${worker.index + 1} `,
      h(Text, { color: stateColors[worker.state] }, worker.state),
      `  processed ${num(worker.processed)}  written ${num(worker.written)}`),
    h(Box, null,
      h(ProgressBar, { value: worker.progress }),
      h(Box, { width: 5, flexShrink: 0 },
        h(Text, null, `${Math.round(worker.progress)}%`.padStart(5))))
  )
}
