// Snapshot mutable pool state before passing it into the component tree.
export function progressSnapshot(pool) {
  const workers = pool.workers.map((worker) => {
    const status = pool.status[worker.index] || {}
    const size = worker.rangeSize || 1
    const bytes = worker.finished ? size : status.bytes || 0
    let state = 'running'
    if (pool.error) state = 'error'
    else if (worker.finished) state = 'done'
    else if (pool.parked.includes(worker)) state = 'parked'
    return {
      index: worker.index, state, size, bytes,
      progress: Math.min(100, bytes / size * 100),
      processed: status.processed || 0,
      written: status.written || 0,
      errors: status.errors || 0
    }
  })
  const size = workers.reduce((n, worker) => n + worker.size, 0)
  return {
    workers,
    progress: size ? workers.reduce((n, worker) => n + worker.bytes, 0) / size * 100 : 0,
    queue: pool.queue.length,
    queueLimit: pool.queueLimit,
    parked: pool.parked.length,
    rss: Math.round(process.memoryUsage().rss / 1048576),
    errors: workers.reduce((n, worker) => n + worker.errors, 0)
  }
}

export function plainProgress(frame) {
  const counts = frame.workers.map((w) => `#${w.index + 1} ${w.written.toLocaleString()}`).join('   ')
  return `${counts} | queue ${frame.queue}  parked ${frame.parked}  rss ${frame.rss}mb`
}
