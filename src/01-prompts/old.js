#!/usr/bin/env node
import prompt from 'prompt'
import optimist from 'optimist'

import fs from 'node:fs'
import path from 'node:path'
import { whichFormat } from './prompts.js'

const dir = process.cwd()

var schema = {
  properties: {
    lang: {
      type: 'string',
      description: '\nWhich language wikipedia to download? (please use 2-letter code)',
      mesage: "Use 'fr' to download the french wikipedia, etc.",
      required: true,
      default: 'en'
    },
    output: {
      description: '\nWhat format do you want the results to be?',
      message: 'hash, flat, encyclopedia, enclyclopedia-two, or ndjson',
      default: 'hash'
    },
    pageviews: {
      description: 'Do you also want to download pageviews data? y/n',
      message: 'To include pageview data, type y',
      validator: /y[es]*|n[o]?/,
      default: 'n'
    },
  }
}


console.log('\n\nWelcome to dumpster-duck\n   a utility to download and parse a wikimedia dump.\n\n')
prompt.start()
prompt.override = optimist.argv

const status = await prompt.get(schema)

if (!status.output) {
  status.output = await whichFormat()
}

// co-erce to boolean
status.pageviews = status.pageviews === 'y' ? true : false
status.text = status.text === 'y' ? true : false




console.log('\n\nBeginning to process wikipedia dump:\n')
let opts = {
  input: file,
  outputMode: status.output,
  pageviews: status.pageviews,
  parse: function (doc) {
    return doc.json()
  }
}
if (status.text) {
  opts.parse = function (doc) {
    return doc.text()
  }
}
console.log(opts)
