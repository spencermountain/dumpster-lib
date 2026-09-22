import test from 'tape'
import TapDance from 'tap-dancer'
import { pipeline } from 'node:stream'
import { readdirSync } from 'node:fs'

// Wait for ESM dependencies to load before Tape starts running tests.
test.wait()

const reporter = new TapDance()
reporter.on('complete', (results) => {
  if (!results.ok) process.exitCode = 1
})

pipeline(test.createStream(), reporter, process.stdout, (err) => {
  if (err) {
    console.error(err)
    process.exitCode = 1
  }
})

for (const file of readdirSync(new URL('.', import.meta.url)).sort()) {
  if (file.endsWith('.test.js')) await import(new URL(file, import.meta.url))
}
test.run()
