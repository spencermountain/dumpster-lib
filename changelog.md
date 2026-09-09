
### 0.1.0 [Sep 2026]
- **[new]** - shared CLI: `dumpster-lib/cli` runner + a default `dumpster` command; writer plugins wire their own `npx` command through it. commander flags, guided `@clack/prompts` setup for missing options
- **[new]** - setup + report tables, live in-place heartbeat table (cli-table3 + log-update), honoring `NO_COLOR` / `NO_UNICODE`
- **[change]** - `engines.node` is now `>=20` (CLI dependencies)
- **[new]** - backpressure: workers pause while the writer catches up, memory stays bounded
- **[new]** - `batch` and `end` listeners may return a promise, which is awaited
- **[new]** - `pool.done` promise, resolves with run stats
- **[new]** - `queueLimit` option, heartbeat shows queue depth, parked workers and memory
- **[change]** - replaced sunday-driver with a pull-based reader. its pause did not hold for async consumers, and dropped pages
- **[fix]** - workers split the file on exact `<page>` boundaries - no more mangled pages at the seams
- **[new]** - `md` format includes `templates`
- **[new]** - explicit `skip_redirect`, `skip_disambig`, and `skip_nsfw` filters; `skip_nsfw` also accepts a per-reason map
- **[new]** - `dumpster-lib/fixture` export, for testing writers
- **[fix]** - redirect and disambiguation filters are now honoured
- **[fix]** - a missing file or unknown format rejects `done` instead of exiting the process
- **[fix]** - `end` waited for nobody, and `process.exit` could cut in-flight writes short
- **[change]** - `chunkSize` option renamed to `batchPageCount`, `chunk` event renamed to `batch`
- **[change]** - default `batchPageCount` is 100, default `workers` is cpu count − 1
