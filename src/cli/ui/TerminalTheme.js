import { createElement as h } from 'react'
import { ThemeProvider, defaultTheme, extendTheme } from '@inkjs/ui'
import { ascii } from './format.js'

const asciiTheme = extendTheme(defaultTheme, {
  components: {
    ProgressBar: {
      config: () => ({ completedCharacter: '#', remainingCharacter: '-' })
    }
  }
})

export default function TerminalTheme({ children }) {
  return h(ThemeProvider, { theme: ascii() ? asciiTheme : defaultTheme }, children)
}
