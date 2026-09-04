
### 0.1.0 [Sep 2026]
- **[new]** - backpressure: workers pause while the writer catches up, memory stays bounded
- **[new]** - `batch` and `end` listeners may return a promise, which is awaited
- **[new]** - `pool.done` promise, resolves with run stats
- **[new]** - `highWater` option, heartbeat shows queue depth, parked workers and memory
- **[change]** - replaced sunday-driver with a pull-based reader. its pause did not hold for async consumers, and dropped pages
- **[fix]** - workers split the file on exact `<page>` boundaries - no more mangled pages at the seams
- **[fix]** - `redirects` and `disambiguation` options are now honoured
- **[fix]** - `end` waited for nobody, and `process.exit` could cut in-flight writes short
- **[change]** - `chunkSize` option renamed to `batchPageCount`, `chunk` event renamed to `batch`
- **[change]** - default `batchPageCount` is 100, default `workers` is cpu count − 1
