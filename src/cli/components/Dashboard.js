import { createElement as h } from 'react'
import { Box, Text } from 'ink'
import { ProgressBar } from '@inkjs/ui'
import WorkerProgress from './WorkerProgress.js'

export default function Dashboard({ frame }) {
  return h(Box, { flexDirection: 'column' },
    frame.workers.map((worker) => h(WorkerProgress, { key: worker.index, worker })),
    h(Box, { marginTop: 1 },
      h(Text, { color: 'magenta' }, 'overall '),
      h(ProgressBar, { value: frame.progress }),
      h(Box, { width: 5, flexShrink: 0 },
        h(Text, null, `${Math.round(frame.progress)}%`.padStart(5)))),
    h(Text, { dimColor: true }, `queue ${frame.queue}/${frame.queueLimit}, ${frame.parked} parked, ${frame.rss}mb`),
    frame.errors > 0 && h(Text, { color: 'red' }, `errors ${frame.errors.toLocaleString()}`)
  )
}
