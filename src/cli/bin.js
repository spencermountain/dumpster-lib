#!/usr/bin/env node
import { readFileSync } from 'node:fs'
import run from './index.js'

const pkg = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url)))

// the default command: parse a dump and print the report, with no writer attached.
// useful for inspecting or benchmarking a dump. writer plugins call run() with their own writer.
run({
  name: 'dumpster',
  version: pkg.version,
  description: 'parse a wikimedia dump and report what is in it (no writer attached)',
})
