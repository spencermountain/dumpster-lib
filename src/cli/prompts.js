import { createElement as h } from 'react'
import { render } from 'ink'
import SetupWizard from './components/SetupWizard.js'
import TerminalTheme from './ui/TerminalTheme.js'

export { PromptCancelled } from './components/SetupWizard.js'

export async function promptParams(params, current, config, streams = {}) {
  if (params.length === 0) return { ...current }
  const app = render(h(TerminalTheme, null, h(SetupWizard, { params, current, config })), {
    ...streams,
    exitOnCtrlC: false
  })
  try {
    return await app.waitUntilExit()
  } finally {
    app.unmount()
    app.cleanup()
  }
}
