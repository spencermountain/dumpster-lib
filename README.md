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
- `namespace` - which namespace to keep (default 0. `null` for all)
- `redirects` - keep redirect pages (default false)
- `disambiguation` - keep disambiguation pages (default true)
- `heartbeat` - ms between status lines (default 5000. `0` to disable)

the heartbeat prints each worker's page count, then `queue` (batches waiting for your writer), `parked` (workers paused waiting for room) and memory. if `parked` sits near the worker count, the writer is the bottleneck - try fewer workers, or bigger batches.

MIT

### Testing a writer

`dumpster-lib/fixture` builds a tiny, realistic dump in a temp directory, for the tests of a writer library:

```js
import makeFixture from 'dumpster-lib/fixture'
const { file, dir, expect } = makeFixture(300) // 300 pages. expect.articles lists the titles that should arrive
```
