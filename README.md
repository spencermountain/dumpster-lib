# dumpster-lib

shared resources for [dumpster-dip](https://github.com/spencermountain/dumpster-dip), [dumpster-dive](https://github.com/spencermountain/dumpster-dive/), [dumpster-duck](https://github.com/spencermountain/dumpster-duck/) and [dumpster-disk](https://github.com/spencermountain/dumpster-disk/)

used to download, unzip, and parse wikipedia dumps, other wikimedia dumps, and 3rd-party mediawiki dumps.

it parses the dump in worker threads, and hands you the results in batches. your `batch` listener is the writer - it can write to a database, the filesystem, or do nothing at all.

### Usage

```js
import dumpster from 'dumpster-lib'

const pool = dumpster({
  project: 'wikipedia',
  lang: 'sw',
  format: 'text',
  batchPageCount: 100,
  file: './swwiki-latest-pages-articles.xml'
})
pool.on('batch', (pages) => {
  console.log(pages.length, 'pages to write')
})
pool.on('end', (stats) => {
  console.log('end', stats)
})
```

### Backpressure

the workers will always out-run a slow writer, so the pool paces them: each worker parses `batchPageCount` pages, hands them over, and waits until the pool has room for more. memory stays bounded at about `(queueLimit + workers)` batches, no matter how slow the writer is.

a `batch` listener can be sync or async. **if it starts async work, return the promise** - the pool waits for it before handing over the next batch:

```js
pool.on('batch', async (pages) => {
  await db.insertMany(pages)
})
```

the returned promise means "ready for more", not "durably written" - a writer can keep a few writes in-flight itself, and only await when it hits its own limit.

`end` listeners are awaited too, so flush and close your database there:

```js
pool.on('end', async () => {
  await db.close()
})
```

if a listener throws (or rejects), the run stops, the workers are torn down, and `error` fires.

you can also await the whole thing:

```js
const stats = await pool.done
```

### Options

- `file` - path to the (unzipped) xml dump
- `format` - shape of each page: `text`, `sm` (type, summary, categories, infobox), `md` (sm + templates, links, intro), `lg`, `xl`, `html`, `markdown`, `json` (default)
- `batchPageCount` - pages per batch (default 100)
- `workers` - parsing threads (default: cpu count − 1, leaving a core for the main thread and your writer)
- `queueLimit` - batches the main thread holds before pausing the workers (default: one per worker)
- `namespace` - namespace inclusion rule (default 0): an integer keeps one namespace; `true` or `null` keeps all; `false` keeps none; an object such as `{ 0: true, 14: false }` keeps keys set to true and excludes false or omitted keys
- `skip_redirect` - skip redirect pages (default true)
- `skip_disambig` - skip disambiguation pages (default false)
- `skip_nsfw` - skip pages flagged by `wtf-plugin-nsfw` (default false). set true to filter all flagged pages, or pass a reason map such as `{ Weapons: false, 'Drug-use': true }`. omitted reasons are not skipped.
- `skip_stub` - skip pages identified by `wtf_wikipedia`'s `isStub()` method (default false)
- `heartbeat` - ms between status lines (default 5000. `0` to disable)

flagged pages include `isNsfw: true` and an `nsfwReason`. the plugin's current reasons are `Sexuality`, `Drug-use`, `Weapons`, `Violence`, `Profanity`, and `Obscenity`:

```js
const pool = dumpster({
  file: './enwiki-latest-pages-articles.xml',
  skip_nsfw: {
    Weapons: false,
    'Drug-use': true
  }
})
```

this keeps weapon-related pages and filters drug-related pages. omitted reasons are kept.

the heartbeat prints each worker's page count, then `queue` (batches waiting for your writer), `parked` (workers paused waiting for room) and memory. if `parked` sits near the worker count, the writer is the bottleneck - try fewer workers, or bigger batches.

### TypeScript

the package includes declarations for `dumpster-lib`, `dumpster-lib/cli`, and `dumpster-lib/fixture`. page types are inferred from the literal `format` option, and the core types can be imported by name.

MIT

### CLI

every dumpster tool shares one command-line interface. the lib's own default command parses a dump and reports what's in it, without writing anything - handy for inspecting or benchmarking a file:

```
npx dumpster ./swwiki-latest-pages-articles.xml --format sm
```

the flags mirror the options above (`--file`, `--format`, `--lang`, `--workers`, `--namespace`, `--batch-page-count`, `--queue-limit`, `--skip-redirect`, `--skip-disambig`, `--skip-nsfw`, `--skip-stub`, `--heartbeat`). each skip flag also has a `--no-skip-*` form. run it with no file - or with `-i` - and it walks you through a guided setup, prompting only for what it needs. run it with the required options and it starts right away. it prints the setup, a live-updating per-worker table, and a final report (all of which degrade to plain text / ascii when piped or when `NO_COLOR` / `NO_UNICODE` is set).

### CLI for a writer plugin

a writer library (dumpster-disk, dumpster-duck, …) gives its users the same CLI by calling the shared runner with its own writer and any extra options:

```js
#!/usr/bin/env node
import run from 'dumpster-lib/cli'

run({
  name: 'dumpster-disk',
  description: 'parse a wikipedia dump to files on disk',
  params: [
    { name: 'out', flags: '-o, --out <dir>', desc: 'output directory', type: 'string', required: true, guided: true },
  ],
  writer: (pool, opts) => {
    pool.on('batch', async (pages) => {
      // write pages to opts.out
    })
    pool.on('end', async () => {
      // flush and close
    })
  },
})
```

point the package's `bin` at that file, and `npx dumpster-disk <file> --out ./pages` inherits every core option, the guided prompts, the shared validation, and the setup/heartbeat/report UI - the plugin only describes its own extra options and its writer. a `param` has: `name` (the option key), `flags` (commander spec), `desc`, `type` (`string`/`number`/`select`/`boolean`/`path`), and optionally `required`, `guided` (include in the guided setup), `choices` (for `select`), `parse` (coercion) and `validate`.

### Testing a writer

`dumpster-lib/fixture` builds a tiny, realistic dump in a temp directory, for the tests of a writer library:

```js
import makeFixture from 'dumpster-lib/fixture'
const { file, dir, expect } = makeFixture(300) // 300 pages. expect.articles lists the titles that should arrive
```
